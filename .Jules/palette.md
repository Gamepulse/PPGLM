## 2025-05-14 - Unsetting Personal Ratings & Emoji Accessibility
**Learning:** Native HTML range inputs cannot represent a null state. To allow users to "unset" a value (like a 1-100 rating), a separate 'Clear' action must be provided. Additionally, decorative emojis in interactive elements cause screen reader noise and should be wrapped in aria-hidden spans.
**Action:** Always provide a 'Clear' button for range-based settings that can be null. Wrap decorative emojis in <span aria-hidden="true"> across the application.

## 2025-05-14 - Card Component Keyboard Visibility
**Learning:** For complex card components with nested interactive elements (tags, buttons), using focus-within:ring-2 on the container provides critical visual feedback for keyboard users.
**Action:** Implement focus-within styles on all card-like containers to improve discoverability during tab navigation.
