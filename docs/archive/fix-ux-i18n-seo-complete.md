# Task: Fix UX, i18n, SEO Layout and Redesign Details (Complete)

## Context
User reported multiple functional, UI/UX, layout, and translation defects in `index.html`, along with additional styling and document requirements. Current version has regressions from previous incomplete fixes.

## Detailed Requirements

### Bug Fixes & UX Adjustments

1. **Free / Pro Switcher - Clear Console Instructions for Manual Test**:
   - **Free version (default)**: Open `index.html`, ensure `localStorage.localjson_pro_status` is NOT set (or is `null`).
   - **Pro version test**: In browser DevTools Console (F12 → Console tab), run:
     ```js
     localStorage.setItem('localjson_pro_status', 'activated');
     location.reload();
     ```
     Page reloads with green `★ Pro Active` button.
   - **Reset to Free**: In Console, run:
     ```js
     localStorage.removeItem('localjson_pro_status');
     location.reload();
     ```
   - Document these steps in `START-HERE.md` for future QA.

2. **Instant Language Switcher (No M2. **Instant Language Switcher (No M2. **Instant Language Switcer DOM via `applyLang()` and update URL (`?lang=es` / `?lang=en`) using `history.replaceState()` — **no `location.reload()`**.
   - Verify: click ES button → page content changes instantly, URL updates, no flash of English.

3. **Pro Active Button — No Amber Flash on Load**:
   - Fix initialization race: `checkProStatus()` must run **synchronously** (or before first paint) so button renders correct color immediately.
   - If `localStorage.localjson_pro_status === 'activated'` → green `★ Pro Active` from frame 1.
   - If not → amber Pro button from frame 1.   - If not → amber Pro button from frame 1.   - If not → on Wide Screens**:
   - Subtitle (`header-subtitle`) must stay on one line on desktop (`white-space: nowrap` or container max-width control).
   - Wrap only on narrow/mobile (`max-width: 640px`).

5. **Remove Auto-Load Sample JSON from Textarea**:
   - Delete the `window.addEventListener('load')` block that injects Alex Rivera / Elena Rostova JSON into `#inp`.
   - Textarea must be **empty** on load with only translated placeholder (`inp-placeholder` key).

6. **SEO Grid Layout — Three Allowed States (Strict)*6. **SEO Grid Layout — Three Allowed States (Strict)*6. **SEO Grid Layout — Three Allws (`repeat6. **SEO Grid Layout — Three Allowed States (Stri × 2 rows (`repeat(2, 1fr)`).
   - **Mobile ≤767px**: 1 column × 4 rows (`1fr`).
   - **FORBIDDEN**: 3-column layout at ANY viewport width.
   - Applies to both "How It Works" and "Use Cases" sections.

7. **Pricing Table — Full Spanish Translation**:
   - Translate "License Type" row (currently hardcoded English at line 592) → use `data-i18n="pf8"` with ES key `"Tipo de Licencia"`.
   - Translate "Free Forever" / "Lifetime ($5)" cells → keys `free-label` / `pro-label` in ES.
   - Ensure all feature rows (`pf1`–`pf7`) have ES translations.

8. **Footer Links — Full Spanish Translation**:
   - Footer anchor texts (Home, How It Works, Use Cases, FAQ, Pricing, Offline Version, Pro Docs) must switch language via `data-i18n` keys.
   - Add ES translations for all footer link labels in `I18N.es`.

9. **Header Buttons Responsive Wrapping**:
   - On small mobile (`max-width: 480px` or similar), header buttons must wrap to new lines without horizontal overflow.
   - EN/ES language switcher pair must **stay together** (never split across lines).
   - Pro button can wrap separately.

10. **100% Spanish Modal — Zero English Leakage**:
    - Modal content keys: `modal-title`, `modal-desc`, `license-placeholder`, `activate-btn`, feature list items (`pf5`–`pf7`), `price-title`, `price-sub`, `buy-btn`.
    - **All** must exist in `I18N.es` and differ from `I18N.en`.
    - Feature list in modal (currently hardcoded English bullets) must use translated keys.
    - Price box text (`Lifetime License`, `Pay once, use forever`) must use i18n keys.
    - Buy but    - Buy but    - Buytivation Key`) must use i18n key.

### Additional Features & Styling

11. **Bilingual Documentation — Two Static Files**:
    - Create **two separate static HTML files** (no language toggle inside):
      - `LocalJSON_Pro_Documentatio      - `LocalJSON_Pro_Documentatio    sion
      - `LocalJSON_Pro_Documentation_and_License_Key_es.html` — Spanish version
    - Each file is self-contained with hardcoded content in its language.
    - Include the **single shared license key** (generated once, used across all LocalJSON products).
    - Document: "Each product has its     - Document: "Each product has its     - Document: "Each product has its     - Document: "Each product has its     - Document: "Each product has its     - Do Spanish checkout (future task).

12. **Record Future Task — Spanish Payment Link**:
    - Add note/task: "Update Lava checkout link for Spanish version when Spanish license page is ready (separate task)."

13. **Centered Section Titles (SEO Sections 1, 2, 3)**:
    - "How It Works" (`#how-it-works`), "Use Cases" (`#use-cases`), "FAQ" (`#faq`) — headings and subheadings must be `text-align: center`.

14. **How It Works — Step Numbers 3× Larger**:
    - Step number badges ("1", "2", "3", "4") in first SEO section: increase `font-size` to ~300% of current.

15. **How It Works — Remove All Card Decorations**:
    - Remove `background`, `border`, `box-shadow`, and **internal borders** between step elements from `.step-card` (or equivalent) in "How It Works".
    - Cards become plain text/icon layouts.

16. **FAQ — Subtle Question Mark Watermarks**:
    - Each FAQ item (`.faq-item` or similar) gets a large `?` watermark on the right edge.
    - Size: height ≈ full text area (heading + 2 lines body).
    - Color: `rgba(bg-color-r, bg-color-g, bg-color-b, 0.05)` — barely visible, slightly lighter than background.
    - Position: absolute, right: 16px, top: 50%, transform: translateY(-50%), pointer-events: none.

## Acceptance
```bash
node acceptance/final-polish-check.mjs index.html && node acceptance/seo-check.mjs index.html && node acceptance/i18n-check.mjs index.html
```

All three must pass. Manual verification checklist included in task description.

## Files to Modify
- `/Users/moore/my work/localjson/index.html`
- `/Users/moore/my work/localjson/acceptance/final-polish-check.mjs` (update checks for new requirements)
- `/Users/moore/my work/localjson/LocalJSON_Pro_Documentation_and_License_Key.html` (English static)
- `/Users/moore/my work/localjson/Loca- `/Users/Documentation_and_License_Key_es.html` (Spanish static)
- `/Users/moore/my work/localjson/tasks/fix-ux-i18n-seo-complete.md` (this file)

## Queue Entry
```
/Users/moore/my work/localjson;/Users/moore/my work/localjson/tasks/fix-ux-i18n-seo-complete.md;plexus-act
```
