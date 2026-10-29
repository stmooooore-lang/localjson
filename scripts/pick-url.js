// pick-url.js - selects a URL from sitemap.xml based on day of year and sends Telegram reminder
const fs = require('fs');
const path = require('path');

const sitemapPath = path.resolve('sitemap.xml');
const xml = fs.readFileSync(sitemapPath, 'utf8');

// Extract all <loc> URLs
const locMatches = xml.match(/<loc>(.*?)<\/loc>/g);
if (!locMatches || locMatches.length === 0) {
  console.error('No <loc> entries found in sitemap.xml');
  process.exit(1);
}
const urls = locMatches.map(m => m.replace(/<\/?loc>/g, '').trim());

// Day of year (0-based)
const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const diff = now - start;
const oneDay = 1000 * 60 * 60 * 24;
const dayOfYear = Math.floor(diff / oneDay);

const index = dayOfYear % urls.length;
const selectedUrl = urls[index];

const gscBase = 'https://search.google.com/search-console/inspect?resource_id=https://localjson-black.vercel.app/&url=';
const gscLink = gscBase + encodeURIComponent(selectedUrl);

const message = `⏰ Напоминание: запросите индексацию в GSC для ${selectedUrl}\nСсылка на GSC: ${gscLink}`;

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars');
  process.exit(1);
}

async function sendTelegram() {
  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Telegram API error:', data);
    process.exit(1);
  }
  console.log('Telegram message sent:', data.result.message_id);
}

sendTelegram().catch(err => {
  console.error('Failed to send Telegram message:', err);
  process.exit(1);
});