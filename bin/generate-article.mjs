#!/usr/bin/env node
/**
 * bin/generate-article.mjs — generates a blog article via Google Gemini API.
 *
 * Generation strategy (v2, sectioned pipeline):
 *   1. Outline call — asks for N H2 section headings + briefs.
 *   2. Intro call — standalone intro (no heading), 200–250 words.
 *   3. Section calls — one per section, 350–400 words each.
 *
 * Why sectioned: a single call reliably returns 400–700 words, well below the
 * 1200-word floor in acceptance/blog-check.mjs. Splitting the work makes the
 * length deterministic (5 × 350 + 220 ≈ 1970 words, plus headroom).
 *
 * Cost: ~7 API calls per article instead of 1. Runtime ~4–8 min.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN_PATH = path.join(ROOT, 'blog', 'plan.json');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const WRITER_PATH = path.join(ROOT, 'blog', 'prompts', 'writer.md');

const API_KEY = process.env.LLM_API_KEY;
if (!API_KEY) {
  console.error('Error: LLM_API_KEY is not set');
  process.exit(1);
}

function getNextTopic() {
  if (!fs.existsSync(PLAN_PATH)) return null;
  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
  const existing = new Set();
  if (fs.existsSync(POSTS_DIR)) {
    for (const f of fs.readdirSync(POSTS_DIR)) {
      if (f.endsWith('.md')) existing.add(f.slice(0, -3));
    }
  }
  for (const item of plan) {
    if (item.status === 'pending' && !existing.has(item.slug)) {
      return item;
    }
  }
  return null;
}

async function callGemini(systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`;
  const body = {
    contents: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'user', parts: [{ text: userPrompt }] }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4000
    }
  };
  // Exponential backoff for 503 (model overload). Gemini free tier returns
  // this frequently under load; the delays give Google time to recover.
  const delays = [30000, 60000, 120000, 240000];
  const maxAttempts = delays.length + 1;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (response.ok) {
      const data = await response.json();
      const candidate = data.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        throw new Error('Unexpected Gemini response format');
      }
      return candidate.content.parts[0].text.trim();
    }
    const errText = await response.text();
    lastErr = new Error(`Gemini API error ${response.status}: ${errText}`);
    if (response.status === 503 && attempt < maxAttempts) {
      const wait = delays[attempt - 1] / 1000;
      console.warn(`[generate-article]   503 on attempt ${attempt}/${maxAttempts}, waiting ${wait}s before retry...`);
      await new Promise(r => setTimeout(r, delays[attempt - 1]));
      continue;
    }
    throw lastErr;
  }
  throw lastErr || new Error('callGemini: retries exhausted');
}

async function generateOutline(systemPrompt, title, count = 5) {
  const userPrompt = `Produce a content outline for a technical article titled "${title}".

Return exactly ${count} H2 section headings (the last one must be "Conclusion"). Write one heading per line, starting with "## ". On the line immediately below each heading, write a one-sentence brief describing what that section covers.

Do not write anything else. No intro paragraph, no frontmatter, no closing text. Just the headings and briefs, nothing else.`;
  const raw = await callGemini(systemPrompt, userPrompt);
  const sections = [];
  let pending = null;
  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      if (pending) sections.push(pending);
      pending = { heading: h2[1].trim(), brief: '' };
      continue;
    }
    if (pending && !pending.brief) {
      pending.brief = line.replace(/^[-–—*•]\s*/, '').trim();
    }
  }
  if (pending) sections.push(pending);
  if (sections.length < 3) {
    throw new Error(`Outline returned only ${sections.length} section(s); expected at least 3`);
  }
  return sections;
}

async function generateIntro(systemPrompt, title) {
  const userPrompt = `Write only the introduction of the article titled "${title}".

Constraints:
- No heading. Do not start with "#", "##", or any markdown header.
- 200–250 words.
- 2–3 paragraphs.
- Open with a concrete scenario or problem an engineer would recognise, then state what the article covers.
- No marketing tone. No "in today's world", no "delve", no "leverage", no "seamless".

Return only the intro body, nothing else.`;
  return (await callGemini(systemPrompt, userPrompt)).trim();
}

