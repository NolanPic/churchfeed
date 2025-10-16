# UserAuth & Permissions System - Implementation Tasks

## Task Organization

Tasks are organized into strategic phases that build upon each other. Each phase should be completed before moving to the next.

---

## Phase 1: Core Module Setup

These tasks establish the foundation that both frontend and backend will use.

### Task 1.1: Create directory structure
**Description:** Set up the folder structure for the auth module
**Files to create:**
- `lib/auth/core/`
- `lib/auth/convex/`
- `lib/auth/client/`

**Acceptance criteria:**
- All directories exist
- Directory structure matches spec

---

### Task 1.2: Implement core types
**Description:** Create TypeScript types and interfaces for the auth system
**File:** `lib/auth/core/types.ts`

**Implementation details:**
- Define `UserRole`, `FeedRole`, `FeedPermission`, `FeedPrivacy` types
- Define `PermissionDenialReason` type with all possible reasons
- Define `PermissionResult` interface with `throwIfNotPermitted()` method
- Define `AuthUser` interface
- Define `FeedAuthContext` interface
- Export all types

**Acceptance criteria:**
- All types defined and exported
- Types match the spec exactly
- No TypeScript errors

---

### Task 1.3: Implement core permission logic
**Description:** Create the shared permission checking functions
**File:** `lib/auth/core/permissions.ts`

**Implementation details:**
- Implement `createPermissionResult()` function that creates PermissionResult with throwIfNotPermitted helper
- Implement `checkUserRole()` function
  - Check if user is null (unauthenticated)
  - Check if user is deactivated
  - Check if user has the required role
  - Handle default 'user' role
- Implement `checkFeedPermission()` function
  - Check if user is member
  - Check if feed has required permission in memberPermissions array
- Export all functions

**Acceptance criteria:**
- All functions implemented
- Permission logic matches spec
- Functions return correct PermissionResult objects
- throwIfNotPermitted() helper works correctly

---

### Task 1.4: Create core utilities
**Description:** Create shared utility functions (if needed)
**File:** `lib/auth/core/utils.ts`

**Implementation details:**
- Error message mapping for PermissionDenialReason
- Any other shared utilities

**Acceptance criteria:**
- Utilities are reusable across platforms
- No platform-specific code

---

## Phase 2: Backend Implementation (Convex)

These tasks implement the backend auth system using the core module.

### Task 2.1: Implement UserAuth class
**Description:** Create the main UserAuth class for Convex
**File:** `lib/auth/convex/index.ts`

**Implementation details:**
- Create `UserAuth` class with private user property
- Implement constructor that takes `ctx` and `orgId`
- Implement `init()` method that:
  - Gets Clerk user from ctx.auth.getUserIdentity()
  - Queries users table by clerkId and orgId
  - Sets this.user to AuthUser format
  - Returns void
- Implement `hasRole()` method using `checkUserRole()` from core
- Implement `feed()` method that returns FeedAuthContextImpl

**Acceptance criteria:**
- UserAuth class properly initializes user
- hasRole() works correctly
- feed() returns proper context
- No TypeScript errors

---

### Task 2.2: Implement FeedAuthContextImpl class
**Description:** Create the feed permission context for backend
**File:** `lib/auth/convex/index.ts`

**Implementation details:**
- Create `FeedAuthContextImpl` class implementing `FeedAuthContext`
- Constructor takes ctx, user, feedId, optional feedData
- Implement `hasRole()` method:
  - Check user authentication and deactivation
  - Query userFeeds table for membership
  - Check owner flag if role is 'owner'
  - Return appropriate PermissionResult
- Implement `canPost()` method:
  - Check membership using hasRole('member')
  - Get feed data (use provided or fetch)
  - Use checkFeedPermission() from core
  - Return PermissionResult
- Implement `canMessage()` method (similar to canPost)

**Acceptance criteria:**
- All methods implemented correctly
- Database queries use proper indexes
- Feed data auto-fetch works when not provided
- Permission checks match spec logic

---

### Task 2.3: Implement getUserAuth helper
**Description:** Create the main entry point for backend auth
**File:** `lib/auth/convex/index.ts`

**Implementation details:**
- Export async function `getUserAuth(ctx, orgId)`
- Create UserAuth instance
- Call init() and await
- Return initialized UserAuth instance

**Acceptance criteria:**
- Function is async and properly typed
- Returns fully initialized UserAuth
- Can be imported and used in queries/mutations

---

### Task 2.4: Write backend unit tests
**Description:** Create tests for backend implementation
**File:** `lib/auth/convex/index.test.ts`

**Implementation details:**
- Test UserAuth initialization
- Test hasRole() with different roles
- Test feed().hasRole() for member and owner
- Test canPost() and canMessage()
- Test with deactivated users
- Test with missing feed data

**Acceptance criteria:**
- All core permission logic is tested
- Tests pass
- Edge cases covered

---

