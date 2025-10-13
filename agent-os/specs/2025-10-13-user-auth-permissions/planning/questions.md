# Clarifying Questions

Based on my analysis of your codebase and the permissions draft, I have some questions to ensure the UserAuth system meets your needs:

---

## 1. API Design & Structure

How would you prefer to structure the permission checks?
- **Option A:** Class-based (e.g., userAuth.canPostInFeed(feedId))
- **Option B:** Functional (e.g., canPostInFeed(user, feed))
- **Option C:** Method chaining (e.g., userAuth.feed(feedId).canPost())

**Answer**: Option C. Additionally, the functions available should be very granular, but composable. For example, we don't need a `canUserViewAdminSettings()` function, just an `isAdmin()` function (or equivalent).
---

## 2. Shared Code Strategy

Since this needs to work on both frontend (Next.js) and backend (Convex), how should we share the code?
- **Option A:** Separate implementations with shared types/interfaces
- **Option B:** Single shared module with platform-specific adapters
- **Option C:** Core logic in a shared module, with thin wrappers for each platform

**Answer**: Option B since the frontend should work as a React hook.

---

## 3. Feed Data Loading

For permission checks that require feed data (privacy, memberPermissions), should the system:
- **Option A:** Require feed data to be passed in (caller's responsibility to load)
- **Option B:** Auto-fetch feed data when needed (system handles loading)
- **Option C:** Support both approaches with different methods

**Answer**: Option C

---

## 4. Error Handling

How should permission denials be handled?
- **Option A:** Return boolean (true/false) for simple checks
- **Option B:** Return result objects with reasons (like current AuthResult)
- **Option C:** Throw errors that can be caught
- **Option D:** Mix of approaches depending on context

**Answer**: Option B, though it may be nice to have some kind of `.throwIfNotPermitted()` helper that throws an error using the reason in the result object.

---

## 5. Admin "Become Owner" Flow

When an admin wants to become a feed owner:
- Should this be a permission check only, or should the system also provide a method to execute the ownership change?
- Should there be audit logging when admins take ownership?

**Answer**: Permission check only, e.g. something like `isAdmin()`. There should be no "mutations" in the system, only auth checks.

---

## 6. Caching & Performance

For permission checks (especially on frontend):
- Should we cache permission results?
- How long should cache be valid?
- Should we use Convex's built-in reactivity or implement custom caching?

**Answer**: Use Convex's built-in reactivity/caching

---

## 7. Migration Strategy

When replacing existing auth code:
- Should we do a gradual migration (both systems coexist temporarily)?
- Should we create compatibility helpers to ease transition?
- Any specific order of migration (backend first, frontend first, or parallel)?

**Answer**:
  - We should migrate as part of the implementation at the end
  - No compatibility helpers
  - Backend first, then frontend

---

## 8. Testing Requirements

What level of testing do you want?
- Unit tests for permission logic?
- Integration tests with Convex?
- Frontend component tests with the auth system?

**Answer**: Do the bare minimum number of unit tests necessary to test that auth works. No integration tests necessary at this time.

---

## 9. Edge Cases

How should these scenarios be handled:
- User is deactivated mid-session?
- Feed privacy/permissions change while user is viewing it?
- User's role changes (becomes admin or loses admin)?
- Organization changes?

**Answer**:
Convex reactivity should handle deactivations, privacy, and role changes. The org would not change unless the user goes to a different subdomain, and at that point it would have its own auth/login.

---

## 10. Future Extensibility

Are there any planned features that should influence the design?
- More granular permissions (edit vs delete, etc.)?
- Team/group permissions beyond user roles?
- Custom permission rules per organization?

**Answer**: In the future, a user may be able to edit their post/message, but a feed owner would only be able to delete it. We don't need to worry about implementing this now, but the system should be designed in a such a way that adding new rules is easy and straightfoward.

---

## 11. Visual Assets

Do you have any of the following that would help:
- Flow diagrams showing permission check flows?
- UI mockups showing how permissions affect the interface?
- Wireframes of admin panel for managing permissions?

**Answer**: I have no visual assets available.

---

Please provide answers to these questions, and feel free to share any visual assets by placing them in the
`agent-os/specs/2025-10-13-user-auth-permissions/planning/visuals/` folder!

# Follow-up Questions

---

## 1. Method Chaining API Details

You mentioned **Option C: Method chaining** (e.g., `userAuth.feed(feedId).canPost()`).
A few clarifications:

### a) For simple role checks, should it be:
- `userAuth.isAdmin()`
- `userAuth.role.isAdmin()`
- `userAuth.hasRole('admin')`

**Answer**: `userAuth.hasRole('admin')`

### b) For feed membership checks without permissions, should it be:
- `userAuth.feed(feedId).isMember()`
- `userAuth.isMemberOf(feedId)`

**Answer**: Actually, let's make it `userAuth.feed(feedId).hasRole('member')`

### c) For feed ownership checks:
- `userAuth.feed(feedId).isOwner()`
- `userAuth.isOwnerOf(feedId)`

**Answer**: Actually, let's make it `userAuth.feed(feedId).hasRole('owner')`

---

## 2. Result Object Structure

You chose **Option B: Return result objects with reasons**.
Should the result structure be:

### Option A: Success/failure with reason
```json
{ "success": true, "allowed": true }
{ "success": true, "allowed": false, "reason": "missing_permission" }
```

### Option B: Simple allowed with optional reason
```json
{ "allowed": true }
{ "allowed": false, "reason": "not_feed_member" }
```

### Option C: Something else?

**Answer**: Option B

---

## 3. Frontend Hook Return Structure

Since the frontend should be a React hook, should `useUserAuth()` return:

### Option A: Object with methods
```js
const auth = useUserAuth();
auth.isAdmin();
auth.feed(feedId).canPost();
```

### Option B: Array with auth object and helpers
```js
const [auth, { isLoading, error }] = useUserAuth();
```

### Option C: Just the auth object with built-in state
```js
const auth = useUserAuth();
auth.isLoading;
auth.isAdmin();
```

**Answer**: Option B

---

## 4. Feed Data Loading — Both Approaches

For **Option C** (support both approaches), should the API be:

### Option A: Separate methods
```js
// Auto-fetch
userAuth.feed(feedId).canPost();

// Pass in feed data
userAuth.feedWithData(feed).canPost();
```

### Option B: Optional parameter
```js
// Auto-fetch
userAuth.feed(feedId).canPost();

// Pass in feed data
userAuth.feed(feedId, feedData).canPost();
```

**Answer**: Option B

---

## 5. Backend Usage Pattern

On the backend (Convex mutations/queries), should it look like:

### Option A: Helper function that creates auth instance
```js
const auth = await getUserAuth(ctx, orgId);
const result = await auth.feed(feedId).canPost();
```

### Option B: Direct import
```js
import { UserAuth } from './auth';
const auth = new UserAuth(ctx, orgId);
```

**Answer**: Option A

---

## 6. Granular Permissions

You mentioned **"very granular, but composable."**
For checking if a user can post in a feed, this requires:
1. User is authenticated
2. User is member of feed (or feed is public/open depending on privacy)
3. Feed has `'post'` in `memberPermissions`

Should `canPost()` check all of these, or should we also expose the individual checks like:
- `isMember()`
- `hasPermission('post')`

So developers can compose them if needed?

**Answer**: When there are multiple checks that need to happen, and they are common, give me a helper function that just composes all the checks internally. For the above example, I think a `canPost()` method is helpful.
