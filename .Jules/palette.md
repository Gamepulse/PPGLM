# Palette's UX Journal

This journal contains critical UX and accessibility learnings for the Pascal project.

## 2025-04-29 - [Confirmation for Destructive Actions]
**Learning:** All destructive actions in the app (like deleting games or resetting the database) should follow a consistent confirmation pattern to prevent accidental data loss. Using `window.confirm` with localized strings is the established lightweight pattern in this codebase.
**Action:** Always wrap delete/reset operations in a confirmation check using the appropriate `t('confirm...')` key.
