import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getUserFeedsWithMembershipsHelper, getPublicFeeds } from "./feeds";
import { getUserAuth } from "@/auth/convex";
import { Doc, Id } from "./_generated/dataModel";
import { fromJSONToHTML } from "./utils/postContentConverter";
import { getStorageUrl } from "./uploads";
import { api, internal } from "./_generated/api";
import { sendNotifications } from "./notifications";

export const getPostsForUserFeed = query({
  args: {
    orgId: v.id("organizations"),
    selectedFeedId: v.optional(v.id("feeds")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, selectedFeedId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();
    const publicFeeds = await getPublicFeeds(ctx, orgId);

    let feeds: Doc<"feeds">[] = [...publicFeeds];

    if (user) {
      const { feeds: feedsUserIsMemberOf } =
        await getUserFeedsWithMembershipsHelper(ctx, user._id);
      feeds = feeds.concat(feedsUserIsMemberOf);
    }

    if (selectedFeedId) {
      feeds = feeds.filter((feed) => feed._id === selectedFeedId);

      if(feeds.length === 0) {
        // this may be an open feed that the user is not a member of
        const feed = await ctx.runQuery(api.feeds.getFeed, {
          orgId,
          feedId: selectedFeedId,
        });
        if (feed && feed.privacy === "open") {
          feeds.push(feed);
        }
      }
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_org_and_postedAt", (q) => q.eq("orgId", orgId))
      .filter((q) =>
        q.or(...feeds.map((feed) => q.eq(q.field("feedId"), feed._id))),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const feedMap = new Map<Id<"feeds">, Doc<"feeds">>();
    for (const feed of feeds) {
      feedMap.set(feed._id, feed);
    }

    const enrichedPosts = await Promise.all(
      posts.page.map(async (post) => {
        const author = await ctx.db.get(post.posterId);
        if (!author) return null; // skip posts with no author

        const image = await getStorageUrl(ctx, author.image);
        const feed = feedMap.get(post.feedId) || null;
        const messageCount = (
          await ctx.db
            .query("messages")
            .withIndex("by_orgId_postId", (q) =>
              q.eq("orgId", orgId).eq("postId", post._id),
            )
            .collect()
        ).length;
        return {
          ...post,
          author: { ...author, image },
          feed,
          content: fromJSONToHTML(post.content),
          messageCount,
        };
      }),
    );

    return {
      ...posts,
      page: enrichedPosts.filter((post) => post !== null),
    };
  },
});

export const createPost = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, content } = args;

    const auth = await getUserAuth(ctx, orgId);

    const canPost = await auth.feed(feedId).canPost();
    canPost.throwIfNotPermitted();

    const user = auth.getUser()!;

    const now = Date.now();

    const postId = await ctx.db.insert("posts", {
      orgId,
      feedId,
      posterId: user._id,
      content,
      postedAt: now,
      updatedAt: now,
    });

    // Send notifications for feed members
    await sendNotifications(ctx, orgId, "new_post_in_member_feed", {
      userId: user._id,
      feedId,
      postId,
    });

    return postId;
  },
});

export const getById = query({
  args: {
    orgId: v.id("organizations"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const { orgId, postId } = args;

    const auth = await getUserAuth(ctx, orgId);

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");
    const feed = await ctx.db.get(post.feedId);
    if (!feed) throw new Error("Feed not found");

    const isUserAMemberOfThisFeedCheck = await auth
      .feed(post.feedId)
      .hasRole("member");
    const feedIsPublic = feed.privacy === "public";
    const userCanViewThisPost =
      feedIsPublic || isUserAMemberOfThisFeedCheck.allowed;

    if (!userCanViewThisPost) {
      throw new Error("User cannot view this post");
    }

    const author = await ctx.db.get(post.posterId);
    if (!author) return null;
    const image = await getStorageUrl(ctx, author.image);

    return {
      ...post,
      author: { ...author, image },
      feed: feed ?? null,
      content: fromJSONToHTML(post.content),
    };
  },
});

export const deletePost = mutation({
  args: {
    orgId: v.id("organizations"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const { orgId, postId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    // Get the post
    const post = await ctx.db.get(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user is the post author
    const isAuthor = post.posterId === user._id;

    // Check if user is the feed owner
    const feedOwnerCheck = await auth.feed(post.feedId).hasRole("owner");
    const isFeedOwner = feedOwnerCheck.allowed;

    const canDelete = isAuthor || isFeedOwner;
    if (!canDelete) {
      throw new Error("You do not have permission to delete this post");
    }

    // Get all messages for this post
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_orgId_postId", (q) =>
        q.eq("orgId", orgId).eq("postId", postId),
      )
      .collect();

    // Delete all messages (which also deletes their uploads)
    const messageIds = messages.map((m) => m._id);
    if (messageIds.length > 0) {
      await ctx.runMutation(internal.messages.deleteMessagesInternal, {
        orgId,
        messageIds,
      });
    }

    // Delete uploads for the post itself
    await ctx.runMutation(internal.uploads.deleteUploadsForSources, {
      orgId,
      source: "post",
      sourceIds: [postId],
    });

    // Delete the post
    try {
      await ctx.db.delete(postId);
    } catch (error) {
      console.warn(`Failed to delete post ${postId}:`, error);
      throw error; // Re-throw since this is critical
    }

    return postId;
  },
});
