# Task: Fix and Polish LocalJSON — i18n, SEO, UI/UX

## Context
Production at https://localjson-black.vercel.app/ is broken after Spanish i18n deploy. Working tree (Candidate B) has i18n but:
- SEO blocks invisible (FOUC/race condition)
- Pro button wrong color (green instead of amber)
- Language switcher buttons don't match Pro button styling
- Favicon not showing
- SEO grid: 3 columns leaves orphan, should be 2×2 or 4×1
- Spanish modal has English text remaining
- Mobile may be broken

Candidate A (HEAD, 568 lines) has solid SEO but no i18n.
Candidate C (v0, 260 lines) is baseline only.

**Base for this task: Candidate A (HEAD / `f9dcda2`)** — clean SEO foundation.
Then add: i18n (clean, no FOUC), Pro button color fix, language switcher matching Pro button, favicon, SEO grid fix, full ES translations.

---

## Requirements

### 1. Pro Button Color (from Candidate C)
- Keep original amber/yellow: `color: #fbbf24`, `background: rgba(251, 191, 36, 0.1)`, `border: 1px solid rgba(251, 191, 36, 0.2)`, `border-radius: 8px`, `height: 36px`, `padding: 6px 14px`
- **Must NOT be green** — that was a regression

### 2. Language Switcher Buttons (matching Pro button styling)
- Two buttons: EN / ES
- Placed left of green badge in header
- Same height (36px), same border-radius (8px), same border style, same font
- Current language: `aria-pressed="true"`, visually disabled (`cursor: not-allowed`, dimmed)
- Other language: `aria-pressed="false"`, active
- Colors: outline style matching "Interactive Grid" button aesthetic
- Persist choice in `localStorage` + URL param `?lang=es`

### 3. Spanish i18n — Complete & No FOUC
- Load translations **before first paint** (inline tiny loader in `<head>` or synchronous fetch)
- Apply translations to DOM immediately — no flash of empty sections
- All 65 keys from working tree preserved for EN/ES
- **Critical fixes:**
  - "Rejilla Interactiva" section: placeholder/table headers in Spanish when ES selected
  - Pro upgrade modal (`#m`): **100% Spanish** when ES — no English leftovers
  - All tooltips, button labels, feature lists, price box

### 4. Favicon
- `<link rel="icon" type="image/svg+xml" href="/favicon.svg">` in `<head>`
- File exists at project root: `favicon.svg`

### 5. SEO Grid Layout Fix
- "How It Works" (4 steps) and "Use Cases" (4 cases): **2 columns × 2 rows** on desktop (`grid-template-columns: repeat(2, 1fr)`)
- Mobile (`max-width: 768px`): **1 column**
- No 3-column layout ever (prevents orphan single item)

### 6. Mobile Responsive
- Header stacks vertically on mobile (`max-width: 640px`)
- All cards, grids, modals fit without horizontal scroll
- Font sizes readable

### 7. Test Data Auto-Load
- On `DOMContentLoaded`, prefill textarea with:
```json
[
  {"id": 101, "name": "Alex Rivera", "role": "UX Researcher", "verified": true},
  {"id": 102, "name": "Elena Rostova", "role": "Product Designer", "verified": false}
]
```
- Allows immediate "Analyze Data Structure" click to test full flow

### 8. Pro Activation Test
- Enter any key `LJSON-PRO-XXXXXXXXXXXX` (≥15 chars) in modal
- Button changes to `★ Pro Active`, green color
- Persists in `localStorage.localjson_pro_status = "activated"`

---

## Acceptance

```bash
node acceptance/final-polish-check.mjs && echo "polish OK"
```

The check verifies:
1. Pro button CSS matches amber spec exactly
2. Language buttons exist, match Pro button height/radius/border, switch lang, persist
3. No FOUC: `I18N` loaded and applied before `DOMContentLoaded` fires (or sync inline)
4. Spanish modal fully translated (no English strings in modal when ES active)
5. Favicon link present in `<head>`
6. SEO grids: `.seo-grid` has `repeat(2, 1fr)` desktop, `1fr` mobile
7. Mobile header stacks on ≤640px
8. Test JSON auto-loads on fresh page
9. Pro activation works with dummy key
10. All existing SEO checks still pass (`node acceptance/seo-check.mjs`)
11. All existing i18n checks still pass (`node acceptance/i18n-check.mjs`)

---

## Files to Modify
- `/Users/moore/my work/localjson/index.html` — main deliverable
- `/Users/moore/my work/localjson/acceptance/final-polish-check.mjs` — new check
- `/Users/moore/my work/localjson/tasks/fix-and-polish-localjson-i18n-seo.md` — this file

## Queue Entry
```
/Users/moore/my work/localjson;/Users/moore/my work/localjson/tasks/fix-and-polish-localjson-i18n-seo.md;plexus-act
```