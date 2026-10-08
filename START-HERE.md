# LocalJSON — Start Here

## Что это

Single-file client-side JSON tool. Форматтер, мэппер, converter в CSV.
100% в браузере. Privacy-first. Freemium: 3 действия/день бесплатно,
$5 lifetime за Pro.

## Где живёт

- Локально: /Users/moore/my work/localjson
- GitHub: https://github.com/stmooooore-lang/localjson
- Прод: https://localjson-black.vercel.app
- Оплата: Lava.top, EN и ES продукты

## Как работает

Один HTML-файл (index.html) содержит разметку, стили, скрипты, i18n
словари (EN + ES). Деплой — git push в main → Vercel автосборка за
~30 секунд.

ES страница: генерируется через `node bin/build-es.mjs` → es/index.html.
Запускается вручную после правок index.html или ES-словаря.

Пакеты покупателей (offline HTML + докстраница + README) — в zip-
архивах в корне. Заливаются в Lava вручную после пересборки.

## Правила проекта

- Не пушить в main без письменного «принято» (AGENTS.md, founder gate).
- Не добавлять build steps, кроме bin/build-es.mjs (исключение
  основателя).
- Не добавлять server-side код, БД.
- Не трогать монетизацию без явного решения.

## Что читать

- Текущее состояние → SPEC.md, раздел 12
- Принятые решения → DECISIONS.md
- Что делать → BACKLOG.md
- Продуктовая спецификация → SPEC.md

## Контакты

- Telegram: https://t.me/localjson
- Formspree: форма в докстранице

## Агентам

Push-гейт: локальный коммит разрешён, push — только после письменного
«принято» в текущей беседе. Если работаешь в sandbox-клоне — пушить
можно, но основатель делает git pull после.

Приёмка задач — через node acceptance/*.mjs или письменное «принято»
основателя. Grep в чате задачу не закрывает.
