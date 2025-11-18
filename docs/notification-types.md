# Notification Types
Notifications are available as push notifications and email, with the possibility of extending to SMS. Below is a breakdown of each type of notification.

## New post in feed
**Trigger**: A new post is published in a feed that the user is a member of
**Label**: `new_post_in_member_feed`
**Push title**: "New post"
**Push body**: "{name} just published a post in {feed}"
**Action**: Navigates to `/post/{postId}`
**Data**: `userId`, `feedId`, `postId`
## New post in feed user owns
**Trigger**: A new post is published in a feed that the user is an owner of
**Label** `new_post_in_owned_feed`
**Details**: This takes precedence over `new_post_in_member_feed` - they will not both be sent.
**Push title**: "New post in your feed"
**Push body**: "{name} just published a post in your feed, {feed}"
**Action**: Navigates to `/post/{postId}`
**Data**: `userId`, `feedId`, `postId`

## New message in post user has messaged in
**Trigger**:  A new message is sent in a post that the user has messaged in
**Label**: `new_message_in_post`
**Push title**: "{name} responded in a post"
**Push body**: "{message contents}"
**Action**: Navigates to `/post/{postId}/#{messageId}`
**Data**: `messageId` and the post content (`post.content` is the source data, which then needs to be converted into HTML or plain text, for email and push respectively)

## New message in user's post
**Trigger**:  A new message is sent in a post that the user published
**Label**: `new_message_in_owned_post`
**Details**: This takes precedence over `new_message_in_post` - they will not both be sent.
**Push title**: "{name} messaged in your post"
**Push body**: "{message contents}"
**Action**: Navigates to `/post/{postId}/#{messageId}`
**Data**: `messageId` and the message content (`message.content` is the source data, which then needs to be converted into HTML or plain text, for email and push respectively)

## Someone joins a feed user owns
**Trigger**:  Somebody joins a feed that the user is an owner of
**Label**: `new_feed_member`
**Details**: 
**Push title**: "Someone joined your feed"
**Push body**: "{name} just joined {feed}"
**Action**: Navigates to`/feed/{feedId}`
**Data**: `userId` and `feedId`

## Someone needs approval to join
**Trigger**:  Somebody just registered to the organization and needs to be approved
**Label**: `new_user_needs_approval`
**Details**: Only sent to admins
**Push title**: "New user requesting to join"
**Push body**: "{name} is requesting to join {organization name}"
**Action**: Navigates to `/admin/users/?filter=needs_approval`
**Data**: `userId` and `organizationId`

---

## Template
**Trigger**:  
**Label**: 
**Details**: 
**Push title**: 
**Push body**: 

