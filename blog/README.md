# Blog Pipeline — How to Add an Article

## Quick Start

1. Create a new `.md` file in `blog/posts/` with the naming convention: `<slug>.md`
2. Add required frontmatter (see below)
3. Write your article in Markdown
4. Run `node bin/build-blog.mjs`
5. Run `node acceptance/blog-check.mjs` to verify
6. Commit and push

## Frontmatter (Required)

```yaml
---
slug: your-article-slug          # URL-friendly, lowercase, hyphens only
title: "Your Article Title"       # Display title (20-70 chars recommended)
description: "One-sentence SEO description (100-170 chars)"
date: 2026-10-14                  # ISO date (YYYY-MM-DD)
author: LocalJSON                 # Author name
cluster: formatter-beautifier     # Semantic cluster (see clusters below)
keywords: ["json formatter", "json beautifier", "format json online"]
---
```

**All fields are mandatory.** The generator will fail with a clear error if any field is missing or invalid.

## Markdown Supported

The built-in parser handles:
- Headings: `# H1`, `## H2`, `### H3`
- Paragraphs (blank line separated)
- Lists: `- item` or `1. item` (nested supported)
- Code blocks: ```lang\ncode\n```
- Inline code: `code`
- Bold: `**text**`
- Italic: `*text*`
- Links: `[text](url)`
- Images: use the screenshot placeholder (see "Screenshots" below)
- Blockquotes: `> quote`
- Horizontal rule: `---`

## Internal Links

Use `[[slug]]` or `[[slug|custom text]]` to link to other blog posts.

Examples:
- `[[json-formatter-online]]` → links to `/blog/json-formatter-online/` with title from target article
- `[[json-formatter-online|this article]]` → links with custom text "this article"

If the target slug doesn't exist, a warning is printed but the build continues (link rendered as plain text).

## Clusters (for categorization)

| Cluster | Description |
|---------|-------------|
| `formatter-beautifier` | Formatting, pretty-print, beautify |
| `viewer` | JSON viewer, tree view, inspection |
| `validator-schema` | Validation, JSON Schema, linting |
| `editor` | Online editor, playground, fiddle |
| `converter` | CSV, YAML, XML, Excel conversion |
| `compare-diff` | Compare, diff, merge tools |
| `b2b-cleaning` | B2B data cleaning, mapping, pipelines |

Pick the most relevant one. New clusters can be added as needed.

## Pipeline Output

Running `node bin/build-blog.mjs` produces:
- `blog/<slug>/index.html` — the article page
- `blog/index.html` — the blog listing page (all articles, newest first)
- Updated `sitemap.xml` with new URLs

## Acceptance Criteria

`acceptance/blog-check.mjs` verifies each article:
1. `<title>` length 20-70 chars
2. `<meta name="description">` length 100-170 chars
3. Self-referential canonical URL
4. Valid JSON-LD Article with headline, datePublished
5. ≥ 1200 words in `<article>`
6. ≥ 1 link to homepage (`/`)
7. ≥ 1 internal link to another article (WARN if 0)
8. Open Graph tags present
9. Slug matches folder name
10. No duplicate slugs

## Screenshots

Use the `{{SCREENSHOT:name}}` placeholder to embed a screenshot of the live
LocalJSON app. Put it on its own line:

```markdown
## Where the data lands

{{SCREENSHOT:schema}}

The figure above shows the analyzed grid.
```

How it resolves:

1. If `blog/assets/<name>.png` exists, it is embedded right away.
2. Otherwise the generator runs `bin/make-screenshot.mjs <name>` once: headless
   Chromium (Playwright) opens the production site, pastes a small test dataset,
   clicks "Analyze Data Structure", waits for the results grid and captures a
   1440x900 viewport screenshot.
3. If generation fails, a WARN is printed and the placeholder is left untouched —
   the build still succeeds.

The emitted tag is:

```html
<img src="/blog/assets/<name>.png" alt="...">
```

`alt` comes from `screenshot-alt` in the frontmatter, else from the nearest
preceding `## heading`, else from the article title. A placeholder alone in its
own paragraph is replaced by a bare `<img>` (no wrapping `<p>`).

`{{SCREENSHOT_SCHEMA}}` is a legacy alias for `{{SCREENSHOT:schema}}`.

Generate or refresh a screenshot by hand:

```bash
node bin/make-screenshot.mjs schema   # writes blog/assets/schema.png
node bin/make-screenshot.mjs          # writes blog/assets/screenshot-default.png
```

Playwright is a devDependency: `npm install` plus `npx playwright install chromium`.
Generated PNGs in `blog/assets/` are committed — CI does not need a browser.

## Rebuilding

The pipeline is idempotent — run it anytime after adding/editing posts.

## GitHub Actions — Automated Weekly Publishing

A workflow (`.github/workflows/publish-blog.yml`) runs every Monday 09:00 UTC
and on manual dispatch. It:

1. Checks out the repo, installs Node 20 and Playwright Chromium.
2. Runs `node bin/generate-article.mjs` (placeholder — logs the next topic).
3. Runs `node bin/build-blog.mjs` to build HTML and screenshots.
4. Runs `node acceptance/blog-check.mjs` to validate the new article.
5. Commits and pushes any new/updated files.

### Required GitHub Secret

Go to **Settings → Secrets and variables → Actions → New repository secret**:

- **Name**: `LLM_API_KEY`
- **Value**: your LLM provider API key (e.g., OpenAI, Anthropic)

The workflow exposes this as `LLM_API_KEY` to `generate-article.mjs`.
When you implement the real LLM call, read `process.env.LLM_API_KEY`.

**Without this secret the workflow will still run** (the placeholder script
exits 0), but no real article will be generated.