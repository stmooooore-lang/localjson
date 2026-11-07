#!/usr/bin/env node
/**
 * scripts/submit-indexnow.mjs
 *
 * Reads sitemap.xml and submits every URL to the IndexNow API
 * (https://api.indexnow.org/indexnow).
 *
 * IndexNotifies (Bing, Yandex, DuckDuckGo, Yahoo, Naver, Seznam, and
 * several AI-answer engines) fetch and index the submitted URLs much
 * faster than waiting for the next crawl.
 *
 * Usage:
 *   node scripts/submit-indexnow.mjs [--url <single-url>] [--dry-run]
 *
 * Environment (both have built-in defaults, override only if needed):
 *   INDEXNOW_KEY      - key that must also live in /<key>.txt at the
 *                       site root (the file is committed at repo root)
 *   INDEXNOW_ENDPOINT - defaults to https://api.indexnow.org/indexnow
 *   INDEXNOW_Sitemap  - defaults to sitemap.xml in repo root
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* --------------------------------------------------------------- config */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'NDkCKfQYMQ-HZS3asUKxO4csyzaEWrdm';
const HOST = 'localjson-black.vercel.app';
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const SITEMAP_PATH = process.env.INDEXNOW_SITEMAP || path.join(ROOT, 'sitemap.xml');
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

/* ------------------------------------------------------------------ args */

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const urlFlagIndex = argv.indexOf('--url');
const SINGLE_URL = urlFlagIndex !== -1 ? argv[urlFlagIndex + 1] : null;

/* --------------------------------------------------------------- helpers */

function fail(msg) {
  console.error(`[IndexNow] ERROR: ${msg}`);
  process.exit(1);
}

function readSitemapUrls(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`sitemap not found at ${filePath}`);
  }
  const xml = fs.readFileSync(filePath, 'utf8');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());
  return [...new Set(urls)].filter(Boolean);
}

/* ------------------------------------------------------------------- main */

const urls = SINGLE_URL ? [SINGLE_URL] : readSitemapUrls(SITEMAP_PATH);

if (urls.length === 0) {
  fail('no URLs found — nothing to submit');
}

console.log(`[IndexNow] key: ${INDEXNOW_KEY}`);
console.log(`[IndexNow] keyLocation: ${KEY_LOCATION}`);
console.log(`[IndexNow] URLs to submit: ${urls.length}`);
urls.forEach((u, i) => console.log(`  ${String(i + 1).padStart(2)}. ${u}`));

if (DRY_RUN) {
  console.log('[IndexNow] --dry-run: skipping POST, exiting');
  process.exit(0);
}

// The payload. host/keyLocation must match, url-list may be non-empty.
const payload = {
  host: HOST,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
};

if (!KEY_LOCATION.startsWith(`https://${HOST}/`) || !KEY_LOCATION.endsWith('.txt')) {
  fail('keyLocation must live on the same host as the submitted URLs');
}
if (INDEXNOW_KEY.length < 8 || INDEXNOW_KEY.length > 128) {
  fail('key length must be between 8 and 128 characters');
}
if (!/^[A-Za-z0-9-]+$/.test(INDEXNOW_KEY)) {
  fail('key may only contain A-Z, a-z, 0-9 and hyphens');
}

const controller = new AbortController();
const timeoutMs = 30000;
const timer = setTimeout(() => controller.abort(), timeoutMs);

let res;
let bodyText = '';
try {
  res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
    signal: controller.signal,
  });
  bodyText = await res.text();
} catch (err) {
  clearTimeout(timer);
  if (err.name === 'AbortError') {
    fail(`request timed out after ${timeoutMs} ms`);
  }
  fail(`network error: ${err.message}`);
}
clearTimeout(timer);

/* ------------------------------------------------------------- reporting */

// 200 | 4xx | 403 (other)
const outcomeTable = {
  200: 'OK — URLs queued for indexing',
  202: 'ACCEPTED — key/indexing pending (URL list accepted, indexing soon)',
  400: 'BAD REQUEST — invalid format (resubmit after fixing)',
  403: 'FORBIDDEN — key not valid for this host (check /<key>.txt)',
  422: 'UNPROCESSABLE — URL list does not belong to the host, or key mismatch',
  429: 'TOO MANY REQUESTS — possible spam signal, back off',
};

console.log('');
console.log('================ IndexNow submit report ================');
console.log(`  HTTP status      : ${res.status} ${res.statusText || ''}`);
console.log(`  Outcome          : ${outcomeTable[res.status] || `unexpected (${res.status})`}`);
console.log(`  URLs submitted   : ${urls.length}`);
console.log(`  Endpoint         : ${ENDPOINT}`);
if (bodyText) {
  console.log(`  Response body    : ${bodyText.trim().slice(0, 500)}`);
}
console.log('=======================================================');

if (res.status !== 200 && res.status !== 202) {
  console.error('[IndexNow] submission not accepted — see report above');
  process.exit(1);
}
console.log('[IndexNow] submission accepted; Bing/Yandex/DuckDuckGo + AI search will be notified.');
