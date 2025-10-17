# Task Breakdown: Frontend Image Upload Simplification

## Overview
Total Tasks: 4 Task Groups
Assigned roles: ui-designer, testing-engineer
Net Code Reduction: ~300+ lines removed

## Task List

### Core Upload Hook (Reusable)

#### Task Group 1: Create Reusable Image Upload Hook
**Assigned implementer:** ui-designer
**Dependencies:** None

- [ ] 1.0 Create reusable image upload hook
  - [ ] 1.1 Write 2-8 focused tests for useImageUpload hook
    - Limit to 2-8 highly focused tests maximum
    - Test only critical behaviors: successful upload flow, permission check failure, network error handling
    - Mock Convex mutations (generateUploadUrlForUserContent, getStorageUrlForUserContent)
    - Skip exhaustive edge case testing (will be covered in integration tests)
  - [ ] 1.2 Create `/app/components/editor/hooks/useImageUpload.ts`
    - Extract upload logic from existing ImageDrop.tsx (lines 19-137)
    - Accept parameters: editor instance, optional position parameter
    - Return uploadImage(file: File) function
    - Implement upload flow: generate URL → fetch upload → get storage URL
    - Use existing context: OrganizationProvider, CurrentFeedAndPostProvider
    - Handle permission checks (orgId, feedId, postId validation)
  - [ ] 1.3 Implement placeholder and loading states
    - Insert placeholder image with data URL for immediate visual feedback (Option C from spec)
    - Show loading state during upload (low opacity or blur effect)
    - Replace with final Convex storage URL on success
    - Use ProseMirror transaction to atomically replace placeholder
  - [ ] 1.4 Add comprehensive error handling
    - Handle missing organization/feed/post context
    - Handle network failures during upload
    - Handle failed upload URL generation
    - Handle failed storage URL retrieval
    - Provide clear error messages for debugging
  - [ ] 1.5 Ensure upload hook tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify critical upload behaviors work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 1.1 pass
- Hook is framework-agnostic and reusable outside of editor context
- Upload logic maintains all existing permission checks
- Loading states provide immediate user feedback
- Error states are clearly communicated

### Editor Integration

#### Task Group 2: Integrate Direct Upload into Editor
**Assigned implementer:** ui-designer
**Dependencies:** Task Group 1

