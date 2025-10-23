import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { getUserAuth } from "@/auth/convex";
import { PermissionDenialReason } from "@/auth/core/types";

/**
 * Permission check result for actions
 */
export interface ActionPermissionResult {
  allowed: boolean;
  reason?: PermissionDenialReason;
  user?: Doc<"users">;
}

/**
 * Internal query to get and validate an authenticated user for actions
 */
export const getAuthenticatedUser = internalQuery({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args): Promise<ActionPermissionResult> => {
    const auth = await getUserAuth(ctx, args.orgId);
    const user = auth.getUser();

    if (!user) {
      return {
        allowed: false,
        reason: "user_not_found",
      };
    }

    if (user.deactivatedAt) {
      return {
        allowed: false,
        reason: "user_deactivated",
      };
    }

    return {
      allowed: true,
      user,
    };
  },
});

/**
 * Internal query to check upload permissions for posts/messages
 */
export const checkUploadPermission = internalQuery({
  args: {
    userId: v.id("users"),
    feedId: v.id("feeds"),
    orgId: v.id("organizations"),
    action: v.union(v.literal("post"), v.literal("message")),
  },
  handler: async (ctx, args): Promise<ActionPermissionResult> => {
    const { userId, feedId, orgId, action } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    if (!user) {
      return {
        allowed: false,
        reason: "unauthenticated",
      };
    }

    // Verify the user ID matches (security check)
    if (user._id !== userId) {
      return {
        allowed: false,
        reason: "user_not_found",
      };
    }

    const { allowed, reason } =
      action === "post"
        ? await auth.feed(feedId).canPost()
        : await auth.feed(feedId).canMessage();

    return {
      allowed,
      reason,
    };
  },
});
