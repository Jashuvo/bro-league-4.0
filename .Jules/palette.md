## 2024-05-22 - [Accessibility & Keyboard Navigation Enhancements]
**Learning:** In data-heavy dashboards, interactive rows often use <div> for styling flexibility, which excludes keyboard users. Adding role="button" and tabIndex={0} with keydown listeners (Enter/Space) effectively bridges this accessibility gap without requiring a layout refactor.
**Action:** Always verify that interactive elements use semantic <button> or <a> tags, or have appropriate ARIA roles and keyboard support if custom elements are used.
