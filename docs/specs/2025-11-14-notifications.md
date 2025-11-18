# Notifications

**IMPORTANT: To implement this spec, please follow the instructions in @docs/specs/spec-instructions.md**

---
## Part 1: Create notifications sidebar
### User stories
**User story 1:** A user wants to see the most recent activity that is important to them. They click the notification bell icon in the top left of the app to open the notification sidebar, where they see a list of notifications with the newest at the top. They click on a notification that tells of a new post in their Homegroup feed, and it opens up that post. The notification is marked as "read".

**User Story 2:** A user glances at their notifications and realizes that none of them are important. They do not want to click each one to mark it as read, so instead they click the "Clear all" button at the top of the sidebar.

**User Story 3:** A user is viewing a specific notification and does not care about it. They want to clear the notification, but they don't want to click on it, and they also don't want to clear all notifications. Instead, they click the small dot next to the notification, which marks it as "read".
### Backend

- Create `notifications` table:
	- `id` - convex creates this
	- `userId`
	- `type` - can be any of the types defined in `notification-types.md`
	- `data` - JSON object that defines all the data needed to create the notification text
	- `orgId` - use `defaultColumns` in schema.ts
	- `readAt?` - date that is null if the user hasn't read the notification
	- `createdAt` - convex creates this
	- `updatedAt` -  use `defaultColumns` in schema.ts
- Create queries & mutations
	- `createNotification` - a mutation that takes a notification `type` `data`, `userId`, and `orgId` and adds it to the `notifications` table
	- `getUserNotifications` - a paginated query that gets the user's notifications. Use the authenticated user on the backend to get the correct user. Data should be ordered by `createdAt` with the newest first
		- `getUserNotifications` should call a `getNotificationText` helper method that takes all of the notifications and returns a new list with an additional `title` and `body` property on each notification. The `title` and `body` should be text that is generated from the `data`, and use the definitions in `notification-types.md` This new notification object should have a type of `EnrichedNotification`, and this is what should be returned to the frontend. `getNotificationText` should work with 1 notification or many, and should be generic enough that it can be used across the backend (e.g. when sending notification emails).
	- `markNotificationAsRead` - a mutation that 1) takes a `notification._id`, 2) checks to make sure the notification ID belongs to the authed user, and 3) sets the notification's `readAt` to `Date.now()` 
	- `clearNotifications` - a mutation that finds all the notifications belonging to the authed user and sets each of their `readAt` to `Date.now()`

