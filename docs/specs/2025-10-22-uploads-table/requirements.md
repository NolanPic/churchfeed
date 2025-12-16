# How to follow these instructions

- I will ask you to implement one part of these instructions at a time (e.g. "Part 1 - Database changes").
- When you begin on a part, start with asking clarifying questions to ensure you understand the requirements. Be very rigorous in this, and make sure there are NO gaps in your understanding! You can even ask multiple rounds if needed.
- Please ask your questions under a "## Questions" section under the current part.
- Once you are satisfied, add a "## Clarifications" section at the end of the current part in this document that summarizes the key clarifications.
- It is possible that there are inconsistencies or discrepancies in the requirements. It is your job to point these out and suggest improvements.
- Be sure to fully understand the relevant parts of the codebase before you begin (and ask questions, see above, if needed).
  Please commit your changes regularly in meaningful intervals. Ensure a single commit is not too large.

# Overview

We need to create a general-purpose, storage system for images and files that can be reused across the app. Currently, there is some upload functionality, but it is not secure since it gives direct access to upload anything into Convex's storage.

There are two types of uploads at the moment, and one coming: images in posts, images in messages, and user avatars (uploading avatars is not implemented yet).

Please note that "image" and "file" will be used somewhat interchangeably in this spec.

## Important goals

- Security - ensure only logged-in users can upload, and that only the users who have access can upload to specific sources or read a file
- Low complexity - keep it simple and the codebase maintainable
- Keep the spec as simple as possible and code examples minimal

# Part 1 - Database changes

Add a new table (`uploads`) to Convex that will store all uploads across the app. It should have these columns in addition to the defaults (`defaultColumns` in the schema):

- `storageId` - the id of the upload
- `source` - union with these options: `post` | `message` | `avatar`
- `sourceId` - the id of the source, e.g. the post id or message id. If the source is `avatar`, this column will be the user id (so the user id will be in both the `sourceId` and `userId` columns).
- `userId`
- `fileExtension` - string

File size and mime type are available in the `_storage` table and can be easily retrieved using the `storageId`.

The `uploads._id` column should be used when referencing an image in the database, e.g. the `users` table would have an `avatar` column that accepts an `uploads` id.

## Questions

1. Data Types

- For `storageId`: Should this be `v.id("_storage")` to reference Convex's built-in storage system?
  - **Answer**: Yes
- For `fileExtension`: Should this include the dot (e.g., `.jpg`) or without (e.g., `jpg`)?
  - **Answer**: Without the dot.

2. Default Columns

- The `defaultColumns` object includes `orgId` and `updatedAt`. Should the `uploads` table include these, or should I also explicitly include `_creationTime` (which I believe is automatically added by Convex)?
  - **Answer**: The uploads table should include the `defaultColumns`.

3. Source ID Behavior

- For `source: "post"`: Should `sourceId` be the post ID?
  - **Answer**: Yes
- For `source: "message"`: Should `sourceId` be the message ID?
  - **Answer**: Yes
- For `source: "avatar"`: Confirmed — `sourceId` should be the user ID (same as `userId`).
  - **Answer**: Correct

4. Optional Fields & Upload Flow

- Should `sourceId` be optional? For example, if a user uploads an image but hasn't attached it to a post yet, would `sourceId` initially be `null` and then updated later?
  - **Answer**: Yes, `sourceId` should be optional, but there should always be a `source` value and a `userId`.
- Or does the upload only happen after the post/message is created, so `sourceId` is always known?
  - **Answer**: It's possible it could be `null` initially, but it should be updated later. We will decide this later for sure but you can operate on it being optional.

5. Database Indexes

- Should I add indexes to the `uploads` table for common query patterns? Potential indexes:
  - `by_org` on `["orgId"]`
  - `by_source_and_sourceId` on `["source", "sourceId"]`
  - `by_userId` on `["userId"]`
  - `by_org_and_source` on `["orgId", "source"]`
    - **Answer**: You should create indexes, but there should be no overlap. For example, instead of having `by_org` and `by_source_and_sourceId` and `by_org_and_source`, you can create a single index for all of these. When you are using the index, you can use only the columns you need to.

6. Scope of Part 1

