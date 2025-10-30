# UserAuth & Permissions System Specification

## 1. Overview

### 1.1 Purpose
Create a unified UserAuth system for churchfeed that provides a consistent, type-safe API for authentication and authorization checks across both the Next.js frontend and Convex backend.

### 1.2 Goals
- Single source of truth for all auth/permission logic
- Intuitive, method-chaining API for common permission checks
- Seamless operation across frontend and backend platforms
- Type-safe with excellent IDE autocomplete support
- Minimal performance overhead using Convex's built-in reactivity
- Easily extensible for future permission rules

### 1.3 Scope
**In Scope:**
- User authentication checks (Clerk integration)
- User role checks (admin, user)
- Feed membership and ownership checks
- Feed permission checks (post, message)
- Feed privacy enforcement (public, open, private)
- Result objects with descriptive error reasons
- Frontend React hook implementation
- Backend Convex helper function
- Migration from existing auth code

**Out of Scope:**
- Mutations (creating users, assigning roles, etc.)
- Admin panel UI implementation
- Audit logging
- Post/message deletion implementation (permission checks only)
- Edit permissions (future consideration)

## 2. Architecture

### 2.1 System Design
The system follows a **shared module with platform-specific adapters** architecture:

```
lib/
└── auth/
    ├── core/              # Shared core logic
    │   ├── types.ts       # TypeScript types and interfaces
    │   ├── permissions.ts # Permission checking logic
    │   └── utils.ts       # Shared utilities
    ├── convex/            # Backend adapter
    │   └── index.ts       # Convex-specific implementation
    └── client/            # Frontend adapter
        └── useUserAuth.ts # React hook
```

### 2.2 Data Flow

**Backend:**
```
Convex Query/Mutation → getUserAuth(ctx, orgId) → UserAuth instance → Permission checks
```

**Frontend:**
```
React Component → useUserAuth() → [auth, { isLoading, error }] → Permission checks
```

### 2.3 Key Principles
1. **Granular but composable**: Atomic checks (hasRole) + composite helpers (canPost)
2. **Platform-agnostic core**: Core logic works on both platforms
3. **No side effects**: Read-only permission checks, no mutations
4. **Leverage platform features**: Convex reactivity for caching
5. **Type safety**: Full TypeScript support throughout

## 3. Data Models

### 3.1 Database Schema Reference

**users table:**
```typescript
{
  _id: Id<"users">
  email: string
  name: string
  image?: Id<"_storage">
  orgId: Id<"organizations">
  clerkId?: string
  deactivatedAt?: number
  role?: "admin" | "user"
}
```

**feeds table:**
```typescript
{
  _id: Id<"feeds">
  name: string
  orgId: Id<"organizations">
  privacy: "public" | "open" | "private"
  memberPermissions?: ("post" | "message")[]
  updatedAt: number
}
```

**userFeeds table:**
```typescript
{
  _id: Id<"userFeeds">
  userId: Id<"users">
  feedId: Id<"feeds">
  owner: boolean
  orgId: Id<"organizations">
  updatedAt: number
}
```

### 3.2 Core Types

```typescript
// Permission check result
type PermissionResult =
  | { allowed: true }
  | { allowed: false; reason: PermissionDenialReason }

type PermissionDenialReason =
  | 'unauthenticated'
  | 'user_not_found'
  | 'user_deactivated'
  | 'not_feed_member'
  | 'not_feed_owner'
  | 'missing_permission'
  | 'invalid_feed_privacy'

// User role types
type UserRole = 'admin' | 'user'

// Feed role types
type FeedRole = 'member' | 'owner'

// Feed permission types
type FeedPermission = 'post' | 'message'

// Feed privacy types
type FeedPrivacy = 'public' | 'open' | 'private'
```

## 4. API Specification

### 4.1 Frontend API (React Hook)

#### Hook Signature
```typescript
function useUserAuth(): [
  auth: UserAuthClient | null,
  state: { isLoading: boolean; error: Error | null }
]
```

