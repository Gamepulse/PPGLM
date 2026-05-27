## 2026-05-27 - [Personal Rating Nullability]
**Learning:** HTML5 range inputs cannot natively represent a `null` or "unset" state once a value is assigned. This makes it impossible for users to "un-rate" a game once they've touched the slider.
**Action:** Always provide a clear, accessible "Clear" or "Reset" button (e.g., a small ✕) next to range inputs that correspond to nullable database fields to ensure full user control over their data.

## 2026-05-27 - [Strict Build Constraints]
**Learning:** This project uses strict TypeScript linting in its production build (`pnpm build`), where unused variables or state declarations (e.g., `hasIgdbId`) cause build failures.
**Action:** Always run `pnpm build` before submitting to identify and remove unused code that might have been left over during development.
