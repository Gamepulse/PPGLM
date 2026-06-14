## 2025-05-14 - [Clear Rating and Range Accessibility]
**Learning:** HTML range inputs cannot naturally represent a `null` or "unset" state, which can be frustrating for users wanting to remove a rating. Additionally, range inputs require explicit ID-to-label associations and hiding of decorative bounds (like '0' and '100' text) to be fully accessible.
**Action:** Always provide a 'Clear' button next to range inputs that handle nullable data, and ensure strict ARIA labeling with unique IDs for all form controls.
