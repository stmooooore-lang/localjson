#!/usr/bin/env node
/**
 * bin/make-screenshot.mjs — capture a PNG screenshot of the LocalJSON app.
 *
 * Opens the production site in headless Chromium, pastes a small test
 * dataset, runs "Analyze Data Structure", waits for the results table,
 * and saves a viewport screenshot to blog/assets/.
 *
 * Usage:
 *   node bin/make-screenshot.mjs [output-name]
 *   (default output-name: screenshot-default.png)
 *
 * Only dependency: playwright (devDependency, see package.json).
 * On any failure (element not found, timeout) exits 1 with a clear
 * message and leaves no partial file behind.
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = 'https://localjson-black.vercel.app/';
const DEFAULT_NAME = 'screenshot-default.png';
const TIMEOUT_MS = 30_000;
const RENDER_SETTLE_MS = 500;

// Test dataset pasted into the input area (same as docs examples).
const TEST_JSON = JSON.stringify([
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: null }
]);

function die(msg) {
    console.error(`[make-screenshot] ERROR ${msg}`);
    process.exit(1);
}

function resolveName(raw) {
    let name = raw || DEFAULT_NAME;
    if (!name.endsWith('.png')) name += '.png';
    if (!/^[a-z0-9][a-z0-9-]*\.png$/.test(name)) {
        die(`invalid output name "${name}" — use lowercase letters, digits and hyphens`);
    }
    return name;
}

async function main() {
    const name = resolveName(process.argv[2]);
    const outPath = path.join(ROOT, 'blog', 'assets', name);

    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

        // 1. Load the page and wait for network idle.
        await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });

        // 2. Paste the test JSON into the input area.
        await page.fill('#inp', TEST_JSON);

        // 3. Run the analysis.
        await page.click('#btn');

        // 4. Wait for the results grid: the row-count badge loses "hidden"
        //    and the table body gets real data rows.
        await page.waitForSelector('#rc:not(.hidden)', { timeout: TIMEOUT_MS });
        await page.waitForFunction(
            () => document.querySelectorAll('#tb tr td:not([colspan])').length > 0,
            { timeout: TIMEOUT_MS }
        );

        // 5. Let the grid settle, then capture the visible area.
        await page.waitForTimeout(RENDER_SETTLE_MS);
        await page.screenshot({ path: outPath, type: 'png', fullPage: false });

        const size = fs.statSync(outPath).size;
        console.log(`[make-screenshot] saved blog/assets/${name} (${size} bytes)`);
    } catch (err) {
        // Never leave a partial file behind.
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
        throw err;
    } finally {
        await browser.close();
    }
}

main().catch(err => {
    console.error(`[make-screenshot] ERROR ${err && err.message ? err.message : err}`);
    process.exit(1);
});
