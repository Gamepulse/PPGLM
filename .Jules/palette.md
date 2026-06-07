## 2025-05-15 - Improving Game Detail Accessibility and Rating UX

**Learning:** Form controls (selects, range inputs, textareas) require explicit label association via `htmlFor` and unique IDs to be accessible. Native HTML range inputs cannot represent a `null` state, so providing a separate "Clear" button is essential for allowing users to unset values like personal ratings. Additionally, converting clickable text elements (like folder paths) into semantic `<button>` elements provides native keyboard support and better screen reader identification.

**Action:** Always associate labels with form controls using unique IDs (suffixed with entity ID if possible). For range inputs or other controls that don't support null, include a "Clear" action. Ensure icon-only buttons have both `aria-label` and `title` attributes.
