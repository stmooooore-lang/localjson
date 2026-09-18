# Task: Add Spanish Localization with Redesigned Language Switcher

## Context
Refactor the existing i18n implementation to:
- Use a clean, non-duplicative approach (no repeated sections in HTML)
- Add a redesigned language switcher (outlined buttons, left of the green banner)
- Ensure all functionality (SEO, Free/Pro, payment, FAQ) remains intact

## Requirements
1. **Language Switcher Design**
   - Place left of the green banner in the header
   - Outlined buttons (matching "Interactive Grid" style)
   - Height: 36px (same as Pro banner)
   - Rounded corners (6px)
   - Current language visually disabled (grayed out, `cursor: not-allowed`)
   - HTML:
     ```html
     <div style="display: flex; gap: 8px; margin-right: 16px;">
         <button class="lang-btn" data-lang="en" aria-pressed="true">EN</button>
         <button class="lang-btn" data-lang="es" aria-pressed="false">ES</button>
     </div>
     ```
   - CSS:
     ```css
     .lang-btn {
         padding: 8px 12px;
         border: 1px solid #334155;
         background: transparent;
         color: #94a3b8;
         border-radius: 6px;
         cursor: pointer;
         height: 36px;
     }
     .lang-btn[aria-pressed="true"] {
         color: #e2e8f0;
         border-color: #6366f1;
         cursor: not-allowed;
     }
     ```

2. **Spanish Localization**
   - Add `I18N` object with complete EN/ES translations for:
     - Header, input placeholder, buttons
     - How It Works (4 steps), Use Cases (4 cases), FAQ (6 Q&A), Pricing (8 features)
     - Footer, modal
   - Update `hreflang` for Spanish:
     ```html
     <link rel="alternate" hreflang="es" href="https://localjson-black.vercel.app/?lang=es">
     ```
   - Add `id="schema-jsonld"` to JSON-LD script

3. **Functionality**
   - Implement `applyLang(lang)`: updates DOM by ID, placeholders, hreflang, JSON-LD
   - Implement `initLang()`: reads `?lang=` / localStorage, defaults to `en`, persists
   - Wire language buttons to update URL, localStorage, and call `applyLang`

4. **Verification**
   - `index.html?lang=es` → Spanish render
   - EN/ES buttons switch language, update URL
   - Refresh preserves language via localStorage
   - No console errors
   - All existing functionality (payment, SEO, Free/Pro) intact

## Acceptance Command
```bash
node acceptance/i18n-check.mjs && echo "i18n OK"
```