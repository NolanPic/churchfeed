import { QueryCtx, MutationCtx } from "@/convex/_generated/server";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { UserIdentity } from "convex/server";
import {
  AuthUser,
  FeedAuthContext,
  PermissionResult,
  UserRole,
  FeedRole,
} from "../core/types";
import {
  checkUserRole,
  checkFeedRole,
  checkFeedPermission,
  createPermissionResult,
} from "../core/permissions";

type ConvexContext = QueryCtx | MutationCtx;

/**
 * Main authentication and authorization class for Convex backend
 * Provides methods for checking user roles and feed permissions
 */
export class UserAuth {
  private user: Doc<"users"> | null = null;
  private clerkUser: UserIdentity | null = null;

  constructor(
    private ctx: ConvexContext,
    private orgId: Id<"organizations">
  ) {}

  /**
   * Initialize the auth instance by loading the authenticated user
   * Must be called before using any permission check methods
   */
  async init(): Promise<void> {
    const clerkUser = await this.ctx.auth.getUserIdentity();
    if (!clerkUser) {
      this.clerkUser = null;
      this.user = null;
      return;
    }

    this.clerkUser = clerkUser;

    const dbUser = await this.ctx.db
      .query("users")
      .withIndex("by_clerk_and_org_id", (q) =>
        q.eq("clerkId", clerkUser.subject).eq("orgId", this.orgId)
      )
      .first();

    if (!dbUser) {
      this.user = null;
      return;
    }

    this.user = dbUser;
  }

  /**
   * Get the authenticated user document
   * @returns The full user document from Convex database, or null if not authenticated
   */
  getUser(): Doc<"users"> | null {
    return this.user;
  }

  /**
   * Get the authenticated user document or throw an error
   * @throws Error if user is not authenticated or not found
   * @returns The full user document from Convex database
   */
  getUserOrThrow(): Doc<"users"> {
    if (!this.clerkUser) {
      throw new Error("User not authenticated with Clerk");
    }
    if (!this.user) {
      throw new Error("User not found in database");
    }
    return this.user;
  }

  /**
   * Get the Clerk user identity
   * @returns The Clerk UserIdentity, or null if not authenticated
   */
  getClerkUser(): UserIdentity | null {
    return this.clerkUser;
  }

  /**
   * Convert stored user to AuthUser format for permission checks
   * @private
   */
  private toAuthUser(): AuthUser | null {
    if (!this.user) {
      return null;
    }
    return {
      id: this.user._id,
      clerkId: this.user.clerkId,
      role: this.user.role,
      deactivatedAt: this.user.deactivatedAt,
      orgId: this.user.orgId,
    };
  }

  /**
   * Check if user has a specific role (admin or user)
   * @param role - The required user role
   * @returns PermissionResult indicating if user has the role
   */
  hasRole(role: UserRole): PermissionResult {
    return checkUserRole(this.toAuthUser(), role);
  }

  /**
   * Create a feed context for checking feed-specific permissions
   * @param feedId - The ID of the feed
   * @param feedData - Optional feed document to avoid re-fetching
   * @returns FeedAuthContext for checking feed permissions
   */
  feed(feedId: Id<"feeds">, feedData?: Doc<"feeds">): FeedAuthContext {
    return new FeedAuthContextImpl(this.ctx, this.toAuthUser(), feedId, feedData);
  }
}

/**
 * Feed-specific authentication context for Convex backend
 * Provides methods for checking feed membership, ownership, and permissions
 */
class FeedAuthContextImpl implements FeedAuthContext {
  constructor(
    private ctx: ConvexContext,
    private user: AuthUser | null,
    private feedId: Id<"feeds">,
    private feedData?: Doc<"feeds">
  ) {}

  /**
   * Check if user has a specific role in the feed (member or owner)
   * @param role - The required feed role
   * @returns Promise resolving to permission result
   */
  async hasRole(role: FeedRole): Promise<PermissionResult> {
    if (!this.user) {
      return createPermissionResult(false, "unauthenticated");
    }

    if (this.user.deactivatedAt) {
      return createPermissionResult(false, "user_deactivated");
    }

    const userFeed = await this.ctx.db
      .query("userFeeds")
      .withIndex("by_user_and_feed", (q) =>
        q.eq("userId", this.user!.id).eq("feedId", this.feedId)
      )
      .first();

    if (!userFeed) {
      return createPermissionResult(false, "not_feed_member");
    }

    return checkFeedRole(true, userFeed.owner, role);
  }

  /**
   * Check if user can post in the feed
   * Composite check: authenticated, member, and feed has 'post' permission
   * @returns Promise resolving to permission result
   */
  async canPost(): Promise<PermissionResult> {
    const memberCheck = await this.hasRole("member");
    if (!memberCheck.allowed) {
      return memberCheck;
    }

    const feed = this.feedData || (await this.ctx.db.get(this.feedId));
    if (!feed) {
      return createPermissionResult(false, "not_feed_member");
    }

    return checkFeedPermission(true, feed, "post");
  }

  /**
   * Check if user can message in the feed
   * Composite check: authenticated, member, and feed has 'message' permission
   * @returns Promise resolving to permission result
   */
  async canMessage(): Promise<PermissionResult> {
    const memberCheck = await this.hasRole("member");
    if (!memberCheck.allowed) {
      return memberCheck;
    }

    const feed = this.feedData || (await this.ctx.db.get(this.feedId));
    if (!feed) {
      return createPermissionResult(false, "not_feed_member");
    }

    return checkFeedPermission(true, feed, "message");
  }
}

/**
 * Helper function to create and initialize a UserAuth instance
 * This is the main entry point for backend authentication
 *
 * @param ctx - Convex query or mutation context
 * @param orgId - The organization ID
 * @returns Promise resolving to initialized UserAuth instance
 *
 * @example
 * ```typescript
 * export const myQuery = query({
 *   args: { orgId: v.id("organizations") },
 *   handler: async (ctx, args) => {
 *     const auth = await getUserAuth(ctx, args.orgId);
 *
 *     // Check if user is admin
 *     const adminCheck = auth.hasRole('admin');
 *     if (!adminCheck.allowed) {
 *       throw new Error(`Access denied: ${adminCheck.reason}`);
 *     }
 *
 *     // Check feed permissions
 *     const canPost = await auth.feed(feedId).canPost();
 *     canPost.throwIfNotPermitted();
 *
 *     return { success: true };
 *   },
 * });
 * ```
 */
export async function getUserAuth(
  ctx: ConvexContext,
  orgId: Id<"organizations">
): Promise<UserAuth> {
  const auth = new UserAuth(ctx, orgId);
  await auth.init();
  return auth;
}
