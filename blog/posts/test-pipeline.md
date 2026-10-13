---
slug: test-pipeline
title: "Blog Pipeline Test Article"
description: "A test article to verify the blog generation pipeline works correctly with proper frontmatter, Markdown rendering, internal links, and acceptance checks."
date: 2026-10-13
author: LocalJSON
cluster: formatter-beautifier
keywords: ["blog pipeline", "test article", "json tools", "markdown rendering"]
---

# Blog Pipeline Test Article

This article serves as a **comprehensive test** of the LocalJSON blog generation pipeline. It exercises every component of the system: frontmatter parsing, Markdown-to-HTML conversion, internal link resolution, JSON-LD Article schema generation, template rendering, blog index generation, sitemap updates, and acceptance validation. The pipeline is designed to be zero-dependency, using only Node.js built-in modules, making it lightweight and reliable for static site generation on Vercel.

Visit the [LocalJSON homepage](/json-formatter/) to see the main tool in action.

## Frontmatter Validation

The pipeline requires seven mandatory frontmatter fields:

- `slug` — URL-friendly identifier (lowercase, hyphens only)
- `title` — Display title (20-70 characters recommended)
- `description` — SEO meta description (100-170 characters)
- `date` — Publication date in ISO format (YYYY-MM-DD)
- `author` — Author name
- `cluster` — Semantic category for grouping
- `keywords` — Array of relevant search terms

If any field is missing, the generator fails with a clear error message and writes no partial output. This **fail-fast behavior** prevents malformed articles from reaching production. The validation happens before any HTML is generated, ensuring that only complete, well-formed articles enter the pipeline.

## Markdown Feature Coverage

The built-in Markdown parser handles the following constructs:

### Headings

# Heading Level 1

## Heading Level 2

### Heading Level 3

### Paragraphs and Text Formatting

Regular paragraphs are separated by blank lines. **Bold text** uses double asterisks. *Italic text* uses single asterisks. `Inline code` uses backticks. You can also combine formatting like **bold *italic* code**. The parser correctly handles nested formatting and edge cases.

### Lists

Unordered list example:

- First item with some **bold** text
- Second item with *italic* text
- Third item with `inline code`
- Nested list:
  - Nested item one
  - Nested item two

Ordered list example:

1. First step
2. Second step
3. Third step

### Code Blocks

Fenced code blocks with language hints:

```javascript
function formatJSON(input) {
    try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return 'Invalid JSON: ' + e.message;
    }
}
```

```python
def validate_json_schema(data, schema):
    """Validate JSON against a JSON Schema."""
    import jsonschema
    try:
        jsonschema.validate(instance=data, schema=schema)
        return True, None
    except jsonschema.ValidationError as e:
        return False, str(e)
}
```

### Blockquotes

> The best way to predict the future is to invent it.
> — Alan Kay

### Links and Images

