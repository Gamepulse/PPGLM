
## 2024-04-24 - Accessibility and Destructive Actions
**Learning:** Reusable interactive elements like spans or divs with `role="button"` must always include `tabIndex={0}` and an `onKeyDown` handler for 'Enter' and 'Space' to be keyboard accessible. Additionally, destructive actions (like game deletion) must have a confirmation step to prevent accidental data loss, which is a core UX pattern in this app.
**Action:** Always verify keyboard focus and interactions when adding `role="button"` and ensure `window.confirm` is used for all delete or reset actions.
