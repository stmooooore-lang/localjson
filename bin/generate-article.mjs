#!/usr/bin/env node
/**
 * bin/generate-article.mjs — generates a blog article via Google Gemini API.
 * Reads writer.md (system prompt), picks next pending topic from plan.json,
 * calls Gemini, writes the article to blog/posts/<slug>.md,
 * and updates plan.json status to "draft".
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
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }
  const data = await response.json();
  // Extract text from candidates[0].content.parts[0].text
  const candidate = data.candidates?.[0];
  if (!candidate || !candidate.content?.parts?.[0]?.text) {
    throw new Error('Unexpected Gemini response format');
  }
  return candidate.content.parts[0].text.trim();
}

async function main() {
  // 1. Load system prompt
  const systemPrompt = fs.readFileSync(WRITER_PATH, 'utf8');
  // 2. Get next topic
  const topic = getNextTopic();
  if (!topic) {
    console.log('[generate-article] No pending topics in plan.json');
    return;
  }
  console.log(`[generate-article] Generating article for: ${topic.title} (${topic.slug})`);
  // 3. Call Gemini
  const userPrompt = `Write an article about: ${topic.title}`;
  let articleMarkdown;
  try {
    articleMarkdown = await callGemini(systemPrompt, userPrompt);
  } catch (err) {
    console.error('[generate-article] Failed to generate article:', err.message);
    process.exit(1);
  }
  // 4. Write article file
  const outPath = path.join(POSTS_DIR, `${topic.slug}.md`);
  fs.writeFileSync(outPath, articleMarkdown, 'utf8');
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