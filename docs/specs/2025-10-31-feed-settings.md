# Feed settings

**IMPORTANT: To implement this spec, please follow the instructions in @docs/specs/spec-instructions.md**

---

We need to add a new Feed settings modal to the app. It should be opened by clicking the "Feed settings" button on the right side of the feed.

For context, this modal will have two tabs: Settings and Members. (See 2025-10-30-modal-tabs.md for tab implementation details.) In this spec, we will only implement the Settings tab (an empty "Members" tab can be added as well).

The settings tab in the modal will have the following form fields:

- Name - text
- Privacy - select (public, open, private)
- Permissions - select fields (members can post? members can message?)
- Description - text

You should research feed permissions/privacy in the codebase to get a full understanding.

## Part 1: Validation
- We need to validate certain fields like the Name and Description field above
- Since we will need validation in other parts of the app, we should create a simple way of validating form fields that works across the front and backend
- The `/validation` module is currently used to validate file uploads on the front and backend. We should add additional functions to this module that the backend can use for validating form fields.
- The `Input` and `Select` components should support different types of validation. For example, they should accept props like `required` (both) and `minLength` and `maxLength` (Input). The input `type` should also be used to validate whether the contents are an email, number, etc.

### Questions

1. **Validation Module Structure**: Should I create a new file in the `/validation` module (e.g., `validation/formValidation.ts`) for form field validation functions, similar to how file validation is currently structured? Or should I add these functions to the existing `validator.ts` file?
   **Answer**: Please add a new file called `formValidator.ts` for the new functions, and then please rename the existing `validator.ts` file to `fileValidator.ts`.

2. **Backend Validation API**: What should the validation function signature look like for backend use? I'm thinking something like:
   ```ts
   validateTextField(value: string, options: { required?: boolean; minLength?: number; maxLength?: number }): ValidationResult
   ```
   Should this follow the same pattern as the existing file validation (returning `{ valid: boolean; errors: ValidationError[] }`)?
   **Answer**: The signature looks good. And yes, use the same patterns as the file validation.

3. **Frontend Validation Timing**: For the Input and Select components:
   - Should validation happen on every keystroke (onChange), or only on blur and submit?
    **Answer**: Only on blur and submit.
   - The spec mentions "validate both on blur and on submission" - should I add internal state to track validation errors, or should this be managed by the parent component?
   **Answer**: What are some common ways of handling this? I would like to do this a standard way. One idea is there could be a new `<Form>` component that handles it, but I also don't want to reinvent the wheel.
   - Should the components accept validation props directly (e.g., `minLength={4}`) or a validation configuration object?
    **Answer**: good question. Let's use a validation config.

3. **Error Message Generation**: Should the validation module generate user-friendly error messages automatically (e.g., "Name must be at least 4 characters"), or should the component/parent provide custom error messages?
   **Answer**: Each form field (input, dropdown, etc.) should be able to display its own error.

4. **Select Validation**: The `Select` component should support `required` validation - should this validate that a non-empty value is selected? What should be considered an "empty" value (empty string, null, undefined)?
   **Answer**: Yes, it should validate non-empty, and this should be a falsey value (empty string, null, undefined, etc.)

5. **Email/Number Validation**: For the Input component's `type` prop (email, number), should I:
   - Rely on native HTML5 validation?
   - Add custom validation logic in the validation module?
   - Use both (custom validation for consistency across frontend/backend)?
   **Answer**: Do not rely on native HTML5. We should use the same validation logic as the backend within each field component (`<Input>`, `<Select>`, etc.). The component's validation config options should be passable to the validation module's functions.

7. **Textarea Support**: The Description field is described as "text" but might need to be a textarea for multi-line input. Should I:
   - Add support for a `textarea` variant to the Input component?
   - Create a separate Textarea component?
   - Keep it as a regular text input for now?
   **Answer**: Keep it as a regular text input for now.

8. **Privacy and Permissions Fields**: Looking at the schema (convex/schema.ts:31-39), I see:
   - `privacy` is `"public" | "private" | "open"`
   - `memberPermissions` is an optional array that can contain `"post"` and/or `"message"`

   The spec mentions "Permissions - select fields (members can post? members can message?)" - should this be:
   - Two separate checkbox/toggle inputs (one for post, one for message)?
   - A multi-select dropdown?
   - Something else?
   **Answer**: For now, this can be two separate dropdowns with values of "Yes" and "No". If the feed privacy is `public`, the Permissions dropdowns should both default to "No" (though the user can change it). This should be handled in Part 3, however.

## Part 2: Backend

- Add `description` (string, optional, max length 600 characters) to the feed schema
- Implement backend Convex query for getting the feed for the frontend to display
- Implement backend Convex mutation for saving the feed
	- This should also update the `updatedAt` column in the `feeds` table
- Both the query and mutation should check that the user is an admin and that the feed belongs to the org that the user belongs to, otherwise throw
- Validate the form fields using the validation module
	- The Name field should be required and have a minimum length of 4 characters and a max of 25 characters
	- The Description field should be optional and have a max of 600 characters

### Questions

1. **Query Name**: What should I name the Convex query? Options:
   - `getFeedSettings` - More specific
   - `getFeedForSettings` - Descriptive of use case
   - `getFeed` - Simple, but might conflict with existing queries
   **Answer**: Use `getFeed`. It should return a feed for both admins and for users who have access to the feed. It may be used for other areas of the app besides the settings.

