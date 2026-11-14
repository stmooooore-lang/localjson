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
import { fileURLToPath } from 'node:url';

import {
  loadCredentials,
  getAccessToken,
  readSitemapUrls,
  inspectUrl,
  listProperties,
  verdictBucket,
} from './gsc-api.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITEMAP_PATH = process.env.GSC_SITEMAP || path.join(ROOT, 'sitemap.xml');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const WANT_JSON = argv.includes('--json');
const FAIL_ON_ERROR = argv.includes('--fail-on-error');

function flagValue(name) {
  const i = argv.indexOf(name);
  if (i === -1) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

const OUT_FILE = flagValue('--out');
const SINGLE_URL = flagValue('--url');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function main() {
  let creds;
  try {
    creds = loadCredentials();
  } catch (err) {
    fail('ERROR: ' + err.message);
  }

  let token;
  try {
    token = await getAccessToken(creds);
  } catch (err) {
    fail('ERROR: ' + err.message);
  }

  // If --url is given, check only that one URL; otherwise load from sitemap.
  let urls;
  if (SINGLE_URL) {
    urls = [SINGLE_URL];
  } else {
    urls = readSitemapUrls(SITEMAP_PATH);
    if (!urls.length) {
      fail('No URLs found in sitemap.xml at ' + SITEMAP_PATH);
    }
  }

  // Optionally verify the service account owns the property.
  const props = await listProperties(token);
  const owns = props.some(p => p === creds.siteUrl);
  if (!owns) {
    console.warn('[GSC] WARNING: service account does not own property ' + creds.siteUrl);
    console.warn('[GSC] Known properties: ' + (props.length ? props.join(', ') : '(none)'));
  }

  const report = {
    siteUrl: creds.siteUrl,
    serviceAccount: creds.clientEmail,
    checkedAt: new Date().toISOString(),
    urlsChecked: 0,
    summary: { pass: 0, warn: 0, fail: 0, unknown: 0 },
    results: [],
  };

  let problems = 0;
  let allFailed = true;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (i > 0) await new Promise(r => setTimeout(r, 250));

    const result = await inspectUrl(token, creds.siteUrl, url);
    report.urlsChecked++;

    if (result.error) {
      console.error('[GSC] ' + url + ' -> ' + result.error);
      report.results.push({ url, error: result.error });
      allFailed = false;
      continue;
    }

    const bucket = (result.verdict === 'PASS') ? 'pass' :
      (result.verdict === 'NEUTRAL' ? 'warn' :
        (result.verdict === 'FAIL' ? 'fail' : 'unknown'));

    if (bucket === 'fail') problems++;
    if (bucket !== 'unknown') allFailed = false;

    report.summary[bucket]++;
    report.results.push({
      url,
      verdict: result.verdict,
      coverageState: result.coverageState,
      indexingState: result.indexingState,
      pageFetchState: result.pageFetchState,
      robotsTxtState: result.robotsTxtState,
      indexingAllowed: result.indexingAllowed,
      googleCanonical: result.googleCanonical,
      userCanonical: result.userCanonical,
      crawledAs: result.crawledAs,
      lastCrawlTime: result.lastCrawlTime,
      sitemap: result.sitemap,
      referringUrls: result.referringUrls,
    });

    if (!DRY_RUN) {
      const status = result.verdict === 'PASS' ? 'OK' :
        result.verdict === 'NEUTRAL' ? 'WARN' :
          result.verdict === 'FAIL' ? 'FAIL' : 'UNK';
      console.log('[' + status + '] ' + result.coverageState.padEnd(38) + ' ' + url);
    }
  }

  if (!DRY_RUN) {
    console.log('\n============ GSC indexation report ============');
    console.log('  Property        : ' + creds.siteUrl);
    console.log('  Service account : ' + creds.clientEmail);
    console.log('  Checked at      : ' + new Date().toISOString());
    console.log('  URLs in sitemap : ' + report.urlsChecked);
    const s = report.summary;
    console.log('  PASS   (good)   : ' + s.pass);
    console.log('  NEUTRAL (warn)  : ' + s.warn);
    console.log('  FAIL   (bad)    : ' + s.fail);
    console.log('  UNKNOWN         : ' + s.unknown);
  }

  if (OUT_FILE) {
    fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2) + '\n', 'utf8');
    console.log('[GSC] Report written to ' + OUT_FILE);
  }

  // A run that could not check anything is a broken run, not a clean one.
  if (allFailed) {
    console.error('[GSC] ERROR: every URL failed to inspect - nothing was actually checked');
    if (report.results[0] && report.results[0].error) {
      console.error('[GSC] first error: ' + report.results[0].error);
    }
    console.error('[GSC] Most common cause: the service account is not added to this');
    console.error('[GSC] property (Search Console -> Settings -> Users and permissions).');
    process.exit(1);
  }

  if (FAIL_ON_ERROR && problems > 0) {
    console.error('[GSC] --fail-on-error: ' + problems + ' URL(s) are not a clean PASS');
    process.exit(2);
  }

  if (problems === 0) {
    console.log('[GSC] all checked URLs are PASS - nothing to fix');
  } else {
    console.log('[GSC] ' + problems + ' URL(s) need attention - listed above, worst first');
  }
}

main().catch(err => {
  console.error('[GSC] ERROR: ' + err.message);
  process.exit(1);
});