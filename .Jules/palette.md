## 2025-05-15 - [UX Pattern: Range Input Null State]
**Learning:** Native HTML range inputs (`<input type="range">`) cannot represent a `null` or "unset" state as they always default to a value (usually the minimum).
**Action:** Provide a separate "Clear" or "Reset" button next to numeric range controls to allow users to explicitly unset the value.

## 2025-05-15 - [Accessibility: Icon-only Buttons]
**Learning:** Icon-only buttons containing text emojis (e.g., ✕) can be confusing for screen readers if the emoji is not hidden and a proper label is not provided.
**Action:** Wrap text emojis in `<span aria-hidden="true">` and provide both `aria-label` and `title` attributes on the parent button.
