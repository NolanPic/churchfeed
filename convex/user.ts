import { Id, Doc } from "./_generated/dataModel";
import { UserIdentity } from "convex/server";
import { query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export type AuthResult<T = any> = 
  | { success: true; clerkUser: UserIdentity; user: Doc<"users">; data?: T }
| { success: false; reason: 'unauthenticated' | 'user_not_found' | 'unauthorized' | 'user_deactivated' };

type AuthContext = QueryCtx | MutationCtx;

export const doesUserExist = query({
    args: {
        email: v.string(),
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.query("users")
        .withIndex("by_org_and_email", (q) => q
            .eq("orgId", args.orgId)
            .eq("email", args.email))
        .first();

        return {
            userExists: !!user,
            clerkUserExists: !!user?.clerkId,
            deactivated: !!user?.deactivatedAt,
        };
    },
  });

export const getUserByClerkId = query({
    args: {
        clerkId: v.string(),
        orgId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.query("users")
            .withIndex("by_clerk_and_org_id", (q) => q
                .eq("clerkId", args.clerkId)
                .eq("orgId", args.orgId))
            .first();

        if (!user) {
            return null;
        }

        const image = user.image ? await ctx.storage.getUrl(user.image) : null;

        return {
            ...user,
            image,
        };
    },
});

export const getAuthenticatedUser = async (
    ctx: AuthContext,
    orgId: Id<"organizations">
  ): Promise<Doc<"users"> | null> => {
    const result = await getAuthResult(ctx, orgId);
    return result.success ? result.user : null;
  };

/**
 * Get authentication result
 */
export const getAuthResult = async (
  ctx: AuthContext,
  orgId: Id<"organizations">
): Promise<AuthResult> => {
  const clerkUser = await ctx.auth.getUserIdentity();
  if (!clerkUser) {
    return { success: false, reason: 'unauthenticated' };
  }

  const user = await ctx.db.query("users")
    .withIndex("by_clerk_and_org_id", (q) => q
      .eq("clerkId", clerkUser.subject)
      .eq("orgId", orgId))
    .first();

  if (!user) {
    return { success: false, reason: 'user_not_found' };
  }

  if(user.deactivatedAt) {
    return { success: false, reason: 'user_deactivated' };
  }

  return { success: true, clerkUser, user };
};

/**
 * Require authentication result (throw if unauthenticated)
 */
export const requireAuth = async (
  ctx: AuthContext,
  orgId: Id<"organizations">
): Promise<{ clerkUser: UserIdentity; user: Doc<"users"> }> => {
  const result = await getAuthResult(ctx, orgId);
  if (!result.success) {
    throw new Error(`Authentication failed: ${result.reason}`);
  }
  return { clerkUser: result.clerkUser, user: result.user };
};