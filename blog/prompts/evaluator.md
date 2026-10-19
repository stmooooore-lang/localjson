# Blog Evaluator Checklist — LocalJSON

Use this checklist to **accept or reject** a draft article before it enters the pipeline. Every item must be **YES**.

## 1. Frontmatter & Metadata
- [ ] All required fields present: `slug`, `title`, `description`, `date`, `author`, `cluster`, `keywords`, `screenshot-alt`.
- [ ] `slug` matches filename (no `.md`), lowercase, hyphens only.
- [ ] `title` length 20–70 characters.
- [ ] `description` length 100–170 characters.
- [ ] `cluster` is one of the approved clusters.
- [ ] `keywords` array has 3–5 items, lowercase.
- [ ] `screenshot-alt` describes the screenshot content.

## 2. Structure
- [ ] Exactly **seven H2 sections** in the prescribed order.
- [ ] No extra H2, no missing H2.
- [ ] H3 allowed inside sections, no H1 in body.
- [ ] Frontmatter delimiter `---` at top only.

## 3. Content Quality
- [ ] **Technical tone** — no marketing clichés, no "in today's world", "delve", "seamless", "robust", "comprehensive", "leverage", "game-changer", "unlock", "supercharge".
- [ ] **No LLM markers** — no `TODO`, `FIXME`, `XXX`, "as an AI language model", "here is a", "here are the", "note that", "it's important to note".
- [ ] **Word count** ≥ 1500 words in rendered `<article>` (pipeline enforces ≥ 1200).
- [ ] **At least one internal link** `[[existing-slug]]` to another published article.
- [ ] **At least one homepage link** (`/` or `https://localjson-black.vercel.app/`).
- [ ] **Screenshot placeholder** `{{SCREENSHOT:name}}` on its own line, with matching `screenshot-alt`.

## 4. Factual Accuracy (LocalJSON)
- [ ] Every claim about LocalJSON matches current `index.html` (search the repo).
- [ ] **No "3 actions per day" / daily limit** — the product has no daily counter.
- [ ] **Pro features** listed are only those actually gated: *standalone offline HTML version*.
- [ ] No mention of "inline column renaming", "one-click deduplication", "unlimited record processing" as Pro features.
- [ ] BOM (`utf-8-sig`), RFC 4180 quoting, column checkboxes, JSON.stringify for nested — all verifiable in `index.html`.
- [ ] Free tier described as "fully functional, no daily limits" (or equivalent).

## 5. Code & Examples
- [ ] Every code block is **executable** and language-tagged.
- [ ] Each code block's **output matches the shown result** (run it locally).
- [ ] Input data shown; output matches exactly (including BOM, quoting, escaping).
- [ ] No pseudocode; no placeholder functions.

## 5. Screenshots
- [ ] `{{SCREENSHOT:name}}` placeholder present where figure belongs.
- [ ] `screenshot-alt` in frontmatter describes the screenshot accurately.

## 6. Style
- [ ] British spelling throughout.
- [ ] Short sentences, one idea per paragraph.
- [ ] Inline code for keys, commands, file names.
- [ ] Bold for UI labels (buttons, menu items).
- [ ] No emoji in body text.
- [ ] External links HTTPS.

## 7. Pipeline Gates
- [ ] `node bin/build-blog.mjs` exits 0.
- [ ] `node acceptance/blog-check.mjs` exits 0.
- [ ] `node acceptance/seo-check.mjs` exits 0.
- [ ] `node acceptance/i18n-check.mjs` exits 0.
- [ ] `node acceptance/final-polish-check.mjs` exits 0.

---

**Decision**: If **all** boxes are ticked → **ACCEPT**. Any **NO** → **REJECT** with specific reasons.