import pathlib

content = """# LocalJSON Project Specification

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
- Dependencies: Zero - vanilla- Dependencies: Zero - vanilla- Dependencies: Zero - vanilr, license key)
- Parsing: JSON.par- Parsing: JSON.par- Parsing: JSON.par- Parsing: JSON.par- Parsing: JSti- Parsing: JSON.par- os- Parsing: JSON.par- Parsing: JSON.par- Parsiuto-deploy on push to main

File InvenFile InvenFile InvenFile InvenFile InvenFile InvenFile InvenFile InvenFile InvenFine_File InvenFile InvenFffline, pre-activated Pro - Live (distributed to buyers)
- LocalJSON_Pro_Documentation_and_License_Key.html: Activation page + docs - Live
- 1.jpg, 2.jpg: Screenshots for listings - Assets
- README.txt: Buyer delivery note - L- README.txt: Buyer delivery note - L- README.txt: Bu LJSON-- README.txt: Buyer delivery not total)

Validation Logic (clienValidation Logic (clienValidation Logic (clienValidationkeyInput.length Validation Logic (clienValidation Logic (clienValidation Logic (clienValidationkeyInput.le3 aValidation Logi(format / map / export = 1 actiValidation Logic (clienValidation Logic (clienValidatired in localStorage.localjson_usage_counter as {date: "YYYY-MM-DD", count: N}

Pro Tier:
- Unlimited actio- Unlimited actio- Unlimited actio- Unlimited actio- Unlimited actio- Unlimited actio- Unlimited actid locally

Payment Flow (External):
1. User buys via Gumroad / Lemonsqueezy / Stripe l1. User buys via Gumroad / Lemonsqueezy / Stripe l1. User buys via Gumroad / Lemonsqueezy / Stripe l1. User buys via Gumroad / Lemonsqueezy / Stripe l1. User buys via Gumr separate HTML (pre-activated)

## 5. SEO - Current State (Audit)

Present:
- title:- title:- titlffline Privacy-First B2B JSON Data Mapper & Cleaner
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
- Image alt attributes: Missing (sc- Image alt aterformance hints (preload, def- Image alt attributes: Missing (sc- Image al: json mapper, json formatter- Image alt attributes: Missing (sc- Image alt aterformance hints (preload, def- Image alt attributes: Missing (sc- Image al: json mapper, json formatter- Image alt atcious)
- B2B/Dev: b2b json data cleaner, json data mapping tool, api response formatter, json array to csv (Professional)
- Pro/Commercial: json mapper pro, unlimited json forma- Pro/Commercial: json mapper pro, unlimited json forma- Pro/Commerciaat- Pro/Commercial: json mapper pro, unlimite+ Pro unlock - Yes
- /?auth=success: Post-payment redirect - Sets Pro in localStorage - N- /?auth=succeo /)
- /offline/ (future): Offline Version - Pre-activated Pro, no network - Yes
- /activate/ (future): Activation & Docs - License entry, documentation - Yes
- /privacy/ (futu- /privacy/ (futu- /privacy/ (futu- /privacy/ (futu- /privacy/ (fu): Terms of Service - Legal - Yes

Note: Currently only index.html Note: Currently only index.html Note: Currently only index.html Note: Currently only index.html Note: Currently only index.html Note: Currently only index.html Note: Currently only index.html Note: Currently ub repo: Code host - Active

## 8. Roadmap - SEO First (Zero Budget)

Phase 1: Technical Foundation (Week 1) IN PROGRESPhase 1: Technical Foundation (Week 1) IN PROGRESPhase 1: Technical Foundation (Week 1)generated via GitHub Action)Phase 1: Technical Foundation (Week 1) IN PROGRESPhase 1: Technical Foundation (Week 1) IN PROGRESPhase 1: Technical Foundation (Week 1)generated via GitHub Action)Phase 1: Technical FounutPhase 1: Technical Foundation (Week 1) IN PROGRESPhase 1: Technical Foundation (Week -5 sPhase 1: Technical Foundation (Week 1) IN PROGRESPhase 1: Technical Founda, Offline work)
- [ ] FAQ (8-10 questions, marked up with FAQPage schema)
- [ ] Feature Comparison table (Free vs Pro)
- [ ] Testimonials / Social Proof placeholder

Phase 3: On-Page Optimization (Week 2)
- [ ] Optimize title / meta description / h1 for target clusters
- [ ] Add keyword-rich section headings (h2, h3)
- [ ] Internal links: index <-> offline <-> activate
- [ ] Anchor links for scroll-to sections

Phase 4: Authority & Signals (Ongoing)
- [ ] Submit - [ ] Submit - [ ] Submit - [ ] Submit Fix GSC coverage/indexing errors
- [ ] Request indexing for updated pages
- [ ] Add to JSON tool directories (alternative.to, producthunt, etc.)
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
# No build step - open i# No build step - open i# No build stpx# No build step - open i# No build step - open i# No build stpASU# No build step - open i# No build step - 0. Chan# No build step - open i# No build step - open i# Nall production files committed
- 2025-08-20: (this session) - .gitignore added, SPEC.md created

## 11. Quick Reference for AI Assistants
When user asks to modify the siWhen user asks to modify the siWhen useinWhen user asks to modify the siWhen user asks to modify the siPEC.md with changes
4. git add -A && git commit -m "type: description" && git push
5. Ver5. Ver5. Ver5. Ver5. Ver5. Ver5. Veat5. Ver5. Ver5. Ver5. Ver5. Ver5. Ver5.  versi5. Ver5. Ver5. Ver5. Ver5. Ver5. Vehtml
- Activation docs: /LocalJSON_Pro_Documentation_and_License_Key.html
- Spec: /SPEC.md

Do NOT:
- Add build steps / bundlers / frameworks
- A- A- A- A- A- A- A- A- A- A- A- A- A- A-idation (client- A- A- A- A- A- A- A- A- A- A- A- irst - A- A- A- A- A- A- A- A- A- A- A- A- A- A-idation (clied, repo connected*
"""

pathlib.Path('/Users/moore/my work/localjson/SPEC.md').write_text(content)
print('SPEC.md written successfully')