- [ ] 2.0 Integrate upload hook into editor
  - [ ] 2.1 Write 2-8 focused tests for editor integration
    - Limit to 2-8 highly focused tests maximum
    - Test only critical interactions: toolbar click opens file dialog, file selection triggers upload, drag-drop inserts at cursor position
    - Mock file input interactions and upload hook
    - Skip exhaustive user interaction scenarios
  - [ ] 2.2 Update `/app/components/editor/Editor.tsx` for toolbar click flow
    - Add hidden file input ref with accept="image/*" and single file selection
    - Store last known cursor position in ref or state
    - Update TipTap Image extension configuration (remove ImageDropNode, keep built-in Image)
    - Create handler for file input change event
    - On file selection: call useImageUpload.uploadImage() at last cursor position (or document end if none)
  - [ ] 2.3 Implement drag-and-drop handling
    - Configure TipTap Image extension with custom handleDrop handler
    - Intercept image file drops (check dataTransfer.files for image/* types)
    - Extract drop position from event coordinates
    - Call useImageUpload.uploadImage() at drop position
    - Prevent default browser image handling
    - Reject multi-file drops (same as current behavior)
  - [ ] 2.4 Update `/app/context/EditorCommands.tsx`
    - Modify addImageDrop command to trigger hidden file input click
    - Command should no longer insert ImageDropNode
    - Maintain same command interface for toolbar compatibility
  - [ ] 2.5 Update `/app/components/editor/EditorToolbar.tsx`
    - No UI changes required (button remains same)
    - Verify image button still calls addImageDrop command
    - Ensure keyboard navigation still works (accessibility check)
  - [ ] 2.6 Ensure editor integration tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify toolbar click and drag-drop workflows work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 2.1 pass
- Toolbar click opens native file dialog immediately (single click)
- Selected images upload at last cursor position or document end
- Drag-dropped images insert at drop position and upload
- No multi-file selection allowed (matches current behavior)
- Keyboard navigation maintained for accessibility

### Code Cleanup and Removal

#### Task Group 3: Remove Legacy Upload Components
**Assigned implementer:** ui-designer
**Dependencies:** Task Group 2

- [ ] 3.0 Remove obsolete upload code
  - [ ] 3.1 Remove ImageDrop component and styles
    - Delete `/app/components/editor/ImageDrop.tsx` (169 lines)
    - Delete `/app/components/editor/ImageDrop.module.css` (34 lines)
    - Remove all imports of ImageDrop component
  - [ ] 3.2 Remove ImageDropNode custom TipTap node
    - Delete `/app/components/editor/tiptap/ImageDropNode.ts` (137 lines)
    - Remove ImageDropNode from TipTap extensions array in Editor.tsx
    - Remove TypeScript declaration for imageDrop commands
  - [ ] 3.3 Remove upload queue system
    - Delete `/app/components/editor/uploadQueue.ts` (12 lines)
    - Remove all imports of enqueueDroppedFile and dequeueDroppedFile
  - [ ] 3.4 Remove react-dropzone dependency
    - Run: npm uninstall react-dropzone
    - Verify no other components use react-dropzone
    - Update package-lock.json
  - [ ] 3.5 Verify editor still functions after cleanup
    - Manual test: click toolbar image button → file dialog opens
    - Manual test: drag image into editor → uploads at drop position
    - Manual test: keyboard navigation still works
    - Check for any console errors or warnings

**Acceptance Criteria:**
- All legacy files deleted (ImageDrop.tsx, ImageDrop.module.css, ImageDropNode.ts, uploadQueue.ts)
- react-dropzone dependency removed from package.json
- No broken imports or TypeScript errors
- Editor functions normally with new simplified approach
- Net code reduction of 300+ lines achieved

### Testing and Verification

#### Task Group 4: Integration Testing and Accessibility Verification
**Assigned implementer:** testing-engineer
**Dependencies:** Task Groups 1-3

- [ ] 4.0 Review and fill critical test gaps
  - [ ] 4.1 Review tests from Task Groups 1-2
    - Review the 2-8 tests written by ui-designer for upload hook (Task 1.1)
    - Review the 2-8 tests written by ui-designer for editor integration (Task 2.1)
    - Total existing tests: approximately 4-16 tests
  - [ ] 4.2 Analyze test coverage gaps for THIS feature only
    - Identify critical workflows lacking coverage: end-to-end upload flow, concurrent upload scenarios, permission edge cases
    - Focus ONLY on gaps related to image upload simplification
    - Do NOT assess entire editor test coverage
    - Prioritize integration tests over unit test gaps
  - [ ] 4.3 Write up to 10 additional strategic tests maximum
    - Add maximum of 10 new integration tests to fill critical gaps
    - Test end-to-end workflows: toolbar click → file selection → upload → image appears
    - Test drag-drop workflow: drag image → drops at cursor → upload → image appears
    - Test error scenarios: upload failure, permission denied, network timeout
    - Test edge cases: rapid successive uploads, upload during concurrent edits, invalid file types
    - Test accessibility: keyboard-only navigation, screen reader announcements
    - Do NOT write exhaustive coverage for all scenarios
    - Skip performance tests, load tests, and stress tests
  - [ ] 4.4 Run feature-specific tests only
    - Run ONLY tests related to image upload feature (tests from 1.1, 2.1, and 4.3)
    - Expected total: approximately 14-26 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass
  - [ ] 4.5 Perform accessibility verification
    - Test keyboard-only navigation: tab to image button, press enter, file dialog opens
    - Test with screen reader: verify upload progress announcements
    - Verify focus management: focus returns to editor after upload
    - Test on mobile: touch interaction works for file selection
    - Document any accessibility issues found

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 14-26 tests total)
- No more than 10 additional tests added by testing-engineer
- Critical user workflows covered: toolbar click upload, drag-drop upload, error handling
- Accessibility verified: keyboard navigation, screen reader support, focus management
- Testing focused exclusively on image upload simplification feature

## Execution Order

Recommended implementation sequence:
1. Core Upload Hook (Task Group 1) - Build reusable foundation
2. Editor Integration (Task Group 2) - Wire up new system
3. Code Cleanup and Removal (Task Group 3) - Remove legacy code
4. Testing and Verification (Task Group 4) - Ensure quality and accessibility

## Key Technical Decisions

### Why This Order?
1. **Hook First**: Build the reusable upload logic in isolation, making it testable and future-proof for other upload scenarios (e.g., avatar uploads)
2. **Integration Second**: Wire the hook into the editor once it's stable, using TipTap's built-in Image extension
3. **Cleanup Third**: Only remove legacy code after new system is working, enabling safe rollback if issues arise
4. **Testing Last**: Comprehensive testing after implementation to catch integration issues and verify accessibility

### Reusability Strategy
The `useImageUpload` hook is intentionally designed to be:
- Editor-agnostic (can be used outside TipTap context)
- Position-flexible (accepts optional position parameter)
- Context-aware (uses existing Convex mutations and permission checks)
- Ready for future use cases (avatar uploads, profile images, etc.)

### Loading State Rationale
Using data URL (Option C) provides:
- Immediate visual feedback (no loading spinner delay)
- Actual preview of uploaded image
- Seamless transition when Convex URL loads
- Better user experience than placeholder icons

### Migration Safety
This approach enables safe migration:
1. New system built alongside old (Task Groups 1-2)
2. Old system removed only after new system verified (Task Group 3)
3. Comprehensive testing ensures no regressions (Task Group 4)
4. Manual testing checkpoints at each stage

## Success Metrics
- Net reduction: 300+ lines of code removed
- Dependencies removed: 1 (react-dropzone)
- Files removed: 4 (ImageDrop.tsx, ImageDrop.module.css, ImageDropNode.ts, uploadQueue.ts)
- New files added: 1 (useImageUpload.ts hook)
- Test coverage: 14-26 focused tests for critical workflows
- Accessibility: Keyboard navigation and screen reader support maintained
- Performance: No regression in upload speed or editor responsiveness
