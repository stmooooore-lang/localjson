#!/usr/bin/env node
import fs from "fs";
import path from "path";

const indexPath = path.join(process.cwd(), "index.html");
const html = fs.readFileSync(indexPath, "utf-8");

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

function extractScriptContent(html, id) {
  if (id) {
    const regex = new RegExp(`<script[^>]*id="${id}"[^>]*>([\s\S]*?)<\/script>`, "i");
    const match = html.match(regex);
    return match ? match[1] : null;
  }
  const scripts = [];
  const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  return scripts.join("\n");
}

function extractI18NObject(scripts) {
  const match = scripts.match(/const\s+I18N\s*=\s*\{/);
  let pos = match.index + match[0].length - 1;
  let braceCount = 0;
  for (let i = pos; i < scripts.length; i++) {
    if (scripts[i] === "{") braceCount++;
    else if (scripts[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        let end = i + 1;
        if (scripts[end] === ";") end++;
        return scripts.slice(pos, end);
      }
    }
  }
  return null;
}

const allScripts = extractScriptContent(html);
const i18nStr = extractI18NObject(allScripts);

if (!i18nStr) {
  fail("I18N object not found in index.html");
} else {
  try {
    console.log("DEBUG: i18nStr length:", i18nStr.length);
    console.log("DEBUG: i18nStr first 500:", i18nStr.slice(0, 500));
    console.log("DEBUG: i18nStr last 200:", i18nStr.slice(-200));
    console.log("DEBUG: open braces:", (i18nStr.match(/{/g) || []).length);
    console.log("DEBUG: close braces:", (i18nStr.match(/}/g) || []).length);
    console.log("DEBUG: open brackets:", (i18nStr.match(/\[/g) || []).length);
    console.log("DEBUG: close brackets:", (i18nStr.match(/\]/g) || []).length);
    const I18N = eval("(" + i18nStr.trim().replace(/;$/, "") + ")");
    if (!I18N.en || !I18N.es) {
      fail("I18N missing en or es locale");
    } else {
      pass("I18N object exists with en and es locales");
      const enKeys = Object.keys(I18N.en).sort();
      const esKeys = Object.keys(I18N.es).sort();
      const missingInEs = enKeys.filter(k => !esKeys.includes(k));
      const missingInEn = esKeys.filter(k => !enKeys.includes(k));
      if (missingInEs.length > 0) fail("Keys missing in es: " + missingInEs.join(", "));
      if (missingInEn.length > 0) fail("Keys missing in en: " + missingInEn.join(", "));
      if (missingInEs.length === 0 && missingInEn.length === 0) pass("Key parity: " + enKeys.length + " keys in both en and es");
      const idRegex = /id=["']([^"']+)["']/g;
      const domIds = [];
      let idMatch;
      while ((idMatch = idRegex.exec(html)) !== null) {
        domIds.push(idMatch[1]);
      }
      const technicalIds = new Set([
        "schema-jsonld", "langSwitcher", "proBtn", "inp", "btn", "analyzeBtn",
        "cc", "cb", "rc", "dl", "downloadBtn", "th", "tb", "licenseKey", "checkoutLink",
        "m", "lang-en", "lang-es"
      ]);
      const translatableIds = domIds.filter(id => !technicalIds.has(id));
      const missingInI18n = translatableIds.filter(id => !I18N.en[id]);
      if (missingInI18n.length > 0) fail("DOM IDs missing from I18N: " + missingInI18n.join(", "));
      else pass("DOM id coverage: all " + translatableIds.length + " translatable IDs have I18N entries");
      const identicalKeys = enKeys.filter(k => I18N.en[k] === I18N.es[k] && I18N.en[k].trim() !== "");
      if (identicalKeys.length > 0) fail("Identical translations (en === es): " + identicalKeys.join(", "));
      else pass("No identical translations between en and es");
    }
  } catch (e) {
    fail("Failed to parse I18N object: " + e.message);
  }
}

if (html.includes("function applyLang")) {
  pass("applyLang() function declared");
} else {
  fail("applyLang() function not found");
}

if (html.includes("function initLang")) {
  pass("initLang() function declared");
} else {
  fail("initLang() function not found");
}

console.log("\n--- Summary ---");
if (exitCode === 0) console.log("All checks passed");
else {
  console.log(failures.length + " check(s) failed");
  failures.forEach(f => console.log("  - " + f));
}
process.exit(exitCode);