## Phase 3: Frontend Implementation (React)

These tasks implement the frontend auth hook using the core module.

### Task 3.1: Implement UserAuthClient class
**Description:** Create the client-side UserAuth class
**File:** `lib/auth/client/useUserAuth.ts`

**Implementation details:**
- Create `UserAuthClient` class
- Constructor takes user, userFeeds array, and getFeed callback
- Implement `hasRole()` method using `checkUserRole()` from core
- Implement `feed()` method that returns FeedAuthContextClient

**Acceptance criteria:**
- UserAuthClient properly stores user and feed data
- hasRole() works correctly
- feed() returns proper context
- No TypeScript errors

---

### Task 3.2: Implement FeedAuthContextClient class
**Description:** Create the feed permission context for frontend
**File:** `lib/auth/client/useUserAuth.ts`

**Implementation details:**
- Create `FeedAuthContextClient` class implementing `FeedAuthContext`
- Constructor takes user, userFeeds, feedId, optional feedData, optional getFeed
- Implement `hasRole()` method:
  - Check user authentication and deactivation
  - Find userFeed in userFeeds array
  - Check owner flag if role is 'owner'
  - Return appropriate PermissionResult
- Implement `canPost()` method:
  - Check membership using hasRole('member')
  - Get feed data (use provided or call getFeed)
  - Use checkFeedPermission() from core
  - Return PermissionResult
- Implement `canMessage()` method (similar to canPost)

**Acceptance criteria:**
- All methods implemented correctly
- Uses in-memory userFeeds array (no additional queries)
- Feed data auto-fetch works when not provided
- Permission checks match spec logic

---

### Task 3.3: Implement useUserAuth hook
**Description:** Create the React hook wrapper
**File:** `lib/auth/client/useUserAuth.ts`

**Implementation details:**
- Export `useUserAuth()` function
- Use Clerk's `useUser()` hook
- Use `useOrganization()` hook
- Use Convex `useQuery()` for user data
- Use Convex `useQuery()` for feeds data
- Create `getFeed` helper that uses cached feeds
- Return `[auth, { isLoading, error }]` tuple
- Handle loading state
- Handle null user
- Create UserAuthClient when user exists

**Acceptance criteria:**
- Hook returns correct tuple structure
- Loading states handled properly
- Uses Convex reactivity for caching
- No unnecessary re-renders
- TypeScript types correct

---

### Task 3.4: Write frontend unit tests
**Description:** Create tests for frontend implementation
**File:** `lib/auth/client/useUserAuth.test.ts`

**Implementation details:**
- Test UserAuthClient with different user states
- Test hasRole() with different roles
- Test feed().hasRole() for member and owner
- Test canPost() and canMessage()
- Test with missing feed data
- Test getFeed caching

**Acceptance criteria:**
- All core permission logic is tested
- Tests pass
- React hook testing best practices followed

---

## Phase 4: Backend Migration

These tasks migrate the existing backend code to use the new auth system.

### Task 4.1: Identify all usages of old auth code
**Description:** Find all places that use convex/user.ts
**Files to check:**
- All files in `convex/` directory
- Search for imports from `./user` or `@/convex/user`

**Acceptance criteria:**
- Complete list of files using old auth
- Documented in migration notes

---

### Task 4.2: Migrate backend queries
**Description:** Update all Convex queries to use new auth system
**Files:** All query files identified in 4.1

**Implementation details:**
For each file:
- Replace `import { getAuthResult, requireAuth } from './user'`
- With `import { getUserAuth } from '@/lib/auth/convex'`
- Replace `await getAuthResult(ctx, orgId)` with `await getUserAuth(ctx, orgId)`
- Replace `await requireAuth(ctx, orgId)` with auth checks + `throwIfNotPermitted()`
- Add feed permission checks where needed

**Acceptance criteria:**
- All queries migrated
- No imports from old user.ts
- All permission checks work correctly
- No TypeScript errors

---

### Task 4.3: Migrate backend mutations
**Description:** Update all Convex mutations to use new auth system
**Files:** All mutation files identified in 4.1

**Implementation details:**
Same as Task 4.2 but for mutations

**Acceptance criteria:**
- All mutations migrated
- No imports from old user.ts
- All permission checks work correctly
- No TypeScript errors

---

### Task 4.4: Test backend migration
**Description:** Verify all backend auth checks work
**Testing approach:**
- Run all existing backend tests
- Manually test critical auth flows
- Verify permission checks are enforced

**Acceptance criteria:**
- All tests pass
- Auth checks work in development
- No regressions

---

### Task 4.5: Remove old backend auth code
**Description:** Delete the old user.ts file
**Files to delete:**
- `convex/user.ts` (keep only if there are other non-auth functions)

**Acceptance criteria:**
- Old auth code removed or marked deprecated
- No imports of old code anywhere
- Codebase uses new auth system exclusively

---

## Phase 5: Frontend Migration ✅

