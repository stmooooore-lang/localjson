# LocalJSON Project Specification

## 1. Meta
- Production URL: https://localjson-black.vercel.app
- Vercel Project: localjson-black
- GitHub Repo: https://github.com/stmooooore-lang/localjson
- Google Analytics: G-ZV5DKDT69T
- Google Site Verification: 10xz_XA9jkc2g8rJb77XIRslZtHqtnQJPcS_rvBGpYM
- Primary Branch: main
- Deploy Trigger: Push to main -> Vercel auto-deploy
- Language: English + Spanish (EN/ES switcher, ?lang= URL param, ES license/docs page live)
- Target Audience: Web developers, data analysts, B2B integrators working with JSON

## 2. Product Overview
LocalJSON - 100% client-side, privacy-first JSON utility for formatting, mapping, and cleaning sensitive B2B data arrays in the browser. Zero server uploads.

Core Value Props:
- Privacy-first: Data never leaves the browser
- Offline-capable: Works without internet (Offline version)
- B2B-focused: Column mapping, CSV export, large array handling
- No lock-in: Single HTML file, no build, no dependencies

User Funnel:
Landing (index.html) -> Free tier (3 actions/day) -> Pro upgrade (LJSON-PRO-*) -> Unlimited

## 3. Tech Stack
- Runtime: Browser (ES2020+)
- Structure: Single-file HTML (HTML + CSS + JS inlined)
- Dependencies: Zero - vanilla JS only
- Parsing: JSON.parse + custom unescape/repair logic

## 4. Monetization & Licensing
Pro Key Format: LJSON-PRO-<ALPHANUMERIC> (min 15 chars total)
Validation Logic (client-side only):
if (keyInput.startsWith("LJSON-PRO-") && keyInput.length > 14) {
    localStorage.setItem("localjson_pro_status", "activated");
}

Free Tier Limits:
- 3 actions per day (format / map / export = 1 action each)
- Counter resets at midnight local time
- Stored in localStorage.localjson_usage_counter as {date: "YYYY-MM-DD", count: N}

Pro Tier:
- Unlimited actions
- Persisted in localStorage.localjson_pro_status = "activated"
- No server validation - key checked locally

