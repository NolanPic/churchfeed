# Deleting Posts & Messages

To implement this spec, please follow the instructions in @docs/specs/spec-instructions.md

---

We need to add the ability to delete posts and messages.

Basic requirements:

1. A user who is the author of a post or message should be able to delete it.
2. A user who is the owner of a feed should be able to delete any post or message in that feed.
3. Any resources belonging to the post or message should also be deleted. For example, deleting a post should delete all of the images and messages in that post. Deleting a message should delete all the images in that message. This should cascade as well, so deleting a post will delete its messages and all the images in those messages.

## Backend

We need mutations for:

1. Deleting a post
2. Deleting a message
3. Deleting uploads (images)

#1 should call #2, and #1 and #2 should call #3 internally.

These mutations should all check user permissions via the `auth/` module to make sure they meet the permission requirements.

### Questions

1. **Deletion behavior**: Should the deletions be "soft deletes" (marking as deleted) or "hard deletes" (removing from database)? I notice the schema doesn't have a `deletedAt` field on posts/messages, so I'm assuming hard deletes?
   **Answer**: Yes, hard deletes.

2. **Cascading deletion for posts**: When a post is deleted, should we:
   - Delete all messages in that post first (each message triggers its own upload deletions)?
   - Or collect all uploads from both the post AND its messages, then delete messages, then delete all uploads in one go?
   - I'm leaning toward the first approach for clarity and to use the existing message deletion logic.
    **Answer**: Yes, let's go with the first for now. If it's inefficient, it can be improved later.

3. **Storage cleanup**: When deleting uploads, should we:
   - Call `ctx.storage.delete(upload.storageId)` for each upload's storage file?
   - Handle errors gracefully if the storage file is already deleted (similar to `deletePreviousAvatar` in `uploads.ts:89-101`)?
    **Answer**: Yes to both.

4. **Permission checking**: For checking if a user can delete a post/message, should we:
   - Check if `user._id === post.posterId` OR `user is owner of feed`?
     **Answer**: Yes
   - Is there any other permission level we need to check (e.g., admin users)?
     **Answer**: There are admins, but an admin still needs to be the owner of a feed to delete anything.

5. **Return values**: Should the delete mutations return:
   - The deleted ID?
   - `void` (nothing)?
   - A count of deleted items (e.g., `{ deletedPost: 1, deletedMessages: 5, deletedUploads: 8 }`)?
    **Answer**: The deleted ID

6. **Error handling**: If a post doesn't exist or user doesn't have permission, should we:
   - Throw an error with a descriptive message?
   - Return a result object like `{ success: false, reason: "not_found" }`?
   - I'm leaning toward throwing errors to match the existing pattern in the codebase.
    **Answer**: Yes, throw errors

6. **Upload deletion edge case**: The schema shows `uploads.sourceId` is optional. Should we only delete uploads where `sourceId` matches the post/message being deleted, or should we also handle orphaned uploads (where `sourceId` is undefined but `source` type matches)?
   **Answer**: Only delete where there is a `sourceId` that matches the post/message's ID.

## Frontend

### Posts

On each post in the feed, there should be a three dot button icon that opens a small list menu with only one option: "Delete post".

- Add the three dots to the `<Post />` component to the left of `.messageThreadButton`.
- The list menu should look the same as the menu in the `UserAvatarMenu` (but without the blurred backdrop). If it's easy to do, we should just create a separate component for the menu that can be used in both.
- This three dot button should only show up if the user is 1) the author of the post or 2) an owner of the feed that the post is in.
- The three dots button should always be visible on phones, but only visible when hovering on the post on desktop.

#### Questions

1. **Three dots icon**: Should I use an existing icon from `/public/icons/` or create a new one? What should the icon look like (vertical three dots, horizontal three dots)?
   **Answer**: You can create one. It should just be three horizontal dots.

2. **Menu positioning**: Should the menu dropdown appear:
   - Below the three dots button?
   - Above the three dots button?
   - Auto-position based on available space?
   **Answer**: Below the three dots button.

2. **Confirmation dialog**: Should there be a confirmation dialog when deleting a post (e.g., "Are you sure you want to delete this post?") or should it delete immediately?
   **Answer**: Yes, please use a regular `confirm()`. This should happen on both posts AND messages.

3. **Loading/error states**: How should we handle:
   - Loading state while the delete is processing?
   - Errors if the delete fails?
   - Should the post disappear immediately (optimistic update) or wait for confirmation from the backend?
    **Answer**: There should be no loading state, and no optimistic update. Convex will automatically remove the post/message from the UI upon successful deletion.

5. **Menu component**: You mentioned creating a separate component for the menu if it's easy. Should I:
   - Extract the menu logic from `UserAvatarMenu` into a reusable component?
   - Or just duplicate the styles for now since there are some differences (no backdrop)?
    **Answer**: You can just duplicate the styles for now.

5. **Hover behavior on desktop**: Should the three dots appear when hovering over the entire post area, or just when hovering over a specific region?
   **Answer**: The entire post area.

6. **Post deletion redirect**: When a post is deleted from the PostModalContent (where the URL shows the post ID), where should we redirect the user?
   - Back to the feed that the post was in?
   - Back to the previous URL using browser history (e.g., `router.back()`)?
   - To the home/main feed page?
    **Answer**: back to the feed that the user was in, or to the main feed if the user wasn't in a specific feed. Check out how closing the post modal works - we want this exact same functionality.

### Messages
The implementation for messages should be the same as posts with the following exceptions:

- The three dots should show up on the right side of the user's name in a message when the user is hovering over the message on desktop.
- On mobile, do not show the three dots at all. Instead, a long-press on the message should bring up the menu with the option to delete.
- Like posts, this functionality should only be on messages that the logged-in user is an author of, or messages that are within posts that are within a feed that the logged-in user is an owner of.

#### Questions

1. **Long-press implementation**: For the long-press on mobile, should I:
   - Use a library (like `use-long-press`) or implement it manually?
   - What duration should constitute a "long press" (e.g., 500ms, 800ms)?
**Answer**: If it's simple, you should just implement it as its own hook. If not, use a library. For duration, use 800ms and we'll see how that feels.

1. **Long-press visual feedback**: Should there be visual feedback during the long press (e.g., the message background changes, a progress indicator)?
   **Answer**: No visual feedback.

2. **Long-press menu**: When the long-press menu appears, should it:
   - Appear as a modal/overlay in the center of the screen?
   - Appear near the message that was long-pressed?
   - Look different from the desktop menu?
    **Answer**: It should appear under the message.

4. **Permission checking on frontend**: For both posts and messages, should I:
   - Pass permission info from the query (e.g., `canDelete: boolean`)?
   - Calculate permissions on the client side using the auth context?
   - I'm leaning toward passing it from the backend query for consistency.
    **Answer**: You should check permissions using the `auth/` module (like you did for the backend) which as a frontend counterpart.