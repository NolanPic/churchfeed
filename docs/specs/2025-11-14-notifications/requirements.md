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
	- At the top of the sidebar should be two tabs, "All" and "Unread". "All" should be default. When the user clicks "Unread", it should filter the notifications to just those that are unread
	- Also at the top of the sidebar should be a small "Clear all" text button (clicking this calls `clearNotifications`)
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

## Questions

1. The `PushSubscription` object from the browser has the shape `{endpoint: string, keys: {p256dh: string, auth: string}, expirationTime: number | null}`. Should I store this as a single object field in the schema, or break it out into separate fields (`endpoint`, `p256dh`, `auth`, `expirationTime`)?
**Answer:** Store the whole object in the field.

2. Should `createPushSubscription` check if a subscription already exists for the user and update it, or should it always create a new one? Also, should there be a limit on how many subscriptions a user can have?
**Answer:** It should always create a new one.

3. Should the `pushSubscriptions` table have an index? If so, what should it be indexed by (e.g., `by_org_and_userId`)?
**Answer:** Yes, include a `by_org_and_user` index.

4. For `deletePushSubscriptionsByUser`, should this be a hard delete or should we have a `deletedAt` field for soft deletes?
**Answer:** Hard delete.

5. Should the mutations check for authentication using `getUserAuth()` like the notifications mutations do?
**Answer:** Yes, use the same auth checks used in other mutations/queries.

## Part 3: Add to homescreen instructions
For iOS and Android, we want to show a prompt for logged-in users so that they can add the app to their homescreen.

- The prompt should be its own component (`<InstallPrompt />`) and use a modal with a slide-to-close handle (the `<Modal>` component supports this)
- It should show different instructions for iOS vs Android
- For iOS, it should mention that adding the app to the user's homescreen will let them set up notifications
- The component should detect if the user already has the web app installed (or are currently viewing in the installed app)
- A "Done!" button should close the modal
- A "No thanks" button should close the modal and set a local storage date stamp for 3 months in the future. The modal will not open again until the date stamp expires

## Questions

### Detection & Behavior

1. For detecting if the user already has the web app installed, should I check `window.matchMedia('(display-mode: standalone)').matches` or is there a different method you prefer? Also, should the component detect this on every render, or just once on mount?
**Answer:** That check will work. And please detect just once.

