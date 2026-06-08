## 2025-05-15 - [Personal Rating UX Improvement]
**Learning:** Native HTML range inputs cannot represent a `null` state once interacted with. Providing a separate 'Clear' button is essential for allowing users to unset numeric values. Additionally, marking range bounds as `aria-hidden="true"` reduces screen reader noise when the input itself is properly labeled.
**Action:** Always provide a clear/reset mechanism for optional numeric inputs and ensure proper ARIA labeling for range controls.