- Part 1 says: “The `uploads._id` column should be used when referencing an image in the database, e.g. the `users` table would have an `avatar` column that accepts an `uploads` id.”
- Currently, the `users` table has: `image: v.optional(v.id("_storage"))`
- Should I update this field in Part 1 to: `avatar: v.optional(v.id("uploads"))`?
  - **Answer**: Yes
- Or should schema changes to existing tables be deferred to a later part?

7. Images in Posts/Messages Context

- Currently, images in posts/messages are embedded in TipTap JSON content using the Image extension.
- I assume the TipTap content will eventually store `uploads._id` references instead of direct storage URLs?
- Should I be aware of this for Part 1, or will that be handled in later parts?
  - **Answer**: No, the images will be kept as URLs embedded in the JSON. You do not need to worry about this.

8. Deletion Behavior

- Should there be a `deletedAt` field for soft deletes, or will uploads be permanently deleted?
  - **Answer**: Yes, you can include a `deletedAt` field that a future cron job can use to clean up.
- The instructions mention security — should we track this for audit purposes?

Please clarify these points so I can implement Part 1 correctly and completely.

## Clarifications

- **storageId**: Uses `v.id("_storage")` to reference Convex's built-in storage system
- **fileExtension**: Stored without the dot (e.g., "jpg" not ".jpg")
- **Default Columns**: The uploads table includes `orgId` and `updatedAt` from `defaultColumns`
- **sourceId**: Optional field that can be `null` initially and updated later. However, `source` and `userId` are always required.
- **Source ID mapping**:
  - For `source: "post"` → `sourceId` is the post ID
  - For `source: "message"` → `sourceId` is the message ID
  - For `source: "avatar"` → `sourceId` is the user ID (same as `userId`)
- **Indexes**: Use compound indexes to avoid overlap. A single compound index can serve multiple query patterns by using only the fields needed.
- **Users table update**: Added `avatar: v.optional(v.id("uploads"))` field to reference the new uploads table. Kept the existing `image` field to avoid breaking existing code - migration will be handled in a future part.
- **Images in posts/messages**: Images remain as URLs embedded in TipTap JSON content - no changes needed for Part 1
- **Deletion**: Includes `deletedAt` field for soft deletes, allowing future cron job cleanup

# Part 2 - Validation

When a user uploads a file, we need to validate it both on the front and backend. We should have one module/file that both the front and backend share.

The main validation function should accept a File object and use a functional approach that uses multiple functions to check:

- File size (files should be <=3MB)
- File type (allow only images for now, though should be easily extensible later)
  - avatars should not allow gifts

Validation should return standard errors to the frontend or backend code that calls it, allowing the caller to handle the errors.

## Questions

1. **Shared Module Location**
   - Where should the shared validation module be located? I see there's a `convex/lib` folder (currently empty). Should I create the module there?
   - Or should it be in a different location like a root-level `lib/` or `shared/` folder?
   - **Answer**: It should be in a root level `validation/` folder.

2. **File Object Type**
   - The validation function should accept a File object. Is this the browser's `File` API object?
   - In the backend (Convex), do we receive the same File object type, or do we need to handle a different type (e.g., Blob)?

- **Answer**: Since the backend and frontend will share the same code, the type should work for both the browser's API object and whatever the backend will accept by `post`ing the file. This may just be the browser's `File` object type - I'm not sure. Do some research here and let me know if you have questions.

3. **Error Format**
   - What error format should be returned? Should it be:
     - A single error string?
     - An array of error objects with codes and messages?
     - A typed error result object (e.g., `{ valid: boolean; errors: ValidationError[] }`)?
     - **Answer**: The last option.
   - Should the errors be typed (TypeScript)?
     - **Answer**: Yes

4. **Validation Context (Source Type)**
   - The spec mentions "avatars should not allow gifs" (I assume "gifts" is a typo for "gifs")
     - **Answer**: Correct.
   - How should the validation function know if it's validating an avatar vs other image types?
     - **Answer**: The `source` type (`"post"` | `"message"` | `"avatar"`) should be passed as a parameter to the validation function.
   - Should the `source` type (`"post"` | `"message"` | `"avatar"`) be passed as a parameter to the validation function?
     - **Answer**: Yes

