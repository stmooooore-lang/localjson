# LocalJSON Project Specification

## 1. Meta
- Production URL: https://localjson-black.vercel.app
- Vercel Project: localjson-black
- GitHub Repo: https://github.com/stmooooore-lang/localjson
- Google Analytics: G-ZV5DKDT69T
- GA4 Property: https://analytics.google.com/analytics/web/#/a402128824p546826873/
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
2. Receives LJSON-PRO-... key via email / download page
3. Enters key in app -> localStorage set -> Pro unlocked permanently
4. Offline version delivered as separate HTML (pre-activated)

Support Channels:
- Secure contact form (Formspree) in LocalJSON_Pro_Documentation_and_License_Key.html
- Telegram: https://t.me/localjson (required by Lava.top for seller verification/support)

## 5. SEO - Current State (Audit)

Present:
- title: LocalJSON - Offline Privacy-First B2B JSON Data Mapper & Cleaner
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
- Image alt attributes: Missing (screenshots)
- Performance hints (preload, defer): Partial

Target Keyword Clusters:
## 6. Content Inventory (Pages / States)
- / (index.html): Main App - Free tier + Pro unlock - Yes
- /?auth=success: Post-payment redirect from Lava.top. Sets Pro in
  localStorage. **Live production mechanism — DO NOT REMOVE.** Lava
  activates Pro through this path; the doc pages
  (LocalJSON_Pro_Documentation_and_License_Key*.html)
  are certificates and do not participate in activation.
- /offline/ (future): Offline Version - Pre-activated Pro, no network - Yes
- /activate/ (future): Activation & Docs - License entry, documentation - Yes
- /privacy/ (future): Privacy Policy - GDPR/CCPA compliance - Yes
- /terms/ (future): Terms of Service - Legal - Yes

Note: Currently only index.html is deployed. Offline/Activate pages distributed as files to buyers.

## 7. Backlinks & Listings (Known)
- Product Hunt: https://www.producthunt.com/products/localjson — Active listing (confirmed by owner)
- Indie Hackers: https://www.indiehackers.com/product/localjson — Active listing (confirmed by owner)
- AlternativeTo: https://alternativeto.net/software/localjson/ — Active listing
- Gumroad / Lemonsqueezy product page: Marketplace - Active (legacy, now Lava.top)
- Vercel dashboard: Platform - Active
- GitHub repo: Code host - Active
- Core: json mapper, json formatter online, json to csv converter, json viewer (Tool usage)
## 8. Roadmap - SEO First (Zero Budget)

Phase 1: Technical Foundation (Week 1) **DONE**
- [x] Git repo connected
- [x] .gitignore added
- [x] robots.txt + sitemap.xml (auto-generated via GitHub Action)
- [x] JSON-LD Schema.org (SoftwareApplication + Product + FAQPage)
- [x] Open Graph / Twitter Cards
- [x] Canonical URLs + hreflang=en
- [x] Semantic HTML5 restructure (header, main, section, article, footer)
- [x] Image alt attributes — N/A (no <img> tags in body; screenshots only in meta tags)

Phase 2: Content Expansion (Week 1-2) **DONE**
- [x] How it Works section (step-by-step, 4 steps)
- [x] Use Cases (4 cards: API debugging, CSV export, Data cleaning, Offline work)
- [x] FAQ (6 questions, marked up with FAQPage schema + visible on page)
- [x] Feature Comparison table (Free vs Pro)
- [ ] Testimonials / Social Proof placeholder

Phase 3: On-Page Optimization (Week 2) **MOSTLY DONE**
- [x] Optimize title / meta description / h1 for target clusters
- [x] Add keyword-rich section headings (h2, h3)
- [ ] Internal links: index <-> offline <-> activate (footer has anchor links to sections; cross-page links to offline/activate HTML files not added)
- [x] Anchor links for scroll-to sections