#### Usage Example
```typescript
import { useUserAuth } from '@/lib/auth/client/useUserAuth';

function MyComponent() {
  const [auth, { isLoading, error }] = useUserAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!auth) return <div>Not authenticated</div>;

  // Check user role
  const adminCheck = auth.hasRole('admin');
  if (adminCheck.allowed) {
    // Show admin UI
  }

  // Check feed permissions
  const canPostCheck = await auth.feed(feedId).canPost();
  if (canPostCheck.allowed) {
    // Show post button
  }

  // With feed data to avoid re-fetch
  const canMessageCheck = auth.feed(feedId, feedData).canMessage();

  return <div>...</div>;
}
```

### 4.2 Backend API (Convex)

#### Function Signature
```typescript
async function getUserAuth(
  ctx: QueryCtx | MutationCtx,
  orgId: Id<"organizations">
): Promise<UserAuth>
```

#### Usage Example
```typescript
import { getUserAuth } from '@/lib/auth/convex';

export const myQuery = query({
  args: {
    feedId: v.id("feeds"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const auth = await getUserAuth(ctx, args.orgId);

    // Check if user is admin
    const adminCheck = auth.hasRole('admin');
    if (!adminCheck.allowed) {
      throw new Error(`Access denied: ${adminCheck.reason}`);
    }

    // Check feed ownership
    const ownerCheck = await auth.feed(args.feedId).hasRole('owner');

    // Check posting permission
    const canPost = await auth.feed(args.feedId).canPost();
    if (!canPost.allowed) {
      // Use helper to throw
      canPost.throwIfNotPermitted();
    }

    return { canPost: true };
  },
});
```

### 4.3 Method Reference

#### User Role Methods
```typescript
// Check if user has a specific role
auth.hasRole(role: UserRole): PermissionResult

// Examples:
auth.hasRole('admin')  // { allowed: true } or { allowed: false, reason: '...' }
auth.hasRole('user')
```

#### Feed Context Methods
```typescript
// Create a feed context for permission checks
auth.feed(feedId: Id<"feeds">, feedData?: Doc<"feeds">): FeedAuthContext

// Feed role checks
auth.feed(feedId).hasRole('member'): Promise<PermissionResult>
auth.feed(feedId).hasRole('owner'): Promise<PermissionResult>

// Feed permission checks (composite)
auth.feed(feedId).canPost(): Promise<PermissionResult>
auth.feed(feedId).canMessage(): Promise<PermissionResult>

// With feed data to avoid auto-fetch
auth.feed(feedId, feedData).canPost(): PermissionResult
auth.feed(feedId, feedData).canMessage(): PermissionResult
```

#### Helper Methods
```typescript
// Throw error if not permitted (extends PermissionResult)
result.throwIfNotPermitted(): void | throws Error
```

### 4.4 Return Value Extensions

All `PermissionResult` objects include a `throwIfNotPermitted()` helper:

```typescript
interface PermissionResult {
  allowed: boolean;
  reason?: PermissionDenialReason;
  throwIfNotPermitted(): void;
}

// Usage:
const result = await auth.feed(feedId).canPost();
result.throwIfNotPermitted(); // Throws if not allowed
```

## 5. Permission Logic

### 5.1 User Role Checks

#### hasRole('admin')
```
Returns { allowed: true } if:
- User is authenticated
- User exists in database
- User is not deactivated
- users.role === 'admin'

Otherwise returns { allowed: false, reason: '...' }
```

#### hasRole('user')
```
Returns { allowed: true } if:
- User is authenticated
- User exists in database
- User is not deactivated
- users.role === 'user' OR users.role is undefined (default)

Otherwise returns { allowed: false, reason: '...' }
```

### 5.2 Feed Role Checks

#### feed(feedId).hasRole('member')
```
Returns { allowed: true } if:
- User is authenticated
- User exists in database
- User is not deactivated
- userFeeds record exists for user+feed

Otherwise returns { allowed: false, reason: 'not_feed_member' }
```

#### feed(feedId).hasRole('owner')
```
Returns { allowed: true } if:
- User is authenticated
- User exists in database
- User is not deactivated
- userFeeds record exists for user+feed
- userFeeds.owner === true

Otherwise returns { allowed: false, reason: 'not_feed_owner' }
```

### 5.3 Feed Permission Checks (Composite)

