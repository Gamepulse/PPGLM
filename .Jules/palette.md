## 2024-05-22 - [Emoji Accessibility in Icon Buttons]
**Learning:** Icon-only buttons using text emojis as icons require specific accessibility treatment to be screen-reader friendly and avoid redundant announcements.
**Action:** Always add an `aria-label` to the `<button>` and wrap the emoji in `<span aria-hidden="true">` to hide the raw character from assistive technologies.

## 2024-05-22 - [Safe Destructive Actions]
**Learning:** Destructive actions like game deletion were missing confirmation, leading to potential accidental data loss.
**Action:** Implement `window.confirm` with localized strings for all destructive actions to provide a safety net for users.
