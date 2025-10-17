# Specification: Frontend Image Upload Simplification

## Goal
Simplify the image upload UX by removing the dropzone intermediary step, enabling direct file selection on toolbar click and seamless drag-and-drop insertion, while reducing codebase complexity.

## User Stories
- As a user, when I click the image icon in the toolbar, I want to immediately see a file dialog so that I can quickly select an image without an extra click
- As a user, when I drag an image into the editor, I want it to start uploading at my cursor position so that I have precise control over placement
- As a developer, I want to remove unnecessary abstraction layers so that the codebase is easier to maintain and debug

## Core Requirements

### Functional Requirements
- Clicking the image toolbar button opens native file dialog immediately
- Selected image inserts at last cursor position (or bottom if no previous position)
- Upload begins automatically after insertion
- Drag-and-drop images insert at cursor/drop position and begin uploading
- Error handling for failed uploads
- Only accept image file types (image/*)
- Single file upload only (no multi-file selection)

### Non-Functional Requirements
- Simpler codebase: remove more code than added
- No degradation in accessibility
- Maintain existing security/permission checks
- Consistent with existing editor patterns
- No performance regression during upload

## Current Implementation Analysis

### Files Involved
- `/app/components/editor/ImageDrop.tsx` (169 lines) - React component for dropzone UI
- `/app/components/editor/ImageDrop.module.css` (34 lines) - Dropzone styling
- `/app/components/editor/tiptap/ImageDropNode.ts` (137 lines) - Custom TipTap node
- `/app/components/editor/uploadQueue.ts` (12 lines) - Queue for drag-dropped files
- `/app/components/editor/EditorToolbar.tsx` - Toolbar with image button
- `/app/context/EditorCommands.tsx` - Command context for editor actions
- `/app/components/editor/Editor.tsx` - Main editor setup

### Current Complexity
1. **Custom TipTap Node**: `ImageDropNode` is a custom block-level node that renders a dropzone
2. **React Component**: `ImageDrop` uses react-dropzone library for drag-drop and click-to-upload
3. **Queue System**: `uploadQueue.ts` bridges global drag events to node instances
4. **Two-Step Process**: Insert dropzone node → user clicks/drops → upload → replace with image
5. **Dependencies**: Requires react-dropzone package (14.3.8)

### Current Flow

**Toolbar Click:**
1. User clicks image icon
2. `addImageDrop` command executes
3. `ImageDropNode` creates unique ID and inserts dropzone block
4. `ImageDrop` component renders with react-dropzone
5. User clicks dropzone to open file dialog
6. User selects file
7. Upload process begins
8. On success, dropzone node replaced with image node

**Drag and Drop:**
1. User drags image over editor
2. `ImageDropNode` plugin's `handleDOMEvents.drop` intercepts
3. File enqueued in `uploadQueue`
4. Dropzone node inserted at drop position
5. `ImageDrop` component mounts, dequeues file
6. Upload begins automatically
7. On success, dropzone replaced with image node

### Upload Logic (Reusable)
The actual upload logic in `ImageDrop.tsx` is well-structured and should be preserved:
- Permission checking via context (orgId, feedId, postId)
- Convex mutations: `generateUploadUrlForUserContent` and `getStorageUrlForUserContent`
- Atomic node replacement using ProseMirror transactions
- Error handling and loading states

## Proposed Solution

### Remove Custom Node
Eliminate `ImageDropNode` entirely and leverage TipTap's built-in Image extension directly.

### Direct File Input
Replace dropzone with native file input approach:
- Create hidden file input triggered by toolbar button
- On file selection, insert placeholder image immediately
- Begin upload, update src on completion

### Simplified Drag-and-Drop
Use TipTap's built-in `handleDrop` in Image extension configuration or a lighter ProseMirror plugin:
- Intercept image drops
- Insert placeholder image at drop position
- Trigger upload logic

### Upload Coordination
Extract upload logic into reusable hook or utility:
- `useImageUpload` hook or `uploadImage` utility function
- Handles: URL generation, fetch upload, get storage URL, error states
- Used by both toolbar click and drag-drop paths
- Used by other areas of the app that need an upload function (e.g. uploading avatars in user's profile - not yet implemented)

## Reusable Components

### Existing Code to Leverage
- TipTap Image extension (`@tiptap/extension-image`) - built-in support for image nodes
- Upload mutations from `/convex/uploads.ts` - `generateUploadUrlForUserContent`, `getStorageUrlForUserContent`
- Context providers - `OrganizationProvider`, `CurrentFeedAndPostProvider` for permissions
- Editor command pattern - `EditorCommands` context for toolbar actions
- Icon component - for upload state indicators

### New Components Required
- `useImageUpload` custom hook - centralize upload logic (extracted from current `ImageDrop.tsx`)
- File input ref handling in Editor component - manage hidden input and trigger

### Components to Remove
- `ImageDrop.tsx` component (169 lines)
- `ImageDrop.module.css` (34 lines)
- `ImageDropNode.ts` custom node (137 lines)
- `uploadQueue.ts` queue system (12 lines)
- react-dropzone dependency

**Total removal: ~350+ lines of code**

## Technical Approach

### Database
No changes required. Existing upload flow through Convex storage remains unchanged.

### API
No changes required. Continue using:
- `api.uploads.generateUploadUrlForUserContent`
- `api.uploads.getStorageUrlForUserContent`

### Frontend

#### 1. Create Upload Hook
`/app/components/editor/hooks/useImageUpload.ts`
- Accept editor instance and position (optional)
- Return `uploadImage(file: File)` function
- Handle: upload URL generation, file upload, storage URL retrieval
- Insert placeholder image with loading indicator (data URL or spinner icon)
- Replace with final image on success
- Show error state on failure
- Use existing org/feed/post context

#### 2. Update Editor Component
`/app/components/editor/Editor.tsx`
- Add hidden file input ref
- Configure TipTap Image extension with drag-drop handler
- Update `addImageDrop` command to trigger file input click
- Pass file to upload hook on selection

#### 3. Update TipTap Configuration
- Remove `ImageDropNode` from extensions
- Keep standard `Image` extension
- Add custom drop handler to Image extension options
- Use `editable: true` to allow image insertion

#### 4. Update Toolbar
`/app/components/editor/EditorToolbar.tsx`
- No change to UI
- Command now triggers file input instead of inserting dropzone

#### 5. Loading States
Options for showing upload progress:
- Option A: Insert image with low-opacity/blur while uploading
- Option B: Insert placeholder node with spinner icon
- Option C: Use data URL of selected file as temporary src

Recommendation: Option C (data URL) for immediate visual feedback, then replace with Convex URL

### Testing
- Unit tests for upload hook (mock Convex mutations)
- Integration tests for toolbar click → upload flow
- Integration tests for drag-drop → upload flow
- Error handling tests (network failure, permission denied)
- Edge case: rapid successive uploads
- Edge case: upload during concurrent edits
- Accessibility testing with keyboard navigation

## Out of Scope
- Multi-file uploads
- Image editing/cropping before upload
- Upload progress percentage indicator (just loading state)
- Retry failed uploads automatically
- Image optimization/compression client-side
- Paste image from clipboard (future enhancement)
- Video/other media upload

## Success Criteria
- Net reduction of at least 300 lines of code
- Toolbar image button opens file dialog in one click
- Drag-dropped images insert and upload seamlessly
- No regressions in accessibility (keyboard navigation works)
- Upload success rate unchanged from current implementation
- No new dependencies added (remove react-dropzone)
- All existing permission checks maintained
- Editor remains responsive during uploads

## Migration Notes
- No data migration required
- No backward compatibility needed (feature change, not API)
- Existing images in posts unaffected
- Remove react-dropzone from package.json

## Key Simplifications
1. **Eliminate custom TipTap node** - Use built-in Image extension
2. **Remove react-dropzone dependency** - Use native input and ProseMirror events
3. **Remove queue system** - Direct file handling
4. **Single upload path** - Unified logic for click and drag-drop
5. **Fewer UI states** - No dropzone rendering/interaction states
