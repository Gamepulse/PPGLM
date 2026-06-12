## 2025-05-15 - [Clear Button for Numeric Inputs]
**Learning:** Since native HTML range inputs cannot represent a `null` state, providing a separate 'Clear' or 'Remove' button allows users to unset numeric values like personal ratings, improving UX flexibility.
**Action:** Always provide a 'Clear' action next to range inputs or sliders when the underlying data model supports an unassigned or null state.

## 2025-05-15 - [Accessibility for Range Inputs]
**Learning:** Visual labels representing the min/max bounds of a range input (e.g., '0' and '100' text) should be marked `aria-hidden="true"` to prevent redundant announcements by screen readers when the input itself is labeled.
**Action:** Use `aria-hidden="true"` for decorative or redundant range bounds and ensure the input has a descriptive `aria-label`.
