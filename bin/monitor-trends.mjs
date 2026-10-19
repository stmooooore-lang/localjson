#!/usr/bin/env node
/**
 * bin/monitor-trends.mjs
 * Reads blog/plan.json, checks for existing .md files in blog/posts/,
 * prints the next pending article title in Russian.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLAN_PATH = path.join(ROOT, 'blog', 'plan.json');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');

function main() {
  if (!fs.existsSync(PLAN_PATH)) {
    console.error('plan.json not found');
    process.exit(1);
  }
  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
  const existing = new Set();
  if (fs.existsSync(POSTS_DIR)) {
    for (const f of fs.readdirSync(POSTS_DIR)) {
      if (f.endsWith('.md')) existing.add(f.slice(0, -3));
    }
  }
  for (const item of plan) {
    if (item.status === 'pending' && !existing.has(item.slug)) {
      console.log(`Следующая тема: ${item.title}`);
      return;
    }
  }
  console.log('Нет ожидающих тем');
}

main();