#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# === EINMALIG AUSFÜLLEN (Supabase DB Passwort, NICHT API Key) ===
PGHOST="aws-1-eu-central-1.pooler.supabase.com"
PGPORT="5432"
PGUSER="postgres.levztgbjylvspmfxcbuj"
PGDATABASE="postgres"
PGPASSWORD="Rubmuw-mexqiO-mypvaz"

export PGHOST PGPORT PGUSER PGDATABASE PGPASSWORD

OUT_DIR="$(pwd)/backups/supabase"
TS="$(date +'%Y-%m-%d_%H-%M-%S')"
OUT_FILE="$OUT_DIR/scores_${TS}.sql.gz"

mkdir -p "$OUT_DIR"

pg_dump --no-owner --no-privileges --format=plain --table=public.scores | gzip -9 > "$OUT_FILE"

ls -1t "$OUT_DIR"/scores_*.sql.gz 2>/dev/null | tail -n +501 | xargs -r rm -f

git add "$OUT_DIR"
if ! git diff --cached --quiet; then
  git commit -m "backup: scores ${TS}"
  git push
fi
