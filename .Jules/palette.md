## 2025-05-14 - [GameCard Accessibility & Interaction]
**Learning:** When adding `role="button"` to a container that uses `target.closest('[role="button"]')` to prevent navigation when clicking interactive children, the check must be updated to exclude the container itself (e.g., `interactiveChild && interactiveChild !== e.currentTarget`).
**Action:** Always verify that adding accessibility roles to containers doesn't break existing event delegation or "click-blocking" logic.
