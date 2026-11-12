#!/usr/bin/env node
/**
 * scripts/gsc-check.mjs
 *
 * Reads the indexation state of every URL in sitemap.xml out of Google
 * Search Console, so the coverage report stops being a UI-only, 10-click
 * job. Produces a table that can be pasted straight into a fix brief.
 *
 * Auth: service account, no dependencies. The JWT is signed with the
 * built-in node:crypto and exchanged for an access token at Google's
 * OAuth endpoint, so the repo stays at zero dependencies.
 *
 * Usage:
 *   node scripts/gsc-check.mjs [--url <single-url>] [--dry-run] [--json]
 *                             [--out <file>] [--fail-on-error]
 *
 * Environment:
 *   GSC_SERVICE_ACCOUNT_JSON  - the whole service-account JSON as one string
 *                               (what GitHub Secrets gives you). Preferred.
 *   GSC_CLIENT_EMAIL          - fallback: ...@....iam.gserviceaccount.com
 *   GSC_PRIVATE_KEY           - fallback: "-----BEGIN PRIVATE KEY-----\n..."
 *   GSC_SITE_URL              - fallback: GSC property, default
 *                               https://localjson-black.vercel.app/
 *
 * Exit codes:
 *   0  report produced (even when URLs are not indexed - those are
 *      findings, not a broken run)
 *   1  missing/broken credentials, auth rejected, or API call failed
 *   2  used with --fail-on-error and at least one URL is not PASS
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITEMAP_PATH = process.env.GSC_SITEMAP || path.join(ROOT, 'sitemap.xml');

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SITES_URL = 'https://searchconsole.googleapis.com/webmasters/v3/sites';
const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
const SCOPE = 'https://www.googleapis.com/auth/webmasters';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 8000;
const FETCH_TIMEOUT_MS = 30000;
const BETWEEN_URLS_MS = 250;

/* ------------------------------------------------------------------- args */

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const WANT_JSON = argv.includes('--json');
const FAIL_ON_ERROR = argv.includes('--fail-on-error');

function flagValue(name) {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) {
    console.error(`[GSC] ERROR: ${name} requires a value`);
    process.exit(1);
  }
  return v;
}

const SINGLE_URL = flagValue('--url');
const OUT_FILE = flagValue('--out');

/* --------------------------------------------------------------- helpers */

function fail(msg) {
  console.error(`[GSC] ERROR: ${msg}`);
  process.exit(1);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * POST with retry, backoff and a hard timeout. Returns
 * { status, ok, json, text }. Returns null only when the request never
 * got a response, so callers can tell "Google said no" (has a status)
 * from "the network died" (null).
 */
async function postJson(url, { headers = {}, form = null, json = null }) {
  const init = { method: 'POST', headers };
  if (form !== null) {
    init.headers = { ...init.headers, 'Content-Type': 'application/x-www-form-urlencoded' };
    init.body = form;
  } else if (json !== null) {
    init.headers = { ...init.headers, 'Content-Type': 'application/json; charset=utf-8' };
    init.body = JSON.stringify(json);
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      const text = await res.text();
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null; // non-JSON body (HTML error page) - keep the text
      }
      return { status: res.status, ok: res.ok, json: parsed, text };
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) {
        if (err.name === 'AbortError') {
          console.error(`[GSC] ERROR: request timed out after ${FETCH_TIMEOUT_MS} ms (${url})`);
          return null;
        }
        console.error(`[GSC] ERROR: network error after ${MAX_ATTEMPTS} attempts: ${err.message}`);
        return null;
      }
      console.warn(`[GSC] network error (attempt ${attempt}/${MAX_ATTEMPTS}): ${err.message} - retrying`);
    } finally {
      clearTimeout(timer);
    }
    await sleep(RETRY_DELAY_MS);
  }
  return null;
}

/* ----------------------------------------------------------- credentials */

/**
 * The private key almost never arrives as intended. Google's console shows
 * it with real newlines, secrets managers flatten those to the two
 * characters backslash and n, and some wrap the whole value in quotes.
 * All three shapes are normalised here - this is the single most common
 * reason a first run dies with "error:0909006C" somewhere deep in crypto.
 */
