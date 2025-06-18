import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";

const getFeedsForPublicPosts = (ctx: QueryCtx, args: { orgId: Id<"organizations"> }) => {
  return ctx.db.query("feeds")
    .withIndex("by_org_privacy", (q) => q.eq("orgId", args.orgId).eq("privacy", "public"))
    .collect();
}

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
      .withIndex("by_org", (q) =>
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
          return { ...post, author };
        })
      )
    };
  },
});