### Frontend
- Create a `NotificationsSidebar` component
	- The sidebar should slide open from the left side of the screen
	- On mobile, the sidebar should take up the whole screen
	- On desktop, the sidebar should be narrow and fixed to the left side of the screen
		- It should use `<BackDrop>` so that the rest of the screen is dimmed, and clicking anywhere off of the sidebar closes it
	- At the top of the sidebar should be a small "Clear all" text button (clicking this calls `clearNotifications`)
	- Under this the sidebar should render a list of notifications (coming from `getUserNotifications`). Each notification should display the `title` and `body`, as well as a small dot using `--accent` for its color that indicates whether the notification is read or not (if the dot is there, it means it's not read). The dot should display to the right of the notification text
		- Use Convex pagination. When the user scrolls to the bottom of the notification sidebar, load the next "page"
	- Clicking on a notification should take the user to the location that the notification is about. These are defined in `notification-types.md` under "Action" for each type
	- Clicking on a notification (or clicking the dot) should mark the notification as read (`markNotificationAsRead`)
	- An "X" in the top right corner should close the sidebar with the reverse slide animation
	- Use `motion` for opening/closing animations

## Questions

### Backend

1. For the `data` field in the notifications table - should this be typed as `v.any()` or should I create a union type for each notification type's data structure?
**Answer:** This should be strongly typed. Please create a union type based on the data required in @docs/specs/notification-types.md.

2. In `getNotificationText`, I'll need to look up user names and feed names from the IDs in the `data` field. Should this helper handle cases where these entities no longer exist (e.g., deleted user, deleted feed)? If so, what should the text say?
**Answer:** If the data is deleted, ultimately the notification should not be returned. `getNotificationText` in that case should return `null`, and the `notification` record should be deleted.

3. For `getUserNotifications` pagination, what page size should I use?
**Answer:** Use 25 notifications per page.

4. Should `clearNotifications` actually delete the notifications, or just mark them as read? The spec says "sets each of their `readAt` to `Date.now()`" which marks as read, but I want to confirm this is the desired behavior.
**Answer:** It should only mark them as read, not delete. Later, we'll have a cleanup task that deletes old notifications.

5. For the message content in notifications (types `new_message_in_post` and `new_message_in_owned_post`), the spec mentions converting `message.content` or `post.content` to HTML or plain text. For the sidebar notifications, should I use plain text or HTML? And should I truncate long messages?
**Answer:** Use plain text, and truncate long messages.

6. Should there be an index on the notifications table for efficient querying? (e.g., by_userId_and_createdAt or by_org_and_userId)
**Answer:** Yes, create and use a `by_org_and_userId` index.

### Frontend

7. Where should the notification bell icon be placed? I see user story mentions "top left of the app" but the Toolbar component currently has buttons on the right side. Should I add it to the Toolbar or in the OrganizationLayout component?
**Answer:** On mobile, it should appear as an icon in the top left of the screen. On desktop (`--tablet` and up) it can be displayed in the Toolbar.

8. Should there be a badge/count showing the number of unread notifications on the notification bell icon?
**Answer:** Yes.

9. For navigation when clicking a notification - some actions use hash fragments (e.g., `/post/{postId}/#{messageId}`). Should I use Next.js routing for this, or window.location? Also, should the sidebar close after navigation?
**Answer:** Routing is already in place in most cases, except for the hash. Please use whatever method makes the most sense in the context (nextjs routing or window.location).

10. What should happen if a user clicks on a notification but the target (post, feed, etc.) has been deleted?
**Answer:** Nothing. It can just be marked as read as normal. This case should be rare since the backend will only return notifications where their data exists. 

11. For the sidebar width on desktop - what specific width should it be? Should I reference an existing component or create a new CSS variable?
**Answer:** Go ahead and create a CSS variable that I can tweak.

12. The spec says to use Convex pagination and load the next page when scrolling to the bottom. Should I use an IntersectionObserver pattern similar to what might exist elsewhere in the codebase, or is there a different pattern you prefer?
**Answer:** Yes, use the same pattern as elsewhere.

13. Should clicking the dot (to mark as read) also trigger navigation to the notification's action URL, or only mark it as read without navigating?
**Answer:** It should only mark it as read without navigating.

14. Should the sidebar be accessible only to authenticated users? Should there be any additional permission checks?
**Answer:** Only authed users should be able to view it, and the icon to open it should be hidden from unauthenticated users.

### General

15. When should notifications actually be created? Part 1 creates the table and UI, but doesn't mention triggering notification creation. Should I implement the triggers in Part 1, or is that coming in a later part?
**Answer:** This is coming in a later part.

16. Should notifications be real-time (using Convex live queries) or only fetch when the sidebar is opened?
**Answer:** Only fetch when the sidebar is open, but it should still use convex live queries - it just won't query if the component is unmounted.

17. For the notification bell icon - should I use an existing icon from the Icon component, or do I need to add a new one? What icon name should I use?
**Answer:** Please add a new one. I will replace later if needed.
 
## Part 2: Push subscriptions backend
When subscribing a user to web push notifications, a `PushSubscription` object is created by the browser. We need to create the table that allows for saving these.

- Create the `pushSubscriptions` table
	- `id` - convex creates this
	- `userId`
	- `orgId` - use `defaultColumns` in schema.ts
	- `subscription` - `PushSubscription` object
	- `createdAt` - convex creates this
	- `updatedAt` - use `defaultColumns` in schema.ts
- Create queries and mutations
	- `createPushSubscription` - accepts the `orgId` and `subscription` (`PushSubscription`) object. `userId` is retrieved from authed user
	- `deletePushSubscriptionsByUser` - accepts the `orgId` and gets the `userId` from the authed user. For now, this should delete all of a user's subscriptions
	- `getPushSubscriptions` - gets a user's push subscriptions. Accepts `orgId` and gets the `userId` from the authed user

## Part 3: Push notification frontend
If a user does not have an existing web push notification subscription, we need to prompt them to subscribe. Additionally, we need to add a service worker that will handle showing notifications that it receives.

- 

## Part 4: Push notification backend
The backend should only send notifications that the user wants to see. There is no frontend for the user to configure this yet, but the backend should support it.

