## 2025-05-15 - [Destructive Action Confirmation]
**Learning:** All destructive actions (like game deletion) must have a confirmation step. The app uses `window.confirm` with `useI18n` keys for this.
**Action:** Always wrap delete/reset logic in a confirmation check using existing or new translation keys.

## 2025-05-15 - [Build Constraint: Unused Variables]
**Learning:** The project's production build (`pnpm build`) includes strict TypeScript linting; unused variables or state declarations will cause build failures.
**Action:** Ensure all new state or variables introduced for UX features (like loading states or modal visibility) are used, or removed if they become redundant.
