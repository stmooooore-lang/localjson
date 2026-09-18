# Task: Remove orphaned debug.js script

## Context
The file `debug.js` is a leftover from troubleshooting the I18N brace-matching bug (2026-08-22). It is no longer needed and is not referenced anywhere in the project (verified by `grep -rl`).

## What must become true
The file `debug.js` must be deleted from the project root.

## Acceptance
```bash
test -f debug.js && echo "FAIL: debug.js still exists" && exit 1 || echo "debug.js removed OK"
```