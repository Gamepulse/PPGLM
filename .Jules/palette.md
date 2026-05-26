## 2025-05-14 - [Rating Reset Pattern]
**Learning:** HTML range inputs cannot represent a `null` state once interacted with. Providing a dedicated "Clear" button next to the slider is a necessary UX pattern for optional numeric fields to allow users to unset their selection.
**Action:** Always include a reset/clear mechanism for range-based inputs or other selection elements that lack a native "none" state.

## 2025-05-14 - [Semantic Buttons for Interaction]
**Learning:** Using `<span>` with `role="button"` requires manual handling of keyboard events (Enter/Space) and tab indexing. Switching to semantic `<button type="button">` elements provides these features natively and improves reliability for assistive technologies.
**Action:** Prefer semantic `<button>` elements over `role="button"` on non-interactive elements whenever possible.