5. **Allowed Image Types**
   - What specific image MIME types should be allowed? For example:
     - JPEG (`image/jpeg`)
     - PNG (`image/png`)
     - WebP (`image/webp`)
     - GIF (`image/gif`) - allowed for posts/messages but not avatars
     - Others?
     - **Answer**: Start with those. It should also be able to upload images from Apple Photos. I'm not sure if that is a different MIME type or if it's one of the above.

6. **Size Limits**
   - The spec says "files should be <=3MB"
   - Should all file types (post, message, avatar) have the same 3MB limit?
   - Or should avatars have a smaller limit?
   - **Answer**: Avatar should have a smaller limit, say 1MB.

7. **Extensibility for Future File Types**
   - The spec mentions "allow only images for now, though should be easily extensible later"
   - Should the validation function be designed to accept a configuration object that specifies allowed types and size limits?
   - Or should it have hardcoded image validation for now?
   - **Answer**: It can be hardcoded for now, but as a `VALIDATION_OPTIONS` constant that can be easily edited.

8. **Synchronous vs Asynchronous**
   - Should the validation be synchronous or asynchronous?
   - Reading file metadata from a File object is typically synchronous, but should I design it as async for future extensibility?
   - **Answer**: This will be called from the front and backend, so let's make it async.

9. **Backend Validation Approach**
   - Looking at the current upload flow:
     1. Frontend calls `generateUploadUrlForUserContent` mutation to get an upload URL
     2. Frontend POSTs the File directly to Convex storage (not through our backend)
     3. Frontend receives a `storageId` from Convex
     4. Frontend calls `getStorageUrlForUserContent` with the `storageId`
   - At what point should backend validation happen?
     - Option A: In `getStorageUrlForUserContent` - validate using `ctx.storage.getMetadata(storageId)` and delete if invalid
     - Option B: Create a new mutation that validates and creates the upload record (frontend calls this after storage upload)
     - Option C: Other approach?
   - Note: The backend won't receive the File object directly - it only has access to the `storageId` and metadata from `ctx.storage.getMetadata()`
     - **Answer**: Option C. The current upload flow will be refactored so that a file is POSTed to our backend function, which then:
     1. Validates the file
     2. Creates the upload URL
     3. Uploads the file to that upload URL
     4. Creates the upload record in the database
     5. Returns the storage URL to the frontend along with the upload record ID
        However, this part is not concerned with this. I have provided this for context only. Do not implement in this part.

## Clarifications

- **Location**: Create validation module in a root-level `validation/` folder
- **File Type**: Accepts browser's `File` API object (works for both frontend and backend)
- **Error Format**: Returns typed result object: `{ valid: boolean; errors: ValidationError[] }`
- **Source Parameter**: Validation function accepts `source` type (`"post"` | `"message"` | `"avatar"`) as parameter
- **Allowed MIME Types**: JPEG (`image/jpeg`), PNG (`image/png`), WebP (`image/webp`), GIF (`image/gif`), plus Apple Photos formats (HEIC: `image/heic`, HEIF: `image/heif`)
- **GIF Restriction**: GIFs not allowed for avatars
- **Size Limits**:
  - Avatar: <= 1MB (1,048,576 bytes)
  - Post/Message: <= 3MB (3,145,728 bytes)
- **Extensibility**: Use `VALIDATION_OPTIONS` constant for easy configuration (hardcoded for now)
- **Async**: Validation function is async
- **Backend Integration**: Will be refactored in a future part (not Part 2)

# Part 3: Backend

The backend for file uploads needs to be refactored. Currently, the frontend calls the following backend functions:

- `generateUploadUrlForUserContent`: uses Convex's storage API to get url for uploading image
- `getStorageUrlForUserContent`: uses Convex's storage API to get the URL of an uploaded image by its `_storage._id`

After calling `generateUploadUrlForUserContent`, the frontend uses the returned URL to upload the file to Convex's storage.

This presents a problem for validation, because we do not control what Convex's upload URL does internally. To mitigate this, we should refactor our backend.

## Refactor

Refactor `uploads.ts` to have an `uploadFile` mutation that does the following:

1. Accepts a file and all the parameters required for inserting into the `uploads` table
2. Checks that the user has auth/permission to upload the file to the given source/sourceId
3. Validates the file using the validation module introduced previously
4. If successfully authed & validated, generates an upload URL and uploads the file to Convex's storage
5. Creates an `uploads` record
6. Returns an object with the storage URL of the file along with it's `uploads._id`

