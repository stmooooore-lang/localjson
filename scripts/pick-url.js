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
//   3. GSC filter: remove URLs that are already indexed (PASS + Submitted and indexed)
//   4. take first pending URL (or report "all done")
//   5. sendMessage with InlineKeyboardMarkup
//
// Requires: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// Optional: GSC_SERVICE_ACCOUNT_JSON for automatic GSC filtering

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const STATE_PATH = path.join(ROOT, 'state', 'gsc-queue.json');

const GSC_BASE =
  'https://search.google.com/search-console/inspect?resource_id=https://localjson-black.vercel.app/&url=';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// The reminder itself is rate-limited. The workflow used to run once a day
// and could therefore send on every wake-up; it now runs every 15 minutes
// (see .github/workflows/daily-index-reminder.yml) so that button presses
// get answered within minutes instead of the next morning. That makes a
// guard necessary: without it the chat would receive ~96 reminders a day.
// Only the *send* is gated — getUpdates and the press handling still run on
// every wake-up, which is the whole point of the new schedule.
//
// Timezone is Spanish time: the /es/ version is why the bot's prompts are in
// Russian for the owner but the product audience is Spanish-speaking, so
// reminders are anchored to Madrid rather than to the runner's UTC clock.
// Override with BOT_TZ.
const BOT_TZ = process.env.BOT_TZ || 'Europe/Madrid';
const BOT_SEND_FROM_HOUR = Number.isFinite(Number(process.env.BOT_SEND_FROM_HOUR))
  ? Number(process.env.BOT_SEND_FROM_HOUR)
  : 9; // 09:00 local — a single reminder per morning

// Calendar date in the bot's timezone, not in UTC: GitHub Actions runs in
// UTC, so a UTC "day" boundary would put the reminder at 01:00-03:00 in
// Spanish time, in the middle of the night.
function zonedToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOT_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = t => (parts.find(p => p.type === t) || {}).value || '';
  return { date: get('year') + '-' + get('month') + '-' + get('day'), hour: Number(get('hour')) || 0 };
}

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
    // Spread first so fields this script does not own (lastSentDate, and
    // anything a later version adds) survive a save instead of being
    // silently dropped.
    return {
      ...parsed,
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

/* -------------------------------------------------------- GSC filtering */

// GSC filtering is optional: if GSC_SERVICE_ACCOUNT_JSON is not set,
// the bot works without it (legacy behaviour).
async function filterIndexedUrls(state) {
  const saJson = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    console.log('[queue] GSC_SERVICE_ACCOUNT_JSON not set — skipping GSC filter');
    return state;
  }

  // Dynamic import works from CommonJS; the module is ESM but exports
  // are static so await import() returns the namespace.
  const gsc = await import('./gsc-api.mjs');

  let creds;
  try {
    creds = gsc.loadCredentials();
  } catch (err) {
    console.warn('[queue] GSC credentials invalid: ' + err.message);
    return state;
  }

  let token;
  try {
    token = await gsc.getAccessToken(creds);
  } catch (err) {
    console.warn('[queue] GSC auth failed: ' + err.message);
    return state;
  }

  // We only check the URLs currently in the queue.
  const urls = state.pending;
  if (!urls.length) {
    console.log('[queue] queue empty — nothing to filter');
    return state;
  }

  console.log('[queue] checking ' + urls.length + ' URL(s) against GSC...');

  const filtered = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (i > 0) await new Promise(r => setTimeout(r, 250)); // polite delay

    let result;
    try {
      const res = await gsc.inspectUrl(token, gsc.SITE_URL, url);
      result = res;
    } catch (err) {
      console.warn('[queue] GSC inspect error for ' + url + ': ' + err.message);
      filtered.push(url); // keep on error — don't drop silently
      continue;
    }

    if (result.error) {
      console.warn('[queue] ' + url + ' -> GSC error: ' + result.error);
      filtered.push(url); // keep on error
      continue;
    }

    const isIndexed = result.verdict === 'PASS' &&
      (result.coverageState === 'Submitted and indexed' || result.coverageState === 'Indexed');

    if (isIndexed) {
      console.log('[queue] DROPPING (already indexed): ' + url + ' [' + result.coverageState + ']');
      // Do NOT add to filtered — drop it
    } else {
      console.log('[queue] KEEPING (not indexed): ' + url + ' [' + result.coverageState + ']');
      filtered.push(url);
    }

    // Polite delay between API calls
    if (i < urls.length - 1) await new Promise(r => setTimeout(r, 250));
  }

  const dropped = urls.length - filtered.length;
  if (dropped > 0) {
    console.log('[queue] GSC filter: dropped ' + dropped + ' indexed URL(s), ' + filtered.length + ' remain');
  }
  state.pending = filtered;
  return state;
}