These tasks migrate the existing frontend code to use the new auth hook.

### Task 5.1: Identify all usages of useAuthedUser ✅
**Description:** Find all places that use app/hooks/useAuthedUser.ts
**Files to check:**
- All files in `app/` directory
- Search for imports from `useAuthedUser`

**Acceptance criteria:**
- Complete list of components using old hook
- Documented in migration notes

---

### Task 5.2: Migrate components to new hook ✅
**Description:** Update all components to use useUserAuth
**Files:** All component files identified in 5.1

**Implementation details:**
For each component:
- Replace `import { useAuthedUser }` with `import { useUserAuth }`
- Replace `const { user, feeds, isSignedIn } = useAuthedUser()`
- With `const [auth, { isLoading }] = useUserAuth()`
- Update auth checks to use new API:
  - `isSignedIn` → `auth !== null`
  - Feed owner checks → `auth.feed(feedId).hasRole('owner')`
  - Admin checks → `auth.hasRole('admin')`
- Update permission checks:
  - Add `canPost()`, `canMessage()` checks
- Handle loading states properly
- Handle null auth

**Acceptance criteria:**
- All components migrated
- No imports from old hook
- All auth checks work correctly
- Loading states handled
- No TypeScript errors

---

### Task 5.3: Test frontend migration ✅
**Description:** Verify all frontend auth checks work
**Testing approach:**
- Test all auth-gated UI components
- Test role-based rendering
- Test permission-based buttons
- Test loading states
- Test edge cases (deactivated user, etc.)

**Acceptance criteria:**
- All UI components work correctly
- Auth checks are enforced
- Loading states work smoothly
- No regressions

---

### Task 5.4: Remove old frontend auth code ✅
**Description:** Delete the old useAuthedUser hook
**Files to delete:**
- `app/hooks/useAuthedUser.ts`

**Acceptance criteria:**
- Old hook removed
- No imports of old hook anywhere
- Codebase uses new hook exclusively

---

## Phase 6: Final Verification & Documentation

### Task 6.1: Run full test suite
**Description:** Execute all tests to verify the system works end-to-end
**Commands:**
- Run unit tests: `npm test`
- Run type checking: `npm run type-check`

**Acceptance criteria:**
- All tests pass
- No TypeScript errors
- No console warnings

---

### Task 6.2: Manual testing
**Description:** Test all auth flows manually in the app
**Test cases:**
- Login/logout
- Admin role checks
- User role checks
- Feed membership checks
- Feed ownership checks
- Post permission checks
- Message permission checks
- Deactivated user handling
- Privacy enforcement (public/open/private)

**Acceptance criteria:**
- All test cases pass
- Auth system works as expected
- No bugs found

---

### Task 6.3: Performance verification
**Description:** Verify no performance regressions
**Checks:**
- Page load times similar to before
- No excessive re-renders
- Convex reactivity working properly
- Feed queries cached appropriately

**Acceptance criteria:**
- Performance is equal or better than before
- No unnecessary queries
- Caching works correctly

---

### Task 6.4: Update code documentation
**Description:** Add inline code documentation
**Files to document:**
- All exported functions and classes
- Complex permission logic
- Public API methods

**Acceptance criteria:**
- JSDoc comments on all public APIs
- Clear examples in comments
- Type documentation complete

---

### Task 6.5: Create usage guide
**Description:** Write developer documentation for the new auth system
**File:** `lib/auth/README.md`

**Content:**
- Quick start guide
- API reference
- Common patterns
- Migration guide from old system
- Examples for common use cases
- Troubleshooting tips

**Acceptance criteria:**
- Documentation is clear and comprehensive
- Examples work correctly
- Covers all main use cases

---

## Summary

**Total Phases:** 6
**Total Tasks:** 27

**Estimated Timeline:**
- Phase 1: 4-6 hours (Core module)
- Phase 2: 6-8 hours (Backend implementation)
- Phase 3: 6-8 hours (Frontend implementation)
- Phase 4: 4-6 hours (Backend migration)
- Phase 5: 6-8 hours (Frontend migration)
- Phase 6: 2-4 hours (Verification & docs)

**Total: 28-40 hours**

**Critical Path:**
Phase 1 → Phase 2 → Phase 4 → Phase 3 → Phase 5 → Phase 6

**Dependencies:**
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1
- Phase 4 depends on Phase 2
- Phase 5 depends on Phase 3
- Phase 6 depends on Phases 4 and 5

**Risk Areas:**
- Backend migration (Task 4.2-4.3): Many files may need updates
- Frontend migration (Task 5.2): Component changes may affect UI
- Testing (6.2): Manual testing may reveal edge cases

**Success Metrics:**
- ✅ All tests pass
- ✅ Zero imports from old auth code
- ✅ Single source of truth for auth
- ✅ Consistent API across platforms
- ✅ No performance regressions
- ✅ Full type safety maintained
