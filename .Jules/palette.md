## 2026-06-10 - [Semantic Button Conversion & Rating UX]
**Learning:** Converting interactive elements like folder paths from `<p>` to semantic `<button type="button">` significantly improves keyboard accessibility without altering the visual design. Providing a clear way to reset numeric values (like personal ratings) via a "Clear" button handles the `null` state which native range inputs cannot represent.
**Action:** Always prefer `<button type="button">` for custom interactive elements and ensure all numeric inputs have a "Clear" or "Reset" mechanism if the value is optional.