#### feed(feedId).canPost()
```
Returns { allowed: true } if ALL of:
1. User is authenticated
2. User exists in database
3. User is not deactivated
4. User is a member of the feed (userFeeds record exists)
5. Feed has 'post' in memberPermissions array

Otherwise returns { allowed: false, reason: '...' }
Possible reasons: 'unauthenticated', 'user_not_found', 'user_deactivated',
                 'not_feed_member', 'missing_permission'
```

#### feed(feedId).canMessage()
```
Returns { allowed: true } if ALL of:
1. User is authenticated
2. User exists in database
3. User is not deactivated
4. User is a member of the feed (userFeeds record exists)
5. Feed has 'message' in memberPermissions array

Otherwise returns { allowed: false, reason: '...' }
Possible reasons: Same as canPost()
```

### 5.4 Feed Privacy Enforcement

Feed privacy rules are enforced during membership checks:

**Public feeds:**
- Anyone can view (even non-authenticated users)
- Membership not required for viewing
- Membership required for posting/messaging

**Open feeds:**
- Any authenticated user can view
- Users can join freely (creates userFeeds record)
- Membership required for posting/messaging

**Private feeds:**
- Only feed members can view
- Feed owners must invite users (creates userFeeds record)
- Membership required for posting/messaging

## 6. Implementation Details

### 6.1 Core Module Structure

**lib/auth/core/types.ts:**
```typescript
import { Id, Doc } from '@/convex/_generated/dataModel';

export type UserRole = 'admin' | 'user';
export type FeedRole = 'member' | 'owner';
export type FeedPermission = 'post' | 'message';
export type FeedPrivacy = 'public' | 'open' | 'private';

export type PermissionDenialReason =
  | 'unauthenticated'
  | 'user_not_found'
  | 'user_deactivated'
  | 'not_feed_member'
  | 'not_feed_owner'
  | 'missing_permission';

export interface PermissionResult {
  allowed: boolean;
  reason?: PermissionDenialReason;
  throwIfNotPermitted(): void;
}

export interface AuthUser {
  id: Id<"users">;
  clerkId?: string;
  role?: UserRole;
  deactivatedAt?: number;
  orgId: Id<"organizations">;
}

export interface FeedAuthContext {
  hasRole(role: FeedRole): Promise<PermissionResult>;
  canPost(): Promise<PermissionResult>;
  canMessage(): Promise<PermissionResult>;
}
```

**lib/auth/core/permissions.ts:**
```typescript
import { PermissionResult, AuthUser, FeedPermission } from './types';

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

export function checkUserRole(
  user: AuthUser | null,
  role: UserRole
): PermissionResult {
  if (!user) {
    return createPermissionResult(false, 'unauthenticated');
  }

  if (user.deactivatedAt) {
    return createPermissionResult(false, 'user_deactivated');
  }

  const userRole = user.role || 'user';
  if (userRole !== role) {
    return createPermissionResult(false, 'user_not_found');
  }

  return createPermissionResult(true);
}

export function checkFeedPermission(
  isMember: boolean,
  feed: Doc<"feeds">,
  permission: FeedPermission
): PermissionResult {
  if (!isMember) {
    return createPermissionResult(false, 'not_feed_member');
  }

  const hasPermission = feed.memberPermissions?.includes(permission) ?? false;
  if (!hasPermission) {
    return createPermissionResult(false, 'missing_permission');
  }

  return createPermissionResult(true);
}
```

### 6.2 Backend Implementation

