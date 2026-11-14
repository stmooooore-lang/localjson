/**
 * scripts/gsc-api.mjs
 *
 * Shared Google Search Console API layer for LocalJSON bots.
 * Zero dependencies — uses built-in node:crypto for JWT signing.
 *
 * Exports:
 *   - SITE_URL, SCOPE, TOKEN_URL, INSPECT_URL, SITES_URL
 *   - postJson, normalisePrivateKey, loadCredentials
 *   - createAssertion, getAccessToken
 *   - readSitemapUrls, inspectUrl, listProperties
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const SITE_URL = process.env.GSC_SITE_URL || 'https://localjson-black.vercel.app/';
export const SCOPE = 'https://www.googleapis.com/auth/webmasters';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const INSPECT_URL = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';
export const SITES_URL = 'https://searchconsole.googleapis.com/webmasters/v3/sites';

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 8000;
export const FETCH_TIMEOUT_MS = 30000;
export const BETWEEN_URLS_MS = 250;

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ----------------------------------------------------------- network */

export async function postJson(url, { headers = {}, form = null, json = null }) {
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
        parsed = null;
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

export function normalisePrivateKey(raw) {
  if (typeof raw !== 'string') return '';
  let key = raw.trim();
  if (key.length > 1 && key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
  if (key.length > 1 && key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
  if (!key.includes('-----BEGIN')) return '';
  return key.includes('\n') ? key : key.replace(/\\n/g, '\n');
}

export function loadCredentials() {
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
      throw new Error('GSC_SERVICE_ACCOUNT_JSON is set but is not valid JSON: ' + err.message);
    }
    if (sa.type !== 'service_account') {
      throw new Error('GSC_SERVICE_ACCOUNT_JSON does not look like a service-account key (type="' + sa.type + '"). Expected "service_account".');
    }
    if (!sa.client_email || !sa.private_key) {
      throw new Error('GSC_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
    }
    clientEmail = sa.client_email;
    privateKey = sa.private_key;
    fromJson = true;
  }

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing GSC credentials.\n' +
      'Set GSC_SERVICE_ACCOUNT_JSON (whole service-account file) — this is what GitHub Secrets stores.\n' +
      'Fallback fields: GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL.'
    );
  }

  privateKey = normalisePrivateKey(privateKey);
  if (!privateKey) {
    throw new Error(
      'GSC private key is not a PEM block.\n' +
      'It must start with -----BEGIN PRIVATE KEY----- (or RSA PRIVATE KEY).'
    );
  }

  if (!siteUrl) siteUrl = 'https://localjson-black.vercel.app/';

  if (!/^(https?:\/\/[^\s]+|sc-domain:[^\s]+)\/?$/.test(siteUrl)) {
    throw new Error('GSC_SITE_URL "' + siteUrl + '" is neither a URL nor a sc-domain: property');
  }

  return { clientEmail, privateKey, siteUrl, fromJson };
}

/* ----------------------------------------------------------- auth */

export function createAssertion(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/webmasters',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const b64u = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signingInput = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url') + '.' +
    Buffer.from(JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/webmasters',
      aud: 'https://oauth2.googleapis.com/token',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');
  return signingInput + '.' + signature;
}

export async function getAccessToken(creds) {
  const assertion = createAssertion(creds.clientEmail, creds.privateKey);
  const form =
    'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
    '&assertion=' + encodeURIComponent(assertion);

  const res = await postJson('https://oauth2.googleapis.com/token', { form });
  if (!res) throw new Error('could not reach Google OAuth endpoint');
  if (!res.ok || !res.json || !res.json.access_token) {
    const detail = res.json && res.json.error_description
      ? res.json.error_description
      : (res.text || '').trim().slice(0, 300);
    throw new Error('OAuth token rejected (HTTP ' + res.status + '): ' + detail);
  }
  return res.json.access_token;
}

/* ----------------------------------------------------------- data */

export function readSitemapUrls(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const xml = fs.readFileSync(filePath, 'utf8');
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());
  return [...new Set(urls)].filter(Boolean);
}

export async function listProperties(token) {
  const res = await postJson('https://searchconsole.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res || !res.ok || !res.json) return [];
  return (res.json.siteEntry || []).map(e => e.siteUrl);
}

/* ----------------------------------------------------------- inspection */

export async function inspectUrl(token, siteUrl, url) {
  const res = await postJson(
    'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    {
      headers: { Authorization: 'Bearer ' + token },
      json: { inspectionUrl: url, siteUrl, languageCode: 'en-US' },
    }
  );
  if (!res) return { url, error: 'no response' };
  if (!res.ok) {
    const detail = res.json && res.json.error ? res.json.error.message : (res.text || '').slice(0, 300);
    return { url, error: 'HTTP ' + res.status + ': ' + detail, httpStatus: res.status };
  }
  const isr = (res.json && res.json.inspectionResult && res.json.inspectionResult.indexStatusResult) || {};
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
  };
}

/* ----------------------------------------------------------- helpers */

export function isIndexed(v) {
  return v === 'PASS' && ['Submitted and indexed', 'Indexed'].includes;
}

export function verdictBucket(v) {
  if (v === 'PASS') return 'pass';
  if (v === 'NEUTRAL') return 'warn';
  if (v === 'FAIL') return 'fail';
  return 'unknown';
}