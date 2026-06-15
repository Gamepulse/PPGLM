## 2025-05-14 - [Rating UI and Semantic Buttons]
**Learning:** Native HTML range inputs cannot represent a `null` state, making a separate 'Clear' button necessary for optional numeric values. Also, informational text that triggers an action (like a folder path opening a file explorer) must be implemented as a semantic `<button>` rather than a `<p>` or `<span>` to ensure keyboard accessibility.
**Action:** Always provide a 'Clear' button for optional sliders and convert interactive text elements into semantic buttons with `focus-visible` styles and descriptive `aria-label`s.
