## 2025-05-14 - [Semantic HTML for Badges and Tags]
**Learning:** Using `<span>` with `role="button"` for interactive elements like tags or status badges is an accessibility anti-pattern. Semantic `<button type="button">` should be preferred as it provides native keyboard support (Enter/Space) and better screen reader interaction without custom event handlers.
**Action:** Always use `<button type="button">` for interactive small elements, and ensure they have appropriate `aria-label` when the text content alone isn't descriptive enough (e.g., adding "Status: " prefix).

## 2025-05-14 - [Null state in Range Inputs]
**Learning:** Native HTML range inputs (`<input type="range">`) cannot represent a `null` or "unset" state once a value is selected. This creates a UX barrier for features like personal ratings where a user might want to remove their rating entirely.
**Action:** Provide a separate "Clear" or "Unset" button adjacent to the range input to allow users to reset the value to `null`.

## 2025-05-14 - [Translation Key Parity]
**Learning:** The custom i18n system in this app uses a single TypeScript object for all languages. Missing a key in one language but having it in another will cause type errors during the build process (`tsc`).
**Action:** When adding new UX strings, always update both English and French translation objects simultaneously in `src/i18n/translations.ts`.
