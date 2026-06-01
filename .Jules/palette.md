## 2026-06-01 - [Accessibility Anti-pattern: Nested Interactive Elements]
**Learning:** Adding 'role=button' and 'tabIndex=0' to a container that already contains interactive elements (like buttons or tags) creates a confusing experience for screen reader users and can easily break mouse interactions if not handled with extreme care.
**Action:** Prefer keeping card containers purely stylistic or use 'focus-within' styles if child elements need to be highlighted. If a card must be interactive, ensure child elements are handled via event delegation or that the card's click handler explicitly ignores clicks originating from its interactive children.

## 2026-06-01 - [Strict Build Constraints]
**Learning:** The project uses strict TypeScript linting (TSC) in the production build which fails on unused variables.
**Action:** Always run 'pnpm build' before submitting to catch 'declared but never read' errors that don't appear in the dev server.
