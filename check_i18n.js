const fs = require('fs');
const html = fs.readFileSync('/Users/moore/my work/localjson/index.html', 'utf-8');
const allScripts = [];
const regex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  allScripts.push(match[1]);
}
const scripts = allScripts.join('\n');
console.log('Total scripts:', allScripts.length);
for (let i = 0; i < allScripts.length; i++) {
  if (allScripts[i].includes('const I18N = {')) {
    console.log('Script', i, 'has const I18N');
    console.log('First 200 chars:', allScripts[i].substring(0, 200));
    console.log('Last 200 chars:', allScripts[i].slice(-200));
  }
}
const i18nMatch = scripts.match(/const\s+I18N\s*=\s*\{/);
if (i18nMatch) {
  console.log('Match found at:', i18nMatch.index);
  let pos = i18nMatch.index + i18nMatch[0].length - 1;
  let braceCount = 0;
  let i18nStr = '';
  for (let i = pos; i < scripts.length; i++) {
    if (scripts[i] === '{') braceCount++;
    else if (scripts[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        let end = i + 1;
        if (scripts[end] === ';') end++;
        i18nStr = scripts.slice(pos, end);
        break;
      }
    }
  }
  console.log('I18N string length:', i18nStr.length);
  console.log('First 100 chars:', i18nStr.substring(0, 100));
  console.log('Last 100 chars:', i18nStr.slice(-100));
  try {
    const I18N = eval('(' + i18nStr.trim().replace(/;$/, '') + ')');
    console.log('I18N.es:', I18N.es);
    const modalKeys = ['modal-title', 'modal-desc', 'license-placeholder', 'activate-btn', 'pf5', 'pf6', 'pf7', 'pf8', 'pro-label'];
    for (const key of modalKeys) {
      console.log(key, ':', I18N.es[key]);
    }
  } catch (e) {
    console.error('Parse error:', e);
  }
}