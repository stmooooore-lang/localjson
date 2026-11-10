# LocalJSON — Agent Instructions

## How work is tracked

The legacy detached-queue (`Continue MODELS integration/localjson-queue`,
`queue-tasks.txt`, `lane.sh`, `queue-log/`) is **dead** — removed 2026-11-08.
Work is tracked in the repository itself:

| What | Where |
| --- | --- |
| What to do next | `BACKLOG.md` — read it before starting; a task leaves the backlog only when it is closed and moved to the "Закрыто" section |
| Accepted/rejected decisions | `DECISIONS.md` |
| Current product state | `START-HERE.md` |
| Task briefs (if any) | `tasks/*.md` |

Automated work runs on **GitHub Actions**, not a local runner:

| Schedule | Workflow |
| --- | --- |
| Mondays 09:00 UTC — weekly article | `.github/workflows/publish-blog.yml` (generate → build → **Submit to IndexNow** → validate → commit) |
| Daily 07:00 UTC (10:00 MSK) — GSC indexing reminder | `.github/workflows/daily-index-reminder.yml` (Telegram reminder for one URL + persist `state/gsc-queue.json`) |

Read the log for a run with `gh run list` / `gh run view --log`.

**You are already in the project directory.** Working directory is the project
root; there is no need to go there. Of 1063 shell calls measured in an earlier
session, 537 were `cd` — half of all shell traffic spent on nothing. Use relative
paths.

**Do not rediscover the project — the task carries addresses.** In the same
measurement, 181 edits cost 689 shell commands and 303 file reads, and one file
was read 47 times. If a task does not say where to edit, that is a defect in
the specification: say so in your report instead of walking the whole project.

**The sandbox is a throwaway directory from mktemp, never a directory inside
the repository.**
A check that builds its sandbox under the project root — .acceptance/ and the
like — and runs the product from its own repo path is isolated in name only: it
verifies the live tree, and its verdict describes a state nobody submitted. Copy
into the sandbox what you need and run it from there. The verdict is unreliable
if the check changed the working tree.

**Acceptance never leaves its sandbox.** Not to the screen, not to the network,
not to devices, not to a human's attention. Whatever the product uses to touch
the outside world is replaced by a stub in the check, and what is verified is
the INTENT: not "the user clicked OK" but "the product was about to show this
text". The stub goes in the sandbox and first on PATH.

The reason is practical: automation runs with no human present. A dialog waiting
for a click hangs forever, and the window pops over someone else's work — which
is exactly what happened on 2026-08-21, when the product showed system dialogs to
the owner in the middle of the night.

Acceptance rules, applied to every check:

- **the check is not written by the one doing the work.** The command is taken
  from the task file's Acceptance section and run as a separate step, not by the
  executor as a self-report;
- the check must be able to fail. Green on undone work is useless;
- the check runs on throwaway data. A command with `sudo`, `/Volumes`, the
  keychain or a real backup is **refused**;
- a task is closed only when its acceptance check passes. Editing the check to
  match the work is not closing the task.

For this project the checks are `node acceptance/*.mjs` — run them from the
project root. The acceptance section of a task brief may be headed
`## Acceptance` or `## Приёмка`.

## Where things are written

Four homes. If this project does not have one of them yet, create it the first
time you need it — in that turn — and say that you did.

| What | Where |
| --- | --- |
| the queue of work: what is open, what is next, what was closed | `BACKLOG.md` |
| current state: what is done, what is open, what is next | `START-HERE.md` — rewritten, never appended |
| what the product must be | `SPEC.md` |
| decisions: what was chosen, what was rejected, why | `DECISIONS.md` — appended, dated |
| SEO plan, metrics, backlink register | `SEO-PLAN.md` |
| an individual task brief | `tasks/*.md` |

The universal rules — name the unit of work, write decisions down in the turn
they are made, the deliverable is not always code, read narrowly — are injected
by the proxy into every call. They are not repeated here on purpose: one source,
not two.

