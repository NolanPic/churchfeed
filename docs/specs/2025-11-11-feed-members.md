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

## Part 2: Card list implementation
- Implement reusable `<Card>` and `<CardList>` components. These will be used in multiple places throughout the app
- The `<Card>` component should have a header and a body. It should follow industry standards for cards, but avoid complexity. It should be able to render text or other components in both the header and body
- The `<CardList>` component should render `<Card>`s for all of the `data` items
- `<CardList>` should work well with a convex query to display data
- `<CardList>` should work well with a paginated convex query (see https://docs.convex.dev/database/pagination)
- By default, the CardList should render as many cards on one row as it can fit
- CardList should allow classes to be passed so that the default styles can be overwritten
- Add usage examples to storybook. Keep them few, simple, and without overlap between them

### Questions

1. **Card visual design**: What should the Card component look like visually?
   - Should it have a border? If so, what color?
   - Should it have a background color? (e.g., `var(--mid)`, `var(--dark)`, transparent?)
   - Should it have a border-radius? If so, should I use existing variables like `--border-radius-sm`?
   - Should there be any shadow or elevation effect?
   - What padding should the card have?
**Answer**: It should use `--light` as a border, have a background of `--mid2`, and `--border-radius-lg`. It should have a slight box shadow effect (look at box shadows used elsewhere in the app). Choose some padding using a `--spacing{X}` variable, and I will adjust if needed.

2. **Card header/body separation**: Should the header and body be visually distinct sections?
   - Should there be a dividing line or border between them?
   - Should they have different background colors?
   - Or should they just be separated by spacing/padding?
**Answer**: Have a small dividing line between them.

3. **CardList layout specifics**: For "as many cards on one row as it can fit":
   - Should I use CSS Grid with `auto-fit`/`auto-fill`?
   - What should be the minimum card width?
   - What should be the gap/spacing between cards?
   - Should cards all be the same width in a row, or can they vary?
**Answer**: It should use CSS Grid `auto-fit`/`auto-fill`, but be sure that the default class can be overridden by a `className` prop. The gap can be `--spacing4` to start. The cards should all have the same width, and that width should be the width of the largest card (based on its content).

4. **CardList with pagination**: How should CardList handle paginated queries?
   - Should it have a "Load More" button at the bottom (to call `loadMore()`)?
   - Should it use infinite scroll like Feed.tsx does with IntersectionObserver?
   - Or should pagination controls be handled outside of CardList (making CardList just render what's given)?
**Answer**: It should use infinite scroll like `Feed.tsx`.

5. **Loading and empty states**:
   - Should CardList show skeleton/loading cards while `status === "LoadingFirstPage"`?
   - Should CardList display an empty state message when there's no data?
   - Or should these states be handled by the parent component?
**Answer**: It can display "Loading..." and it should display an empty state message (can be a prop with a default value of "No data").

6. **Card interactivity**:
   - Should the entire Card be clickable (with an `onClick` prop)?
   - Should Cards have hover states (e.g., transform, border color change)?
   - Or should they be static containers with interactivity only from their child components?
**Answer**: No `onClick` is needed. The border color can change to `--accent` on hover. Child components will offer interactivity.

7. **Responsive behavior**:
   - Should the number of cards per row change on mobile vs tablet/desktop?
   - For example: 1 card per row on mobile, 2-3 on tablet, 3-4 on desktop?
   - Or should it always just "fit as many as possible" regardless of screen size?
**Answer**: The only rule is that it should only display 1 card per row on phones. Above that (e.g. at the `--tablet` custom media breakpoint and up) it should just fit as many as possible.

8. **CardList data handling**:
   - Should CardList accept a render function prop to customize how each card's content is rendered?
   - For example: `renderCard={(item) => <Card>...</Card>}` or should the parent always pass pre-rendered cards as children?
   - Should it accept raw data and handle the mapping internally, or receive already-rendered Card components?
**Answer**: I will back up so I can answer this properly:

First, the card component should be used like this:

```tsx
<Card>
  <CardHeader>header stuff...</CardHeader>
  <CardBody>body stuff...</CardBody>
</Card>
```

The three components in the above example should all come from `Card.tsx`.

Now, for CardList, it should accept `renderCardHeader` and `renderCardBody` props that will allow passing in the children for the `<CardHeader>` and `<CardBody>` components respectively.

9. **Storybook examples**: What types of examples would be most useful?
   - Simple card with text only?
   - Card with mixed content (text, buttons, etc.)?
   - CardList with non-paginated data?
   - CardList with paginated data simulation?
   - Different grid layouts?
**Answer**: Card with mixed content and card with body content only. Card list with paginated data, and separate card list with custom grid layout using className prop.

## Part 3: Frontend
- Remove the "Members tab coming soon..." text from the members tab
- Add an invite function at the top of the tab
  - To select users, use the `<UserSelect>` component. It should get users with the `getUsersNotInFeed` query
  - An Invite button that, when pressed, takes all of the selected user IDs and sends them to the `inviteUsersToFeed` mutation
  - The user selection should clear after the mutation successfully runs
- Add a card list using of users using the new `<CardList>` component
- For each user display:
  - Avatar (should be in the header)
  - Name (should be in the header)
  - Email (body)
  - Role - dropdown (Member or Owner) (changing this immediately calls `changeMemberRole`) (body)
  - Remove - button to remove from feed. Uses a `confirm()` and then calls `removeMemberFromFeed` (body)
- If the current owner viewing the list is the only owner, they should not be able to remove themselves from the feed, and the button should be disabled

### Questions

1. **Invite section layout**: How should the UserSelect and Invite button be arranged?
   - Should they be on the same row (flexbox side by side)?
   - Should they stack vertically?
   - Should the UserSelect take full width with the button below/beside it?
   - What spacing should be between the invite section and the member list?
**Answer**: UserSelect takes full width and the button is beside it (flexbox).

2. **Loading and disabled states**: For the Invite button:
   - Should it show "Inviting..." when the mutation is running?
   - Should it be disabled when no users are selected?
   - Should the UserSelect be disabled while the mutation is running?
**Answer**: Here are the states for the button/UserSelect:
- When UserSelect is empty, button is disabled
- When UserSelect has selection(s), button is enabled
- While the mutation is running, button is disabled and reads, "Inviting..."
- When the mutation finishes running, button is still disabled and says, "Invited!" for 2 seconds
- When the mutation finishes, UserSelect should be cleared of its value
- If an error occurs, use the `error` prop on UserSelect. The selections stay, and the button is enabled

3. **Error handling**: When mutations fail (invite, change role, remove member):
   - Should errors be displayed as alerts/confirms?
   - Should there be an error banner at the top of the tab?
   - Should errors appear inline near the relevant UI element?
**Answer**: I described how user invites should error above. For everything else, there should be an error banner at the top of the tab. It should use the `<Hint>` component.

4. **Success feedback**: After successfully inviting users:
   - Should there be any success message/notification?
   - Or is clearing the selection sufficient feedback?
**Answer**: Answered above. Button will say "Invited!" for 2 seconds.

5. **Role dropdown**:
   - Should the dropdown show "Member" and "Owner" as labels?
   - Should it be disabled while the mutation is running?
   - Should there be a loading indicator when changing roles?
   - Should the dropdown be disabled for the last owner?
**Answer**: Yes, "Member" and "Owner" should be the two options. It should be disabled while running. No loading indicator. Yes, it should be disabled for the last owner. Also, if the mutation fails, it should go back to the last value.

6. **Remove button**:
   - What should the confirm() message say?
   - Should it mention the user's name?
   - For the last owner scenario, should the button be visually disabled or just not work?
**Answer**: "Are you sure you want to remove {name} from {feed}?" For the last owner, yes, disable the button.

7. **Member card body layout**: How should the elements in the card body be arranged?
   - Should Email, Role, and Remove button all stack vertically?
   - Or should Role and Remove button be on the same row with Email above?
   - What spacing between elements?
**Answer**: The user's avatar and name should be in the card header. The user's email should also appear in smaller text right below their name. The Role dropdown and Remove button should be side-by-side in the body with a little bit of spacing between.

8. **Empty state**: If there are no members to display (edge case):
   - Should CardList's default empty message be used?
   - Or a custom message like "No members yet"?
**Answer**: Use "No members yet! Invite some above."

9. **Initial loading**: While `getFeedMembers` is loading:
   - Should CardList's "Loading..." message be used?
   - Or should the entire tab content be replaced with a loading indicator?
**Answer**: Cardlist's "Loading..." is fine.

## Part 4: Roles
There are some additional changes that need to be made depending on if the logged in user is a feed owner or just a member:
- Feed owners see both the Settings and Members tabs
- Feed members see only the Members tab, with no option to change roles, and an option to leave the feed (calls `removeMemberFromFeed`)
- For feed members, the button to open the model should change to a user icon labelled "Members", and the modal should be titled "Members"

## Part 5: Check for privilege escalation
Double check the backend for any possible privilege escalation scenarios.
