## 2025-05-15 - [Accessible Personal Ratings]
**Learning:** Range sliders for 0-100 ratings often lack a way to represent a 'null' or 'unset' state. Providing an explicit "Clear" button with proper ARIA labeling improves both UX and accessibility. Additionally, marking min/max text labels as `aria-hidden` prevents redundant screen reader announcements.
**Action:** Always provide a way to unset numeric values that use range inputs, and ensure icon-only clear buttons have localized `aria-label` and `title`.