function normalisePrivateKey(raw) {
  if (typeof raw !== 'string') return '';
  let key = raw.trim();
  // strip one layer of wrapping quotes, if the secret was pasted with them
  if (key.length > 1 && key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  if (key.length > 1 && key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
  if (!key.includes('-----BEGIN')) return '';
  // literal "\n" sequences -> real newlines (no-op when already real)
  return key.includes('\n') ? key : key.replace(/\\n/g, '\n');
}

function loadCredentials() {
  let clientEmail = process.env.GSC_CLIENT_EMAIL || '';
  let privateKey = process.env.GSC_PRIVATE_KEY || '';
  let siteUrl = process.env.GSC_SITE_URL || '';
  let fromJson = false;

  const saJson = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (saJson) {
    let sa;
    try {
      sa = JSON.parse(saJson);
    } catch (err) {
      fail(
        'GSC_SERVICE_ACCOUNT_JSON is set but is not valid JSON: ' + err.message +
        '\n       Paste the whole downloaded file contents, not just one field.'
      );
    }
    if (sa.type !== 'service_account') {
      fail(
        'GSC_SERVICE_ACCOUNT_JSON does not look like a service-account key ' +
        `(type="${sa.type}"). Expected "service_account".`
      );
    }
    if (!sa.client_email || !sa.private_key) {
      fail('GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
    }
    clientEmail = sa.client_email;
    privateKey = sa.private_key;
    fromJson = true;
  }

  if (!clientEmail || !privateKey) {
    fail(
      'Missing credentials.\n' +
      '       Set GSC_SERVICE_ACCOUNT_JSON (the whole service-account file) -\n' +
      '       this is what GitHub Secrets stores. Locally, put it in .env\n' +
      '       (that file is gitignored). Fallback fields: GSC_CLIENT_EMAIL,\n' +
      '       GSC_PRIVATE_KEY, GSC_SITE_URL.\n' +
      '       Get the key at: IAM & Admin -> Service Accounts -> Keys -> Add key (JSON).\n' +
      '       Then add the service-account e-mail in Search Console:\n' +
      '       Settings -> Users and permissions -> Add user (Restricted is enough).'
    );
  }

  privateKey = normalisePrivateKey(privateKey);
  if (!privateKey) {
    fail(
      'GSC private key is not a PEM block.\n' +
      '       It must start with -----BEGIN PRIVATE KEY----- (or RSA PRIVATE KEY).\n' +
      '       If it arrived with literal backslash-n characters, this script converts them;\n' +
      '       if it arrived truncated, re-copy the whole key field.'
    );
  }

  if (!siteUrl) siteUrl = 'https://localjson-black.vercel.app/';

  // A domain property and a URL-prefix property are different strings in
  // the API, and only the one the account actually owns will answer.
  if (!/^(https?:\/\/[^\s]+|sc-domain:[^\s]+)\/?$/.test(siteUrl)) {
    fail(`GSC_SITE_URL "${siteUrl}" is neither a URL nor a sc-domain: property`);
  }

  return { clientEmail, privateKey, siteUrl, fromJson };
}

/* ------------------------------------------------------------------- auth */

function createAssertion(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const b64u = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = `${b64u(header)}.${b64u(claim)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');
  return `${signingInput}.${signature}`;
}

async function getAccessToken(creds) {
  const assertion = createAssertion(creds.clientEmail, creds.privateKey);
  const form =
    'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
    '&assertion=' + encodeURIComponent(assertion);

  const res = await postJson(TOKEN_URL, { form });
  if (!res) fail('could not reach Google OAuth endpoint');
  if (!res.ok || !res.json || !res.json.access_token) {
    const detail = res.json && res.json.error_description
      ? res.json.error_description
      : (res.text || '').trim().slice(0, 300);
    fail(`OAuth token rejected (HTTP ${res.status}): ${detail}`);
  }
  return res.json.access_token;
}

/* ------------------------------------------------------------------- data */

function readSitemapUrls(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const xml = fs.readFileSync(filePath, 'utf8');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());
  return [...new Set(urls)].filter(Boolean);
}

async function listProperties(token) {
  const res = await postJson(SITES_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res || !res.ok || !res.json) return [];
  return (res.json.siteEntry || []).map(e => e.siteUrl);
}

async function inspectUrl(token, siteUrl, url) {
  const res = await postJson(INSPECT_URL, {
    headers: { Authorization: `Bearer ${token}` },
    json: { inspectionUrl: url, siteUrl, languageCode: 'en-US' },
  });
  if (!res) return { url, error: 'no response' };
  if (!res.ok) {
    const detail = res.json && res.json.error ? res.json.error.message : (res.text || '').slice(0, 300);
    return { url, error: `HTTP ${res.status}: ${detail}`, httpStatus: res.status };
  }
  const isr = (res.json && res.json.inspectionResult && res.json.inspectionResult.indexStatusResult) || {};
  const mu = (res.json && res.json.inspectionResult && res.json.inspectionResult.mobileUsabilityResult) || {};
  const rr = (res.json && res.json.inspectionResult && res.json.inspectionResult.richResultsResult) || {};
  return {
    url,
    verdict: isr.verdict || 'UNKNOWN',
    coverageState: isr.coverageState || '',
    indexingState: isr.indexingState || '',
    pageFetchState: isr.pageFetchState || '',
    robotsTxtState: isr.robotsTxtState || '',
    indexingAllowed: isr.indexingAllowed,
    googleCanonical: isr.googleCanonical || '',
    userCanonical: isr.userCanonical || '',
    crawledAs: isr.crawledAs || '',
    lastCrawlTime: isr.lastCrawlTime || '',
    sitemap: isr.sitemap || [],
    referringUrls: isr.referringUrls || [],
    mobileUsabilityVerdict: mu.verdict || '',
    richResultsVerdict: rr.verdict || '',
  };
}

async function queryAnalytics(token, siteUrl) {
  // 28 days back, ending 2 days ago: GSC data needs about two days to settle.
  const end = new Date(Date.now() - 2 * 86400000);
  const start = new Date(end.getTime() - 27 * 86400000);
  const iso = d => d.toISOString().slice(0, 10);
  const res = await postJson(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      headers: { Authorization: `Bearer ${token}` },
      json: {
        startDate: iso(start),
        endDate: iso(end),
        dimensions: ['page'],
        rowLimit: 1000,
      },
    }
  );
  const out = {
    startDate: iso(start),
    endDate: iso(end),
    rows: [],
    error: null,
  };
  if (!res || !res.ok || !res.json) {
    out.error = 'search performance unavailable';
    return out;
  }
  out.rows = (res.json.rows || []).map(r => ({
    page: r.keys && r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
  return out;
}

/* ------------------------------------------------------------ reporting */

const VERDICT_LABEL = {
  PASS: 'indexed, no problems',
  NEUTRAL: 'indexed, but something is off',
  FAIL: 'not indexed / blocked',
  VERDICT_UNSPECIFIED: 'Google gave no verdict',
  UNKNOWN: 'no verdict in response',
};

function verdictBucket(v) {
  if (v === 'PASS') return 'pass';
  if (v === 'NEUTRAL') return 'warn';
  if (v === 'FAIL') return 'fail';
  return 'unknown';
}

function printReport(report) {
  console.log('');
  console.log('============ GSC indexation report ============');
  console.log(`  Property        : ${report.siteUrl}`);
  console.log(`  Service account : ${report.serviceAccount}`);
  console.log(`  Checked at      : ${report.checkedAt}`);
  console.log(`  URLs in sitemap : ${report.urlsChecked}`);
  const s = report.summary;
  console.log(`  Verdicts        : ${s.pass} pass / ${s.warn} warn / ${s.fail} fail / ${s.unknown} unknown`);
  console.log('');

  if (report.results.length === 0) {
    console.log('  (no URLs to check)');
  } else {
    // Problems first, so a fix brief can be written off the screen.
    const order = { fail: 0, warn: 1, unknown: 2, pass: 3 };
    const sorted = [...report.results].sort(
      (a, b) => order[verdictBucket(a.verdict)] - order[verdictBucket(b.verdict)]
    );
    for (const r of sorted) {
      if (r.error) {
        console.log(`  [ERR ] ${r.url}`);
        console.log(`         ${r.error}`);
        continue;
      }
      const bucket = verdictBucket(r.verdict);
      const tag = bucket === 'pass' ? '[ OK ]' : bucket === 'warn' ? '[WARN]' : bucket === 'fail' ? '[FAIL]' : '[ ?  ]';
      console.log(`  ${tag} ${r.url}`);
      console.log(`         ${VERDICT_LABEL[r.verdict] || r.verdict}`);
      if (r.coverageState) console.log(`         coverage : ${r.coverageState}`);
      if (r.indexingState) console.log(`         indexing: ${r.indexingState}`);
      if (r.pageFetchState) console.log(`         fetch    : ${r.pageFetchState}`);
      if (r.robotsTxtState) console.log(`         robots   : ${r.robotsTxtState}`);
      if (r.googleCanonical && r.googleCanonical !== r.url) {
        console.log(`         canonical: ${r.googleCanonical}`);
      }
      if (r.lastCrawlTime) console.log(`         crawled  : ${r.lastCrawlTime}`);
      if (r.mobileUsabilityVerdict) console.log(`         mobile   : ${r.mobileUsabilityVerdict}`);
      if (r.richResultsVerdict) console.log(`         rich-res : ${r.richResultsVerdict}`);
    }
  }

  const a = report.analytics;
  if (a && a.rows && a.rows.length) {
    console.log('');
    console.log(`  --- search performance (${a.startDate} .. ${a.endDate}) ---`);
    for (const row of a.rows.slice(0, 10)) {
      console.log(`    ${String(row.impressions).padStart(6)} impr / ${String(row.clicks).padStart(4)} clk / ${String(row.position).padStart(6)} pos  ${row.page}`);
    }
    if (a.rows.length > 10) console.log(`    ... and ${a.rows.length - 10} more pages`);
  } else if (a && a.error) {
    console.log('');
    console.log(`  --- search performance: ${a.error} ---`);
  }

  console.log('==============================================');

  if (report.serviceAccountError) {
    console.log('');
    console.log('  NOTE: this account may not own the property. In Search Console:');
    console.log('        Settings -> Users and permissions -> Add user');
    console.log('        (add the service-account e-mail above; Restricted is enough).');
  }
}

/* ------------------------------------------------------------------- main */

const creds = loadCredentials();
const urls = SINGLE_URL ? [SINGLE_URL] : readSitemapUrls(SITEMAP_PATH);

if (SINGLE_URL) {
  console.log(`[GSC] checking single URL: ${SINGLE_URL}`);
} else if (urls.length === 0) {
  fail(`sitemap not found or empty at ${SITEMAP_PATH} - nothing to inspect`);
} else {
  console.log(`[GSC] URLs to inspect: ${urls.length}`);
}

console.log(`[GSC] authenticating as ${creds.clientEmail}`);
if (DRY_RUN) console.log('[GSC] --dry-run: auth only, no data requested');

let token;
try {
  token = await getAccessToken(creds);
} catch (err) {
  fail(`JWT signing failed - the private key is unreadable by node:crypto. ${err.message}`);
}

if (DRY_RUN) {
  console.log('[GSC] access token acquired - dry run OK');
  process.exit(0);
}

// One call to see what the account can actually reach: if the property is
// missing from the answer, every inspect call below will 403.
const properties = await listProperties(token);
const owns = properties.length === 0 || properties.includes(creds.siteUrl);

const report = {
  siteUrl: creds.siteUrl,
  serviceAccount: creds.clientEmail,
  checkedAt: new Date().toISOString(),
  propertyVisible: owns,
  visibleProperties: properties,
  urlsChecked: urls.length,
  summary: { pass: 0, warn: 0, fail: 0, unknown: 0 },
  results: [],
  analytics: null,
  serviceAccountError: !owns,
};

console.log(`[GSC] properties visible: ${properties.length ? properties.join(', ') : '(none returned)'}`);
if (!owns) {
  console.warn(`[GSC] ${creds.siteUrl} is not in that list - inspection calls will likely fail`);
}

for (const [i, url] of urls.entries()) {
  process.stdout.write(`[GSC] inspecting ${i + 1}/${urls.length}: ${url}\n`);
  const result = await inspectUrl(token, creds.siteUrl, url);
  if (result.verdict) report.summary[verdictBucket(result.verdict)]++;
  else report.summary.unknown++;
  report.results.push(result);
  if (i < urls.length - 1) await sleep(BETWEEN_URLS_MS);
}

report.analytics = await queryAnalytics(token, creds.siteUrl);

printReport(report);

if (OUT_FILE) {
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2) + '\n');
  console.log('');
  console.log(`[GSC] JSON report written to ${OUT_FILE}`);
}

if (WANT_JSON) {
  console.log('---JSON---');
  console.log(JSON.stringify(report, null, 2));
}

const problems = report.summary.fail + report.summary.warn + report.summary.unknown;
const allFailed =
  report.results.length > 0 && report.results.every(r => r && r.error);

// A run that could not check anything is a broken run, not a clean one.
// Reporting "0 errors" here would paint a broken workflow green. This
// takes precedence over --fail-on-error: a broken run is exit 1 whatever
// the flags say.
if (allFailed) {
  console.error('[GSC] ERROR: every URL failed to inspect - nothing was actually checked');
  if (report.results[0] && report.results[0].error) {
    console.error(`[GSC] first error: ${report.results[0].error}`);
  }
  console.error('[GSC] Most common cause: the service account is not added to this');
  console.error('[GSC] property (Search Console -> Settings -> Users and permissions).');
  process.exit(1);
}

if (FAIL_ON_ERROR && problems > 0) {
  console.error(`[GSC] --fail-on-error: ${problems} URL(s) are not a clean PASS`);
  process.exit(2);
}

if (problems === 0) {
  console.log('[GSC] all checked URLs are PASS - nothing to fix');
} else {
  console.log(`[GSC] ${problems} URL(s) need attention - listed above, worst first`);
}
