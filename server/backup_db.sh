#!/bin/bash
# Daily SQLite backup for Posutto, run via Xserver cron.
# Snapshots the live DB into dist/data/backups/ and keeps the newest 30.
#
# Xserver cron example (daily 04:00 JST) — replace <ACCOUNT> with your Xserver user:
#   0 4 * * * /bin/bash /home/<ACCOUNT>/sns-tool.online/public_html/posutto/server/backup_db.sh > /dev/null 2>&1
set -u

cd "$(dirname "$0")" || exit 1

DB="dist/data/posutto.db"
BK="dist/data/backups"

if [ ! -f "$DB" ]; then
    echo "backup_db: DB not found: $DB" >&2
    exit 1
fi

mkdir -p "$BK"
cp "$DB" "$BK/posutto_$(date +%Y-%m-%d_%H-%M-%S).db" || exit 1

# Retention: keep the newest 30 backups, delete older ones.
ls -1t "$BK"/posutto_*.db 2>/dev/null | tail -n +31 | while read -r f; do
    rm -f "$f"
done

echo "backup_db: ok ($(ls -1 "$BK"/posutto_*.db 2>/dev/null | wc -l | tr -d ' ') backups)"
