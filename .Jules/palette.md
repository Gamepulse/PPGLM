## 2025-05-15 - [Keyboard Accessibility & Safety Improvements]
**Learning:** Adding `tabIndex={0}` and `onKeyDown` handlers to custom interactive elements (like spans with `role="button"`) is critical for keyboard accessibility in this app. Also, the build system (`pnpm build`) is very strict about unused variables, so they must be removed to avoid deployment failures.
**Action:** Always include `tabIndex` and `onKeyDown` when using `role="button"`. Ensure every destructive action has a `window.confirm` with an i18n key. Check for unused state/variables before finalizing.
