# Palette's Journal - Critical UX/Accessibility Learnings

## 2025-05-14 - Initial Setup
**Learning:** Started looking into Pascal (PPGLM).
**Action:** Identified accessibility gaps in `GameDetailHeader.tsx` including missing `htmlFor` associations and non-semantic interactive elements.

## 2025-05-14 - Build and Verification Nuances
**Learning:** The project's production build (`pnpm build`) includes strict TypeScript linting via `tsc`; unused variables or state declarations (like `hasIgdbId`) will cause build failures and must be removed before submission.
**Action:** Ensure all unused variables are cleaned up before calling it done.

**Learning:** Visual verification of this Tauri app using Playwright requires mocking the Tauri invoke system (`window.__TAURI_INTERNALS__.invoke`) to prevent React components from failing when they attempt to fetch data on mount.
**Action:** Use a robust mock script for Playwright when visual verification is required.