Please ensure that you implement this in multiple functions that "do a thing" and not in one giant function that "does all the things".

We should also create a separate query `getStorageUrl` for reading upload URLs that does the following:

1. Accepts an `uploadId` as a parameter
2. Checks that the user has auth/permission to access the file
3. If successfully authed, generates the storage URL of the file and returns it along with the `uploadId`

### Auth

Ensure you understand the `auth/` module so that you can use it to perform auth checks.

When doing auth checks for `uploadFile` and `getStorageUrl`, we should do the following:

1. Check that the user is logged in
2. If uploading:
   1. If source is `post` or `message`, ensure user has write access to the feed they are posting/messaging in
   2. If type is `avatar`, ensure user is changing their own avatar and not another user's
3. If getting the storage URL:
   1. If `upload` source is `post` or `message`, ensure that user has read access to the feed that the `post`/`message` belongs to
   2. If `upload` source is `avatar`, ensure that the user is logged in and belongs to the same `orgId` as the `uploadId`

## Questions

1. **File Object in Convex Mutations**
   - Can Convex mutations accept `File` objects directly as arguments?
   - Or do we need to accept a different format (e.g., Blob, ArrayBuffer, base64 string)?
   - The validation module expects a `File` object - will this work in Convex?

- **Answer**: Hmm, we may need to change our apporach just slightly. Take a look at /file-uploads-example.md and see how we could accept a file and save it to Convex. It looks like we'll have to use a Convex action instead of a mutation.

2. **File Extension Extraction**
   - Should we extract the file extension from the file name (e.g., "photo.jpg" → "jpg")?
   - Or derive it from the MIME type (e.g., "image/jpeg" → "jpg")?
   - How should we handle edge cases like "image.test.png" or files without extensions?
     **Answer**: We should extract the file extension from the file name. But if the mime type doesn't match the file extension, we should throw an error.

3. **Avatar Upload Parameters**
   - For avatar uploads, `sourceId` should be the user ID
   - Should the caller pass `sourceId`, or should we derive it from the authenticated user?
   - Similarly, should `userId` always be derived from auth, or can it be passed as a parameter?
     **Answer**: In this case, we should derive `sourceId` from the authenticated user. `userId` should ALWAYS be derived from the authenticated user.

4. **Error Handling**
   - If validation fails, should we throw an error or return a result object with the validation errors?
   - Same question for auth failures - throw or return?
     **Answer**: We should throw an error for both validation and auth failures.

5. **Query vs Mutation for getStorageUrl**
   - The spec says "create a separate query `getStorageUrl`" but also says it "generates the storage URL"
   - Should this be a query or mutation? (Queries are read-only, mutations can write)
   - Generating a URL is typically read-only, so I assume query is correct?
     **Answer**: We should use a query for `getStorageUrl`. Generating a storage URL is a Convex function that I believe can be called from within a query.

6. **Upload Flow Implementation**
   - The spec says `uploadFile` should "uploads the file to Convex's storage"
   - Does this mean:
     - A) The frontend sends the File data to our mutation, and we upload it to Convex storage within the mutation?
     - B) Something else?
   - How do we upload a file to Convex storage from within a mutation? Is there a specific API?

   **Answer**: A is correct, though please take in the context of my answer to question 1 above. `uploadFile` should be a Convex action that takes the posted file and uploads it to Convex storage.

7. **Return Value for getStorageUrl**
   - Spec says "returns it along with the `uploadId`"
   - Should this return `{ url: string; uploadId: Id<"uploads"> }`?
   - Or just the URL string?
     **Answer**: This format works: `{ url: string; uploadId: Id<"uploads"> }`

8. **Feed Access for Avatar Uploads**
   - For post/message uploads, we check feed access
   - For avatar uploads, there's no feed involved
   - Should avatar uploads require just authentication, or additional checks?
   - **Answer**: Avatars should require authentication, and that the user is changing their own avatar.
   - The auth spec says "ensure user is changing their own avatar" - so check userId matches auth user?
   - **Answer**: Just use the user ID that comes back from the authentication process.

