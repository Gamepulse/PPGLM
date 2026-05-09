## 2025-05-14 - [Form Accessibility & Deletion Safety]
**Learning:** In a complex SPA like Pascal, ensuring form controls have unique IDs (using entity IDs as suffixes) is critical for accessibility when navigating between detail views. Additionally, adding simple `window.confirm` checks to destructive actions like game deletion is a high-impact, low-effort micro-UX improvement that prevents accidental data loss.
**Action:** Always verify that every input/select/textarea has a corresponding `<label htmlFor="...">` with a unique ID, and always wrap destructive actions in a confirmation dialog.