**lib/auth/convex/index.ts:**
```typescript
import { QueryCtx, MutationCtx } from '@/convex/_generated/server';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { checkUserRole, checkFeedPermission, createPermissionResult } from '../core/permissions';
import { AuthUser, FeedAuthContext, PermissionResult, UserRole, FeedRole } from '../core/types';

type ConvexContext = QueryCtx | MutationCtx;

export class UserAuth {
  private user: AuthUser | null = null;

  constructor(
    private ctx: ConvexContext,
    private orgId: Id<"organizations">
  ) {}

  async init(): Promise<void> {
    const clerkUser = await this.ctx.auth.getUserIdentity();
    if (!clerkUser) {
      this.user = null;
      return;
    }

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

    this.user = {
      id: dbUser._id,
      clerkId: dbUser.clerkId,
      role: dbUser.role,
      deactivatedAt: dbUser.deactivatedAt,
      orgId: dbUser.orgId,
    };
  }

  hasRole(role: UserRole): PermissionResult {
    return checkUserRole(this.user, role);
  }

  feed(feedId: Id<"feeds">, feedData?: Doc<"feeds">): FeedAuthContext {
    return new FeedAuthContextImpl(this.ctx, this.user, feedId, feedData);
  }
}

class FeedAuthContextImpl implements FeedAuthContext {
  constructor(
    private ctx: ConvexContext,
    private user: AuthUser | null,
    private feedId: Id<"feeds">,
    private feedData?: Doc<"feeds">
  ) {}

  async hasRole(role: FeedRole): Promise<PermissionResult> {
    if (!this.user) {
      return createPermissionResult(false, 'unauthenticated');
    }

    if (this.user.deactivatedAt) {
      return createPermissionResult(false, 'user_deactivated');
    }

    const userFeed = await this.ctx.db
      .query("userFeeds")
      .withIndex("by_user_and_feed", (q) =>
        q.eq("userId", this.user!.id).eq("feedId", this.feedId)
      )
      .first();

    if (!userFeed) {
      return createPermissionResult(false, 'not_feed_member');
    }

    if (role === 'owner' && !userFeed.owner) {
      return createPermissionResult(false, 'not_feed_owner');
    }

    return createPermissionResult(true);
  }

  async canPost(): Promise<PermissionResult> {
    const memberCheck = await this.hasRole('member');
    if (!memberCheck.allowed) {
      return memberCheck;
    }

    const feed = this.feedData || await this.ctx.db.get(this.feedId);
    if (!feed) {
      return createPermissionResult(false, 'not_feed_member');
    }

    return checkFeedPermission(true, feed, 'post');
  }

  async canMessage(): Promise<PermissionResult> {
    const memberCheck = await this.hasRole('member');
    if (!memberCheck.allowed) {
      return memberCheck;
    }

    const feed = this.feedData || await this.ctx.db.get(this.feedId);
    if (!feed) {
      return createPermissionResult(false, 'not_feed_member');
    }

    return checkFeedPermission(true, feed, 'message');
  }
}

export async function getUserAuth(
  ctx: ConvexContext,
  orgId: Id<"organizations">
): Promise<UserAuth> {
  const auth = new UserAuth(ctx, orgId);
  await auth.init();
  return auth;
}
```

### 6.3 Frontend Implementation

