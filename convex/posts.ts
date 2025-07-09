import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getFeedsForPublicPosts } from "./feeds";

export const getPublicFeedPosts = query({
  args: { 
    orgId: v.id("organizations"),
    feedId: v.optional(v.id("feeds")),
    paginationOpts: paginationOptsValidator
  },
  handler: async (cxt, args) => {
    const { orgId, feedId } = args;

    const feed = feedId ? await cxt.db.get(feedId) : null;
    if (feed && feed?.privacy !== "public") {
      return {
        page: [],
        isDone: true,
        continueCursor: ""
      };
    }

    const feedIds = feedId ? [feedId] : (
      await getFeedsForPublicPosts(cxt, { orgId })
    ).map((feed) => feed._id);

    const posts = await cxt.db
      .query("posts")
      .withIndex("by_org_and_postedAt", (q) =>
        q.eq("orgId", orgId),
      )
      .filter((q) => q.or(...feedIds.map(id => q.eq(q.field("feedId"), id))))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...posts,
      page: await Promise.all(
        posts.page.map(async (post) => {
          const author = await cxt.db.get(post.posterId);
          const feed = await cxt.db.get(post.feedId);
          return { ...post, author, feed };
        })
      )
    };
  },
});
