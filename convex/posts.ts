import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const getPublicFeedPosts = query({
  args: { 
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    paginationOpts: paginationOptsValidator
  },
  handler: async (cxt, args) => {
    const { orgId, feedId } = args;
    const feed = await cxt.db.get(feedId);
    if (feed?.privacy !== "public") {
      return {
        page: [],
        isDone: true,
        continueCursor: ""
      };
    }
    const posts = await cxt.db
      .query("posts")
      .withIndex("by_org_feed", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...posts,
      page: await Promise.all(
        posts.page.map(async (post) => {
          const author = await cxt.db.get(post.posterId);
          return { ...post, author };
        })
      )
    };
  },
});
