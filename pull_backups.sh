#!/bin/bash
# Pull Posutto production DB backups off-server into ~/posutto-backups.
# - Grabs the current live DB (timestamped) so there is always a fresh copy.
# - Mirrors the server-side cron snapshots (dist/data/backups/).
# - Keeps the newest 30 files locally.
# Reads FTP credentials from the gitignored server/upload_xserver.sh (no secrets here).
set -u

REPO="/Volumes/英紀HD/開発/ポスット"
DEST="$HOME/posutto-backups"
CREDS="$REPO/server/upload_xserver.sh"

if [ ! -f "$CREDS" ]; then
    echo "pull_backups: credentials file not found: $CREDS" >&2
    echo "  (is the external HD mounted?)" >&2
    exit 1
fi

HOST=$(grep -E '^HOST=' "$CREDS" | cut -d'"' -f2)
USER=$(grep -E '^USER=' "$CREDS" | cut -d'"' -f2)
PASS=$(grep -E '^PASS=' "$CREDS" | cut -d'"' -f2)
R=$(grep -E '^REMOTE_PATH=' "$CREDS" | cut -d'"' -f2)
BASE="ftp://$HOST/$R/server/dist/data"

mkdir -p "$DEST"

# 1) Always fetch the current live DB (one per day).
curl -sS --user "$USER:$PASS" "$BASE/posutto.db" \
     -o "$DEST/posutto_live_$(date +%Y-%m-%d).db" --max-time 180 \
  && echo "pull_backups: live DB -> posutto_live_$(date +%Y-%m-%d).db" \
  || echo "pull_backups: WARN failed to fetch live DB" >&2

# 2) Mirror server-side snapshots that we don't already have.
LIST=$(curl -sS --user "$USER:$PASS" "$BASE/backups/" --max-time 120 2>/dev/null \
       | awk '{print $NF}' | grep '\.db$')
for f in $LIST; do
    if [ ! -f "$DEST/$f" ]; then
        curl -sS --user "$USER:$PASS" "$BASE/backups/$f" -o "$DEST/$f" --max-time 180 \
          && echo "pull_backups: snapshot -> $f"
    fi
done

# Retention: keep newest 30 locally.
ls -1t "$DEST"/*.db 2>/dev/null | tail -n +31 | while read -r x; do rm -f "$x"; done

echo "pull_backups: done. $(ls -1 "$DEST"/*.db 2>/dev/null | wc -l | tr -d ' ') files in $DEST"