Phase 4: Authority & Signals (Ongoing) **PENDING**
- [x] Submit sitemap to Google Search Console (manual) — accepted by Google, sitemap status: Success
- [ ] Fix GSC coverage/indexing errors
- [ ] Request indexing for updated pages (including `/index.html` — pending, daily quota blocked)
- [ ] Index sitemap URLs — ensure all submitted URLs are indexed (backlog task)
- [ ] Add to JSON tool directories (Product Hunt, Indie Hackers, AlternativeTo — already listed)

Phase 5: Trust & Social Proof (Backlog)
- [ ] Research & implement real testimonials/social proof: collect real tweets, Product Hunt comments, Indie Hackers feedback, user screenshots; add logos with permission. No fake content.
- [x] Add cross-page links in footer/header to LocalJSON_Pro_Offline_Version.html and LocalJSON_Pro_Documentation_and_License_Key.html
- [ ] Spanish checkout: update Lava.top purchase link for the Spanish version now that LocalJSON_Pro_Documentation_and_License_Key_es.html is live (recorded per fix-ux-i18n-seo-complete req. 12)

## 9. Deployment & Operations

Deploy to Production:
git push origin main  # Vercel auto-deploys

Rollback:
git revert HEAD && git push origin main
# Or: Vercel dashboard -> Deployments -> Promote previous

### How to test prod

Two modes, different things:

- **Normal window** — prod as seen by a returning user. localStorage, i18n
  preference, Pro status, cached assets. Use this to check what a real
  customer sees after using the app once.
- **Incognito window** — prod as seen by a new user. Empty localStorage, no
  cache. Use this first when something looks broken, to rule out local
  state (Pro flag, saved language, stale CSS).

When a bug appears, check incognito before looking at code. If it disappears
there, the cause is local state, not a deployment.

Local Development:
# No build step - open index.html directly in browser
# Or: npx serve .  (if needed)

Environment Variables (Vercel):
- GA_MEASUREMENT_ID: G-ZV5DKDT69T (Production)

## 10. Changelog
- 2025-08-20: f01dd80 - Initial local sync - all production files committed
- 2025-08-20: (this session) - .gitignore added, SPEC.md created
- 2026-10-06: Shipped pending i18n/SEO work to production (5ad286a Spanish localisation, SEO content blocks with strict 4/2/1 grid, header rework; final-polish acceptance check aligned with task req. 5 — sample JSON auto-load removed)
- 2026-10-07: 91f838b - docs(agents): founder gate for push and deploy
- 2026-10-07: 16f34c5 - fix(i18n): export applyLang, translate empty-grid placeholder, split pipeline heading, pro-btn state key
- 2026-10-07: a2b483f - docs(spec): how to test prod (normal vs incognito), auth=success marked as live mechanism
- 2026-10-07: eb7c7ef - acceptance: align final-polish check #3 No-FOUC marker with window.applyLang (dead since 16f34c5)
- 2026-10-07: 2a42477 - feat(es): offline package, readme, zip; fix readme.txt stale filename; rebuild zips without macosx
- 2026-10-07: bb98eee - security: add .vercelignore, close public access to archives and docs; allow *.zip in git; ES Lava URL in offline ES
- 2026-10-07: d00277b - fix(i18n): restore EN fallback URL, add buy-btn-href via data-i18n-attr
- 2026-10-07: 6625839 - i18n(es): finish Spanish localisation of offline ES page (meta, badge, placeholder, footer, row count, Pro state); rebuild localjson-es.zip
- 2026-10-08: 8908b15 - seo(es): serve Spanish on its own /es/ URL instead of /?lang=es
- 2026-10-08: 23b2aba - seo(es): Spanish meta for /es/, close /bin, fix stale hreflang check

## 11. Quick Reference for AI Assistants
When user asks to modify the site:
1. Read this SPEC.md first
2. Edit index.html (main app) - it is the only deployed file
3. Update SPEC.md with changes
4. git add -A && git commit -m "type: description" && git push
5. Vercel deploys automatically

