import { MutationCtx, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { getManyFrom, getAll } from 'convex-helpers/server/relationships';
import { getUserAuth } from "@/lib/auth/convex";

export const getUserFeeds = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const auth = await getUserAuth(ctx, args.orgId);
    const user = auth.getUser();
    const publicFeeds = await getPublicFeeds(ctx, args.orgId);

    if (user) {
      const { feeds: feedsUserIsMemberOf } = await getUserFeedsWithMembershipsHelper(ctx, user._id);
      return [...publicFeeds, ...feedsUserIsMemberOf];
    } else {
      return publicFeeds;
    }
  },
});

export const getUserFeedsWithMemberships = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const auth = await getUserAuth(ctx, args.orgId);
    const user = auth.getUser();

    if(!user) {
      return null;
    }

    const userFeedsWithMemberships = await getUserFeedsWithMembershipsHelper(ctx, user._id);

    return userFeedsWithMemberships;
  },
});

export const getUserFeedsWithMembershipsHelper = async (
  ctx: QueryCtx,
  userId: Id<"users">,
) => {
  const userFeeds = await getManyFrom(ctx.db, "userFeeds", "by_userId", userId);
  const feedIds = userFeeds.map((userFeed) => userFeed.feedId);
  const feedsUserIsMemberOf = await getAll(ctx.db, feedIds);

  return {
    userFeeds,
    feeds: feedsUserIsMemberOf.filter((feed) => feed !== null),
  };
}

export const getPublicFeeds = async (ctx: QueryCtx, orgId: Id<"organizations">) => { 
  const publicFeeds = await ctx.db.query("feeds")
  .withIndex("by_org_privacy", (q) =>
    q.eq("orgId", orgId).eq("privacy", "public")
  )
  .collect();

  return publicFeeds;
};

