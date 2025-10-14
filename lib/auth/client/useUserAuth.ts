"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  UserRole,
  FeedRole,
  FeedAuthContext,
  PermissionResult,
  AuthUser,
} from "../core/types";
import {
  checkUserRole,
  checkFeedRole,
  checkFeedPermission,
  createPermissionResult,
} from "../core/permissions";

/**
 * Extended user type that includes image URL (from getUserByClerkId query)
 */
type UserWithImageUrl = Omit<Doc<"users">, "image"> & {
  image: string | null;
};

/**
 * Client-side authentication class
 * Provides methods for checking user roles and feed permissions on the frontend
 */
export class UserAuthClient {
  private user: AuthUser | null;

  constructor(
    dbUser: UserWithImageUrl | null,
    private userFeeds: Doc<"userFeeds">[],
    private feeds: Doc<"feeds">[]
  ) {
    // Convert database user to AuthUser format
    this.user = dbUser
      ? {
          id: dbUser._id,
          clerkId: dbUser.clerkId,
          role: dbUser.role,
          deactivatedAt: dbUser.deactivatedAt,
          orgId: dbUser.orgId,
        }
      : null;
  }

  /**
   * Check if user has a specific role (admin or user)
   * @param role - The required user role
   * @returns PermissionResult indicating if user has the role
   */
  hasRole(role: UserRole): PermissionResult {
    return checkUserRole(this.user, role);
  }

  /**
   * Create a feed context for checking feed-specific permissions
   * @param feedId - The ID of the feed
   * @param feedData - Optional feed document to avoid lookup
   * @returns FeedAuthContext for checking feed permissions
   */
  feed(feedId: Id<"feeds">, feedData?: Doc<"feeds">): FeedAuthContext {
    return new FeedAuthContextClient(
      this.user,
      this.userFeeds,
      this.feeds,
      feedId,
      feedData
    );
  }
}

/**
 * Feed-specific authentication context for client
 * Provides methods for checking feed membership, ownership, and permissions
 */
class FeedAuthContextClient implements FeedAuthContext {
  constructor(
    private user: AuthUser | null,
    private userFeeds: Doc<"userFeeds">[],
    private feeds: Doc<"feeds">[],
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

    // Find userFeed in the cached array
    const userFeed = this.userFeeds.find((uf) => uf.feedId === this.feedId);
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

    // Get feed data from provided data or cached feeds
    let feed = this.feedData;
    if (!feed) {
      feed = this.feeds.find((f) => f._id === this.feedId);
    }

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

    // Get feed data from provided data or cached feeds
    let feed = this.feedData;
    if (!feed) {
      feed = this.feeds.find((f) => f._id === this.feedId);
    }

    if (!feed) {
      return createPermissionResult(false, "not_feed_member");
    }

    return checkFeedPermission(true, feed, "message");
  }
}

/**
 * React hook for accessing the authentication system
 * Returns a tuple of [auth, state] where auth is the UserAuthClient instance
 * and state contains loading and error information
 *
 * @returns Tuple of [UserAuthClient | null, { isLoading: boolean, error: Error | null }]
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const [auth, { isLoading, error }] = useUserAuth();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!auth) return <div>Not authenticated</div>;
 *
 *   // Check user role
 *   const adminCheck = auth.hasRole('admin');
 *   if (adminCheck.allowed) {
 *     // Show admin UI
 *   }
 *
 *   // Check feed permissions
 *   const canPost = await auth.feed(feedId).canPost();
 *   if (canPost.allowed) {
 *     // Show post button
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useUserAuth(): [
  auth: UserAuthClient | null,
  state: { isLoading: boolean; error: Error | null }
] {
  const { user: clerkUser, isLoaded } = useUser();
  const org = useOrganization();
  const orgId = org?._id ?? ("" as Id<"organizations">);

  // Query user data
  const user = useQuery(api.user.getUserByClerkId, {
    clerkId: clerkUser?.id ?? "",
    orgId,
  });

  // Query feeds with membership data
  const feedsData = useQuery(api.feeds.getUserFeedsWithMemberships, {
    orgId,
  });

  const { userFeeds = [], feeds = [] } = feedsData || {};

  // Handle loading state
  if (!isLoaded || user === undefined || feedsData === undefined) {
    return [null, { isLoading: true, error: null }];
  }

  // Handle unauthenticated or user not found
  if (!user) {
    return [null, { isLoading: false, error: null }];
  }

  // Create and return auth instance
  const auth = new UserAuthClient(user, userFeeds, feeds);
  return [auth, { isLoading: false, error: null }];
}