9. **HTTP Actions and Authentication**
   - HTTP actions use `httpAction` instead of `mutation`
   - How do we access Clerk authentication in an HTTP action?
   - **Answer**: The authentication info should be available on the `ctx` parameter
   - Do we have access to `getUserAuth` like in mutations?
   - **Answer**: Yes, you should be able to import and use it just like in a mutation
   - Or do we need to parse auth tokens from request headers?
   - **Answer**: No. See above.

10. **Calling Mutations from HTTP Actions**

- To save the upload record to the database, can we call a mutation from within the HTTP action?
- I see `ctx.runMutation` in Convex docs - is this the approach?
- **Answer**: Yes, use `ctx.runMutation` and/or `ctx.runQuery`
- Or should we use `ctx.db` directly in the HTTP action?
- - **Answer**: No, see above.

11. **File vs Blob Validation**

- The FormData example shows `file instanceof Blob`
- Our validation module expects a `File` object (which extends Blob)
- Will `File` work here, or do we need to adapt our validation?
- Can we construct a File object from the Blob if needed?
- **Answer**: Let's just use Blob if we can for the validation. Since File extends Blob, it should accept it.

12. **HTTP Action Parameters**

- Besides the file, we need: `orgId`, `source`, `sourceId` (optional), `feedId` (for post/message)
- Should these be sent as FormData fields alongside the file?
- Or as URL parameters / headers?
- **Answer**: Let's send these as FormData as well.

13. **HTTP Action Route**

- What should the HTTP endpoint path be?
- Something like `/api/upload` or should it match Convex's http routing conventions?
- **Answer**: Let's match Convex's conventions.

14. **getStorageUrl Implementation**

- Should `getStorageUrl` remain a regular Convex query (not HTTP)?
- **Answer**: Yes
- Frontend calls it like other Convex queries via the client?
- **Answer**: Yes

15. **Validation Module Update**

- Our validation module currently expects `File` type
- Should I update it to accept `Blob` instead (since File extends Blob)?
- The Blob type doesn't have a `name` property (needed for file extension extraction)
- Should we:
  - A) Keep validation module as-is using File, and handle the type conversion in the HTTP action
  - B) Update validation to accept Blob and pass file name/extension separately
  - C) Other approach?
  - **Answer**: Option B please

16. **Convex HTTP Routing**

- What does "Convex's conventions" mean for HTTP routing?
- Should I look at existing HTTP routes in the codebase?
- Or is there a specific pattern like `convex/http.ts` with routes defined there?
- **Answer**: Just research what the Convex docs do, and use that approach.

## Clarifications

- **HTTP Actions**: Use `httpAction` instead of mutation, defined in `convex/http.ts` router
- **Authentication**: Use `getUserAuth` in HTTP actions via `ctx` parameter (same as mutations)
- **Database Operations**: Use `ctx.runMutation` and `ctx.runQuery` from HTTP actions
- **File Handling**: Accept Blob from FormData, extract metadata separately
- **Validation**: Updated to accept Blob + fileName instead of File object
- **File Extension**: Extract from file name, validate against MIME type
- **Parameters**: Send as FormData fields (orgId, source, sourceId, feedId)
- **User/Source IDs**: Always derive userId from auth; for avatars, sourceId = authenticated user ID
- **Error Handling**: Throw errors for validation and auth failures
- **getStorageUrl**: Remains a Convex query, returns `{ url: string; uploadId: Id<"uploads"> }`
- **Routing**: Follow Convex conventions - create `convex/http.ts` with httpRouter
- **Avatar Auth**: Require authentication only (user uploads their own avatar)

# Part 4: Frontend & implementation

Uploading on the frontend is currently done via the following hooks:

- `useImageUpload` - handles general image uploading
- `useEditorImageUpload` - handles image uploading in the editor (e.g. dropping images into the editor after uploading, etc.) - uses `useImageUpload` for the upload part

These hooks need to be updated to use the new backend upload action.

## Images in posts & messages

There's a bit of a complication with posts and messages. Here's how posting works:

1. User selects feed to post in
2. User begins drafting a post. No post ID exists
3. User adds content and uploads images to post. Still no post ID
4. User publishes post. Now the post ID exists

Messaging works the same, except the user selects a post to message in as step 1.

The problem: The image needs to upload, but there's no post ID yet.

To overcome this problem, here's the process:

