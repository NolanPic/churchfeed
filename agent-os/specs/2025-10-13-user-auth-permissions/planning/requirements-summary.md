# Requirements Summary

## Overview
Create a unified UserAuth system for churchfeed that works across both backend (Convex) and frontend (Next.js) to handle authentication and authorization checks.

## Core Requirements

### 1. Architecture
- **Shared Module**: Single shared module with platform-specific adapters
- **Frontend**: React hook (`useUserAuth`)
- **Backend**: Helper function that creates auth instance
- **No Mutations**: Auth system only performs checks, no data modifications

### 2. API Design

#### Frontend Hook Pattern
```typescript
const [auth, { isLoading, error }] = useUserAuth();
```

#### Backend Usage Pattern
```typescript
const auth = await getUserAuth(ctx, orgId);
```

#### Method Chaining API
- User roles: `auth.hasRole('admin')` or `auth.hasRole('user')`
- Feed roles: `auth.feed(feedId).hasRole('member')` or `auth.feed(feedId).hasRole('owner')`
- Feed permissions: `auth.feed(feedId).canPost()`, `auth.feed(feedId).canMessage()`
- Optional feed data: `auth.feed(feedId, feedData).canPost()` (to avoid auto-fetch)

#### Result Object Structure
```typescript
// Success
{ allowed: true }

// Failure
{ allowed: false, reason: 'not_feed_member' }
```

#### Helper Methods
- `throwIfNotPermitted()` - Helper that throws error using reason from result object
- Composite helpers like `canPost()` that internally check:
  1. User is authenticated
  2. User is member of feed (respecting privacy rules)
  3. Feed has 'post' in memberPermissions

### 3. Permission Rules

#### User Roles
- **Admin**: `users.role === 'admin'`
  - Full access to admin section
  - Can become owner of any feed
  - Can make other users feed owners
- **User**: `users.role === 'user'`
  - Regular users who can access feeds they're members of

#### Feed Roles (via userFeeds table)
- **Member**: `userFeeds` record exists for user+feed
- **Owner**: `userFeeds.owner === true`

#### Feed Privacy Settings
- **public**: Anyone can view (even non-logged-in)
- **open**: Any logged-in user can join
- **private**: Feed owners must invite users

#### Feed Member Permissions
- **post**: Members can post in feed
- **message**: Members can message in feed

#### Content Deletion (future consideration)
- Users can delete their own posts/messages
- Feed owners can delete any post/message in their feeds
- Admins can moderate by becoming feed owners
- Future: Users can edit own content, owners can only delete

### 4. Data Loading
- **Support both approaches:**
  - Auto-fetch: `auth.feed(feedId).canPost()` (system loads feed data)
  - Pass data: `auth.feed(feedId, feedData).canPost()` (caller provides feed data)

### 5. Caching & Performance
- Use Convex's built-in reactivity and caching
- No custom caching layer needed
- Convex reactivity handles:
  - User deactivations
  - Feed privacy/permission changes
  - User role changes
  - Organization is per-subdomain (won't change mid-session)

### 6. Error Handling
- Return result objects with `allowed` boolean and optional `reason`
- Provide `throwIfNotPermitted()` helper for cases needing errors
- Reasons should be descriptive: `'not_feed_member'`, `'missing_permission'`, `'user_deactivated'`, etc.

### 7. Testing
- Bare minimum unit tests to verify auth logic works
- No integration tests required at this time

### 8. Migration Strategy
- Migrate at end of implementation
- No compatibility helpers
- Order: Backend first, then frontend
- Replace:
  - Backend: `convex/user.ts`
  - Frontend: `app/hooks/useAuthedUser.ts`

### 9. Design Principles
- **Granular but composable**: Expose atomic checks (hasRole) and composite helpers (canPost)
- **Lightweight**: Minimal dependencies, leverage platform features
- **Extensible**: Easy to add new permission rules (edit vs delete, etc.)
- **Type-safe**: Full TypeScript support
- **Consistent**: Same API patterns across frontend and backend

## Current Implementation to Replace

### Backend (convex/user.ts)
- `getAuthResult(ctx, orgId)` - Returns AuthResult with user
- `requireAuth(ctx, orgId)` - Throws if not authenticated
- `getAuthenticatedUser(ctx, orgId)` - Returns user or null
- Currently checks: unauthenticated, user_not_found, user_deactivated

### Frontend (app/hooks/useAuthedUser.ts)
- Returns: user, clerkUser, organization, isSignedIn, isLoaded, signOut, feeds
- Queries user by Clerk ID
- Queries feeds with membership/ownership info
- Builds feed map with owner flags

## Success Criteria
- Single source of truth for all auth/permission logic
- Simple, intuitive API for common checks
- Works seamlessly on both frontend and backend
- Replaces all existing auth logic in codebase
- Easy to extend with new permission rules
- Type-safe with good IDE autocomplete
- Minimal performance overhead
