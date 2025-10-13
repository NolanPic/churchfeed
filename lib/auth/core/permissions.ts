import { Doc } from "@/convex/_generated/dataModel";
import {
  PermissionResult,
  PermissionDenialReason,
  AuthUser,
  UserRole,
  FeedPermission,
  FeedRole,
} from "./types";

/**
 * Creates a permission result object with throwIfNotPermitted helper
 * @param allowed - Whether the permission is granted
 * @param reason - Optional reason for denial
 * @returns PermissionResult with helper method
 */
export function createPermissionResult(
  allowed: boolean,
  reason?: PermissionDenialReason
): PermissionResult {
  return {
    allowed,
    reason,
    throwIfNotPermitted() {
      if (!allowed) {
        throw new Error(`Permission denied: ${reason}`);
      }
    },
  };
}

/**
 * Check if user has a specific role
 * @param user - The authenticated user or null
 * @param role - The required role
 * @returns PermissionResult indicating if user has the role
 */
export function checkUserRole(
  user: AuthUser | null,
  role: UserRole
): PermissionResult {
  // Check if user is authenticated
  if (!user) {
    return createPermissionResult(false, "unauthenticated");
  }

  // Check if user is deactivated
  if (user.deactivatedAt) {
    return createPermissionResult(false, "user_deactivated");
  }

  // Default role is 'user' if not specified
  const userRole = user.role || "user";

  // Check if user has the required role
  if (userRole !== role) {
    return createPermissionResult(false, "user_not_found");
  }

  return createPermissionResult(true);
}

/**
 * Check if user has a specific role in a feed
 * @param isMember - Whether user is a member of the feed
 * @param isOwner - Whether user is an owner of the feed
 * @param role - The required feed role ('member' or 'owner')
 * @returns PermissionResult indicating if user has the feed role
 */
export function checkFeedRole(
  isMember: boolean,
  isOwner: boolean,
  role: FeedRole
): PermissionResult {
  // Check membership
  if (!isMember) {
    return createPermissionResult(false, "not_feed_member");
  }

  // Check ownership if required
  if (role === "owner" && !isOwner) {
    return createPermissionResult(false, "not_feed_owner");
  }

  return createPermissionResult(true);
}

/**
 * Check if user has a specific permission in a feed
 * @param isMember - Whether user is a member of the feed
 * @param feed - The feed document
 * @param permission - The required permission ('post' or 'message')
 * @returns PermissionResult indicating if user has the permission
 */
export function checkFeedPermission(
  isMember: boolean,
  feed: Doc<"feeds">,
  permission: FeedPermission
): PermissionResult {
  // User must be a member
  if (!isMember) {
    return createPermissionResult(false, "not_feed_member");
  }

  // Check if feed has the required permission
  const hasPermission = feed.memberPermissions?.includes(permission) ?? false;
  if (!hasPermission) {
    return createPermissionResult(false, "missing_permission");
  }

  return createPermissionResult(true);
}
