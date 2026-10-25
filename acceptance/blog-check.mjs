#!/usr/bin/env node
/**
 * acceptance/blog-check.mjs — validates generated blog article pages.
 *
 * Exit 0 if all checks pass, exit 1 with error list otherwise.
 * Mirrors the style of seo-check.mjs / i18n-check.mjs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(ROOT, 'blog');

let passed = 0;
let failed = 0;
const results = [];

function pass(msg) {
    passed++;
    results.push(`PASS: ${msg}`);
}

function fail(msg) {
    failed++;
    results.push(`FAIL: ${msg}`);
}

function warn(msg) {
    results.push(`WARN: ${msg}`);
}

function countWords(html) {
    // Strip tags, count words
    const text = html.replace(/<[^>]+>/g, ' ');
    return (text.match(/\b\w+\b/g) || []).length;
}

function extractArticleBody(html) {
    const match = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
    return match ? match[1] : '';
}

function extractJsonLd(html) {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!match) return null;
    try {
        return JSON.parse(match[1].trim());
    } catch {
        return null;
    }
}

function checkArticle(slug, html) {
    const errors = [];

    // 1. <title> present, 20-70 chars
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) {
        errors.push('missing <title>');
    } else {
        const len = titleMatch[1].length;
        if (len < 20 || len > 70) {
            errors.push(`title length ${len} not in 20-70 range: "${titleMatch[1]}"`);
        }
    }

    // 2. <meta name="description"> present, 100-170 chars
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    if (!descMatch) {
        errors.push('missing meta description');
    } else {
        const len = descMatch[1].length;
        if (len < 100 || len > 170) {
            errors.push(`description length ${len} not in 100-170 range`);
        }
    }

    // 3. <link rel="canonical"> self-referential
    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
    if (!canonicalMatch) {
        errors.push('missing canonical link');
    } else {
        const expected = `https://localjson-black.vercel.app/blog/${slug}/`;
        if (canonicalMatch[1] !== expected) {
            errors.push(`canonical mismatch: expected ${expected}, got ${canonicalMatch[1]}`);
        }
    }

    // 4. JSON-LD Article valid
    const jsonLd = extractJsonLd(html);
    if (!jsonLd) {
        errors.push('missing or invalid JSON-LD Article');
    } else {
        if (jsonLd['@type'] !== 'Article') errors.push('JSON-LD @type is not Article');
        if (!jsonLd.headline) errors.push('JSON-LD missing headline');
        if (!jsonLd.datePublished) errors.push('JSON-LD missing datePublished');
        if (!jsonLd.author || jsonLd.author['@type'] !== 'Person') errors.push('JSON-LD author invalid');
    }

    // 5. Word count >= 1200 (in <article> body)
    const articleBody = extractArticleBody(html);
    const wordCount = countWords(articleBody);
    if (wordCount < 1200) {
        errors.push(`word count ${wordCount} < 1200`);
    }

    // 6. At least one link to /
    const homeLinks = (html.match(/href="\/[^"#>]*/g) || []).length +
        (html.match(/href="https:\/\/localjson-black\.vercel\.app\/[^"#>]*/g) || []).length;
    if (homeLinks === 0) {
        errors.push('no link to homepage (/) found');
    }

    // 7. At least one internal link to another article
    const internalLinks = (html.match(/href="\/blog\/[^"/]+\//g) || []).length;
    if (internalLinks === 0) {
        warn(`article "${slug}" has 0 internal links to other articles`);
    }

    // 8. Open Graph tags
    const ogTags = ['og:title', 'og:description', 'og:image'];
    for (const tag of ogTags) {
        const re = new RegExp(`property="${tag}" content="[^"]+"`);
        if (!re.test(html)) {
            errors.push(`missing ${tag}`);
        }
    }

    // 9. Slug matches folder name — prefer canonical link over internal links
    const canonicalSlugMatch = html.match(/<link rel="canonical" href="[^"]*\/blog\/([^"/]+)\//);
    if (canonicalSlugMatch) {
        if (canonicalSlugMatch[1] !== slug) {
            errors.push(`slug mismatch: canonical has "${canonicalSlugMatch[1]}" but folder is "${slug}"`);
        }
    } else {
        // Fallback: first /blog/ link (should be canonical, but fallback for safety)
        const folderSlugMatch = html.match(/href="\/blog\/([^"/]+)\//);
        if (folderSlugMatch && folderSlugMatch[1] !== slug) {
            errors.push(`slug mismatch: folder is "${slug}" but link has "${folderSlugMatch[1]}"`);
        }
    }

    return errors;
}

function main() {
    if (!fs.existsSync(BLOG_DIR)) {
        console.error('blog/ directory not found');
        process.exit(1);
    }

    // Find all blog/<slug>/index.html (excluding blog/index.html itself)
    const entries = fs.readdirSync(BLOG_DIR, { withFileTypes: true });
    const slugs = entries
        .filter(e => e.isDirectory())
        .map(e => e.name)
        .filter(s => fs.existsSync(path.join(BLOG_DIR, s, 'index.html')));

    if (slugs.length === 0) {
        console.warn('No blog articles found to check');
        console.log('--- Summary ---');
        console.log('All checks passed (no articles)');
        process.exit(0);
    }

    console.log(`Checking ${slugs.length} article(s)...`);

    // Check for duplicate slugs
    const seen = new Set();
    for (const slug of slugs) {
        if (seen.has(slug)) {
            fail(`duplicate slug: ${slug}`);
        }
        seen.add(slug);
    }

    for (const slug of slugs) {
        const filePath = path.join(BLOG_DIR, slug, 'index.html');
        const html = fs.readFileSync(filePath, 'utf8');

        // Unfinished drafts must not reach production.
        if (html.includes("TODO:") || html.includes("FIXME:")) {
            fail("Article contains TODO or FIXME markers: " + slug);
        }

        const errors = checkArticle(slug, html);
        if (errors.length === 0) {
            pass(`article "${slug}"`);
        } else {
            for (const e of errors) {
                fail(`article "${slug}": ${e}`);
            }
        }
    }

    // Summary
    console.log('');
    console.log('--- Summary ---');
    for (const r of results) {
        console.log(r);
    }
    console.log(`\nTotal: ${passed} passed, ${failed} failed`);

    if (failed > 0) {
        process.exit(1);
    }
}

main();