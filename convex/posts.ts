import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getFeedsUserIsMemberOf, getPublicFeeds } from "./feeds";
import { getAuthenticatedUser } from "./user";
import { Doc, Id } from "./_generated/dataModel";


export const getUserPosts = query({
  args: {
    orgId: v.id("organizations"),
    selectedFeedId: v.optional(v.id("feeds")),
    paginationOpts: paginationOptsValidator
  },
  handler: async (ctx, args) => {
    const { orgId, selectedFeedId } = args;

    const user = await getAuthenticatedUser(ctx, orgId);
    const publicFeeds = await getPublicFeeds(ctx, orgId);

    let feeds: Doc<"feeds">[] = [...publicFeeds];

    if(user) {
      const feedsUserIsMemberOf = await getFeedsUserIsMemberOf(ctx, user._id);
      feeds = feeds.concat(feedsUserIsMemberOf);
    }

    if(selectedFeedId) {
      feeds = feeds.filter(feed => feed._id === selectedFeedId);
    }

    const posts = await ctx.db
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

      const postsWithMetadata = await Promise.all(
        posts.page.map(async (post) => {
          const author = await ctx.db.get(post.posterId);
          if (!author) return null; // skip posts with no author
          
          const image = author.image ? await ctx.storage.getUrl(author.image) : null;
          const feed = feedMap.get(post.feedId) || null;
          return { ...post, author: { ...author, image }, feed };
        })
      );

      return {
        ...posts,
        page: postsWithMetadata.filter((post) => post !== null)
      };
  }
});
