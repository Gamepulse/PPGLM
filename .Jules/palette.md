# Palette's Journal - UX & Accessibility Learnings

## 2025-05-15 - Semantic Buttons vs role="button"
**Learning:** Using semantic `<button type="button">` instead of `<span role="button">` simplifies accessibility by providing native keyboard support (Enter/Space) and avoids custom `tabIndex` or `onKeyDown` logic.
**Action:** Always prefer `<button>` for interactive elements. If styling is difficult, reset button styles rather than using a `span`.

## 2025-05-15 - Interactive Elements on Cards
**Learning:** Absolute-positioned interactive elements (like status badges) inside a clickable card require a defined z-index (e.g., `z-10`) and event propagation stopping (`e.stopPropagation()`) to remain interactive and not trigger the card's main action.
**Action:** Ensure nested buttons have higher z-index than the card background and call `stopPropagation` on click.
