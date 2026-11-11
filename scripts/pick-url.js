// pick-url.js - interactive GSC indexing-reminder bot.
//
// Maintains a persistent queue of URLs (state/gsc-queue.json) that still
// need to be submitted to Google Search Console, and sends a daily
// reminder for the first URL in the queue with two inline buttons:
//
//   "✅ Готово"  -> the URL is indexed, drop it from the queue
//   "⏳ Квота"   -> GSC daily quota used up, keep the URL at the head
//                   of the queue so it is retried tomorrow
//
// Button presses are read via Telegram Bot API getUpdates (offset is
// tracked as lastUpdateId), so the workflow can commit the state file
// back to the repo between runs.
//
// Flow per run:
//   1. getUpdates (offset = lastUpdateId)  -> consume button presses
//   2. mutate pending accordingly, save lastUpdateId
//   3. take first pending URL (or report "all done")
//   4. sendMessage with InlineKeyboardMarkup
//
// Requires: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const STATE_PATH = path.join(ROOT, 'state', 'gsc-queue.json');

const GSC_BASE =
  'https://search.google.com/search-console/inspect?resource_id=https://localjson-black.vercel.app/&url=';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !CHAT_ID) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars');
  process.exit(1);
}

/* ------------------------------------------------------------- state I/O */

function readSitemapUrls() {
  if (!fs.existsSync(SITEMAP_PATH)) {
    console.error('sitemap.xml not found at ' + SITEMAP_PATH);
    return [];
  }
  const xml = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const matches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
  return matches.map(m => m.replace(/<\/?loc>/g, '').trim()).filter(Boolean);
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    // First run: seed from sitemap, keeping sitemap order.
    const urls = readSitemapUrls();
    console.log('[queue] state file absent, seeding from sitemap (' + urls.length + ' URLs)');
    return { pending: urls, lastUpdateId: 0 };
  }
  try {
    const raw = fs.readFileSync(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
      lastUpdateId: Number.isFinite(parsed.lastUpdateId) ? parsed.lastUpdateId : 0,
    };
  } catch (err) {
    console.error('[queue] failed to parse ' + STATE_PATH + ': ' + err.message);
    console.error('[queue] falling back to sitemap order');
    return { pending: readSitemapUrls(), lastUpdateId: 0 };
  }
}

function saveState(state) {
  const json = JSON.stringify(state, null, 2) + '\n';
  try {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    // Write-then-rename so a crash mid-write cannot truncate the state.
    const tmp = STATE_PATH + '.tmp';
    fs.writeFileSync(tmp, json, 'utf8');
    fs.renameSync(tmp, STATE_PATH);
    console.log('[queue] state saved -> ' + STATE_PATH);
  } catch (err) {
    // Not fatal: the reminder still goes out, state just stays stale.
    console.warn('[queue] could not save state: ' + err.message);
  }
}

/* -------------------------------------------------------- telegram calls */

const API = 'https://api.telegram.org/bot' + TOKEN;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 10000;
const FETCH_TIMEOUT_MS = 20000;

async function tg(method, body, label) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      let res;
      try {
        res = await fetch(API + '/' + method, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const data = await res.json();
      if (!res.ok) {
        console.error('[' + label + '] API error (attempt ' + attempt + '):', data);
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        return null;
      }
      return data;
    } catch (err) {
      console.warn(
        '[' + label + '] network error (attempt ' + attempt + '/' + MAX_ATTEMPTS + '): ' + err.message
      );
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return null;
    }
  }
  return null;
}

// Telegram's HTML parse mode rejects raw &, < and > in the message text and
// fails the send outright, so any URL carrying a query string is escaped
// before it goes into <code>.
const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const getUpdates = offset =>
  tg('getUpdates', { offset, timeout: 0, allowed_updates: ['callback_query'] }, 'getUpdates');

const answerCallbackQuery = (id) =>
  tg('answerCallbackQuery', { callback_query_id: id }, 'answerCallback');

// Replaces the message text and drops the inline keyboard in one call, so
// the buttons visually disappear once acted on. Non-fatal: Telegram
// rejects edits on messages older than 48h or when nothing changed.
const editMessageText = (chatId, messageId, text) =>
  tg(
    'editMessageText',
    {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [] },
    },
    'editMessageText'
  );

const sendMessage = (text, replyMarkup) =>
  tg(
    'sendMessage',
    {
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup, // undefined -> omitted -> plain text
    },
    'sendMessage'
  );