async function generateSectionBody(systemPrompt, title, section, index, total) {
  const userPrompt = `Write only the "${section.heading}" section of the article titled "${title}".

This is section ${index + 1} of ${total}. It should cover: ${section.brief || 'the topic indicated by the heading.'}

Constraints:
- Start with the exact line "## ${section.heading}".
- Target 350–400 words of dense technical prose.
- Include at least one concrete code block, JSON snippet, or comparison table where appropriate.
- If a screenshot belongs in this section, put {{SCREENSHOT:descriptive-kebab-case-name}} on its own line.
- Do NOT include the introduction, other sections, or a separate "## Conclusion". Write only this section.

Return only this section, nothing else.`;
  return (await callGemini(systemPrompt, userPrompt)).trim();
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

// Fallback description when the LLM omits its own frontmatter.
// Pads with fixed segments until it reaches the 100-170 char range
// enforced by acceptance/blog-check.mjs.
function fallbackDescription(title) {
  const parts = [
    `A practical guide on ${title}`,
    'working with structured data',
    'runnable code examples',
    'and a client-side tool that keeps your data local',
  ];
  let desc = parts[0] + '.';
  for (let i = 1; i < parts.length && desc.length < 100; i++) {
    desc = desc.slice(0, -1) + (i === 1 ? ': ' : ', ') + parts[i] + '.';
  }
  return desc;
}

async function main() {
  // 1. Load system prompt
  const systemPrompt = fs.readFileSync(WRITER_PATH, 'utf8');

  // 2. Get next topic and existing articles
  const topic = getNextTopic();
  if (!topic) {
    console.log('[generate-article] No pending topics in plan.json');
    return;
  }

  // Collect existing articles for internal linking
  const existingArticles = [];
  if (fs.existsSync(POSTS_DIR)) {
    for (const f of fs.readdirSync(POSTS_DIR)) {
      if (f.endsWith('.md')) {
        const slug = f.slice(0, -3);
        try {
          const content = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
          if (fmMatch) {
            const titleMatch = fmMatch[1].match(/^title:\s*(.+)$/m);
            if (titleMatch) {
              existingArticles.push({ slug, title: titleMatch[1].replace(/^["']|["']$/g, '') });
            }
          }
        } catch {}
      }
    }
  }
  console.log(`[generate-article] Generating article for: ${topic.title} (${topic.slug})`);
  console.log(`[generate-article] Existing articles for internal links: ${existingArticles.length}`);

  // Inject existing articles into system prompt for internal linking
  let augmentedSystemPrompt = systemPrompt;
  if (existingArticles.length > 0) {
    const articlesList = existingArticles.map(a => `- [[${a.slug}]] — ${a.title}`).join('\n');
    const injection = `\n\n## Existing Articles for Internal Linking\nYou MUST include at least one internal link to an existing article using the [[slug]] syntax.\nAvailable articles:\n${articlesList}\n\nChoose the most relevant article(s) and link naturally in the body (e.g., in "Try LocalJSON", "Best Practices", or method comparison sections).\n`;
    augmentedSystemPrompt = systemPrompt + injection;
  }

  // 3. Sectioned generation
  let articleMarkdown;
  try {
    console.log('[generate-article] Step 1/3: outline');
    const outline = await generateOutline(augmentedSystemPrompt, topic.title, 5);
    console.log(`[generate-article]   outline has ${outline.length} sections:`);
    outline.forEach((s, i) => {
      const brief = s.brief.length > 60 ? s.brief.slice(0, 60) + '…' : s.brief;
      console.log(`[generate-article]     ${i + 1}. ${s.heading} — ${brief}`);
    });

    console.log('[generate-article] Step 2/3: intro');
    const intro = await generateIntro(augmentedSystemPrompt, topic.title);
    console.log(`[generate-article]   intro: ${countWords(intro)} words`);

    console.log('[generate-article] Step 3/3: section bodies');
    const bodies = [];
    for (let i = 0; i < outline.length; i++) {
      console.log(`[generate-article]   section ${i + 1}/${outline.length}: ${outline[i].heading}`);
      const body = await generateSectionBody(augmentedSystemPrompt, topic.title, outline[i], i, outline.length);
      console.log(`[generate-article]     -> ${countWords(body)} words`);
      bodies.push(body);
    }

    articleMarkdown = intro + '\n\n' + bodies.join('\n\n') + '\n';
    console.log(`[generate-article]   assembled total: ${countWords(articleMarkdown)} words`);
  } catch (err) {
    console.error('[generate-article] Failed to generate article:', err.message);
    process.exit(1);
  }

  // 4. Write article file (with defensive frontmatter)
  const outPath = path.join(POSTS_DIR, `${topic.slug}.md`);

  let finalMarkdown = articleMarkdown;
  finalMarkdown = finalMarkdown.replace(/^```(markdown)?\s*\n/, '').replace(/\n```\s*$/, '');

  const fmMatch = finalMarkdown.match(/^---\n([\s\S]*?)\n---\n/);
  const fmFields = {};
  let body = finalMarkdown;

  if (fmMatch) {
    body = finalMarkdown.slice(fmMatch[0].length);
    fmMatch[1].split('\n').forEach(line => {
      const m = line.match(/^([a-zA-Z0-9-]+):\s*(.*)$/);
      if (m) fmFields[m[1]] = m[2];
    });
  }

  body = body.trimStart();

  const date = new Date().toISOString().split('T')[0];
  const safeTitle = (topic.title || '').replace(/"/g, '\\"');
  const safeFmTitle = (fmFields.title || `"${safeTitle}"`).replace(/^"(.*)"$/, '$1');
  const safeFmDesc = (fmFields.description || `"${fallbackDescription(safeTitle)}"`).replace(/^"(.*)"$/, '$1');
  const safeFmAlt = (fmFields['screenshot-alt'] || `LocalJSON interface for ${safeTitle}`).replace(/^"(.*)"$/, '$1');

  const finalFm = `---
slug: ${topic.slug}
title: "${safeFmTitle}"
description: "${safeFmDesc}"
date: ${fmFields.date || date}
author: ${fmFields.author || 'LocalJSON'}
cluster: ${fmFields.cluster || topic.cluster || 'general'}
keywords: ${fmFields.keywords || `["json", "${topic.slug.replace(/-/g, ' ')}"]`}
screenshot-alt: "${safeFmAlt}"
---

`;

  fs.writeFileSync(outPath, finalFm + body, 'utf8');
  console.log(`[generate-article] Written article to ${outPath}`);

  // 5. Update plan.json
  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
  for (const item of plan) {
    if (item.slug === topic.slug) {
      item.status = 'draft';
      break;
    }
  }
  fs.writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 2), 'utf8');
  console.log('[generate-article] Updated plan.json status to draft');
}

main().catch(err => {
  console.error('[generate-article] Unexpected error:', err);
  process.exit(1);
});
