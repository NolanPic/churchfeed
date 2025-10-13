# Research Findings

## Current Implementation Analysis

### Frontend (app/hooks/useAuthedUser.ts)
- Uses Clerk hooks (`useUser`, `useAuth`)
- Queries Convex for user data via `api.user.getUserByClerkId`
- Queries feeds with memberships via `api.feeds.getUserFeedsWithMemberships`
- Returns: user, clerkUser, organization, isSignedIn, isLoaded, signOut, feeds (with owner flag)
- Builds a map of feeds with ownership status

### Backend (convex/user.ts)
- Provides `AuthResult<T>` type with success/failure states
- `getAuthResult()`: Returns authentication result with clerk user and db user
- `requireAuth()`: Throws error if not authenticated
- `getAuthenticatedUser()`: Returns user or null
- Checks for: unauthenticated, user_not_found, user_deactivated
- Does NOT include any feed permission logic

### Database Schema
**users table:**
- email, name, image, orgId, clerkId
- deactivatedAt (optional)
- role: "admin" | "user" (optional)
- Indexes: by_org, by_org_and_email, by_clerk_and_org_id

**feeds table:**
- name, orgId, updatedAt
- privacy: "public" | "private" | "open"
- memberPermissions: array of "post" | "message" (optional)

**userFeeds table:**
- userId, feedId, orgId, updatedAt
- owner: boolean

## Current Gaps
1. No centralized permission checking logic
2. Feed permissions scattered across codebase
3. No consistent API for checking:
   - Can user post in feed?
   - Can user message in feed?
   - Can user delete post/message?
   - Is user feed owner?
   - Is user admin?
4. Frontend and backend have different auth patterns
5. No caching strategy for permission checks
6. No clear way to check "can admin become owner of any feed"

## Requirements Summary
- Create unified UserAuth system for frontend and backend
- Simple, consistent API for all permission checks
- Replace useAuthedUser.ts functionality
- Replace/extend convex/user.ts functionality
- Support all roles and permissions from spec
- Lightweight and extensible
- Follow Next.js, Convex, and Clerk best practices
