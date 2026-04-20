# Palette's UX Journal

This journal tracks critical UX and accessibility learnings for the Pascal project.

## 2025-05-14 - Form Accessibility and Interaction Safety

**Learning:** This app frequently uses interactive forms without proper label/input associations and icon-only buttons without ARIA labels. Additionally, destructive actions like deleting a game lacked a confirmation step, risking accidental data loss.

**Action:**
- Always use `htmlFor` on `<label>` and matching `id` on form inputs (inputs, selects, textareas).
- Suffix IDs with an entity ID (e.g., `${game.id}`) to ensure uniqueness when multiple items are rendered.
- Ensure all icon-only buttons have an `aria-label` that matches their `title`.
- Wrap destructive actions in `window.confirm()` using existing i18n keys like `confirmDelete`.
- Use `aria-hidden="true"` on decorative markers (like range slider min/max values) to reduce screen reader noise.
