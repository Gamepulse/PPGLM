## 2025-05-14 - [Clear Button for Range Inputs]
**Learning:** Since native HTML range inputs (`type="range"`) cannot represent a `null` or "unset" state, a separate interactive element is required to allow users to clear numeric values (like personal ratings) once they have been set.
**Action:** Always provide a 'Clear' or 'Reset' button next to range inputs if the underlying data field is nullable, ensuring it is accessible with proper ARIA labels and focus states.