External link: [LocalJSON Tool](https://localjson-black.vercel.app/)

Internal link using the pipeline's custom syntax: [[json-formatter-online]] will link to the JSON Formatter Online article (once it exists).

Image placeholder: ![LocalJSON Logo](/favicon.svg)

### Horizontal Rule

---

## Internal Link System

The pipeline supports Wikipedia-style internal links:

- `[[slug]]` — links to `/blog/slug/` using the target article's title as link text
- `[[slug|custom text]]` — links with custom anchor text

Examples:
- [[json-validator]] → links to JSON Validator article
- [[json-to-csv|convert JSON to CSV]] → custom anchor text

If the target slug doesn't exist, a warning is printed but the build continues — the link renders as plain text rather than breaking the build. This graceful degradation ensures that the pipeline never fails due to forward references or future articles.

## JSON-LD Article Schema

Every generated article page includes a JSON-LD Article schema in the `<head>`. This structured data helps search engines understand the content:

- `@type: Article`
- `headline` — article title
- `description` — meta description
- `datePublished` — publication date
- `author` — Person with name
- `publisher` — Organization (LocalJSON)
- `mainEntityOfPage` — canonical URL
- `keywords` — comma-separated keywords

The schema is generated automatically from frontmatter, ensuring consistency across all articles.

## Template Features

The article template (`blog/template.html`) mirrors the visual style of `index.html`:

- Same dark theme with CSS custom properties
- Sticky header with logo and language switcher (EN/ES)
- Breadcrumb navigation: Home / Blog / Article Title
- Article card with meta information (date, cluster)
- "← Back to all posts" links at top and bottom
- Footer with navigation links
- Open Graph and Twitter Card meta tags
- Self-referential canonical URL
- hreflang attributes (en, es, x-default)

The template is a single HTML file with embedded CSS, following the project's single-file philosophy. No external stylesheets or build tools are required.

## Blog Index Page

Running the generator also produces `blog/index.html` — a listing of all articles sorted by date (newest first). Each entry shows:

- Article title (linked)
- Description
- Publication date
- Cluster tag
- "Read →" link

The index page includes JSON-LD `Blog` and `BlogPosting` structured data for the collection, helping search engines discover and index all articles efficiently.

## Sitemap Integration

The generator updates `sitemap.xml` automatically:

- Preserves existing non-blog URLs
- Adds `/blog/` index page
- Adds each article at `/blog/<slug>/`
- Includes hreflang annotations for main pages
- Sets appropriate changefreq and priority values

The sitemap parser preserves existing `lastmod`, `changefreq`, and `priority` values for non-blog URLs, ensuring that manual sitemap entries are never overwritten.

## Acceptance Criteria

The `acceptance/blog-check.mjs` validator verifies each article:

1. ✅ `<title>` length 20-70 characters
2. ✅ `<meta name="description">` length 100-170 characters
3. ✅ Self-referential canonical URL matching folder slug
4. ✅ Valid JSON-LD Article with headline and datePublished
5. ✅ Article body ≥ 1200 words
6. ✅ At least one link to homepage (/)
7. ⚠️ At least one internal link to another article (WARN if zero)
8. ✅ Open Graph tags (og:title, og:description, og:image)
9. ✅ Slug matches folder name
10. ✅ No duplicate slugs across articles

The acceptance script follows the same PASS/FAIL/WARN format as the project's other checks (seo-check.mjs, i18n-check.mjs, final-polish-check.mjs).

## Running the Pipeline

```bash
# Generate all articles
node bin/build-blog.mjs

# Validate generated output
node acceptance/blog-check.mjs
```

The pipeline is **idempotent** — running it multiple times produces byte-identical output. This makes it safe to run in CI/CD pipelines.

## Technical Architecture

The blog generator (`bin/build-blog.mjs`) is a single ES module with no external dependencies. It uses only Node.js built-in modules: `fs`, `path`, and `url`. The Markdown parser is a custom implementation of approximately 200 lines that covers the subset of Markdown used in technical articles: headings, paragraphs, lists, code blocks, inline formatting, links, images, blockquotes, and horizontal rules.

The internal link system uses a two-pass approach: first, all posts are loaded and a slug-to-metadata map is built; second, each article's Markdown is processed and `[[slug]]` references are resolved against the map. This allows forward references (linking to articles that appear later in the filesystem) and provides clear warnings for broken links.

The template system uses simple string replacement with `{{PLACEHOLDER}}` syntax. This avoids the complexity and security concerns of a full templating engine while being sufficient for the blog's needs.

## Future Extensibility

The pipeline is designed for growth:

- New Markdown features can be added to the parser incrementally
- Additional frontmatter fields can be added without breaking existing posts
- The cluster taxonomy can be extended as new content categories emerge
- The JSON-LD schema can be enhanced with additional Article properties
- Multi-language support (ES articles) is prepared via the template's hreflang structure

## Conclusion

This test article demonstrates that the LocalJSON blog infrastructure is fully functional. The system handles frontmatter validation, Markdown rendering, internal linking, structured data, template rendering, index generation, sitemap updates, and automated acceptance checks — all with zero npm dependencies and a single-file-per-article output structure suitable for static hosting on Vercel.

For more information about the main tool, visit the [LocalJSON JSON Formatter](/).

---

*Generated as part of the blog pipeline infrastructure setup.*