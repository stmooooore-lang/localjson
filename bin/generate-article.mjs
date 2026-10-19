#!/usr/bin/env node
/**
 * bin/generate-article.mjs — placeholder for LLM article generation.
 * Reads writer.md, determines next topic via monitor-trends logic,
 * logs that it would call the LLM API, but does NOT write the article.
 * Exits 0 so CI does not fail.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN_PATH = path.join(ROOT, 'blog', 'plan.json');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const WRITER_PATH = path.join(ROOT, 'blog', 'prompts', 'writer.md');

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

function main() {
  const writer = fs.existsSync(WRITER_PATH)
    ? fs.readFileSync(WRITER_PATH, 'utf8').slice(0, 200) + '…'
    : '(writer.md not found)';

  const topic = getNextTopic();
  if (!topic) {
    console.log('[generate-article] No pending topics in plan.json');
    return;
  }

  console.log('[generate-article] Writer prompt loaded (truncated):');
  console.log(writer);
  console.log();
  console.log(`[generate-article] Next topic: ${topic.title} (slug: ${topic.slug})`);
  console.log('[generate-article] Would call LLM API with writer prompt and topic…');
  console.log('[generate-article] Placeholder: NOT writing article. Set LLM_API_KEY and implement real call later.');
  // Intentionally does NOT write any file. Exits 0 so CI passes.
}

main();