Payment Flow (External):
1. User buys via Lava.top (https://app.lava.top/products/ccfa8af0-17cc-4dfb-b9f0-062f0f2ad310) — "Purchase Activation Key" button in Pro modal
2. Lava redirects to /?auth=success
3. index.html reads ?auth=success, sets localStorage.localjson_pro_status = "activated"
4. **Live production mechanism — DO NOT REMOVE.** Lava.top requires this redirect for seller verification/support.

Buyer Packages:
- localjson.zip (EN): offline HTML + doc page + README.txt
- localjson-es.zip (ES): offline HTML ES + doc page ES + README_es.txt
- Rebuilt manually, uploaded to Lava.top manually.
- .vercelignore blocks *.zip, *.md, bin/, acceptance/, tasks/ from public serving on Vercel.

## 5. SEO - Current State (Audit)

Present:
- title: LocalJSON — Privacy-First B2B JSON Data Mapper & Cleaner
- meta description: 100% client-side, privacy-first JSON utility for web developers and analysts. Format, map, and clean sensitive B2B data arrays securely in your browser. Zero server uploads.
- meta keywords: local json mapper, offline json viewer, privacy first json formatter, client side data cleaner, secure json utility, b2b data mapper
- h1: Implicit in logo (LocalJSON + Privacy-First B2B JSON Data Mapper)
- Canonical: None (relies on Vercel default)
- Favicon: Base64 PNG inlined
- GA4: G-ZV5DKDT69T
- Google Site Verification: Present

Missing / Weak:
- robots.txt: Missing
- sitemap.xml: Missing
- JSON-LD Schema.org: Missing
- Open Graph / Twitter Cards: Missing
- Semantic HTML5 (main, article, section): Weak (mostly div)
- Structured content blocks (How it works, Use cases, FAQ): Missing
- Internal linking between pages: Missing
- hreflang=en: Missing
- Image alt attributes: Missing (sc)
- Performance hints (preload, def)

## 6. Routes & Pages

| Route | Page | Purpose | Live? |
|---|---|---|---|
| / | index.html | EN landing + app | Yes |
| /es/ | es/index.html | ES landing + app | Yes |
| /blog/ | blog/index.html | Blog listing (auto) | Yes |
| /blog/<slug>/ | blog/<slug>/index.html | Blog article (auto) | Yes |
| /offline/ | **not a route** | The offline build is the file | No |
| /activate/ | **not a route** | Activation lives in Pro modal + ?auth=success | No |
| /?auth=success | index.html (redirect target) | Post-payment Pro activation | Yes |

Note: Deployed to production: index.html (EN, at /), es/index.html (ES, at /es/), and the blog (/blog/ plus one page per article). The offline build and the documentation certificates are distributed to buyers as standalone files, not served as routes.

## 7. Backlinks & Listings (Known)
- Product Hunt: https://www.producthunt.com/products/localjson — Active listing (confirmed by owner)
- Indie Hackers: НЕТ листинга. URL `https://www.indiehackers.com/product/localjson` возвращает **404** (проверено 2026-11-12); предыдущая запись «Active listing (confirmed by owner)» была ошибочной. Листинг нужно создать — черновик поста в `marketing/indie-hackers-draft.md`.
- AlternativeTo: НЕТ листинга. Проверено 2026-11-13 в My Submissions основателем — листинг не создан.
- Gumroad / Lemonsqueezy product page: Marketplace - Active (legacy, now Lava.top)
- Vercel dashboard: Platform - Active
- GitHub repo: Code host - Active
- Core: json mapper, json formatter online, json to csv converter, json viewer (Tool usage)

## 8. Roadmap - SEO First (Zero Budget)

Phase 1: Technical Foundation (Week 1) **DONE**
- [x] robots.txt
- [x] sitemap.xml
- [x] JSON-LD Schema.org (Product + FAQPage)
- [x] Open Graph / Twitter Cards
- [x] Semantic HTML5 (main, article, section)
- [x] Structured content blocks (How it works, Use cases, FAQ)
- [x] Internal linking between pages
- [x] hreflang=en/es/x-default
- [x] Image alt attributes
- [x] Performance hints (preload, defer)

Phase 2: Content Depth (Week 1-2) **DONE**
- [x] FAQ (8-10 questions, marked up with FAQPage schema)
- [x] Feature Comparison table (Free vs Pro)
- [x] Testimonials / Social Proof placeholder

Phase 3: On-Page Optimization (Week 2) **DONE**
- [x] Optimize title / meta description / h1 for target clusters
- [x] Add keyword-rich section headings (h2, h3)
- [x] Internal links: index <-> offline <-> activate
- [x] Anchor links for scroll-to sections

Phase 4: Authority & Signals (Ongoing)
- [ ] Fix GSC coverage/indexing errors
- [ ] Request indexing for updated pages
- [ ] Add to JSON tool directories (AlternativeTo, Product Hunt, etc.)
- [ ] Create comparison content (vs jsonformatter.org, vs onlinejsontools.com)

Phase 5: Performance & UX (Parallel)
- [ ] Preload critical CSS (already inlined)
- [ ] Defer non-critical JS (analytics)
- [ ] Optimize screenshots (WebP, proper dimensions)
- [ ] Core Web Vitals monitoring

## 9. Deployment & Operations

Deploy to Production:
git push origin main  # Vercel auto-deploys

Rollback:
git revert HEAD && git push origin main
# Or: Vercel dashboard -> Deployments -> Promote previous

Local Development:
# No build step - open index.html directly in browser
# All production files committed

## 10. Change Log

- 2026-08-20: .gitignore added, SPEC.md created
- 2026-11-12: CWV baseline via Lighthouse CI, IH draft ready
- 2026-11-13: AlternativeTo confirmed NOT published

## 11. Quick Reference for AI Assistants

When user asks to modify the specification:
1. Edit this script (write_spec.py)
2. Run: python3 write_spec.py
3. git add SPEC.md && git commit -m "type: description"
4. git push origin HEAD:main

Key files:
- Activation docs: LocalJSON_Pro_Documentation_and_License_Key.html
- Spec: SPEC.md
- EN index: index.html
- ES index: es/index.html

Do NOT:
- Add build steps / bundlers / frameworks
- Add server-side code, DB
- Change monetization without explicit decision
- Remove ?auth=success (Lava.top requirement, repo connected)