3. **Mutation Name**: What should I name the Convex mutation? Options:
   - `updateFeedSettings` - Specific to settings
   - `updateFeed` - Generic
   - `saveFeedSettings` - Matches the "Save" button
   **Answer**: `updateFeed`. It should be able to be called by admins and owners of the feed.

3. **Admin Check**: The spec says "check that the user is an admin" - should this be:
   - Organization admin (user.role === "admin")?
   - Feed owner (userFeed.owner === true)?
   - Either admin OR feed owner?
   **Answer**: Either admin OR feed owner.

4. **Return Values**: What should the mutation return?
   - The updated feed document?
   - Just success/void?
   - The feed ID?
   **Answer**: The updated feed.

5. **Privacy/Permissions Validation**: Should I validate that:
   - Privacy is one of the allowed values ("public", "private", "open")?
   - MemberPermissions only contains "post" and/or "message"?
   **Answer**: The database will only accept correct values. Since these will be dropdowns in the UI, we don't need to check them.

6. **Existing Feed Check**: In the mutation, if the feed doesn't exist or doesn't belong to the org, should I:
   - Throw an error (more secure)?
   - Return null/undefined?
   **Answer**: Throw an error

## Part 3: Frontend implementation

- There should be a new NextJS route, `/feed/{feedId}/settings` that opens the modal
- Open a new Feed Settings modal when clicking on the "Feed settings" button (take a look at how other modals are structured in the app and follow that)
- The backend Convex query should be used to populate the form fields
- The modal should have two tabs: Settings and Members. For now, Members will be empty
- Use the `Input`, `Select` and `Button` components for the form
- The form fields should validate based on the props given each field
	- The Name field should be required and have a minimum length of 4 characters and a max of 25 characters
	- The Description field should be optional and have a max of 600 characters
	- The fields should validate both on blur and on submission. Submission should be blocked if there are any validation errors
- When hitting the Save button, the button should be disabled until the Convex mutation finishes running
	- The Save button should temporarily read, "Saved!" before changing back to its default state

### Questions

1. **Route Structure**: I see the app uses a catch-all route at `app/[[...slug]]/page.tsx`. Looking at the existing code, routes like `/feed/{feedId}` and `/post/{postId}` are handled there. Should I:
   - Follow the same pattern and handle `/feed/{feedId}/settings` in the catch-all route?
   - Create a separate route file for feed settings?

   I'm leaning toward following the existing pattern since I saw the "Feed settings" button already exists in `OverflowMenu.tsx` linking to `/feed/${feedId}/settings`.
   **Answer**: Yes, follow the existing pattern.

2. **Modal Implementation**: Looking at how `Feed.tsx` handles post modals:
   - The modal is opened based on URL path (`/post/{postId}`)
   - The `Modal` component is rendered with state that syncs with the URL
   - Browser back/forward navigation is handled

   Should the feed settings modal follow the same pattern (URL-driven with browser history integration)?
   **Answer**: No, it should use Next.js routing instead. The post navigation is custom to fix a specific problem there.

3. **Form State Management**: For the settings form:
   - Should form state be managed with `useState` for each field?
   - Or should there be a single state object for all form values?
   - How should I handle form submission validation (trigger all field validations before submitting)?
   **Answer**: You should use a single state object for all values. There should also be a way to re-run validation across all inputs at once, triggered from the parent. This may be a hole in our validation spec above.

4. **Save Button States**: The spec says the button should:
   - Be disabled while mutation runs
   - Temporarily read "Saved!" before changing back

   How long should it show "Saved!" before reverting? (e.g., 2 seconds?)
   **Answer**: Yes, 2 seconds sounds good. Also, let's have it read, "Saving..." while the mutation is running. So it will read "Save" -> click- >  "Saving..." -> "Saved!" -> 2 seconds -> "Save"

5. **Privacy Field Defaults**: The spec mentions "If the feed privacy is `public`, the Permissions dropdowns should both default to 'No'". Should this logic:
   - Only apply when creating a new feed (not relevant for this settings page)?
   - Apply when the Privacy field is changed to "public" in the form?
   - Apply when the form loads if the feed is already public?
    **Answer**: It should apply both when creating a new feed (this component will be used later for that) AND when the Privacy field is changed to "public".

6. **Permission Field Values**: For the two permission dropdowns:
   - Dropdown 1: "Members can post?" with values "Yes"/"No"
   - Dropdown 2: "Members can message?" with values "Yes"/"No"

   These need to map to the `memberPermissions` array (`["post"]`, `["message"]`, `["post", "message"]`, or `undefined`/`[]`). Should:
   - "No" for both = `undefined` or `[]`?
   - "Yes" for post only = `["post"]`?
   - "Yes" for message only = `["message"]`?
   - "Yes" for both = `["post", "message"]`?
    **Answer**: Yes, that all looks good.

7. **Error Handling**: If the `getFeed` query throws an error (user lacks access, feed not found, etc.), should I:
   - Display an error message in the modal?
   - Redirect the user somewhere?
   - Show a toast notification?
    **Answer**: Display an error at the top of the modal.

8. **Close Modal Behavior**: When the user closes the modal (X button, Escape key, or clicks outside), should:
   - Navigate back to `/feed/{feedId}`?
   - Discard any unsaved changes without warning?
   - Show a confirmation if there are unsaved changes?
    **Answer**: It should navigate back to wherever the user was. And yes, use a JS `confirm()` if there are unsaved changes.