# Part 1 - new hook

We need to refactor the `useOnPost` hook so that it can be reused for messages. The refactored hook should be called `useOnPublish`.

Requirements:

- `useOnPost` -> `useOnPublish`
- Should accept a `source` paremeter that can be either `post` or `message`
- Any references to "post" should become "source", e.g. `postId` -> `sourceId`, etc.
- `PostState` should become `PublishState` and have the values: "drafting" | "publishing" | "published" | "error"
- Depending on the `source` parameter, we should call the correct mutation for saving the content (post or message)
- Update post editors (`PostEditor` and `PostEditorPhone`) to use the updated `useOnPublish`
- Update `MessageEditor` to use `useOnPublish`. Be sure that the `reset()` method is also used for messages

## Questions

1. **Parameters for different sources**: Posts require `feedId`, but messages require `postId`. Should the hook accept both as optional parameters and validate based on the `source` type? For example:

   ```typescript
   useOnPublish(source: 'post' | 'message', editorRef, { feedId?, postId? })
   ```

   **Answer**: Use one parameter called `parentId` whose type is either `Id<"feeds">` or `Id<"posts">`

2. **Return value naming**: Should the hook return `savedSourceId` (generic) or keep it as `savedPostId` for backwards compatibility (even though it might be a message ID)?
   **Answer**: It should return `savedSourceId`

3. **MessageEditor state management**: The current `MessageEditor` has its own `isSending` state and `savedMessageId` state. Should we completely remove these and rely entirely on the hook's state management (using the hook's `state` and `savedSourceId`)?
   **Answer**: Yes, replace `MessageEditor`'s state with the hook

4. **Error messages**: The current error says "Failed to create post. Please contact support". Should this become:
   - Generic: "Failed to publish content. Please contact support"
   - Source-specific: "Failed to create post/message. Please contact support"
     **Answer**: Generic

5. **Validation error message**: The current hook shows "Please add some content to your post" when empty. Should this become generic ("Please add some content") or source-specific?
   **Answer**: Generic

6. **Hook function naming**: Should the main function be called `onPublish` (generic) or keep context-specific naming somehow?
   **Answer**: use `onPublish`

7. **MessageEditor clearing behavior**: The current `MessageEditor` clears the editor immediately after creating the message (in the try block), while `PostEditor` uses a `useEffect` that watches for `state === "posted"` and then clears the editor and calls `reset()`. Should `MessageEditor` follow the same pattern as `PostEditor` (using useEffect)?
   **Answer**: Yes, follow the same pattern as posts

8. **Hook signature**: Based on answer #1, should the hook signature be:
   ```typescript
   useOnPublish(
     source: 'post' | 'message',
     editorRef: RefObject<EditorHandle | null>,
     parentId: Id<"feeds"> | Id<"posts"> | null
   )
   ```
   Or should we validate the parentId type matches the source at runtime?
   **Answer**: This is fine
