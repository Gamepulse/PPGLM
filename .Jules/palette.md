## 2025-04-17 - [Accessibility Foundation Sweep]
**Learning:** In a custom UI like Pascal, many interactive elements (tags, badges, icon-only buttons) were initially inaccessible to keyboard and screen reader users. Decorative icons/emojis without `aria-hidden` created noise, while interactive spans without `tabIndex` and `onKeyDown` were unreachable via keyboard.
**Action:** 1. Mark all decorative icons/emojis with `aria-hidden="true"`. 2. Ensure every icon-only button has both `title` and `aria-label`. 3. Add `tabIndex={0}` and handle `Enter`/`Space` on all elements using `role="button"`.
