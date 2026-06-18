## 2025-05-15 - Enhance Rating UI and Detail Header Accessibility
**Learning:** Native HTML range inputs do not support a "null" or "unset" state, making it difficult for users to remove a value once set. Additionally, interactive elements like folder paths are often implemented as styled text but should be semantic buttons for accessibility.
**Action:** Always provide a "Clear" button for range inputs to allow unsetting values, and convert interactive text into semantic `<button>` elements with appropriate ARIA labels and focus states.