The projects in this workspace that lose the least differ from the rest in
exactly one way: they have a named document for each of these, and everything
discussed lands in one of them. The others keep loose files and lose the
discussion. That is the whole difference; it is not about the models.

A decision that fits none of the four gets a home proposed by you, not a
shrug.

## No real identifiers in repo files

Never commit real chat_ids, tokens, or PII to `tasks/*.md` or any other
repo file — reference them via env/secrets only (`TG_BOT_TOKEN`,
`TG_CHAT_ID`, GitHub Actions secrets). A task brief uses placeholders
(`<TOKEN>`, `${TG_CHAT_ID}`), and its acceptance grep checks the
placeholder name, never the value. What a pushed repo shows is public,
and history keeps what a later commit deletes.

## How you report back

**The brief tells you.** How to report is decided per project by whoever wrote
the brief — what matters here is different from what matters next door, and a
form copied across projects reports the form, not the work.

Two things hold regardless of the shape you are given: name what you changed by
address — file and line — and say plainly which tasks are not closed, including
any whose check never ran. A task whose acceptance did not run is not closed.

If the brief does not say how to report, ask before working rather than
inventing a shape.

The founder gate and the blog pipeline gate are in this file, below.

## Push and deploy — founder gate

No push to `origin/main` without the founder's written acceptance.

`git push origin main` on this project is not an intermediate step — it is
a production deploy. Vercel auto-deploys on push. Treat it accordingly.

Rules:

- Edit, commit locally, run acceptance checks — fine. Do not push.
- "Acceptance checks passed" is not the gate. The founder's explicit
  "принято" / "accepted" in the conversation is the gate. Two separate
  events; do not treat one as the other.
- If the change needs to be visible for review before acceptance, hand it
  over as a local commit and let the founder pull — never push "just to
  let them see it."
- If a task brief says "commit and push", this rule still applies unless
  the founder wrote "push" explicitly in the same conversation.
- What to hand over instead of a push: `git log --oneline -3`,
  `git status --short`, the acceptance output, `git show <sha> -- <file>`.

## Founder gate for blog content

The founder gate applies to infrastructure: the blog pipeline
(`bin/build-blog.mjs`, `blog/template.html`, `acceptance/blog-check.mjs`)
requires written founder acceptance once, before the pipeline is
enabled. After that, articles produced through the pipeline are
pre-approved by the pipeline's own acceptance criteria
(`acceptance/blog-check.mjs`) and do not require per-article founder
sign-off.

An article that fails `blog-check.mjs` twice in a row escalates to the
founder. An article that passed and is published can be unpublished by
founder decision — delete the directory, rebuild sitemap, commit.

The founder's acceptance of this pipeline is recorded in `DECISIONS.md`.

## Working state — START-HERE.md

`START-HERE.md` is the canonical working-state file of this project. It is
rewritten, never appended. History lives in `git log -- START-HERE.md`.

**Reading.** Read it once, at conversation start, before your first task. Do
not re-read it for every subsequent task in the same conversation. Re-read
only when (a) a task brief contradicts a fact in START-HERE — then stop and
report the contradiction, or (b) the founder says «обнови контекст».

**«обнови контекст» — the merge.** When the founder pastes one or more chat
digests and says this, merge **all** of them into START-HERE in one pass:
- The output is the union, not the last digest. Current content stays unless
  a digest or the repo contradicts it.
- Overlapping content is rewritten to a single current version, not
  accumulated. Two paragraphs about one subject is the defect.
- `Decided` / `Rejected` / `Open questions` lines from a digest are never
  dropped.
- "Drop what the repo does not confirm" applies only to claims about repo
  state ("fix applied", "committed", "deployed"). An unconfirmed claim is
  marked unverified, not deleted, and the command that would settle it is
  named.
- Contradictions between digests, or between a digest and the repo, are
  named explicitly. Do not silently pick a winner.

Update the date line, add `Folded:` listing every digest merged in this
pass, commit only this file:

    docs(start-here): <what changed>

    Chat-Source: <project> <date> <label>[, <label>, …]

Commit locally. Never push — the push barrier is the owner's.
