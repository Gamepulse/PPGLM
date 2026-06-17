## 2025-05-14 - Optional Range Inputs and "Clear" state
**Learning:** Native HTML range inputs always have a value and cannot represent a `null` or "not set" state. For optional ratings or numeric settings, users need an explicit way to unset the value.
**Action:** When using range inputs for optional values, include a "Clear" or "Remove" button (with appropriate ARIA label) that appears when a value is set.
