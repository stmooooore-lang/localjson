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
- **Блог** – 2 статьи, еженедельный автопаблиш (GitHub Actions), план 6 тем.
- **Каналы** – Reddit убран; HN, dev.to, Product Hunt – плановые, PH листинг активен.

## 2. Реально подключённые поисковые системы
| Система | Подключена | Sitemap отправлен | Статус |
|---------|------------|-------------------|--------|
| Google  | ✅ | ✅ (Success) | Есть ошибки покрытия |
| Bing    | ⚠️ (только тэг) | ❌ | Требует настройки |
| Яндекс  | ❌ | ❌ | Требует настройки |

## 3. План покрытия индекса (целевые URL)
| Язык | Страница | Приоритет | Статус индексации |
|------|----------|-----------|-------------------|
| EN   | `/` | 1.0 | В индексе |
| ES   | `/es/` | 0.9 | В индексе |
| EN   | `/LocalJSON_Pro_Documentation_and_License_Key.html` | 0.5 | В индексе |
| ES   | `/LocalJSON_Pro_Documentation_and_License_Key_es.html` | 0.5 | В индексе |
| EN   | `/blog/` | 0.9 | В индексе |
| EN   | `/blog/compare-json-files/` | 0.8 | В индексе |
| EN   | `/blog/json-to-csv-complete-guide/` | 0.8 | В индексе |
| *будущие статьи* | `/blog/<slug>/` | 0.8 | По мере публикации |

## 4. Технические требования (чек‑лист)
- [x] `robots.txt` с ссылкой на sitemap  
- [x] `sitemap.xml` актуален, все целевые URL присутствуют  
- [x] Canonical на каждой странице (self‑referencing)  
- [x] `hreflang` = en, es, x‑default на всех страницах  
- [x] Canonical + hreflang на `/blog/` и статьях  
- [x] JSON‑LD (SoftwareApplication, Product, FAQPage, Article)  
- [x] OG / Twitter Cards на всех страницах  
- [ ] **Bing** – создать аккаунт, добавить сайт, отправить sitemap  
- [ ] **Яндекс** – добавить сайт в Вебмастер, отправить sitemap  
- [ ] Исправить ошибки покрытия GSC (показать список)  
- [ ] Запросить переиндексацию обновлённых страниц (GSC → URL Inspection)  
- [ ] Проверить, что все URL из sitemap проиндексированы (Coverage → Valid)  

## 5. Контент‑план (синхронизация с блогом)
- Еженедельная генерация статьи (GitHub Actions, Gemini) → авто‑коммит → деплой.  
- Каждая новая статья автоматически попадает в `sitemap.xml` (при ручном регенере).  
- Внутренние ссылки: каждая статья → ≥1 ссылка на `/` + ≥1 внутренняя на другую статью (`[[slug]]`).  
- План тем (`blog/plan.json`) – 6 тем, 1 draft, 5 pending.  
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
| Low | Core Web Vitals (PageSpeed) | BACKLOG |
| Low | Email‑база / Backlink strategy | BACKLOG |
| Low | Убрать «Phase 5» хвост из SPEC.md | BACKLOG |

## 7. Метрики успеха (KPIs)
| Метрика | Текущее значение | Целевое (3 мес.) |
|---------|------------------|-----------------|
| Показы в GSC (3 мес.) | 7 | ≥ 200 |
| Клики в GSC | 0 | ≥ 20 |
| Покрытие индексом (Valid URLs / Submitted) | ~70 % | 100 % |
| Ошибки покрытия GSC | > 0 | 0 |
| Bing / Яндекс – наличие аккаунта и sitemap | нет | да |
| Core Web Vitals (LCP/CLS/FID) | не измерено | «Good» во всех |
| Опубликованные статьи блога /мес. | 1 (auto) | 4 |
| Upvotes на Product Hunt | 0 | ≥ 50 |