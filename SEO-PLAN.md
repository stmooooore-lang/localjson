# SEO-PLAN.md – Единый план SEO для LocalJSON

## 1. Текущий статус (факты)
- **Google Search Console** – подключён, sitemap отправлен, статус *Success*. Есть открытые ошибки покрытия.
- **Bing Webmaster Tools** – мета‑тэг `msvalidate.01` присутствует, аккаунт **не создан / не проверен**.
- **Яндекс.Вебмастер** – **не настроен**.
- **robots.txt** – валиден, ссылается на `sitemap.xml`.
- **sitemap.xml** – 7 URL, обновляется **вручную** (CI‑джоба удалена).
- **Canonical / hreflang** – корректны на `/`, `/es/`, `/blog/`, проверены `seo-check.mjs`.
- **Meta‑теги** (OG, Twitter, JSON‑LD) – полные, валидны.
- **Мультиязычность** – EN (default) + ES на `/es/`, переключатель без редиректов.
- **Блог** – 4 статьи, еженедельный автопаблиш (GitHub Actions), план 6 тем.
- **Каналы** – Reddit и Hacker News исключены; dev.to (первая статья опубликована 2026-11-04) и Product Hunt – активные, PH листинг в работе.

## 2. Реально подключённые поисковые системы
| Система | Подключена | Sitemap отправлен | Статус |
|---------|------------|-------------------|--------|
| Google  | ✅ | ✅ (Success) | Есть ошибки покрытия; ручная очередь через бота |
| Bing    | ✅ через IndexNow | n/a (IndexNow) | Мгновенные URL-нотификации, авто при сборке блога |
| DuckDuckGo | ✅ через IndexNow | n/a (IndexNow) | Мгновенные URL-нотификации |
| Yahoo   | ✅ через индекс Bing | n/a (наследует) | Бесплатно, следует за индексом Bing |
| Яндекс  | ❌ | ❌ | Требует настройки (Вебмастер + sitemap) |

### 2.1 IndexNow — мгновенная индексация

Внедрено 2026-11-07. Позволяет уведомлять одномоментно Bing, Yandex,
DuckDuckGo, Yahoo, Naver, Seznam и part of AI-answer engines вместо
ожидания следующего обхода.

- **Ключ:** `NDkCKfQYMQ-HZS3asUKxO4csyzaEWrdm`
- **Файл подтверждения:** `/<key>.txt` в корне репозитория (раздаётся Vercel,
  `.vercelignore` его не блокирует) — Bing проверяет владение по нему.
- **Скрипт:** `scripts/submit-indexnow.mjs` — читает `sitemap.xml`,
  POST на `https://api.indexnow.org/indexnow`, печатает отчёт со статусом.
- **Воркфлоу:** шаг «Submit to IndexNow» в `publish-blog.yml` сразу после
  «Build Blog» — каждое авто-обновление блога мгновенно рассылается.
- **Dry-run:** `node scripts/submit-indexnow.mjs --dry-run` — проверить
  состав URL без реальной отправки.
- **Ручной запуск:** `node scripts/submit-indexnow.mjs` (npm-окружение не
  требуется, используется встроенный `fetch` из Node 18+).

### 2.2 Очередь ручной индексации GSC (Google)

Google не участвует в IndexNow, поэтому остаётся ручная подача.
Ведётся постоянная очередь `state/gsc-queue.json` + бот
`scripts/pick-url.js` (см. DECISIONS.md от 2026-11-07).

## 3. План покрытия индекса (целевые URL)
| Язык | Страница | Приоритет | Статус индексации |
|------|----------|-----------|-------------------|
| EN   | `/` | 1.0 | В индексе |
| ES   | `/es/` | 0.9 | В индексе |
| EN   | `/blog/` | 0.9 | В индексе |
| EN   | `/blog/compare-json-files/` | 0.8 | В индексе |
| EN   | `/blog/json-to-csv-complete-guide/` | 0.8 | В индексе |
| EN   | `/blog/json-formatter-online/` | 0.8 | Опубликована 2026‑11‑08 автопаблишем |
| EN   | `/blog/map-vendor-json/` | 0.8 | По мере публикации |
| *будущие статьи* | `/blog/<slug>/` | 0.8 | По мере публикации |

> **Примечание:** Страницы документации (`LocalJSON_Pro_Documentation_and_License_Key.html` и `_es.html`) исключены из индексации (noindex) решением от 2026-11-03. Они удалены из sitemap.xml, закрыты `<meta name="robots" content="noindex, follow">` и заголовком `X-Robots-Tag`.

## 4. Технические требования (чек‑лист)
- [x] `robots.txt` с ссылкой на sitemap  
- [x] `sitemap.xml` актуален, все целевые URL присутствуют  
- [x] Canonical на каждой странице (self‑referencing)  
- [x] `hreflang` = en, es, x‑default на всех страницах  
- [x] Canonical + hreflang на `/blog/` и статьях  
- [x] JSON‑LD (SoftwareApplication, Product, FAQPage, Article)  
- [x] OG / Twitter Cards на всех страницах  
- [ ] **Яндекс** – добавить сайт в Вебмастер, отправить sitemap
- [ ] Bing Вебмастер – аккаунт для отчётов по кликам (индексация уже покрыта IndexNow)
- [ ] Исправить ошибки покрытия GSC (показать список)
- [ ] Запросить переиндексацию обновлённых страниц (GSC → URL Inspection)
- [ ] Проверить, что все URL из sitemap проиндексированы (Coverage → Valid) 