/* ------------------------------------------------------------------- main */

async function main() {
  const state = loadState();

  // --- 1. drain pending button presses --------------------------------
  let offset = state.lastUpdateId || 0;
  const updatesData = await getUpdates(offset);

  if (updatesData && updatesData.ok) {
    const updates = updatesData.result || [];
    console.log('[queue] ' + updates.length + ' new update(s) from offset ' + offset);

    let doneCount = 0;
    let quotaCount = 0;

    // Single chronological pass: acknowledge each button, then apply its
    // effect. "quota" leaves the head URL in place (retried next run);
    // "done" drops it.
    for (const update of updates) {
      // Track the highest seen id so the next run starts after it.
      if (update.update_id >= offset) offset = update.update_id + 1;

      const cb = update.callback_query;
      if (!cb) continue;

      console.log('[queue] callback_query data=' + cb.data + ' from=' + (cb.from && cb.from.id));

      // Stop the spinner on the button; non-fatal if it fails.
      await answerCallbackQuery(cb.id);

      // Feedback shown in place of the prompt, replacing the keyboard.
      const chatId = cb.message && cb.message.chat && cb.message.chat.id;
      const messageId = cb.message && cb.message.message_id;
      const ackInPlace = (status) => {
        if (!chatId || !messageId) return Promise.resolve();
        return editMessageText(chatId, messageId, status);
      };

      if (cb.data === 'done') {
        doneCount++;
        if (state.pending.length > 0) {
          const removed = state.pending.shift();
          console.log('[queue] DONE -> removed from queue: ' + removed);
          await ackInPlace(
            '✅ Принято: проиндексировано\n<code>' + escapeHtml(removed) + '</code>'
          );
        } else {
          console.log('[queue] DONE ignored, queue already empty');
          await ackInPlace('✅ Принято: очередь уже пуста');
        }
      } else if (cb.data === 'quota') {
        quotaCount++;
        const head = state.pending[0] || '(очередь пуста)';
        console.log('[queue] QUOTA -> kept at head: ' + head);
        await ackInPlace(
          '⏳ Принято: квота GSC. Повтор завтра\n<code>' + escapeHtml(head) + '</code>'
        );
      } else {
        console.log('[queue] unknown callback data, ignored: ' + cb.data);
      }
    }

    console.log('[queue] processed presses: ' + doneCount + ' done, ' + quotaCount + ' quota');
  } else {
    // getUpdates failed on all retries. Proceed with the local queue;
    // the offset stays as-is and the same button may be re-read later,
    // which is safe: "quota" is idempotent and a repeat "done" just
    // shifts whatever is now at the head.
    console.warn('[queue] getUpdates unavailable — proceeding with local queue state');
  }

  // --- 3. pick the head of the queue -----------------------------------
  const nextUrl = state.pending[0];

  let message;
  let replyMarkup;

  if (!nextUrl) {
    message = '✅ Все страницы проиндексированы. Очередь GSC пуста.';
    replyMarkup = undefined; // no buttons when there is nothing to act on
    console.log('[queue] queue empty — nothing to submit today');
  } else {
    const gscLink = GSC_BASE + encodeURIComponent(nextUrl);
    message =
      '⏰ Запросите индексацию в GSC\n' +
      '<code>' + escapeHtml(nextUrl) + '</code>' +
      '\n\nОсталось в очереди: ' +
      state.pending.length +
      ' стр.';
    // URL button first: one tap opens GSC pre-filled with this URL, no
    // need to copy the long inspect link out of the message body.
    replyMarkup = {
      inline_keyboard: [
        [{ text: '🔗 Открыть GSC', url: gscLink }],
        [{ text: '✅ Готово', callback_data: 'done' }],
        [{ text: '⏳ Квота', callback_data: 'quota' }],
      ],
    };
    console.log('[queue] next URL to index: ' + nextUrl);
  }

  // --- 4. persist state BEFORE sending ----------------------------------
  // Saving first means a failed send still advances lastUpdateId, so
  // button presses are not re-processed forever.
  state.lastUpdateId = offset;
  saveState(state);

  const sent = await sendMessage(message, replyMarkup);
  if (!sent) {
    console.error('Failed to send Telegram message after retries');
    process.exit(1);
  }
  console.log('Telegram message sent, message_id=' + sent.result.message_id);
}

main().catch(err => {
  console.error('Failed to send Telegram message:', err);
  process.exit(1);
});
