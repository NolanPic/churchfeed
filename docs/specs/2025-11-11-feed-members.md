# Feed members

**IMPORTANT: To implement this spec, please follow the instructions in @docs/specs/spec-instructions.md**

---

We have a new feed settings modal (implemented in `FeedSettingsModalContent.tsx` and used in `Feed.tsx`). Right now it has a "Settings" tab and a "Members" tab. The settings tab is complete, and we need to implement the members tab.

## Part 1: Backend
- Implement `getFeedMembers` convex query for getting the list of users for the feed (should be added to a new `userMemberships.ts`)
	- Feed owners and feed members can call this
- Implement `getUsersNotInFeed` convex query for getting users NOT in the feed (this will be used for the invite to feed function) and accept a `feedId`
	- Only feed owners can call this
- Implement `inviteUsersToFeed` convex mutation for inviting a list of users to a feed (should accept an array of user IDs and a single feed ID)
	- Only feed owners can call this
- Implement `removeMemberFromFeed` convex mutation for removing a user from a feed (single user ID)
	- Only feed owners can call this, unless the user is removing themselves from the feed
	- If no user ID is supplied, use the currently authed user
- Implement `changeMemberRole` convex mutation for changing member role (Member or Owner - determined by `owner` column in `userFeeds` table, see `schema.ts`)
	- Only feed owners can call this

## Questions

1. **File location**: You mentioned creating a new `userMemberships.ts` file, but looking at the existing code structure, I see the `userFeeds` table already has a `convex/feeds.ts` file with feed-related queries. Should I:
   - Create a new `convex/userMemberships.ts` file as specified, OR
   - Add these functions to the existing `convex/feeds.ts` file?
**Answer**: create the `userMemberships.ts` file.

2. **getFeedMembers return data**: What information should this query return for each member? Should it include:
   - User ID, name, email?
   - User avatar/image?
   - Whether they are an owner or member (from the `userFeeds.owner` field)?
   - Any other user fields?
**Answer**: User ID, name, email, avatar URL (make sure you understand the `uploads` table to get the URL) and whether they are an owner. No other fields are necessary at this time.

3. **getUsersNotInFeed scope**: Should this query return:
   - All users in the organization who are NOT in the feed?
   - Only active users (filtering out users with `deactivatedAt` set)?
**Answer**: Yes to both. The users should be in the org and active.

4. **inviteUsersToFeed behavior**: When inviting users to a feed:
   - Should the new members be added as regular members (owner: false) or should this be configurable?
   - Should there be any validation to prevent inviting users who are already members?
   - What should happen if a user is already a member? Error or silently skip?
**Answer**: New users should be added as regular members, and you should validate that they aren't already members. If they are, the backend should throw an error.

5. **removeMemberFromFeed edge cases**:
   - What should happen if there's only one owner left and they try to remove themselves?
   - Should the system prevent removing the last owner, or is this allowed?
   - If a user removes themselves from a feed they own, should their ownership be transferred or just removed?
**Answer**: The backend should not allow the last owner to remove themselves, and should throw an error in this case. I added additional instructions to part 3 for protecting against this.

6. **changeMemberRole permission**: Can an owner change another owner to a member? Or can they only promote members to owners?
**Answer**: An owner can demote another owner to a member.

7. **Feed privacy interaction**: For the `getUsersNotInFeed` query, should the feed's privacy setting affect which users can be invited? For example:
   - For "open" feeds, should we exclude users who could just join themselves?
   - Or should we show all users regardless of feed privacy?
**Answer**: Show all users regardless of feed privacy.

### Follow-up questions

8. **getFeedMembers pagination**: Should the `getFeedMembers` query support pagination? Looking at the codebase, I see paginated queries are used for posts. Should members also be paginated, or can we return all members at once?
**Answer**: Yes, they should use a paginated query (see https://docs.convex.dev/database/pagination for more details on how to use them)

9. **getUsersNotInFeed data format**: Should `getUsersNotInFeed` return the same fields as `getFeedMembers` (user ID, name, email, avatar URL)? Or just a simpler subset since we're just selecting users to invite?
**Answer**: It can be a simpler subset. Since this query's data will be used by `<UserSelect>`, be sure to take a look at that component to see what it expects.

10. **changeMemberRole validation**: When changing a member role, should I validate that:
    - We're not demoting the last owner (leaving the feed with no owners)?
    - Or is it okay to have a feed with no owners after demoting the last one?
**Answer**: Check to make sure we're not demoting the last owner. If we are, throw an error.

11. **Error messages**: Are there any specific error message formats or conventions I should follow in the codebase? I see some functions throw `new Error(...)` with descriptive messages - should I follow that pattern?
**Answer**: Follow the pattern you see in the rest of the codebase.

## Part 2: Table implementation
- Implement a reusable `<Table>` component. This will be used in many places throughout the app.
- The component should work well with a convex query to display data
- The component should work well with a paginated convex query (see https://docs.convex.dev/database/pagination)
- The component should work well without a convex query
- The component should work in an industry-standard way, while also being as simple as possible. It should do the bare minimum, and do it well
- The table cells should support both text and other components (e.g. buttons, avatars, etc.)
- The table should take mobile styling into consideration. Each row should be horizontally scrollable (individually) when it runs out of space, and have a fade on the right side that encourages scrolling

## Part 3: Frontend
- Remove the "Members tab coming soon..." text from the members tab
- Add an invite function at the top of the tab
	- To select users, use the `<UserSelect>` component. It should get users with the `getUsersNotInFeed` query
	- An Invite button that, when pressed, takes all of the selected user IDs and sends them to the `inviteUsersToFeed` mutation
	- The user selection should clear after the mutation successfully runs
- Add a table of users using the new `<Table>` component
- For each user display:
	- Avatar
	- Name
	- Role - dropdown (Member or Owner) (changing this immediately calls `changeMemberRole`)
	- Remove - button to remove from feed. Uses a `confirm()` and then calls `removeMemberFromFeed`
- If the current owner viewing the list is the only owner, they should not be able to remove themselves from the feed, and the button should be disabled

## Part 4: Roles
There are some additional changes that need to be made depending on if the logged in user is a feed owner or just a member:
- Feed owners see both the Settings and Members tabs
- Feed members see only the Members tab, with no option to change roles, and an option to leave the feed (calls `removeMemberFromFeed`)
- For feed members, the button to open the model should change to a user icon labelled "Members", and the modal should be titled "Members"

## Part 5: Check for privilege escalation
Double check the backend for any possible privilege escalation scenarios.