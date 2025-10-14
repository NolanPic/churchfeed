import { mutation, MutationCtx, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getUserFeedsWithMembershipsHelper, getPublicFeeds } from "./feeds";
import { getUserAuth } from "@/lib/auth/convex";
import { Doc, Id } from "./_generated/dataModel";
import { fromJSONToHTML } from "./utils/postContentConverter";

export const getUserPosts = query({
  args: {
    orgId: v.id("organizations"),
    selectedFeedId: v.optional(v.id("feeds")),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const { orgId, selectedFeedId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const authCheck = auth.hasRole("user");
    const publicFeeds = await getPublicFeeds(ctx, orgId);

    let feeds: Doc<"feeds">[] = [...publicFeeds];

    if(authCheck.allowed) {
      // Get user document to access _id
      const clerkUser = await ctx.auth.getUserIdentity();
      if (clerkUser) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_and_org_id", (q) =>
            q.eq("clerkId", clerkUser.subject).eq("orgId", orgId)
          )
          .first();

        if (user) {
          const { feeds: feedsUserIsMemberOf } = await getUserFeedsWithMembershipsHelper(ctx, user._id);
          feeds = feeds.concat(feedsUserIsMemberOf);
        }
      }
    }

    if(selectedFeedId) {
      feeds = feeds.filter(feed => feed._id === selectedFeedId);
    }

    let posts = await ctx.db
      .query("posts")
      .withIndex("by_org_and_postedAt", (q) =>
        q.eq("orgId", orgId),
      )
      .filter((q) => q.or(...feeds.map(feed => q.eq(q.field("feedId"), feed._id))))
      .order("desc")
      .paginate(args.paginationOpts);

    const feedMap = new Map<Id<"feeds">, Doc<"feeds">>();
    for(const feed of feeds) {
      feedMap.set(feed._id, feed);
    }
  
    const enrichedPosts = await Promise.all(
      posts.page.map(async (post) => {
        const author = await ctx.db.get(post.posterId);
        if (!author) return null; // skip posts with no author
        
        const image = author.image ? await ctx.storage.getUrl(author.image) : null;
        const feed = feedMap.get(post.feedId) || null;
        const messageCount = (
          await ctx.db
            .query("messages")
            .withIndex("by_orgId_postId", (q) =>
              q.eq("orgId", orgId).eq("postId", post._id)
            )
            .collect()
        ).length;
        return { ...post, author: { ...author, image }, feed, content: fromJSONToHTML(post.content), messageCount };
      })
    );

    return {
      ...posts,
      page: enrichedPosts.filter((post) => post !== null)
    };
  }
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

    // Check if user can post in this feed
    const canPost = await auth.feed(feedId).canPost();
    canPost.throwIfNotPermitted();

    // Get user document to create post
    const clerkUser = await ctx.auth.getUserIdentity();
    if (!clerkUser) {
      throw new Error("User not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_and_org_id", (q) =>
        q.eq("clerkId", clerkUser.subject).eq("orgId", orgId)
      )
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    const postId = await ctx.db.insert("posts", {
      orgId,
      feedId,
      posterId: user._id,
      content,
      postedAt: now,
      updatedAt: now,
    });

    return postId;
  }
});

export const getById = query({
  args: {
    orgId: v.id("organizations"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const { orgId, postId } = args;

    const post = await ctx.db.get(postId);
    if (!post || post.orgId !== orgId) return null;

    // Determine visibility: public + user's member feeds
    const auth = await getUserAuth(ctx, orgId);
    const authCheck = auth.hasRole("user");
    const publicFeeds = await getPublicFeeds(ctx, orgId);
    let allowedFeedIds = new Set<Id<"feeds">>(publicFeeds.map((f) => f._id));

    if (authCheck.allowed) {
      const clerkUser = await ctx.auth.getUserIdentity();
      if (clerkUser) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_and_org_id", (q) =>
            q.eq("clerkId", clerkUser.subject).eq("orgId", orgId)
          )
          .first();

        if (user) {
          const { feeds: memberFeeds } = await getUserFeedsWithMembershipsHelper(
            ctx,
            user._id
          );
          for (const f of memberFeeds) allowedFeedIds.add(f._id);
        }
      }
    }

    if (!allowedFeedIds.has(post.feedId)) {
      return null;
    }

    const author = await ctx.db.get(post.posterId);
    if (!author) return null;
    const image = author.image ? await ctx.storage.getUrl(author.image) : null;
    const feed = await ctx.db.get(post.feedId);

    return {
      ...post,
      author: { ...author, image },
      feed: feed ?? null,
      content: fromJSONToHTML(post.content),
    };
  },
});
