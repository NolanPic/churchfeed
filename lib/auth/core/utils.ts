import { PermissionDenialReason } from "./types";

/**
 * Human-readable error messages for permission denial reasons
 * Used to provide clear feedback to users when permissions are denied
 */
export const reasonMessages: Record<PermissionDenialReason, string> = {
  unauthenticated: "You must be logged in to perform this action",
  user_not_found: "User account not found",
  user_deactivated: "Your account has been deactivated",
  not_feed_member: "You must be a member of this feed",
  not_feed_owner: "You must be an owner of this feed",
  missing_permission: "You do not have permission to perform this action",
};

/**
 * Get a human-readable error message for a permission denial reason
 * @param reason - The permission denial reason
 * @returns A user-friendly error message
 */
export function getReasonMessage(reason: PermissionDenialReason): string {
  return reasonMessages[reason];
}
