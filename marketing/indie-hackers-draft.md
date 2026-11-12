# Indie Hackers — черновик (новый пост)

**Статус:** черновик. Не публиковано — публикация за основателем.
**Дата составления:** 2026-11-12
**Авторство:** основатель (аккаунт на IH существует, но постов про LocalJSON нет — см. раздел «Разведка» ниже)
**Основание:** `tasks/indie-hackers-post.md` (бриф IH-01)

---

## Разведка (Часть 1 брифа) — результат

Было проверено 5 независимых способов. Итог: **существующих постов и листингов про
LocalJSON на Indie Hackers не найдено.**

| Проверка | Метод | Результат |
| --- | --- | --- |
| Продуктовая страница `indiehackers.com/product/localjson` | прямой fetch → 403 (Cloudflare-челлендж); затем reader-прокси | **HTTP 404** — страницы нет |
| Поиск по сайту: `site:indiehackers.com localjson` | DuckDuckGo через прокси | Найдено только `product/localpatron` (другой продукт) и общие посты про JSON, не про LocalJSON |
| Поиск по домену: `site:indiehackers.com "localjson-black" OR "saint_moore"` | DuckDuckGo через прокси | **No results** |
| Поиск по названию: `"indiehackers.com" "localjson" product` | DuckDuckGo через прокси | **No results** |
| Доска продуктов `indiehackers.com/products` | reader-прокси | LocalJSON отсутствует в текущем Build Board и БД продуктов |

**Вывод Части 1:** обновлять нечего — обновляемого листинга и старых постов не
существует. По Части 2 брифа выбирается ветка «Если постов нет → написать новый
черновик».

### Расхождение в документации

`SPEC.md` строка 107 утверждает:

> Indie Hackers: https://www.indiehackers.com/product/localjson — Active listing (confirmed by owner)

**URL возвращает 404 — листинга не существует.** Это тот же класс ошибки документации,
что и `/activate/` (правило в SPEC, которому не соответствует код). Предполагаю, что
листинг считался сделанным и записан как подтверждённый, но создан не был либо удалён.
В SPEC.md запись исправлена в этом же коммите (переведена в «планируется», с пометкой 404).

Профиль автора: dev.to — `saint_moore` (первая статья 2026-11-04). Ник на IH не
подтверждён; если аккаунт основателя зарегистрирован под другим именем, разведку стоит
повторить внутри авторизованного IH.

---

## Черновик поста

> Ниже — содержание для публикации на Indie Hackers (англ.). Метрики в тексте — только
> реальные.

### Заголовок (варианты)

1. **Most JSON formatters upload your data to a stranger's server. I wanted the opposite.**
2. Every JSON formatter I found sent my payload to someone's server, so I built one that never ships it out
3. I built a JSON formatter that refuses to send your data anywhere — then measured its Core Web Vitals

### Тело поста

Most online JSON tools work like this: you paste, the browser renders, and the
string you just handled gets shipped to the origin server for "processing". For
formatted test fixtures that's annoying. For the API responses, config files and
B2B arrays people actually paste into these tools, it's a bad habit — and usually
one nobody asked for.

