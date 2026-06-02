## 2025-05-15 - [Accessibility & Rating UX]
**Learning:** When using `role="button"` on a container (like a Card) that has nested interactive elements, a standard `target.closest('[role="button"]')` check in the `onClick` handler will also match the container itself, blocking navigation.
**Action:** Use `target.closest('button, a, [role="button"]')` and verify that the result is not `e.currentTarget` to differentiate between a click on the card and a click on a nested control.

**Learning:** Visual labels for range inputs (like '0' and '100' marks) are redundant for screen readers when the input is properly labeled via `htmlFor`.
**Action:** Wrap such decorative boundary labels in `<span aria-hidden="true">`.

**Learning:** Native HTML range inputs cannot be easily reset to a 'null' or 'unset' state by the user.
**Action:** Provide a explicit "Clear" or "Reset" button (e.g., a small '✕' button) to allow users to remove a numeric rating.
