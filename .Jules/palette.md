## 2025-05-14 - [Range Input Clear Action]
**Learning:** Native HTML range inputs cannot represent a `null` or "unset" state once a value has been selected. For user-provided ratings where `null` is a valid "not rated" state, providing a separate localized "Clear" button improves UX by allowing users to undo a rating without choosing an arbitrary low/default value.
**Action:** Always provide a clear/reset action next to range inputs if the underlying data model supports an optional or null state.