1. User begins drafting a post
2. User uploads images to post. On the backend, this will create an `uploads` record with a `source` = `post` and a `sourceId` = `null`
3. As the user uploads images, we will keep track of the `uploadIds` in React state
4. Once the user publishes the post, the `postId` will be returned to the frontend and we will call a `patchUploadSourceIds` mutation that sets the `sourceId` on each of the `uploadIds` equal to the `postId`
5. `patchUploadSourceIds` will need to check that the user is the author of the post for authorization

Messages work the same way as posts.

## Avatars

Avatars do not have the same problem as posts and messages and their `sourceId` can be saved immediately (it's the `userId`). There is one unique requirement for avatars:

- When uploading a avatar, we should replace or delete any previous avatar that belongs to that user

## Questions

1. **HTTP Action Endpoint**
   - The new backend uses an HTTP action at `/upload`
   - Should the frontend POST to this endpoint using fetch?
   - What's the full URL? (e.g., `https://<convex-url>/upload` or something else?)
   - Do we need to include authentication headers, or is auth handled automatically by Convex?
   - **Answer**: The frontend should call this endpoint. Please do research on how to call authenticated Convex actions from the frontend.

2. **Return Type from Upload Action**
   - The backend returns `{ uploadId: Id<"uploads">; url: string }`
   - Should `useImageUpload` now return `uploadId` in addition to `imageUrl`?
   - Do we need to track `uploadIds` in the hook's state, or should the caller track them?
   - **Answer**: I do not believe `useImageUpload` needs to return `uploadId` and can just use it internally. The `uploadIds` can be tracked in the hook's state.

3. **Upload ID Tracking for Posts/Messages**
   - The spec says "we will keep track of the `uploadIds` in React state"
   - Should this tracking happen in `useImageUpload`, or in the parent component that uses the hook?
   - If in the hook: should we add an `uploadIds` array to the return value?
   - If in parent component: how should we expose the `uploadId` from the hook?
   - **Answer**: See above question/answer. The state should be in the `useImageUpload` hook and should not return the value unless necessary for the component using the hook.

4. **Calling patchUploadSourceIds**
   - Where should `patchUploadSourceIds` be called from?
   - Is it called from the post/message creation mutation, or from the frontend after the post is created?
   - If from frontend: should we create a separate hook or utility function?
   - **Answer**: It should be called from the `UseImageUpload` hook. We should be sure that it finishes before the post editor closes.

5. **patchUploadSourceIds Implementation**
   - Should this be a mutation that:
     - Takes `uploadIds: Id<"uploads">[]` and `sourceId: Id<"posts"> | Id<"messages">`?
     - Checks that all uploads belong to the authenticated user?
     - Updates the `sourceId` field on each upload record?

- **Answer**: Yes
  - Should it verify that the user is the author of the post/message?
  - **Answer**: Yes
  - What should it return?
  - **Answer**: It should return an array of `uploadIds` that were successfully updated

6. **Avatar Upload Hook**
   - Is there a separate hook for avatar uploads, or should `useImageUpload` support all upload types?
   - **Answer**: `useImageUpload` should support all types
   - Should we add a `source` parameter to `useImageUpload`?
   - **Answer**: Yes, and I believe it will need a `sourceId`parameter as well that can be null (null while drafting, then once user publishes, it will have a value)
   - Or create a separate `useAvatarUpload` hook?
   - **Answer**: No

7. **Avatar Deletion/Replacement**
   - Should the deletion/replacement of old avatars happen:
     - A) In the backend during upload (in `uploadAction`)?
     - B) In a separate backend function called from frontend?
     - C) In the `patchUploadSourceIds` mutation?
   - Should old avatars be soft-deleted (set `deletedAt`) or hard-deleted?
   - If soft-deleted, should we mark them as deleted immediately or let a cron job handle it?
   - **Answer**: replacement should happen in the `uploadAction` action. Avatars should be hard-deleted.

8. **Frontend Validation**
   - Should we validate files on the frontend before uploading?
   - We have the validation module in `validation/` - can we import and use it on the frontend?
   - Or should we rely solely on backend validation and handle errors?
   - **Answer**: Yes, you should validate using the `validation/` module.

