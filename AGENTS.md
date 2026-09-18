<!-- lane: localjson-queue -->
## Your queue — localjson-queue

Coding work for this project goes through the queue, not through chat: nobody
runs the acceptance check in a chat, so "done" stays a word.

- Your task list: `/Users/moore/my work/Continue MODELS integration/localjson-queue/queue-tasks.txt`. Yours only — no other
  project's tasks belong in it.
- Task line: `<project dir>;<task file>;<model lane>`, lane is usually
  `plexus-act`.
- Start: `cd "/Users/moore/my work/Continue MODELS integration" && ./lane.sh localjson-queue` — **the only way**. It detaches
  itself, so the run outlives the session that started it. Never `bash
  queue.sh` by hand: that puts the run in the wrong directory, with the wrong
  task list and the wrong state file.
- State: `cd "/Users/moore/my work/Continue MODELS integration" && ./queue-status.sh`
- **Chat stays free while the queue runs.** The lane detaches and works in the
  background; do not wait for it in this conversation. Use `queue-status.sh` to
  check progress when needed.

**You are already in the project directory.** The queue starts you with the
working directory set to the project root; there is no need to go there.
Measured 2026-08-22 across four lanes: of 1063 shell calls, **537 were cd** —
half of all shell traffic spent on nothing. Use relative paths.

**Do not rediscover the project — the task carries addresses.** Measured in the
same place: 181 edits cost 689 shell commands and 303 file reads, and one file
was read 47 times. If a task does not say where to edit, that is a defect in
the specification: say so in your report instead of walking the whole project.