/* -------------------------------------------------------- state I/O */

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
    // Spread first so fields this script does not own (lastSentDate, and
    // anything a later version adds) survive a save instead of being
    // silently dropped.
    return {
      ...parsed,
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
  String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');

const getUpdates = offset =>
  tg('getUpdates', { offset, timeout: 0, allowed_updates: ['callback_query'] }, 'getUpdates');

const answerCallbackQuery = (id, text) =>
  tg(
    'answerCallbackQuery',
    text ? { callback_query_id: id, text } : { callback_query_id: id },
    'answerCallback'
  );

// Toast text shown on the pressed button. Answering with text is what makes
// the press visible; answering without it only stops the spinner silently.
const TOAST = {
  done: '✅ Принято!',
  quota: '⏳ Сработала квота',
};

// Message that replaces the prompt after a press, replacing the keyboard.
const ackText = (text, count) => text + ' Осталось в очереди: ' + count + ' стр.';

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
  let state = loadState();

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

      // Stop the spinner on the button and confirm the press with a toast;
      // non-fatal if it fails.
      await answerCallbackQuery(cb.id, TOAST[cb.data]);

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
          await ackInPlace(ackText('✅ Индекс страницы запрошен.', state.pending.length));
        } else {
          console.log('[queue] DONE ignored, queue already empty');
          await ackInPlace(ackText('✅ Индекс страницы запрошен.', state.pending.length));
        }
      } else if (cb.data === 'quota') {
        quotaCount++;
        const head = state.pending[0] || '(очередь пуста)';
        console.log('[queue] QUOTA -> kept at head: ' + head);
        await ackInPlace(ackText('⏳ Сработала квота.', state.pending.length));
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

  // --- 2. GSC filter: drop URLs that are already indexed ----------------
  state = await filterIndexedUrls(state);

  // --- 3. pick the head of the queue -----------------------------------
  const nextUrl = state.pending[0];

  // --- 4. persist state BEFORE sending ----------------------------------
  // Saving first means a failed send still advances lastUpdateId, so
  // button presses are not re-processed forever.
  state.lastUpdateId = offset;
  saveState(state);

  // --- 5. send, but at most one reminder per morning ---------------------
  // Presses were already handled above and the state is already saved, so
  // skipping the send is a complete run: the bot woke up, did its job, and
  // goes back to sleep without spamming the chat 96 times a day.
  const today = zonedToday();
  const alreadySent = state.lastSentDate === today.date;
  const inSendWindow = today.hour >= BOT_SEND_FROM_HOUR;

  if (alreadySent) {
    console.log('[queue] reminder already sent today (' + today.date + ') — not sending again');
  } else if (!inSendWindow) {
    console.log(
      '[queue] before the send window (hour ' + today.hour + ' < ' + BOT_SEND_FROM_HOUR +
      ' in ' + BOT_TZ + ') — press checks only, not sending'
    );
  }

  if (alreadySent || !inSendWindow) return;

  let message;
  let replyMarkup;

  if (!nextUrl) {
    message = '✅ Все страницы проиндексированы. Очередь GSC пуста.';
    replyMarkup = undefined; // no buttons when there is nothing to act on
    console.log('[queue] queue empty — nothing to submit today');
  } else {
    const gscLink = GSC_BASE + encodeURIComponent(nextUrl);
    // The inspect link is printed as bare text, not as an <a> anchor: Telegram
    // pops a confirmation dialog for links in the message body, and a raw URL
    // is only offered for copy — no dialog, no dead end. It still has to be
    // escaped, because parse_mode is HTML and a bare & fails the parse.
    message =
      '⏰ Запросите индексацию в GSC\n\n' +
      escapeHtml(gscLink) +
      '\n\nСтраница (клик — копирование):\n' +
      '<code>' + escapeHtml(nextUrl) + '</code>' +
      '\n\nОсталось в очереди: ' +
      state.pending.length +
      ' стр.';
    // No URL button: an inline-keyboard URL button also raises a confirmation
    // dialog, which costs an extra tap. The message carries both URLs as text,
    // and these buttons only report what was done.
    replyMarkup = {
      inline_keyboard: [
        [{ text: '✅ Готово', callback_data: 'done' }],
        [{ text: '⏳ Квота', callback_data: 'quota' }],
      ],
    };
    console.log('[queue] next URL to index: ' + nextUrl);
  }

  const sent = await sendMessage(message, replyMarkup);
  if (!sent) {
    console.error('Failed to send Telegram message after retries');
    process.exit(1);
  }
  // Recorded only after a successful send, so a failed run retries later
  // the same morning instead of staying silent until tomorrow.
  state.lastSentDate = today.date;
  saveState(state);
  console.log('Telegram message sent, message_id=' + sent.result.message_id);
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
  String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>');

const getUpdates = offset =>
  tg('getUpdates', { offset, timeout: 0, allowed_updates: ['callback_query'] }, 'getUpdates');

const answerCallbackQuery = (id, text) =>
  tg(
    'answerCallbackQuery',
    text ? { callback_query_id: id, text } : { callback_query_id: id },
    'answerCallback'
  );

// Toast text shown on the pressed button. Answering with text is what makes
// the press visible; answering without it only stops the spinner silently.
const TOAST = {
  done: '✅ Принято!',
  quota: '⏳ Сработала квота',
};

// Message that replaces the prompt after a press, replacing the keyboard.
const ackText = (text, count) => text + ' Осталось в очереди: ' + count + ' стр.';

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
  let state = loadState();

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

      // Stop the spinner on the button and confirm the press with a toast;
      // non-fatal if it fails.
      await answerCallbackQuery(cb.id, TOAST[cb.data]);

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
          await ackInPlace(ackText('✅ Индекс страницы запрошен.', state.pending.length));
        } else {
          console.log('[queue] DONE ignored, queue already empty');
          await ackInPlace(ackText('✅ Индекс страницы запрошен.', state.pending.length));
        }
      } else if (cb.data === 'quota') {
        quotaCount++;
        const head = state.pending[0] || '(очередь пуста)';
        console.log('[queue] QUOTA -> kept at head: ' + head);
        await ackInPlace(ackText('⏳ Сработала квота.', state.pending.length));
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

  // --- 2. GSC filter: drop URLs that are already indexed ----------------
  state = await filterIndexedUrls(state);

  // --- 3. pick the head of the queue -----------------------------------
  const nextUrl = state.pending[0];

  // --- 4. persist state BEFORE sending ----------------------------------
  // Saving first means a failed send still advances lastUpdateId, so
  // button presses are not re-processed forever.
  state.lastUpdateId = offset;
  saveState(state);

  // --- 5. send, but at most one reminder per morning ---------------------
  // Presses were already handled above and the state is already saved, so
  // skipping the send is a complete run: the bot woke up, did its job, and
  // goes back to sleep without spamming the chat 96 times a day.
  const today = zonedToday();
  const alreadySent = state.lastSentDate === today.date;
  const inSendWindow = today.hour >= BOT_SEND_FROM_HOUR;

  if (alreadySent) {
    console.log('[queue] reminder already sent today (' + today.date + ') — not sending again');
  } else if (!inSendWindow) {
    console.log(
      '[queue] before the send window (hour ' + today.hour + ' < ' + BOT_SEND_FROM_HOUR +
      ' in ' + BOT_TZ + ') — press checks only, not sending'
    );
  }

  if (alreadySent || !inSendWindow) return;

  let message;
  let replyMarkup;

  if (!nextUrl) {
    message = '✅ Все страницы проиндексированы. Очередь GSC пуста.';
    replyMarkup = undefined; // no buttons when there is nothing to act on
    console.log('[queue] queue empty — nothing to submit today');
  } else {
    const gscLink = GSC_BASE + encodeURIComponent(nextUrl);
    // The inspect link is printed as bare text, not as an <a> anchor: Telegram
    // pops a confirmation dialog for links in the message body, and a raw URL
    // is only offered for copy — no dialog, no dead end. It still has to be
    // escaped, because parse_mode is HTML and a bare & fails the parse.
    message =
      '⏰ Запросите индексацию в GSC\n\n' +
      escapeHtml(gscLink) +
      '\n\nСтраница (клик — копирование):\n' +
      '<code>' + escapeHtml(nextUrl) + '</code>' +
      '\n\nОсталось в очереди: ' +
      state.pending.length +
      ' стр.';
    // No URL button: an inline-keyboard URL button also raises a confirmation
    // dialog, which costs an extra tap. The message carries both URLs as text,
    // and these buttons only report what was done.
    replyMarkup = {
      inline_keyboard: [
        [{ text: '✅ Готово', callback_data: 'done' }],
        [{ text: '⏳ Квота', callback_data: 'quota' }],
      ],
    };
    console.log('[queue] next URL to index: ' + nextUrl);
  }

  const sent = await sendMessage(message, replyMarkup);
  if (!sent) {
    console.error('Failed to send Telegram message after retries');
    process.exit(1);
  }
  // Recorded only after a successful send, so a failed run retries later
  // the same morning instead of staying silent until tomorrow.
  state.lastSentDate = today.date;
  saveState(state);
  console.log('Telegram message sent, message_id=' + sent.result.message_id);
}

main().catch(err => {
  console.error('Failed to send Telegram message:', err);
  process.exit(1);
});