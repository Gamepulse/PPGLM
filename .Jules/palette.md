## 2025-05-22 - [Interactive Elements and Keyboard Navigation]
**Learning:** Using `span role="button"` requires manual `tabIndex` and keyboard event handlers (Enter/Space) to be accessible. It's often better to use a semantic `button` element when possible. For complex interactive containers like cards, they should be focusable and trigger their primary action on Enter/Space.
**Action:** Replace `span role="button"` with `button` for simple elements. Add `tabIndex={0}` and `onKeyDown` handlers to card containers.