**The sandbox is a throwaway directory from mktemp, never a directory inside
the repository.**
A check that builds its sandbox under the project root — .acceptance/ and the
like — and runs the product
from its own repo path is isolated in name only: it verifies the live tree, and
its verdict describes a state nobody submitted. Copy into the sandbox what you
need and run it from there. The queue compares On branch main
Changes not staged for commit:
  (use "git add/rm <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   START-HERE.md
	modified:   docs/QUEUE.md
	modified:   new-repo.sh
	modified:   plexus_hooks.py
	modified:   queue.sh
	modified:   rotate.py
	modified:   yp-queue/queue-tasks.txt
	modified:   yp-queue/run.out
	modified:   yp-queue/run.sh
	modified:   yp-queue/state
	deleted:    yp-queue/tasks/HOST-006.md
	deleted:    yp-queue/tasks/HY-005.md
	deleted:    yp-queue/tasks/M-01-cpu-budget.md
	deleted:    yp-queue/tasks/ST-UX-001.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	S12-16-verdict.md
	add-compaction-flag.py
	case-converter-queue/
	docs/QUEUE-RULES.md
	docs/RESULT-T-01-fix-app-js.md
	export-config.py
	fix-act-lane.py
	fix-key-audit-2026-08-22.py
	handoff/CLAUDE-expert.md
	handoff/PROMPT-agent-inventory.md
	handoff/PROMPT-expert-acceptance.md
	handoff/PROMPT-expert-brief-fix-others.md
	handoff/PROMPT-expert-brief-fix.md
	handoff/PROMPT-expert-new.md
	handoff/PROMPT-expert-resume.md
	handoff/PROMPT-fix-i18n-task.md
	handoff/PROMPT-plexus-cloud.md
	handoff/PROMPT-recovery-acceptance.md
	handoff/PROMPT-recovery-osascript.md
	handoff/PROMPT-recovery-sandbox.md
	handoff/PROMPT-stack-measure-continue.md
	handoff/STACK-EXPLANATION.md
	handoff/TASK-measure-compaction.md
	handoff/config-cloud.yaml
	handoff/config-skeleton.yaml
	lane.sh
	localjson-queue/
	make-cloud-config.py
	measure-compaction.sh
	path-scope.py
	plexus_hooks.py.bak-before-unit-rules
	probe-queue-stack.sh
	queue-done.txt
	queue-log/
	queue-status.sh.bak-run-scope
	queue-tasks-i18n.txt
	queue.sh.bak-before-agent-stubs
	queue.sh.bak-before-backoff
	queue.sh.bak-before-compaction-flag
	queue.sh.bak-before-killtree
	queue.sh.bak-before-lanes
	queue.sh.bak-before-marker
	queue.sh.bak-before-orphan
	queue.sh.bak-before-registry
	queue.sh.bak-before-signals
	queue.sh.bak-before-snapshot
	queue.sh.bak-before-stubs
	queue.sh.bak-before-tree-guard
	queue.sh.bak-before-userscope
	queue.sh.bak-comment-lines
	recovery-queue/
	rotate.py.bak-before-ceiling
	rotate.py.bak-before-overload
	rotate.py.bak-before-survival
	run-all-measurements.sh
	stamp-lane.sh
	swap-gemini-key.py
	wait-and-fix-act.sh
	yp-queue/queue-done.txt
	yp-queue/queue-log/
	yp-queue/tasks/CR-01-changenow.md
	yp-queue/tasks/CR-02-stealthex.md
	yp-queue/tasks/CR-03-letsexchange.md
	yp-queue/tasks/CR-04-exolix.md
	yp-queue/tasks/CR-05-simpleswap.md
	yp-queue/tasks/CR-06-fixedfloat.md
	yp-queue/tasks/CR-07-assemble.md
	yp-queue/tasks/CR-extract.md
	yp-queue/tasks/HOST-004-migration-plan.md
	yp-queue/tasks/PROC-04-context.md
	yp-queue/tasks/PROC-04-extract.md
	yp-queue/tasks/PROC-06-toolcalls.md
	yp-queue/tasks/S3-01-decided.md
	yp-queue/tasks/S3-02-contradictions.md
	yp-queue/tasks/S3-03-invariants.md
	yp-queue/tasks/UX-01-datepicker-fix.md
	yp-queue/tasks/UX-01-datepicker.md

no changes added to commit (use "git add" and/or "git commit -a") before and after the
check; if the check changed the working tree, the verdict is marked unreliable.

**Acceptance never leaves its sandbox.** Not to the screen, not to the network,
not to devices, not to a human's attention. Whatever the product uses to touch
the outside world is replaced by a stub in the check, and what is verified is
the INTENT: not "the user clicked OK" but "the product was about to show this
text". The stub goes in the sandbox and first on PATH.

The reason is practical: the queue runs with no human present. A dialog waiting
for a click hangs it forever, and the window pops over someone else's work —
which is exactly what happened on 2026-08-21, when the product showed system
dialogs to the owner in the middle of the night.

Rules the queue enforces by itself:

- **the check is written by someone other than the one doing the work.** The
  command is taken from the "Acceptance" section of the task file and run by
  the queue, not by the executor;
- the check must be able to fail. Green on undone work is useless;
- the check runs on throwaway data. A command with `sudo`, `/Volumes`, the
  keychain or a real backup is **refused**, and the task does not run;
- appending to the task list while a run is in progress works; editing or
  deleting lines does not — the running pass keeps reading the old file. A task
  can only be removed by stopping the run;
- a second run in the same directory is refused, and the queue will not start
  work in a project where another agent is already working.

The acceptance section may be headed `## Acceptance` or `## Приёмка`; the
queue accepts both, and new tasks should use the English form.

## Where things are written

Four homes. If this project does not have one of them yet, create it the first
time you need it — in that turn — and say that you did.

| What | Where |
| --- | --- |
| current state: what is done, what is open, what is next | `START-HERE.md` — rewritten, never appended |
| what the product must be | the project's specification |
| decisions: what was chosen, what was rejected, why | `DECISIONS.md` — appended, dated |
| tasks | `tasks/*.md` |

The universal rules — name the unit of work, write decisions down in the turn
they are made, the deliverable is not always code, read narrowly — are injected
by the proxy into every call. They are not repeated here on purpose: one source,
not two.

The two projects in this workspace that lose the least — plexus and YP — differ
from the rest in exactly one way: they have a named document for each of these,
and everything discussed lands in one of them. The others keep loose files and
lose the discussion. That is the whole difference; it is not about the models.

A decision that fits none of the four gets a home proposed by you, not a
shrug.

## How you report back

**The brief tells you.** How to report is decided per project by whoever wrote
the brief — what matters here is different from what matters next door, and a
form copied across projects reports the form, not the work.

Two things hold regardless of the shape you are given: name what you changed by
address — file and line — and say plainly which tasks are not closed, including
any whose check never ran. A task whose acceptance did not run is not closed.

If the brief does not say how to report, ask before working rather than
inventing a shape.

Queue rules for every project: `/Users/moore/my work/Continue MODELS integration/docs/QUEUE-RULES.md`.
<!-- /lane -->
