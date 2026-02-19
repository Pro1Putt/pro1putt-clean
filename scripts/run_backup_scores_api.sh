#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# launchd has a minimal PATH – hardcode node
NODE_BIN="/usr/local/bin/node"
if [ ! -x "$NODE_BIN" ]; then
  echo "ERROR: node not executable at $NODE_BIN"
  exit 127
fi

# Minimal safe PATH for git/curl/etc.
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

# Load .env.local (KEY=VALUE), robust for CRLF, comments, quotes
if [ -f .env.local ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"
    [[ -z "$line" ]] && continue
    [[ "$line" == \#* ]] && continue
    [[ "$line" != *"="* ]] && continue

    key="${line%%=*}"
    val="${line#*=}"

    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"

    if [[ "$val" == \"*\" ]]; then val="${val:1:-1}"; fi
    if [[ "$val" == \'*\' ]]; then val="${val:1:-1}"; fi

    export "$key=$val"
  done < .env.local
fi

echo "Loaded URL=${NEXT_PUBLIC_SUPABASE_URL:-"(empty)"}"
echo "Loaded KEY=${SUPABASE_SERVICE_ROLE_KEY:-"(empty)"}" | sed 's/\(sb_.....\).*/\1.../'

"$NODE_BIN" scripts/backup_core_api.mjs

git add backups/supabase
if ! git diff --cached --quiet; then
  git commit -m "backup: core api $(date +'%Y-%m-%d_%H-%M-%S')"
  git push
fi
