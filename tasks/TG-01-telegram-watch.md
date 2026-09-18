# TG-01 - Telegram bot watch and send scripts with launchd

## Context
We need a bash script (`tg-watch.sh`) that polls Telegram Bot API (`getUpdates` with `offset`) using `TG_BOT_TOKEN`, filters messages strictly from `chat_id = 1568126`, saves message text to a file, logs it, and runs in an infinite loop. Also an independent `tg-send.sh` script to send messages (`sendMessage`). And a launchd plist configuration loaded via `launchctl` to run the watcher in the background.

## Requirements
1. `tg-watch.sh`:
   - Reads `TG_BOT_TOKEN` from environment.
   - Polls `https://api.telegram.org/bot<TOKEN>/getUpdates?offset=<offset>&timeout=30`.
   - Filters updates to only process messages where `message.chat.id == 1568126`.
   - Saves message text to a file (e.g., `received_messages.txt`).
   - Logs events (with timestamps).
   - Runs in a continuous infinite loop (does not exit after the first batch).
2. `tg-send.sh`:
   - Takes chat_id and text as arguments, or uses defaults, and calls `sendMessage`.
3. `com.localjson.tgwatch.plist`:
   - launchd plist config pointing to `tg-watch.sh`.
   - Loads the job via `launchctl load` (or `bootstrap`).
4. Place files appropriately (e.g. scripts in repo root or scripts dir, plist where appropriate or loaded).

## Acceptance
```bash
# Verify scripts exist and are executable
test -x tg-watch.sh
test -x tg-send.sh
test -f com.localjson.tgwatch.plist
# Verify script checks TG_BOT_TOKEN and filters chat_id 1568126
grep -q "1568126" tg-watch.sh
grep -q "getUpdates" tg-watch.sh
grep -q "sendMessage" tg-send.sh
```
