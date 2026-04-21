# 🎨 Palette's Journal - UX & Accessibility Learnings

## 2025-05-14 - [Accessibility] Keyboard Support for Pseudo-Buttons
**Learning:** Interactive elements using `role="button"` (such as spans or divs for tags or badges) are invisible to keyboard users unless they have `tabIndex={0}` and an explicit `onKeyDown` handler. In this app, many tags and badges were only clickable with a mouse.
**Action:** Always pair `role="button"` with `tabIndex={0}`, `onKeyDown` (supporting 'Enter' and ' '), and visible focus styles (`focus-visible`).
