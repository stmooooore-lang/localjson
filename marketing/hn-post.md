# Hacker News — Show HN draft

**Title:**

Show HN: LocalJSON - client-side JSON formatter, single file, no uploads

**Body:**

I kept pasting API payloads into online JSON tools and only afterwards wondering where those requests actually went. LocalJSON is the thing I wanted instead: a JSON formatter, column mapper and CSV exporter that runs entirely in the browser. No upload, no account, no backend to breach. The whole app is one HTML file with inline CSS and vanilla JS, zero dependencies and no build step, 14 KB over the wire.

Parsing, key renaming, column selection and RFC 4180 CSV export all happen client-side, so there is no server to scale and no request log to leak. That constraint also shaped the licensing, and I would rather be upfront about the trade-off: with nothing stored server-side, the free-tier counter and the Pro flag both live in localStorage. Pro is a one-time $5 key that unlocks unlimited actions plus a standalone offline HTML version. The key is validated locally against an `LJSON-PRO-` prefix, which means it can be shared. I chose that over adding DRM to a 60 KB file.

The problems that actually took time were diffing and flattening. Line-based diff tools flag false positives when the same JSON arrives with different key order or indentation, so I wrote up how to do a structural comparison instead: https://localjson-black.vercel.app/blog/compare-json-files/ — and alongside it, the failure modes of converting JSON to CSV, from missing byte-order marks to unicode mojibake in Excel.

Questions welcome, especially about the single-file constraint or the CSV quoting rules. Getting RFC 4180 exactly right is harder than it looks.

---

*Опубликовать во вторник, 15:00-17:00 МСК. Отвечать на комментарии в первые 2 часа.*
