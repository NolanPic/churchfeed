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

## Frontend

### Posts

On each post in the feed, there should be a three dot button icon that opens a small list menu with only one option: "Delete post".

- Add the three dots to the `<Post />` component to the left of `.messageThreadButton`.
- The list menu should look the same as the menu in the `UserAvatarMenu` (but without the blurred backdrop). If it's easy to do, we should just create a separate component for the menu that can be used in both.
- This three dot button should only show up if the user is 1) the author of the post or 2) an owner of the feed that the post is in.
- The three dots button should always be visible on phones, but only visible when hovering on the post on desktop.

### Messages
The implementation for messages should be the same as posts with the following exceptions:

- The three dots should show up on the right side of the user's name in a message when the user is hovering over the message on desktop.
- On mobile, do not show the three dots at all. Instead, a long-press on the message should bring up the menu with the option to delete.
- Like posts, this functionality should only be on messages that the logged-in user is an author of, or messages that are within posts that are within a feed that the logged-in user is an owner of.