9. **Error Handling**
   - The backend can return validation errors: `{ error: string; validationErrors?: ValidationError[] }`
   - How should we handle these in the hook?
   - Should validation errors be exposed differently than other errors?
   - **Answer**: Validation will happen on the frontend and should NOT upload the file if validation fails. The backend should be updated so that it throws an error instead of returning `validationErrors`. There is an error message already in place on posts, and that should be used for displaying frontend validation errors.

10. **Source Type Determination**
    - How should the hook know whether it's uploading for a post, message, or avatar?
    - Should we add a `source` parameter to `useImageUpload`?
    - Or infer it from context (feedId + postId)?
    - **Answer**: Add a `source` parameter

11. **FormData Construction**
    - The backend expects: `file`, `fileName`, `orgId`, `source`, `sourceId` (optional), `feedId`
    - For posts/messages without a sourceId yet, do we:
      - A) Omit the `sourceId` field from FormData?
      - B) Send `sourceId: null`?
      - C) Send empty string?
      - **Answer**: Omit `sourceId`
    - Is `fileName` the `file.name` property?
    - **Answer**: Yes

12. **Current Upload Flow**
    - Currently, `useImageUpload` uses context: `CurrentFeedAndPostContext` for `feedId` and `postId`
    - Should we continue using this context?
    - **Answer**: Yes
    - For messages: is `postId` actually the message ID? Or is there a different context?
    - **Answer**: No. `postId` should be replaced by `sourceId`. Think of this in terms of refactoring, not trying to shove a new system into an old one.
    - For avatars: these contexts won't exist - how should we handle that?
    - **Answer**: That's fine, avatars don't need those contexts. They should only be used for posts and messages.

13. **useEditorImageUpload Changes**
    - Does this hook need any changes beyond what `useImageUpload` provides?
    - Or will it "just work" once `useImageUpload` is updated?
    - **Answer**: I believe it will just work, but you should investigate.

14. **Backward Compatibility**
    - Should we deprecate the old `generateUploadUrlForUserContent` and `getStorageUrlForUserContent` functions?
    - Or keep them for now and gradually migrate?
    - **Answer**: Yes, deprecate them.

15. **Testing Requirements**
    - Should I test the upload flow manually?
    - Or are there existing tests I should update?
    - **Answer**: I will test.

16. **Migration Strategy**
    - Should we update `useImageUpload` to work with the new backend immediately?
    - Or create a new hook (e.g., `useImageUploadV2`) and migrate gradually?
    - **Answer**: update the existing hook. Do not create a new hook.

## Clarifications

- **HTTP Action Authentication**: Use Clerk's `useAuth().getToken({ template: "convex" })` to get JWT token, include in Authorization header: `Bearer ${token}`
- **Upload Hook Parameters**: `useImageUpload` now accepts `{ source, sourceId }` options. Source is required, sourceId is optional and can be null while drafting
- **Upload ID Tracking**: Hook tracks `uploadIds` internally in state, not exposed to caller
- **patchUploadSourceIds**: Called automatically via useEffect when sourceId changes from null to a value. Ensures completion before editor closes
- **patchUploadSourceIds mutation**:
  - Takes `uploadIds: Id<"uploads">[]`, `sourceId`, and `orgId`
  - Verifies all uploads belong to authenticated user
  - Returns array of successfully updated uploadIds
- **Avatar Deletion**: Previous avatars hard-deleted in `uploadAction` before new upload using `deletePreviousAvatar` internal mutation
- **Frontend Validation**: Files validated using `validation/` module before upload. Backend also validates but primarily for security
- **Error Handling**: Frontend validation throws Error with combined messages. Backend returns single error message (no separate validationErrors)
- **FormData Construction**: Include file, fileName (from file.name), orgId, source, and optionally feedId (for post/message) and sourceId (if available)
- **Context Usage**: Continue using `CurrentFeedAndPostContext` for feedId. Determine source from postId presence (message if exists, post otherwise)
- **useEditorImageUpload**: Updated to pass source and sourceId options to useImageUpload. Works automatically with updated hook.
- **Deprecated Functions**: `generateUploadUrlForUserContent` and `getStorageUrlForUserContent` marked with @deprecated in backend
- **HTTP Endpoint**: Upload endpoint is `${NEXT_PUBLIC_CONVEX_URL}/upload`
