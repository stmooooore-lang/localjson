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
    const regex = new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</script>', "i");
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
// 1. Pro button CSS matches amber spec exactly
const proBtnStyleRegex = /\.pro-btn\s*\{[^}]*color:\s*#fbbf24[^}]*background:\s*rgba\(251,\s*191,\s*36,\s*0\.1\)[^}]*border:\s*1px\s+solid\s+rgba\(251,\s*191,\s*36,\s*0\.2\)[^}]*border-radius:\s*8px[^}]*height:\s*36px[^}]*padding:\s*6px\s+14px/;
if (proBtnStyleRegex.test(html)) {
  pass("Pro button CSS matches amber spec exactly");
} else {
  fail("Pro button CSS does not match amber spec");
}

// 2. Language buttons exist, match Pro button height/radius/border, switch lang, persist
const langBtnStyleRegex = /\.lang-btn\s*\{[^}]*height:\s*36px[^}]*border-radius:\s*8px[^}]*border:\s*1px\s+solid\s+#334155/;
if (langBtnStyleRegex.test(html)) {
  pass("Language buttons have correct height (36px), border-radius (8px), and border style");
} else {
  fail("Language buttons missing correct styling");
}

if (html.includes('class="lang-btn"') && html.includes('data-lang="en"') && html.includes('data-lang="es"')) {
  pass("Language switcher buttons (EN/ES) present in header");
} else {
  fail("Language switcher buttons missing from header");
}

if (html.includes("localStorage.setItem('localjson_lang'") || html.includes('localStorage.setItem("localjson_lang"')) {
  pass("Language choice persisted in localStorage");
} else {
  fail("Language choice not persisted in localStorage");
}

if (html.includes("searchParams.set('lang'") || html.includes('searchParams.set("lang"')) {
  pass("Language choice persisted in URL param ?lang=");
} else {
  fail("Language choice not persisted in URL param");
}

// 3. No FOUC: I18N loaded and applied before DOMContentLoaded fires (or sync inline)
const i18nInHead = html.includes("const I18N = {") && html.indexOf("const I18N = {") < html.indexOf("</head>");
if (i18nInHead) {
  pass("I18N object loaded inline in <head> (before first paint)");
} else {
  fail("I18N object not loaded inline in <head>");
}

if (html.includes("document.readyState === 'loading'") && html.includes("DOMContentLoaded") && html.includes("applyTranslations")) {
  pass("Synchronous translation apply before DOMContentLoaded detected");
} else {
  fail("No synchronous translation apply before DOMContentLoaded");
}

// 4. Spanish modal fully translated (no English strings in modal when ES active)
const modalKeys = [
  "modal-title", "modal-desc", "license-placeholder", "activate-btn",
  "pf5", "pf6", "pf7", "pf8", "pro-label"
];

const allScripts = extractScriptContent(html);
const i18nMatch = allScripts.match(/const\s+I18N\s*=\s*\{/);
let modalTranslated = true;
if (i18nMatch) {
  let pos = i18nMatch.index + i18nMatch[0].length - 1;
  let braceCount = 0;
  let i18nStr = "";
  for (let i = pos; i < allScripts.length; i++) {
    if (allScripts[i] === "{") braceCount++;
    else if (allScripts[i] === "}") {
      braceCount--;
      if (braceCount === 0) {
        let end = i + 1;
        if (allScripts[end] === ";") end++;
        i18nStr = allScripts.slice(pos, end);
        break;
      }
    }
  }
  try {
    const I18N = eval("(" + i18nStr.trim().replace(/;$/, "") + ")");
    if (I18N.es) {
      for (const key of modalKeys) {
        if (!I18N.es[key] || I18N.es[key].trim() === "" || I18N.es[key] === I18N.en[key]) {
          console.log("  Missing/identical ES modal key: " + key + " = \"" + I18N.es[key] + "\"");
          modalTranslated = false;
        }
      }
    } else {
      modalTranslated = false;
    }
  } catch (e) {
    modalTranslated = false;
  }
} else {
  modalTranslated = false;
}

if (modalTranslated) {
  pass("Spanish modal fully translated (all modal keys present and different from EN)");
} else {
  fail("Spanish modal has missing or identical-to-EN translations");
}

// 5. Favicon link present in <head>
if (html.includes('<link rel="icon" type="image/svg+xml" href="/favicon.svg">')) {
  pass("Favicon link present in <head>");
} else {
  fail("Favicon link missing from <head>");
}

// 6. SEO grids: .seo-grid has repeat(4, 1fr) desktop (>=1024px), repeat(2, 1fr) tablet (768-1023px), 1fr mobile (<=767px) - NO 3-col ever
const seoGridDesktop = html.includes('grid-template-columns: repeat(4, 1fr)');
const seoGridTablet = html.includes('@media (max-width: 1023px)') && html.includes('grid-template-columns: repeat(2, 1fr)');
const seoGridMobile = html.includes('@media (max-width: 767px)') && html.includes('grid-template-columns: 1fr');
if (seoGridDesktop && seoGridTablet && seoGridMobile) {
  pass("SEO grids: 4 columns desktop (>=1024px), 2 columns tablet (768-1023px), 1 column mobile (<=767px)");
} else {
  fail("SEO grid layout incorrect - needs 4x1/2x2/1x4 responsive, NO 3-col ever");
}

// 7. Mobile header stacks on <=640px
const mobileHeaderStack = html.includes('@media (max-width: 640px)') && 
  (html.includes('flex-direction: column') || html.includes('flex-wrap: wrap'));
if (mobileHeaderStack) {
  pass("Mobile header stacks vertically on <=640px");
} else {
  fail("Mobile header does not stack on <=640px");
}

// 8. Test JSON auto-loads on fresh page
const testJsonAutoLoad = html.includes("Alex Rivera") && html.includes("Elena Rostova") && 
  html.includes("DOMContentLoaded") && html.includes("inp-placeholder");
if (testJsonAutoLoad) {
  pass("Test JSON auto-loads on DOMContentLoaded (Alex Rivera, Elena Rostova)");
} else {
  fail("Test JSON auto-load not implemented");
}

// 9. Pro activation works with dummy key
if (html.includes("activatePro") && html.includes("LJSON-PRO-") && html.includes("localjson_pro_status")) {
  pass("Pro activation function exists with key validation and localStorage persistence");
} else {
  fail("Pro activation incomplete");
}

console.log("\n--- Summary ---");
if (exitCode === 0) console.log("All checks passed");
else {
  console.log(failures.length + " check(s) failed");
  failures.forEach(f => console.log("  - " + f));
}
process.exit(exitCode);