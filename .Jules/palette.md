## 2025-05-14 - [A11y: Semantic Buttons and Focus States]
**Learning:** Using semantic `<button type="button">` instead of `<span role="button">` provides native keyboard support (Enter/Space) and better screen reader integration. Adding `focus-visible:ring-2` ensures keyboard navigability is visible.
**Action:** Always prefer `<button>` for interactive elements. Ensure absolute-positioned interactive elements (like badges on cards) have a sufficient `z-index` (e.g., `z-10`) to remain clickable above images.

## 2025-05-14 - [Build: Strict TypeScript Checks]
**Learning:** The project's production build (`pnpm build`) includes strict TypeScript linting that fails on unused variables or state.
**Action:** Always run `pnpm build` and `tsc` before submitting to catch unused declarations that might have been left during development or refactoring.
