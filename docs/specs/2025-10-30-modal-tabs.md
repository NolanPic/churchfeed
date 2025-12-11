# Modal tabs

**IMPORTANT: To implement this spec, please follow the instructions in @docs/specs/spec-instructions.md**

---

We need to add tabs for the `<Modal>` component.

## Requirements:

1. Should be rendered via a `tabs` prop on the `Modal` component.
2. Should be able to define multiple tabs and the components that those tabs render.
3. Should work well with Nextjs app router.
   - For example, when using this for CRUD, we should be able to open a tab that correlates to `/admin/feeds/{$feedId}. This is not necessarily something the `Modal` component needs to "handle", but it should be designed in such a way that this can work really well.
4. Should render at the top of the modal and there should be an `.active` class on the active tab.
5. Use industry standard for tabs and accessibility.

## Part 1: Implement tabs feature

Implement the requirements above.

### Questions

1. **Tab Structure**: What should the `tabs` prop structure look like? I'm thinking something like:

   ```tsx
   tabs={[
     { id: 'general', label: 'General', content: <GeneralForm /> },
     { id: 'settings', label: 'Settings', content: <SettingsForm /> }
   ]}
   ```

   Is this the right approach, or would you prefer a different structure?
   **Answer**: Yes, this looks good.

2. **Active Tab Management**: Should the Modal component manage the active tab state internally, or should it be controlled from the parent (i.e., should there be `activeTabId` and `onTabChange` props)? For Next.js routing integration, I'm thinking controlled would be better.
   **Answer**: It should be controlled from the parent.

3. **Children vs Tabs**: When the `tabs` prop is provided, should the `children` prop be ignored? Or should we support both simultaneously (tabs at the top, children below)?
   **Answer**: The `children` prop should be ignored.

4. **Tab Rendering Position**: You mentioned "Should render at the top of the modal" - should this be:
   - Above the title and separator?
   - Below the title/separator but above the children?
   - Replace the title entirely?
     **Answer**: Under the title but above children.

5. **Accessibility**: For tab accessibility, should I implement the standard ARIA tabs pattern with:
   - `role="tablist"`, `role="tab"`, `role="tabpanel"`
   - Arrow key navigation between tabs
   - Home/End key support
   - Focus management
     **Answer**: Yes

6. **Visual Design**:
   - Should tabs have any specific styling requirements (underline, background change, etc.)?
   - Should the `.active` class be the only styling, or should there be default active styles too?
   - Any specific spacing/padding requirements for the tabs area?
     **Answer**: I have included a screenshot of what it should look like in docs/specs/assets/modal-with-tabs.png. Please don't worry about rendering the title, just the tabs.

7. **Mobile Behavior**: Should tabs behave differently on mobile vs tablet/desktop? (e.g., scrollable horizontal tabs on mobile?)
   **Answer**: Tabs should have horizontal scroll and a "fade" on either side

8. **Next.js Integration**: For the CRUD example you mentioned (`/admin/feeds/{$feedId}`), should the Modal component handle URL synchronization, or should that be the parent component's responsibility? I'm thinking the parent should handle routing and just pass the active tab to Modal.
   **Answer**: Yes, the parent should handle routing.

## Part 2: Add to storybook

Add modals with tabs to storybook.
