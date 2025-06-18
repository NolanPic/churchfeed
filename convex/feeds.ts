import { query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const getFeedsForPublicPosts = (
  ctx: QueryCtx,
  args: { orgId: Id<"organizations"> }
) => {
  return ctx.db
    .query("feeds")
    .withIndex("by_org_privacy", (q) =>
      q.eq("orgId", args.orgId).eq("privacy", "public")
    )
    .collect();
};

export const getPublicFeeds = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return getFeedsForPublicPosts(ctx, args);
  },
});