## 2025-05-15 - Accessibility for custom interactive elements
**Learning:** In Pascal, many interactive elements are implemented using `span` with `role="button"` for styling flexibility. These elements are not keyboard-accessible by default and lack focus indicators.
**Action:** Always add `tabIndex={0}`, an `onKeyDown` handler (supporting 'Enter' and ' '), and `focus-visible` ring styles to any `span` or `div` used as a button. For consistency, use `focus-visible:ring-indigo-600` (or `focus-visible:ring-white` on dark backgrounds).
