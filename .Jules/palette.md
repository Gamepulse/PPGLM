## 2025-05-15 - [Delete Confirmation & Build Strictness]
**Learning:** Destructive actions like deleting a game from the library should always have a confirmation dialog to prevent accidental data loss. Additionally, the project's production build (`pnpm build`) includes strict TypeScript linting that blocks on unused variables, making cleanup mandatory for a successful build.
**Action:** Always implement `window.confirm` for delete buttons and ensure all unused variables are removed before attempting to build/submit.
