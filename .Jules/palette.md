## 2025-05-14 - [Aria Labels and Form Associations]
**Learning:** Accessibility in form controls and icon-only buttons is crucial for screen reader users. Native `window.confirm` is a simple and effective way to prevent accidental data loss in destructive actions.
**Action:** Always ensure `<label>` elements have `htmlFor` attributes matching the `id` of their respective form controls. Add `aria-label` to buttons that only contain icons or emojis.