**lib/auth/client/useUserAuth.ts:**
```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useOrganization } from '@/app/context/OrganizationProvider';
import { Id, Doc } from '@/convex/_generated/dataModel';
import { UserRole, FeedRole, FeedAuthContext, PermissionResult } from '../core/types';
import { checkUserRole, checkFeedPermission, createPermissionResult } from '../core/permissions';

export class UserAuthClient {
  constructor(
    private user: Doc<"users"> | null,
    private userFeeds: Doc<"userFeeds">[],
    private getFeed: (feedId: Id<"feeds">) => Promise<Doc<"feeds"> | null>
  ) {}

  hasRole(role: UserRole): PermissionResult {
    return checkUserRole(this.user, role);
  }

  feed(feedId: Id<"feeds">, feedData?: Doc<"feeds">): FeedAuthContext {
    return new FeedAuthContextClient(this.user, this.userFeeds, feedId, feedData, this.getFeed);
  }
}

class FeedAuthContextClient implements FeedAuthContext {
  constructor(
    private user: Doc<"users"> | null,
    private userFeeds: Doc<"userFeeds">[],
    private feedId: Id<"feeds">,
    private feedData?: Doc<"feeds">,
    private getFeed?: (feedId: Id<"feeds">) => Promise<Doc<"feeds"> | null>
  ) {}

  async hasRole(role: FeedRole): Promise<PermissionResult> {
    if (!this.user) {
      return createPermissionResult(false, 'unauthenticated');
    }

    if (this.user.deactivatedAt) {
      return createPermissionResult(false, 'user_deactivated');
    }

    const userFeed = this.userFeeds.find(uf => uf.feedId === this.feedId);
    if (!userFeed) {
      return createPermissionResult(false, 'not_feed_member');
    }

    if (role === 'owner' && !userFeed.owner) {
      return createPermissionResult(false, 'not_feed_owner');
    }

    return createPermissionResult(true);
  }

  async canPost(): Promise<PermissionResult> {
    const memberCheck = await this.hasRole('member');
    if (!memberCheck.allowed) {
      return memberCheck;
    }

    let feed = this.feedData;
    if (!feed && this.getFeed) {
      feed = await this.getFeed(this.feedId);
    }

    if (!feed) {
      return createPermissionResult(false, 'not_feed_member');
    }

    return checkFeedPermission(true, feed, 'post');
  }

  async canMessage(): Promise<PermissionResult> {
    const memberCheck = await this.hasRole('member');
    if (!memberCheck.allowed) {
      return memberCheck;
    }

    let feed = this.feedData;
    if (!feed && this.getFeed) {
      feed = await this.getFeed(this.feedId);
    }

    if (!feed) {
      return createPermissionResult(false, 'not_feed_member');
    }

    return checkFeedPermission(true, feed, 'message');
  }
}

export function useUserAuth(): [
  auth: UserAuthClient | null,
  state: { isLoading: boolean; error: Error | null }
] {
  const { user: clerkUser, isLoaded } = useUser();
  const org = useOrganization();
  const orgId = org?._id ?? ("" as Id<"organizations">);

  const user = useQuery(api.user.getUserByClerkId, {
    clerkId: clerkUser?.id ?? "",
    orgId,
  });

  const feedsData = useQuery(api.feeds.getUserFeedsWithMemberships, {
    orgId,
  });

  const { userFeeds = [] } = feedsData || {};

  // Create getFeed helper that uses cached feeds
  const getFeed = async (feedId: Id<"feeds">): Promise<Doc<"feeds"> | null> => {
    const feed = feedsData?.feeds.find(f => f._id === feedId);
    return feed || null;
  };

  if (!isLoaded) {
    return [null, { isLoading: true, error: null }];
  }

  if (!user) {
    return [null, { isLoading: false, error: null }];
  }

  const auth = new UserAuthClient(user, userFeeds, getFeed);
  return [auth, { isLoading: false, error: null }];
}
```

## 7. Migration Strategy

### 7.1 Migration Order
1. Implement core module (types, permissions)
2. Implement backend adapter (Convex)
3. Test backend implementation
4. Migrate backend usage (convex/user.ts → lib/auth/convex)
5. Implement frontend adapter (React hook)
6. Test frontend implementation
7. Migrate frontend usage (app/hooks/useAuthedUser.ts → lib/auth/client)
8. Remove old implementations

### 7.2 Backend Migration

**Before (convex/user.ts):**
```typescript
const result = await getAuthResult(ctx, orgId);
if (!result.success) {
  throw new Error(`Authentication failed: ${result.reason}`);
}
const user = result.user;
```

**After (lib/auth/convex):**
```typescript
const auth = await getUserAuth(ctx, orgId);
const adminCheck = auth.hasRole('admin');
adminCheck.throwIfNotPermitted();
```

### 7.3 Frontend Migration

**Before (app/hooks/useAuthedUser.ts):**
```typescript
const { user, feeds, isSignedIn } = useAuthedUser();
const isOwner = feeds.find(f => f._id === feedId)?.owner ?? false;
```

**After (lib/auth/client):**
```typescript
const [auth, { isLoading }] = useUserAuth();
const ownerCheck = await auth?.feed(feedId).hasRole('owner');
const isOwner = ownerCheck?.allowed ?? false;
```

## 8. Testing Strategy

### 8.1 Unit Tests

Create minimal unit tests for core permission logic:

