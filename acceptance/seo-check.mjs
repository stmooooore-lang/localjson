#!/usr/bin/env node
import fs from "fs";
import path from "path";

const root = process.cwd();
const indexPath = path.join(root, "index.html");
const robotsPath = path.join(root, "robots.txt");
const sitemapPath = path.join(root, "sitemap.xml");

const html = fs.readFileSync(indexPath, "utf-8");
const robots = fs.readFileSync(robotsPath, "utf-8");
const sitemap = fs.readFileSync(sitemapPath, "utf-8");

let exitCode = 0;
const failures = [];

function fail(msg) {
  failures.push(msg);
  exitCode = 1;
  console.error("FAIL: " + msg);
}

function pass(msg) {
  console.log("PASS: " + msg);
}

// 1. robots.txt contains Sitemap line
if (robots.includes("Sitemap: https://localjson-black.vercel.app/sitemap.xml")) {
  pass("robots.txt contains Sitemap URL");
} else {
  fail("robots.txt missing Sitemap URL");
}

// 2. sitemap.xml is well-formed XML and has at least one <loc>
try {
  const locMatch = sitemap.match(/<loc[^>]*>([^<]+)<\/loc>/);
  if (locMatch) {
    pass("sitemap.xml is well-formed and contains at least one <loc> element");
  } else {
    fail("sitemap.xml missing <loc> element");
  }
} catch (e) {
  fail("sitemap.xml is not well-formed XML: " + e.message);
}

// 3. index.html line ~19 has canonical link
const canonicalRegex = /<link rel="canonical" href="https:\/\/localjson-black\.vercel\.app\/"[^>]*>/;
if (canonicalRegex.test(html)) {
  pass("index.html has canonical link tag");
} else {
  fail("index.html missing canonical link tag");
}

// 4. index.html lines ~20-22 have three hreflang tags for en, es, x-default
const hreflangEn = /<link rel="alternate" hreflang="en" href="https:\/\/localjson-black\.vercel\.app\/"[^>]*>/;
const hreflangEs = /<link rel="alternate" hreflang="es" href="https:\/\/localjson-black\.vercel\.app\/es\/"[^>]*>/;
const hreflangXDefault = /<link rel="alternate" hreflang="x-default" href="https:\/\/localjson-black\.vercel\.app\/"[^>]*>/;

if (hreflangEn.test(html) && hreflangEs.test(html) && hreflangXDefault.test(html)) {
  pass("index.html has three hreflang tags (en, es, x-default)");
} else {
  fail("index.html missing one or more hreflang tags");
}

// 5. JSON-LD script with SoftwareApplication and FAQPage types
const schemaScriptMatch = html.match(/<script type="application\/ld\+json" id="schema-jsonld"[^>]*>([\s\S]*?)<\/script>/i);
if (schemaScriptMatch) {
  try {
    const schemaJson = JSON.parse(schemaScriptMatch[1].trim());
    const graph = schemaJson["@graph"] || [];
    const hasSoftwareApp = graph.some(item => item["@type"] === "SoftwareApplication");
    const hasFAQPage = graph.some(item => item["@type"] === "FAQPage");
    if (hasSoftwareApp && hasFAQPage) {
      pass("JSON-LD contains SoftwareApplication and FAQPage types");
    } else {
      fail("JSON-LD missing SoftwareApplication or FAQPage type");
    }
  } catch (e) {
    fail("JSON-LD script content is not valid JSON: " + e.message);
  }
} else {
  fail("index.html missing JSON-LD script with id=schema-jsonld");
}

// 6. Open Graph and Twitter Card meta tags (lines ~28-33)
const ogTitle = /<meta property="og:title" content="([^"]+)"[^>]*>/;
const ogDesc = /<meta property="og:description" content="([^"]+)"[^>]*>/;
const ogImage = /<meta property="og:image" content="([^"]+)"[^>]*>/;
const twitterCard = /<meta name="twitter:card" content="([^"]+)"[^>]*>/;

const ogTitleMatch = html.match(ogTitle);
const ogDescMatch = html.match(ogDesc);
const ogImageMatch = html.match(ogImage);
const twitterCardMatch = html.match(twitterCard);

if (ogTitleMatch && ogTitleMatch[1].trim() !== "") {
  pass("og:title meta tag present and non-empty");
} else {
  fail("og:title meta tag missing or empty");
}
if (ogDescMatch && ogDescMatch[1].trim() !== "") {
  pass("og:description meta tag present and non-empty");
} else {
  fail("og:description meta tag missing or empty");
}
if (ogImageMatch && ogImageMatch[1].trim() !== "") {
  pass("og:image meta tag present and non-empty");
} else {
  fail("og:image meta tag missing or empty");
}
if (twitterCardMatch && twitterCardMatch[1].trim() !== "") {
  pass("twitter:card meta tag present and non-empty");
} else {
  fail("twitter:card meta tag missing or empty");
}

// 7. Semantic HTML structure: header, main, footer tags present
if (html.includes("<header") || html.includes("<header>")) {
  pass("index.html has <header> tag");
} else {
  fail("index.html missing <header> tag");
}
if (html.includes("<main") || html.includes("<main>")) {
  pass("index.html has <main> tag");
} else {
  fail("index.html missing <main> tag");
}
if (html.includes("<footer") || html.includes("<footer>")) {
  pass("index.html has <footer> tag");
} else {
  fail("index.html missing <footer> tag");
}

// 8. Footer links to offline version and docs (lines ~438-439)
const offlineLink = /<a href="LocalJSON_Pro_Offline_Version\.html"[^>]*>/;
const docsLink = /<a href="LocalJSON_Pro_Documentation_and_License_Key\.html"[^>]*>/;

if (offlineLink.test(html)) {
  pass("Footer has link to LocalJSON_Pro_Offline_Version.html");
} else {
  fail("Footer missing link to LocalJSON_Pro_Offline_Version.html");
}
if (docsLink.test(html)) {
  pass("Footer has link to LocalJSON_Pro_Documentation_and_License_Key.html");
} else {
  fail("Footer missing link to LocalJSON_Pro_Documentation_and_License_Key.html");
}

console.log("\n--- Summary ---");
if (exitCode === 0) console.log("All checks passed");
else {
  console.log(failures.length + " check(s) failed");
  failures.forEach(f => console.log("  - " + f));
}
process.exit(exitCode);