I built [LocalJSON](https://localjson-black.vercel.app) because the tools I used
kept failing on the *real* inputs: unquoted keys, single quotes, trailing commas,
a surrounding quote pair, and JSON that needed unescaping before it could even be
parsed. The common behavior is to reject the input and make you fix it yourself,
by hand, repeatedly.

So the constraint I set was not "build a better formatter" but "build a formatter
that never leaves the machine". Everything runs inline: formatting, mapping and
cleaning of array data, CSV export, JSON↔CSV, diffing. The whole site is one HTML
file with no build step and no dependencies — you can read the source and see there
is no request that carries your input anywhere. It also works offline.

What surprised me most is how much that constraint costs elsewhere: a
"privacy-first" tool that loads a tracking script to measure its own privacy is a
contradiction. So the privacy story here is structural, not a slogan — there is no
upload path, so there is nothing to accidentally log.

**The numbers I actually got (not targets):**

- **Core Web Vitals, mobile, three URLs** (`/`, `/es/`, a blog article), measured
  by Lighthouse CI on GitHub's runner against production — two runs, ordering stable:

  | URL | LCP | CLS | TBT |
  | --- | --- | --- | --- |
  | `/` | 1.03–1.09 s | **0.00** | **659–970 ms** |
  | `/es/` | 0.84–0.89 s | **0.00** | 164–175 ms |
  | `/blog/…` | 0.87–0.88 s | **0.00** | 78–109 ms |

  - **CLS is 0.00 on all three** — the CLS work actually held.
  - **LCP is «Good» everywhere** (all under 1.1 s), TTFB 2 ms.
  - **The homepage is the one weak URL**, and only for TBT (over the 600 ms bar
    twice in a row). `/es/` is fine — the Spanish version is *not* the problem.
- **Search Console, 2026-10-08 baseline: 7 impressions, 0 clicks.** Real number,
  real baseline, nothing rounded up.
- **Zero revenue.** Free tier is 3 actions/day, Pro is a $5 lifetime unlock checked
  client-side (yes, that means the check can be bypassed — the point of this stage
  is learning, not extracting).

**The lesson I paid for, in case it saves you time:** my *first* measurement round
said something completely different. Measured on my own laptop it reported
`/es/` at LCP 3.1 s and TBT 3.4 s while the homepage looked fine at 1.96 s / 3.27 s.
Running the identical configuration on GitHub's runner flipped the ranking: 0.89 s vs
1.09 s, and homepage TBT 659 ms instead of /es/ 3.4 s. My laptop was throttled under
sandbox load, so every CPU-bound metric (TBT, and LCP through Style & Layout) inflated
roughly 5–6×, and the *relative* order changed outright. I nearly filed an
"optimize the Spanish page" task that would have fixed the wrong page.

So the rule I'm keeping: **a baseline measured on one person's machine is not a
baseline.** If you're going to act on a number, get it on a machine you don't own and
run it twice. The CI config that produced the table above is
[lighthouserc.json](https://github.com/stmooooore-lang/localjson/blob/main/lighthouserc.json)
— three URLs, weekly, warn-level assertions on purpose so an unknown baseline can't
go red.

**What's still missing from that table:** INP. INP is a *field* metric — it needs real
Chrome UX data, and lab runs only give you TBT as a proxy. Getting it means CrUX/GSC
credentials that I don't have yet, so I'm not going to pretend a lab number is INP.

**Ask:** if you run a JSON-heavy workflow, what do you actually paste into these tools,
and what breaks first? That's where I'm deciding what to build next — and whether the
Spanish version deserves the same investment as the English one, or should be cut.

I'll take criticism of the privacy claim too: tell me what you'd test to try to
disprove it.

---

### Комментарий основателю (не для публикации)

- Цифры в тексте — с двух прогонов Lighthouse CI на GitHub-раннере (`workflow_dispatch`,
  артефакт `lighthouse-reports`). Они воспроизводимы, в отличие от замера на моём Mac
  под песочницей — расхождение с первым замером описано в посте честно, это сознательно.
- Перед публикацией проверьте одну вещь: посту можно поверить насчёт CLS 0.00 и LCP,
  но про TBT главной страницы (659–970 мс) стоит самим глянуть в HTML-отчёте артефакта —
  это единственная метрика, которая выходит за порог.
- Не дублировать статью dev.to дословно: этот текст построен вокруг приватности,
  замера и заметки про неверный первый замер; dev.to-статья — вокруг стратегий
  сравнения JSON. Каналы разведены.
- GA (`G-ZV5DKDT69T`) в посте упомянут как противоречие с «privacy-first». Если GA
  считается частью стратегии — оставьте как есть; если нет, решите до публикации,
  потому что в посте это звучит как «таковый вопрос не решён». Я GA не трогал —
  это решение основателя.

---

## Что осталось за основателем

| Шаг | Кто | Замечание |
| --- | --- | --- |
| Подтвердить ник на IH и войти в аккаунт | основатель | разведка сделана без авторизации; если аккаунт называется иначе, разведку повторить |
| Создать продукт `localjson` на IH | основатель | листинга нет (404), «Add Your Product» требует входа |
| Сделать пост из черновика выше | основатель | черновик готов, публикация только вручную |
| Проверить цифры CWV перед публикацией | основатель | цифры в посте — с моего замера; подтвердите перед публичным использованием |
| Дать `GSC_SERVICE_ACCOUNT_JSON` и получить INP | основатель | после этого заменить фразу про INP на реальное число |
