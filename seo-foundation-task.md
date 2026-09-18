# Task: Retroactive acceptance for the SEO foundation (Phase 1, SPEC.md)

## Context
index.html already contains canonical/hreflang tags, JSON-LD (SoftwareApplication +
FAQPage), Open Graph / Twitter Card meta tags, semantic header/main/footer, and
footer cross-links to the offline/docs pages. robots.txt and sitemap.xml already
exist at the project root. None of this was protected by an automated check.

Note: a file `acceptance/seo-check.mjs` may already exist in the working tree —
it was written directly in chat on 2026-08-22, outside this queue, and has not
been verified by the queue's own run. Do not assume it is correct as-is: read it,
check it actually implements the 8 checks below against the current index.html /
robots.txt / sitemap.xml, and fix or rewrite it if it does not. Do NOT change
index.html, robots.txt, or sitemap.xml.

## What must become true
`acceptance/seo-check.mjs` exists and, run with `node acceptance/seo-check.mjs`,
verifies by static parsing only (no network, no browser) that:

1. `robots.txt` (project root) contains the line
   `Sitemap: https://localjson-black.vercel.app/sitemap.xml`
2. `sitemap.xml` (project root) is well-formed XML and contains at least one
   `<loc>` element.
3. `index.html` line ~19 has `<link rel="canonical" href="https://localjson-black.vercel.app/">`.
4. `index.html` lines ~20-22 have three `<link rel="alternate" hreflang="...">`
   tags for `en`, `es`, and `x-default`.
5. `index.html` line ~40 has `<script type="application/ld+json" id="schema-jsonld">`
   whose JSON contains at least one object with `"@type": "SoftwareApplication"`
   and one with `"@type": "FAQPage"`.
6. `index.html` lines ~28-33 have non-empty `og:title`, `og:description`,
   `og:image` meta tags and a `twitter:card` meta tag.
7. `index.html` has `<header>`, `<main`, and `<footer>` tags present.
8. `index.html` footer (around lines ~430-441) contains an
   `<a href="LocalJSON_Pro_Offline_Version.html">` and an
   `<a href="LocalJSON_Pro_Documentation_and_License_Key.html">`.

Each check must print `PASS: <description>` or `FAIL: <description>` (mirror
the style already used in `acceptance/i18n-check.mjs`), and the script must
exit with a non-zero code if any check fails, 0 if all pass.

## Acceptance
```bash
node acceptance/seo-check.mjs && echo "seo OK"
```