File locations:
- Main app: /index.html
- Offline version: /LocalJSON_Pro_Offline_Version.html
- Activation docs: /LocalJSON_Pro_Documentation_and_License_Key.html
- Spec: /SPEC.md

Do NOT:
- Add build steps / bundlers / frameworks
- Add server-side code
- Change license validation (client-only by design)
- Remove privacy-first architecture

*Last updated: 2026-10-06 - EN/ES i18n + SEO work deployed*
- [ ] Create comparison content (vs jsonformatter.org, vs onlinejsontools.com)

Phase 5: Performance & UX (Parallel)
- [ ] Preload critical CSS (already inlined)
- [ ] Defer non-critical JS (analytics)
- [ ] Optimize screenshots (WebP, proper dimensions)
- [ ] Core Web Vitals monitoring
- Privacy: offline json viewer, client side json tool, private json editor, local json formatter (Privacy-conscious)
- B2B/Dev: b2b json data cleaner, json data mapping tool, api response formatter, json array to csv (Professional)
- Pro/Commercial: json mapper pro, unlimited json formatter, json license key (Purchase)
2. Receives LJSON-PRO-... key via email / download page
3. Enters key in app -> localStorage set -> Pro unlocked permanently
4. Offline version delivered as separate HTML (pre-activated)
- Storage: localStorage (Pro status, usage counter, license key)
- Parsing: JSON.parse / JSON.stringify
- Export: Blob API -> CSV (UTF-8 with BOM)
- Analytics: gtag.js (GA4)
- Hosting: Vercel (static, edge)
- CI/CD: Vercel auto-deploy on push to main

File Inventory:
- index.html: Main app (free tier + Pro unlock) - Live
- LocalJSON_Pro_Offline_Version.html: Fully offline, pre-activated Pro - Live (distributed to buyers)
- LocalJSON_Pro_Documentation_and_License_Key.html: Activation page + docs - Live
- 1.jpg, 2.jpg: Screenshots for listings - Assets
- README.txt: Buyer delivery note - Legacy

## 12. Current State (2026-10-08)

**Live:** https://localjson-black.vercel.app (Vercel, auto-deploy on push)

**Языки:** EN (default) + ES на отдельном URL /es/.
- /es/index.html генерируется скриптом bin/build-es.mjs из index.html + ES-словарь.
- На `/es/` переключатель в шапке — это ссылки на `/` и `/es/` (не JS).
- На `/` переключатель по-прежнему JS-кнопки с `?lang=`, их наличие
  требуется `acceptance/final-polish-check.mjs`.
- ?lang=es остаётся работающим, но не ранжируется (canonical на /).

**Монетизация:** Lava.top, $5 USD lifetime.
- EN: https://app.lava.top/products/ccfa8af0-17cc-4dfb-b9f0-062f0f2ad310
- ES: https://app.lava.top/products/299d1b1c-24ea-42ac-b654-f66afe5cbfb8
- Активация: Lava редиректит на /?auth=success, index.html читает
  параметр, ставит localStorage.localjson_pro_status=activated.
  **Живой механизм — не удалять.**

**Пакеты покупателей:**
- localjson.zip (EN): offline HTML + doc page + README.txt
- localjson-es.zip (ES): offline HTML ES + doc page ES + README_es.txt
- Пересобираются вручную, заливаются в Lava вручную.
- .vercelignore блокирует *.zip, *.md, bin/, acceptance/, tasks/ от
  публичной раздачи на Vercel.

**SEO:**
- GSC: главная проиндексирована, краулится регулярно (Oct 3).
- Показы за 3 месяца: 7, клики: 0. Причина — одна страница, ноль
  ссылок. Не техническая поломка. Рост — только через каналы.
- sitemap.xml: /, /es/, две докстраницы (EN и ES).
- hreflang: en → /, es → /es/, x-default → /.

**Стратегия (2026-10-07):** продвижение через каналы
(Reddit, HN, dev.to, PH), не через SEO-контент.
Подробности — DECISIONS.md.
