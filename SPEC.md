# LocalJSON Project Specification

## 1. Meta
- Production URL: https://localjson-black.vercel.app
- Vercel Project: localjson-black
- GitHub Repo: https://github.com/stmooooore-lang/localjson
- Google Analytics: G-ZV5DKDT69T
- Google Site Verification: 10xz_XA9jkc2g8rJb77XIRslZtHqtnQJPcS_rvBGpYM
- Primary Branch: main
- Deploy Trigger: Push to main -> Vercel auto-deploy
- Language: English only (EN)
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
- /?auth=success: Post-payment redirect - Sets Pro in localStorage - No (canonical to /)
- /offline/ (future): Offline Version - Pre-activated Pro, no network - Yes
- /activate/ (future): Activation & Docs - License entry, documentation - Yes
- /privacy/ (future): Privacy Policy - GDPR/CCPA compliance - Yes
- /terms/ (future): Terms of Service - Legal - Yes

Note: Currently only index.html is deployed. Offline/Activate pages distributed as files to buyers.

## 7. Backlinks & Listings (Known)
- Product Hunt: https://www.producthunt.com/products/localjson — Active listing
- AlternativeTo: https://alternativeto.net/software/localjson/ — Active listing
- Gumroad / Lemonsqueezy product page: Marketplace - Active (legacy, now Lava.top)
- Vercel dashboard: Platform - Active
- GitHub repo: Code host - Active
- Core: json mapper, json formatter online, json to csv converter, json viewer (Tool usage)
## 8. Roadmap - SEO First (Zero Budget)

Phase 1: Technical Foundation (Week 1) IN PROGRESS
- [x] Git repo connected
- [x] .gitignore added
- [ ] robots.txt + sitemap.xml (auto-generated via GitHub Action)
- [ ] JSON-LD Schema.org (SoftwareApplication + Product + FAQ)
- [ ] Open Graph / Twitter Cards
- [ ] Canonical URLs + hreflang=en
- [ ] Semantic HTML5 restructure
- [ ] Image alt attributes

Phase 2: Content Expansion (Week 1-2)
- [ ] How it Works section (step-by-step, 4-5 steps)
- [ ] Use Cases (3-4 cards: API debugging, CSV export, Data cleaning, Offline work)
- [ ] FAQ (8-10 questions, marked up with FAQPage schema)
- [ ] Feature Comparison table (Free vs Pro)
- [ ] Testimonials / Social Proof placeholder

Phase 3: On-Page Optimization (Week 2)
- [ ] Optimize title / meta description / h1 for target clusters
- [ ] Add keyword-rich section headings (h2, h3)
- [ ] Internal links: index <-> offline <-> activate
- [ ] Anchor links for scroll-to sections

Phase 4: Authority & Signals (Ongoing)
- [ ] Submit sitemap to Google Search Console
- [ ] Fix GSC coverage/indexing errors
- [ ] Request indexing for updated pages
- [ ] Add to JSON tool directories (alternative.to, producthunt, etc.)
## 9. Deployment & Operations

Deploy to Production:
git push origin main  # Vercel auto-deploys

Rollback:
git revert HEAD && git push origin main
# Or: Vercel dashboard -> Deployments -> Promote previous

Local Development:
# No build step - open index.html directly in browser
# Or: npx serve .  (if needed)

Environment Variables (Vercel):
- GA_MEASUREMENT_ID: G-ZV5DKDT69T (Production)

## 10. Changelog
- 2025-08-20: f01dd80 - Initial local sync - all production files committed
- 2025-08-20: (this session) - .gitignore added, SPEC.md created

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

*Last updated: 2025-08-20 - SPEC.md created, repo connected*
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