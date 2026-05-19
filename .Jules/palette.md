## 2025-05-14 - [Clearable Range Inputs]
**Learning:** Native HTML range inputs cannot represent a null state once a value has been interacted with. For features like personal ratings where "not rated" is a valid state, a separate "Clear" or "Reset" button is necessary for a complete UX.
**Action:** Always provide a clear button for numeric inputs that should allow a null/unset state.

## 2025-05-14 - [Decorative Branding Accessibility]
**Learning:** Stylized branding overlays (like SVG text masks) often contain text that is redundant or confusing for screen readers if not properly hidden.
**Action:** Mark purely decorative branding elements with `aria-hidden="true"` to reduce screen reader noise.
