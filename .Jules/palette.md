## 2025-05-13 - Improved Game Detail Accessibility and UX

**Learning:** Interactive elements nested in complex headers (like game detail pages) often lack proper accessibility attributes and focus indicators, making them difficult for keyboard and screen reader users to navigate. Specifically, range inputs for ratings lack a way to reset to a null state, and labels are frequently not associated with their controls.

**Action:**
1. Use `htmlFor` and unique `id`s to associate labels with form controls.
2. Provide a "Clear" button for range inputs that represent optional numeric values.
3. Apply `focus-visible:ring-2` and `outline-none` to ensure keyboard focus states are clear and consistent with the design system.
4. Convert purely stylistic or informational elements that are actually interactive (like file paths) into proper semantic `<button>` elements.
5. Use `aria-hidden="true"` for decorative text and boundary markers to reduce screen reader noise.