**lib/auth/core/permissions.test.ts:**
```typescript
import { describe, it, expect } from 'vitest';
import { checkUserRole, checkFeedPermission } from './permissions';

describe('checkUserRole', () => {
  it('should allow admin users', () => {
    const result = checkUserRole(
      { id: '123', role: 'admin', orgId: 'org1' },
      'admin'
    );
    expect(result.allowed).toBe(true);
  });

  it('should deny deactivated users', () => {
    const result = checkUserRole(
      { id: '123', role: 'admin', deactivatedAt: Date.now(), orgId: 'org1' },
      'admin'
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('user_deactivated');
  });
});

describe('checkFeedPermission', () => {
  it('should allow members with post permission', () => {
    const feed = {
      _id: 'feed1',
      name: 'Test',
      memberPermissions: ['post'],
      privacy: 'open',
    } as Doc<"feeds">;

    const result = checkFeedPermission(true, feed, 'post');
    expect(result.allowed).toBe(true);
  });

  it('should deny non-members', () => {
    const feed = {
      _id: 'feed1',
      name: 'Test',
      memberPermissions: ['post'],
      privacy: 'open',
    } as Doc<"feeds">;

    const result = checkFeedPermission(false, feed, 'post');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('not_feed_member');
  });
});
```

## 9. Edge Cases & Error Handling

### 9.1 Edge Cases

**Deactivated users:**
- Convex reactivity will update queries when user.deactivatedAt changes
- Auth checks will immediately return 'user_deactivated'
- Frontend UI should handle this gracefully

**Feed privacy changes:**
- Convex reactivity will update feed queries
- Permission checks will reflect new privacy settings
- No custom cache invalidation needed

**Role changes:**
- User role changes propagate via Convex reactivity
- Permission checks will reflect new roles immediately

**Organization changes:**
- Each organization is on a separate subdomain
- New subdomain = new auth session = new orgId
- No cross-organization concerns

**Missing feed data:**
- Auto-fetch will query database if feedData not provided
- Returns 'not_feed_member' if feed doesn't exist

### 9.2 Error Messages

All permission denial reasons should be descriptive and actionable:

```typescript
const reasonMessages: Record<PermissionDenialReason, string> = {
  unauthenticated: 'You must be logged in to perform this action',
  user_not_found: 'User account not found',
  user_deactivated: 'Your account has been deactivated',
  not_feed_member: 'You must be a member of this feed',
  not_feed_owner: 'You must be an owner of this feed',
  missing_permission: 'You do not have permission to perform this action',
};
```

## 10. Future Extensibility

The system is designed to easily accommodate future permission rules:

### 10.1 Adding New Permissions

To add edit permissions:

```typescript
// 1. Add to types
type ContentPermission = 'edit' | 'delete';

// 2. Add method to FeedAuthContext
interface FeedAuthContext {
  // existing methods...
  canEditPost(postId: Id<"posts">): Promise<PermissionResult>;
  canDeletePost(postId: Id<"posts">): Promise<PermissionResult>;
}

// 3. Implement logic
async canEditPost(postId: Id<"posts">): Promise<PermissionResult> {
  // Check if user is post author
  const post = await this.ctx.db.get(postId);
  if (post?.posterId === this.user?.id) {
    return createPermissionResult(true);
  }
  return createPermissionResult(false, 'not_post_author');
}

async canDeletePost(postId: Id<"posts">): Promise<PermissionResult> {
  // User can delete own posts, feed owners can delete any post
  const canEdit = await this.canEditPost(postId);
  if (canEdit.allowed) return canEdit;

  const isOwner = await this.hasRole('owner');
  return isOwner;
}
```

### 10.2 Adding New Role Types

To add moderator role:

```typescript
// 1. Update schema
role: v.optional(v.union(
  v.literal("admin"),
  v.literal("user"),
  v.literal("moderator")  // New role
))

// 2. Add to types
type UserRole = 'admin' | 'user' | 'moderator';

// 3. Use existing hasRole() method
auth.hasRole('moderator')
```

## 11. Success Criteria

- ✅ Single source of truth for all auth/permission logic
- ✅ Intuitive, method-chaining API (hasRole, feed().canPost())
- ✅ Works seamlessly on frontend and backend
- ✅ Type-safe with full TypeScript support
- ✅ Leverages Convex reactivity (no custom caching)
- ✅ Easily extensible for new permissions
- ✅ Replaces convex/user.ts and app/hooks/useAuthedUser.ts
- ✅ Minimal performance overhead
- ✅ Descriptive error messages
- ✅ Comprehensive test coverage of core logic
