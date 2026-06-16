## 2025-05-15 - [Accessible Semantic Components]
**Learning:** Converting informational text components that trigger actions (like file paths or interactive labels) into semantic `<button>` elements with `focus-visible` styles and descriptive `aria-label`s significantly improves keyboard and screen reader accessibility without breaking the visual layout.
**Action:** Always prefer `<button>` or `<a>` for interactive elements instead of `<div>` or `<p>` with `onClick`. Ensure these buttons have proper labels that describe the action and the value.

## 2025-05-15 - [Numeric Input Resets]
**Learning:** Native HTML range inputs (`type="range"`) cannot represent a `null` or "unset" state. Providing a separate "Clear" button is a necessary UX pattern to allow users to remove values like personal ratings.
**Action:** When using range inputs for optional values, include a clear button (e.g., `✕ {t('clear')}`) that resets the state to `null`.