## 5. Контент‑план (синхронизация с блогом)
- Еженедельная генерация статьи (GitHub Actions, Gemini) → авто‑коммит → деплой.  
- Каждая новая статья автоматически попадает в `sitemap.xml` (при ручном регенере).  
- Внутренние ссылки: каждая статья → ≥1 ссылка на `/` + ≥1 внутренняя на другую статью (`[[slug]]`).  
- План тем (`blog/plan.json`) – 6 тем, 3 draft, 3 pending.  
- После публикации – запрос индексации в GSC / Bing / Яндекс.

## 6. Открытые задачи (из BACKLOG + SPEC Phase 4‑5)
| Приоритет | Задача | Источник |
|-----------|--------|----------|
| High | Аудит индексации (GSC, Bing, Яндекс) | BACKLOG |
| High | Аудит мультиязычного SEO (hreflang, canonical, переключатель) | BACKLOG |
| Medium | Исправить ошибки покрытия GSC | BACKLOG / SPEC Phase 4 |
| Medium | Запросить индексацию обновлённых страниц | BACKLOG / SPEC Phase 4 |
| Medium | Индексация всех URL из sitemap | BACKLOG / SPEC Phase 4 |
| Medium | Добавить в каталоги JSON‑тулов (PH, Indie Hackers, AlternativeTo + остальные) | SPEC Phase 4 / BACKLOG |
| Medium | Testimonials / Social Proof | SPEC Phase 5 / BACKLOG |
| Medium | Испанский checkout (Lava link) | SPEC Phase 5 / BACKLOG |
| Medium | Внутренние ссылки index ↔ offline ↔ activate | SPEC Phase 5 / BACKLOG |
| Medium | Настроить ежедневное напоминание (Telegram‑бот) для ручного запроса индексации в GSC (1 URL в день) | SEO‑PLAN | ✅ Сделано 2026‑11‑07: `scripts/pick-url.js` + `state/gsc-queue.json` + `.github/workflows/daily-index-reminder.yml` |
| Medium | Проверить, что очередь GSC реально обрабатывается (лог последнего прогона + состояние `lastUpdateId`) | Наблюдение 2026‑11‑08 | ⚠️ `lastUpdateId` = 0 — воркфлоу ни разу не сработал успешно |
| Low | Core Web Vitals (PageSpeed) | BACKLOG |
| Low | Email‑база / Backlink strategy | BACKLOG |
| Low | Убрать «Phase 5» хвост из SPEC.md | BACKLOG |
| **Decision** | **Fake Testimonials rejected** – основатель решил не добавлять фейковые отзывы; блок Testimonials будет добавлен только с реальными цитатами. | FOUNDER |

## 7. Backlink Tracking — внешние публикации

### 2026-11-04. dev.to publication

- **URL публикации:** https://dev.to/saint_moore/comparing-json-files-practical-diffing-strategies-for-developers-2ndb
- **Дата публикации:** 2026-11-04
- **Целевая страница:** https://localjson-black.vercel.app/blog/compare-json-files/
- **Анкоры в тексте:**
  - "LocalJSON" → https://localjson-black.vercel.app/
  - "Comparing JSON Files" → https://localjson-black.vercel.app/blog/compare-json-files/
- **Тип ссылки:** dofollow (dev.to передает SEO-вес)
- **Ожидаемый эффект:** реферальный трафик, улучшение позиций по "json diff", "compare json files", "structural json comparison"
- **Мониторинг:** GA4 (Traffic acquisition → Referral → dev.to), GSC (покрытие/позиции целевых запросов)

### План накопления бэклинков

| Приоритет | Канал | Статус |
|-----------|-------|--------|
| 1 | dev.to (статьи) | ✅ Первая опубликована |
| 2 | Product Hunt (листинг) | 🔄 Активно (SPEC.md:99) |
| 3 | Indie Hackers | ⏳ Планируется |
| 4 | AlternativeTo | ⏳ Планируется |
| 5 | JSON-каталоги (json-indent.com, jsonanalyzer.com и др.) | ⏳ Аудит |
| 6 | Тематические блоги / гостевые посты | ⏳ Исследование |

## 8. Метрики успеха (KPIs)

Единая таблица: GSC‑метрики с горизонтом 3 месяца и метрики внешних
каналов — к концу Q1 2027.

### 8.1 Поисковая выдача (GSC)

| Метрика | Текущее значение | Целевое (3 мес.) |
|---------|------------------|-----------------|
| Показы в GSC (3 мес.) | 7 | ≥ 200 |
| Клики в GSC | 0 | ≥ 20 |
| Покрытие индексом (Valid URLs / Submitted) | ~70 % | 100 % |
| Ошибки покрытия GSC | > 0 | 0 |
| Core Web Vitals (LCP/CLS/INP) | не измерено | «Good» во всех |
| Опубликованные статьи блога /мес. | 1 (auto) | 4 |

### 8.2 Внешние каналы (к концу Q1 2027)

| Метрика | Текущее значение | Цель |
|---------|------------------|------|
| Referring domains | 1 (dev.to) | ≥ 10 уникальных доменов |
| Organic traffic | базлайн 2026‑10‑08 | +50 % к базлайну |
| Top‑10 позиций | 0 | ≥ 5 целевых запросов |
| Реферальный трафик с dev.to | 0 | ≥ 100 сессий/месяц |
| Upvotes на Product Hunt | 0 | ≥ 50 |

### 8.3 Поисковые системы — аккаунты

| Метрика | Текущее значение | Цель (3 мес.) |
|---------|------------------|----------------|
| Bing / Яндекс — наличие аккаунта и sitemap | Bing: via IndexNow (2026‑11‑07); Яндекс: нет | аккаунты в Вебмастере для данных о кликах |