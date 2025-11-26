import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getUserAuth } from "@/auth/convex";

const pushSubscriptionValidator = v.object({
  endpoint: v.string(),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
  expirationTime: v.union(v.number(), v.null()),
});

/**
 * Create a new push subscription for the authenticated user
 */
export const createPushSubscription = mutation({
  args: {
    orgId: v.id("organizations"),
    subscription: pushSubscriptionValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, subscription } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    const now = Date.now();
    const subscriptionId = await ctx.db.insert("pushSubscriptions", {
      orgId,
      userId: user._id,
      subscription,
      updatedAt: now,
    });

    return subscriptionId;
  },
});

/**
 * Delete all push subscriptions for the authenticated user
 */
export const deletePushSubscriptionsByUser = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { orgId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", orgId).eq("userId", user._id)
      )
      .collect();

    for (const subscription of subscriptions) {
      await ctx.db.delete(subscription._id);
    }

    return subscriptions.length;
  },
});

/**
 * Get all push subscriptions for the authenticated user
 */
export const getPushSubscriptions = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { orgId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    if (!user) {
      return [];
    }

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", orgId).eq("userId", user._id)
      )
      .collect();

    return subscriptions;
  },
});
