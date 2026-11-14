---
title: "Why `diff -u` lies to you about JSON (and what to do instead)"
published: false
description: "Two identical JSON payloads, 400 changed lines in diff. Here's why line-based diffing fails on JSON, and three ways to compare payloads that actually survive contact with real APIs."
tags: json, diffing, debugdiary, webdev
cover_image: ""
series:
# PRIMARY MARKETING PRIORITY (HN excluded 2026-11-03)
---

# A story you have probably lived

Staging deploy goes out. Something breaks downstream.

So you do the obvious thing: export the payload from production, export the payload from staging, and run:

```bash
diff -u prod.json staging.json
```

And diff hands you 400 changed lines. Two files. Same data. Completely unchanged schema.

Except one service decided to sort keys alphabetically, and the other preserved insertion order. And one of them pretty-printed the output while the other minified it. Both sets of choices are perfectly valid JSON. `diff` sees the first file and the second file as having almost nothing in common.

That is the moment it is worth understanding what is actually going on, because the fix is not "use a diff tool with nicer colors."

Let me talk about why this happens, then the three approaches I use depending on where I am standing.

# Why line-based diffing breaks on JSON

Two reasons, and both come from JSON's own spec.

**Object keys have no order.** RFC 8259 describes JSON as an unordered collection of key/value pairs. The spec is explicit: key order carries no semantic meaning. So `{"id":1042,"status":"active"}` and `{"status":"active","id":1042}` are the *same document*.

POSIX `diff` has no idea about that. It computes the longest common subsequence of lines, and a line sequence is absolute truth to it. Reorder the keys and you get a full-file churn report even though not a single value changed.

**Whitespace is arbitrary.** JSON permits any amount of whitespace around structural tokens: space, tab, `\n`, `\r`. A minified payload and its pretty-printed twin tokenize to identical trees. To `diff`, they have zero matching lines.

Here are the two payloads from the story above:

```json
// payload_a.json
{
  "id": 1042,
  "status": "active",
  "tags": ["prod", "auth"]
}
```

```json
// payload_b.json — same record, reordered
{
  "tags": ["prod", "auth"],
  "id": 1042,
  "status": "active"
}
```

```bash
$ diff -u payload_a.json payload_b.json
@@ -1,5 +1,5 @@
 {
+  "tags": ["prod", "auth"],
   "id": 1042,
-  "status": "active",
-  "tags": ["prod", "auth"],
+  "status": "active"
 }
```

Four "changed" lines. Zero actual differences. In a deployment audit this is noise, and in an automated change-detection script it is a broken build.

The underlying fix is to compare *structure*, not text. Parse both documents, normalize, then compare the trees.

# Three approaches, by where you're standing

## 1. Local triage: canonicalize, then diff

For fast shell work, normalize first so plain `diff` has a fair shot:

```bash
diff -u <(jq -S . payload-v1.json) <(jq -S . payload-v2.json)
```

`-S` sorts keys, so key order stops being a problem. Whitespace stops being a problem too, because `jq` re-serializes both files in its own canonical style.

Where it still fails: **arrays**. Line-based diff compares array elements by position, so an unordered set coming back in a different order looks like three value substitutions instead of one permutation:

```json
// Payload A
{"services": ["auth", "billing", "gateway"]}

// Payload B — same set, different order
{"services": ["billing", "gateway", "auth"]}
```

If you need real structural comparison in the terminal, `jd` does its own AST comparison and emits RFC 6902 JSON Patch operations (`add`, `remove`, `replace`). It is the right tool when you want machine-readable output.

## 2. CI/CD: pick a structural diff library

In an integration test, asserting on two large payloads should not shell out. And `assert.deepStrictEqual()` gives you an unreadable blob when both objects have several hundred keys.

What you want is a library that understands structures:

```python
from deepdiff import DeepDiff

diff = DeepDiff(
    payload_v1,
    payload_v2,
    ignore_order=True,        # treat arrays as unordered sets
    significant_digits=4,     # tolerate float drift
)
```

Node's `jsondiffpatch` is the equivalent in the JS world. The important part is not which library — it is that you can express *what "equal" means for your domain*: ignore the timestamp column, round the currency, treat that one array as a set.

That last part is where line-based tools can never follow you.

## 3. Debugging in the browser: don't upload the payload at all

This is where I got personal about it.

Sometimes the payload you need to compare is a customer's production record, or something covered by a contract that says "not processed outside agreed infrastructure." Pasting it into a random online JSON tool is exactly the wrong move, and half the tools you would reach for are upload-by-design.

So I built the thing I wanted: a JSON formatter and mapper that runs **entirely in the browser**. One HTML file, no backend, nothing leaves your machine. It parses, compares and exports CSV client-side, and it works offline once you have the file.

If you want to poke at it: [LocalJSON](https://localjson-black.vercel.app/) — free tier with no account, Pro is a one-time $5 if you need the offline standalone version and unlimited runs.

The comparison logic itself is worth understanding regardless of which tool you use, and there is a longer write-up with all the edge cases in my [Comparing JSON Files](https://localjson-black.vercel.app/blog/compare-json-files/) piece — including the floating-point trap, which is nastier than the ordering one.

# The part nobody warns you about

Two edge cases that bite after you think you're done.

**Array ordering semantics.** RFC 8259 guarantees array order, but applications routinely use arrays for sets — permissions lists, database rows without an `ORDER BY`. If you must compare such arrays, find a unique key (`id`, `uuid`) and correlate on that instead of by index. Positional comparison will lie to you forever otherwise.

**Floating-point precision.** JSON has no distinction between integer and float; it is just "number." Parsers then cast to IEEE 754 doubles, and runtimes disagree about how to print the result:

| Runtime | Value in memory | Serialized JSON |
| --- | --- | --- |
| Python `json.dumps` | `float(1.0)` | `1.0` |
| Node `JSON.stringify` | `1.0` | `1` |
| Go `encoding/json` | `float64(1e-4)` | `0.0001` |

Same number, three spellings. Any comparison that is not numeric-aware will report drift that does not exist.

# Bottom line

If you are diffing JSON, stop diffing JSON as text.

- Quick local look → `jq -S` + `diff`, or `jd` when you want a patch.
- Automated checks → `deepdiff` / `jsondiffpatch` with domain-specific equality rules.
- Sensitive payloads → keep the data in your browser and never upload it.

The whole exercise costs you one insight: compare structure, not lines.

---

*If you end up trying this on your own payloads, I would genuinely like to hear which of the three approaches your team standardized on — especially whether "ignore this array's order" is a rule you have ever needed in CI.*