2. When should the InstallPrompt automatically open? Should it:
   - Open immediately when an authenticated user first visits the app (and hasn't dismissed it)?
   - Open after some delay or specific user action?
   - Never open automatically, only when explicitly triggered by something else?
**Answer:** Open immediately.

3. Should the InstallPrompt be shown on both mobile and desktop, or only on mobile devices? The spec mentions iOS and Android, but should we show it on desktop as well?
**Answer:** Only on mobile devices.

4. If a user is already viewing in the installed app (standalone mode), should the modal never show at all, or should it show with a success message like "You're already using the installed app"?
**Answer:** It should never show at all.

### Instructions Content

5. What specific instructions should be shown for iOS? Should I include steps like:
   - "Tap the Share button in Safari"
   - "Scroll down and tap 'Add to Home Screen'"
   - "Tap 'Add' in the top right"

   Or do you want different/more detailed instructions?
**Answer:** Include basic instructions like above, and I will edit them later if needed.

6. What specific instructions should be shown for Android? Should I include steps like:
   - "Tap the menu button (three dots)"
   - "Tap 'Add to Home screen' or 'Install app'"

   Or do you want different instructions?
**Answer:** Same as iOS, basic instructions and I will edit later.

7. Should the instructions include visual aids (icons, screenshots, or illustrations) or just text?
**Answer:** It should include text and the share icon.

### Technical Implementation

8. Should I create a separate hook for managing the InstallPrompt state (like `useInstallPrompt()`) or should the logic live entirely within the component?
**Answer:** Keep the logic in the component.

9. For the localStorage key, should I use a specific naming pattern? For example: `cf_install_prompt_dismissed` or something else?
**Answer:** `churchfeed_install_prompt_dismissed_until`

10. Where should the InstallPrompt component be rendered? Should it be:
    - In OrganizationLayout (so it appears on all authenticated pages)
    - In the root layout
    - Somewhere else?
**Answer:** `OrganizationLayout`

11. For OS detection, should I use `navigator.userAgent` or `navigator.platform`, or a combination? Also, should I handle other mobile platforms (like Windows Phone) or just iOS and Android?
**Answer:** You can use `navigator.userAgent`. And this is only for iOS and Android.

### Styling

12. Should the modal have a title (like "Install ChurchFeed") or should the instructions be the only content?
**Answer:** Yes, it can read "Install churchfeed" - use the modal's title prop.

13. Should the "Done!" and "No thanks" buttons be styled as primary/secondary buttons, or some other way? Should they be in the modal toolbar or in the modal content?
**Answer:** "Done!" should be primary, "No thanks" default. They can be in the modal toolbar.

14. Should the instructions be formatted as numbered steps, bulleted list, or paragraphs?
**Answer:** Numbered steps.


## Part 4: Push notification frontend
If a user does not have an existing web push notification subscription, we need to prompt them to subscribe. Additionally, we need to add a service worker that will handle showing notifications that it receives.

- Create a new component, `<PushNotificationPrompt>`, with a similar UI to `<InstallPrompt>` (use the `<Modal>` component)
- It should ask the user if they want to receive push notifications, then have two buttons, "Confirm", and "No thanks"
- It should only show on mobile devices (iOS/Android)
- It needs to handle subscribing to push, then saving the subscription to the `pushSubscriptions` table
- Add a service worker (`public/sw.js` ) that will get registered by `<PushNotificationPrompt>` and will manage receiving and displaying incoming notifications
- You can use https://nextjs.org/docs/app/guides/progressive-web-apps for reference for the above things, though be aware that there are some errors in their code examples
- Add a test notification (can be triggered from the frontend) to confirm that it's working

## Questions

### Prompt Behavior

1. When should the PushNotificationPrompt show? Should it:
   - Show immediately after the user installs the app (triggered by InstallPrompt completion)?
   - Show automatically when the user is in standalone mode and doesn't have a subscription?
   - Show after some delay or on a specific page?
**Answer:** It should show within the installed app only on iOS, or in both on Android. It should only show once the user is authenticated. It should check beforehand to see if there's an existing subscription, and only show if there isn't one.

2. Should the PushNotificationPrompt check if the user already has a push subscription in the database before showing? Or should it check the browser's push subscription?
**Answer:** It should check the browser's push subscription.

3. If the user clicks "No thanks", should we store a dismissal timestamp like InstallPrompt does? If so, for how long (3 months, forever, etc.)?
**Answer:** Yes, store a 1-month dismissal timestamp.

4. Should the prompt only show when the app is in standalone mode, or also when viewing in the browser?
**Answer:** In standalone mode on iOS, or either on Android.

### Technical Implementation

5. For the VAPID keys required for web push, where should these be stored? Environment variables? And should I generate them or do you have existing ones?
**Answer:** Yes, they should be stored in `.env.local`. Please generate them using `npm install -g web-push` and `web-push generate-vapid-keys`

6. When registering the service worker, should it be registered in the PushNotificationPrompt component, or in a more global location (like a useEffect in OrganizationLayout)?
**Answer:** It can be in `OrganizationLayout`.

7. For the service worker, should it handle any offline caching or other PWA features, or only push notifications?
**Answer:** Only push notifications.

8. What should the test notification say, and how should it be triggered? Should there be a button in the UI, or should I create a separate test page/component?
**Answer:** Create a function on the window object, something like `window.__churchfeed.showNotification(title, body)`.

9. Should the service worker display all notifications it receives, or should there be any filtering logic?
**Answer:** It should check to ensure that there is content in the title and body of the push notification before displaying. If both are empty, it shouldn't display.

### Error Handling

10. What should happen if the user denies notification permissions at the browser level? Should we show an error message explaining how to re-enable them?
**Answer:** Let's not worry about this for now.

11. If the subscription fails to save to the database, should we unsubscribe from the browser push subscription?
**Answer:** Yes.

### iOS Considerations

12. iOS Safari doesn't support the Push API in regular browser mode, only in installed PWAs (standalone mode). Should the prompt explain this to iOS users, or should we handle it differently?
**Answer:** This is already explained in the `<InstallPrompt>`

## Part 5: Push notification backend

#### Schema Changes
The backend should only send notifications that the user wants to see. There is no frontend for the user to configure this yet, but the backend should support it.

**Users table**: Add `settings` field
```typescript
settings: v.optional(v.object({
  notifications: v.optional(v.array(v.union(
    v.literal("push"),
    v.literal("email")
  )))
}))
```

**Default behavior**:
- If `settings` is `undefined`, `settings.notifications` is `undefined`, or `settings.notifications` is `[]`, treat as opted out
- When creating new users, set `settings.notifications` to `["push", "email"]` by default
- Existing users without `settings` will not receive notifications until they opt in

### Enqueueing process
When an action happens in the app (e.g. a user publishes a new post), we need to enqueue notifications to be sent to the users to whom the action is relevant.

1. `enqueueNotification` is called with the notification type and associated data:
 ```ts
enqueueNotification(
	ctx,
	orgId,
	type, // notification type
	data  // notification data
)
```
2. `enqueueNotification` gets a list of all users that the notification should be sent to, along with their notification preferences (an array that allows `["push", "email"]`).
	1. This should be a separate function
	2. Notification recipients by type:
		- `new_post_in_member_feed`: All feed members except the poster
		- `new_message_in_post`: Post owner + all users who previously messaged in the post, except the current sender
		- `new_feed_member`: All feed owners except the new member
3. `enqueueNotification` then uses a Convex scheduled function (https://docs.convex.dev/scheduling/scheduled-functions) to schedule sending the batch of notifications to the relevant users.  The scheduled function should do three things:
	1. Create `notifications` for each of the users.
	2. Call `sendPushNotifications` with the list of users who have `push` enabled.
	3. Call `sendEmailNotifications` with the list of users who have `email` enabled.
	4. **IMPORTANT NOTE**: We will implement email notifications later, so don't actually implement `sendEmailNotifications`. Instead, write commented-out code for how calling `sendEmailNotifications` *should* work,  then write a `console.warn("Not implemented")`.
4. `sendPushNotifications` will call `notifications.collectNotificationData` in @convex/notifications.ts to get the notification data.
5. The `new_post_in_member_feed` notification type requires `userFeed` data. `sendPushNotifications` should check for this type and gather all the `userFeed`s for all the users and store them in a map where the user ID is the key and the `userFeed` doc is the value. Only do this work if it's required.
6. `sendPushNotifications` will then loop through each user who should receive the notification and:
	1. Generate the final notification data with `generateNotificationText` (in @convex/notifications.ts), passing in the specific user's `userFeed` if this is a `new_post_in_member_feed`.
	2. Look up the user's `pushSubscriptions` and, for each one, send the notification to the subscription endpoint.
	3. If the response from the endpoint is a 404 or 410, we should delete that subscription from the database (**note**: don't delete *all* of the user's subscriptions--only that specific one).
7. `sendPushNotifications` and `sendEmailNotification` should not be called if there are no users to be passed in to them.
8. Notifications should always exclude the person who triggered it.
9. Call `enqueueNotification` in the areas of the app that relate to notifications defined in @notification-types.md. Please confirm with me the places you intend to call this.

## Questions

### Schema Changes

1. For the `settings.notifications` field - should this be added to the users table schema or is there a separate settings table? The spec mentions adding to "Users table" but I want to confirm I should modify the existing `users` table in schema.ts.
**Answer:** It should be the `users` table.

2. The default behavior says new users should NOT have any default and must explicitly opt in. Should the schema use `v.optional()` for both the `settings` object and `settings.notifications` array? Or should we use a different structure?
**Answer:** `v.optional()` for both.

### Notification Enqueueing

3. For `enqueueNotification`, based on the notification types, I plan to call it in these locations:
   - **new_post_in_member_feed**: In `convex/posts.ts` in the `createPost` mutation after a post is successfully created
   - **new_message_in_post**: In `convex/messages.ts` in the `create` mutation after a message is successfully created
   - **new_feed_member**: In `convex/userMemberships.ts` in the `inviteUsersToFeed` mutation after users are added to a feed
   - **new_user_needs_approval**: This one I'm not sure about - where in the codebase do users register and need approval? Is this in the auth flow or a separate mutation?

   Can you confirm these locations are correct and point me to where user registration/approval happens?
**Answer:** Those are correct, and the user approval one can wait - there isn't a UI implemented for registration or approving users yet.

4. For scheduled functions in Convex, should I use `scheduler.runAfter(0, ...)` to run immediately but asynchronously, or a different delay? The spec doesn't specify timing.
**Answer:** Yes, use 0.

5. The spec says "Get a list of all users that the notification should be sent to". For each notification type, should the logic be:
   - **new_post_in_member_feed**: All members of the feed EXCEPT the user who posted
   - **new_message_in_post**: All users who have previously messaged in that post EXCEPT the user who just sent the message
   - **new_feed_member**: All owners of the feed EXCEPT the user who just joined
   - **new_user_needs_approval**: All admin users in the organization

   Is this correct?
**Answer:** Yes, though don't worry about **new_user_needs_approval**.

6. For **new_message_in_post**, should the post owner also receive notifications even if they haven't messaged in the post yet? The notification text suggests yes ("messaged in your post"), but I want to confirm.
**Answer:** Yes.

### Push Notification Implementation

7. The spec mentions using web-push for sending push notifications. Should I add `web-push` as a dependency to package.json? If so, should it be a regular dependency or devDependency?
**Answer:** Yes, add it as a regular dep.

8. For sending push notifications, the web-push library requires the VAPID keys (which I see are already in .env.local). Should I read these from environment variables in the Convex backend? How do I access environment variables in Convex functions?
**Answer:** Just read them as you normally would (`process.env.SOMEKEY`), and Convex will inject them at runtime.

9. When sending push notifications via web-push, the notification payload needs a specific format. Should I send just the title and body, or should I also include data like the action URL, notification ID, etc. for the service worker to handle?
**Answer:** Send the URL and notification ID as well, and the service worker can decide what to do with that information.

10. The spec mentions deleting a push subscription if we get a 404 or 410 response. Should we also handle other error codes (like 401, 403) differently, or just log and continue for all other errors?
**Answer:** Just log them.

11. For `collectNotificationData` - this is already implemented in the existing code. Should I export it so it can be used in the push notification sending logic, or should I refactor to avoid duplication?
**Answer:** Export please.

12. For `generateNotificationText` - this is also already implemented. The spec says to call it in `sendPushNotifications` with the user's `userFeed` if needed. Should I export this function as well, or create a new function specifically for push notifications?
**Answer:** Yes, export.

### User Feed Data for new_post_in_member_feed

13. The spec says "The `new_post_in_member_feed` notification type requires `userFeed` data" and to "gather all the `userFeed`s for all the users and store them in a map". Since each user who receives the notification is already a member of the feed (that's why they're receiving it), should I query the `userFeeds` table once to get all memberships for that feed, then filter to only the users who should receive notifications?
**Answer:** That sounds reasonable, go ahead with that. The reason we need it is because `userFeeds` defines `isOwner`, which is needed for customizing the notification text.

14. When creating the notification record for each user, should the notification data stored in the database be the same for all users (e.g., just `userId`, `feedId`, `postId`), and only the enriched text (title/body) be personalized when sending?
**Answer:** Yes, the data should be the same for all users, while the text is personalized when sending (not stored in the DB).

### General Architecture

15. Should `enqueueNotification` be an internal mutation or a regular mutation? Since it will be called from other mutations, I'm thinking internal mutation makes sense.
**Answer:** Yes, go with internal.

16. For the scheduled function that sends notifications, should it be an internal mutation as well? What should I name it (e.g., `sendNotificationBatch`, `processNotifications`)?
**Answer:** Yes, internal. It can be called `sendNotificationBatch`.

17. The spec mentions `sendEmailNotifications` should be stubbed out with commented code. Should the structure mirror `sendPushNotifications` (loop through users, generate text, etc.) or just a simple placeholder?
**Answer:** It should mirror `sendPushNotifications`.

18. When calling `enqueueNotification`, should I pass in the full notification object as a `Doc<"notifications">`, or just the type and data? The spec shows `notification // Doc<"notifications">` but notifications haven't been created yet at the point of enqueueing.
**Answer:** Hmm, you're right. Let's just pass in the type and data, but be sure it's all strongly typed. Also, please update the spec above to fix this issue.

19. Should error handling in `sendPushNotifications` be graceful (log errors but continue sending to other users) or should it throw and stop the entire batch?
**Answer:** Graceful.

20. For the "get all users that the notification should be sent to" logic - should this be a separate helper function that takes the notification type and data and returns a list of user IDs with their preferences? Or should it be inline in `enqueueNotification`?
**Answer:** It should be a separate function.

## Implementation Notes

### Schema Updates
- Add `userId` field to `new_message_in_post` notification data (consistent with other notification types, avoids extra lookups)
- Update the schema data union type to include this field

### Notification Preferences Logic
- `undefined` or `[]` in `settings.notifications` = opted out
- When creating new users, set to `["push", "email"]` by default
- Existing users without settings remain opted out until they configure preferences

### Recipient Logic by Type
- `new_post_in_member_feed`: All feed members except the poster
- `new_message_in_post`: Post owner + all previous commenters, except current sender
  - First message: post owner only
  - Subsequent: post owner + all who previously commented
- `new_feed_member`: All feed owners except the new member

### Calling Locations
- `new_post_in_member_feed`: `convex/posts.ts` → `createPost` mutation
- `new_message_in_post`: `convex/messages.ts` → `create` mutation
- `new_feed_member`: `convex/userMemberships.ts` → `inviteUsersToFeed` mutation
- `new_user_needs_approval`: Deferred (no registration UI yet)
