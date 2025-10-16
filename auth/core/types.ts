import { Id } from "@/convex/_generated/dataModel";

/**
 * User role types
 */
export type UserRole = "admin" | "user";

/**
 * Feed role types
 */
export type FeedRole = "member" | "owner";

/**
 * Feed permission types
 */
export type FeedPermission = "post" | "message";

/**
 * Feed privacy types
 */
export type FeedPrivacy = "public" | "open" | "private";

/**
 * Possible reasons for permission denial
 */
export type PermissionDenialReason =
  | "unauthenticated"
  | "user_not_found"
  | "user_deactivated"
  | "not_feed_member"
  | "not_feed_owner"
  | "missing_permission";

/**
 * Result of a permission check
 * Contains allowed flag and optional reason for denial
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: PermissionDenialReason;
  /**
   * Throws an error if permission was denied
   * @throws Error with descriptive message if allowed is false
   */
  throwIfNotPermitted(): void;
}

/**
 * Simplified user representation for auth checks
 */
export interface AuthUser {
  id: Id<"users">;
  clerkId?: string;
  role?: UserRole;
  deactivatedAt?: number;
  orgId: Id<"organizations">;
}

/**
 * Context for checking feed-specific permissions
 * Provides methods for checking feed membership, ownership, and permissions
 */
export interface FeedAuthContext {
  /**
   * Check if user has a specific role in the feed
   * @param role - The feed role to check ('member' or 'owner')
   * @returns Promise resolving to permission result
   */
  hasRole(role: FeedRole): Promise<PermissionResult>;

  /**
   * Check if user can post in the feed
   * Composite check: authenticated, member, and feed has 'post' permission
   * @returns Promise resolving to permission result
   */
  canPost(): Promise<PermissionResult>;

  /**
   * Check if user can message in the feed
   * Composite check: authenticated, member, and feed has 'message' permission
   * @returns Promise resolving to permission result
   */
  canMessage(): Promise<PermissionResult>;
}
