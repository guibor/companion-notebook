#!/bin/bash
# Read-only copy of the already-loaded spy buffer, only while exact disposable
# views are visibly held by the visual diagnostic. No Qt grabs or input writes.
set -Eeuo pipefail
umask 077
ID=${1:-}; P=${2:-}; STAGE=${3:-}
[[ "$ID" =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+$ && "$P" =~ ^[1-9][0-9]*$ ]] || exit 2
case "$STAGE" in 1) HEIGHT=1080;; 2) HEIGHT=1440;; *) exit 2;; esac
B=/home/root/.codex-backups/companion-$ID
LOG=$B/probe.log
OUT=$B/frame-$STAGE.rgb32
DOCS=3fe4ae5a-a74e-4de3-994c-b1c40b1ccbe2,e761bdbe-f6b0-495d-8224-cacd07fff3c8
BYTES=13996800
READER=$(dirname "$(readlink -f "$0")")/read-frame
START=$(awk '{print $22}' "/proc/$P/stat")
[[ "$START" =~ ^[1-9][0-9]*$ ]] || exit 1
guard() {
    [ -d "$B" ] && [ ! -L "$B" ] && [ "$(readlink -f "$B")" = "$B" ] || return 1
    [ "$(stat -c %u:%g:%a "$B")" = 0:0:700 ] || return 1
    [ -f "$LOG" ] && [ ! -L "$LOG" ] && [ "$(stat -c %u "$LOG")" = 0 ] || return 1
    [ "$(stat -c %s "$LOG")" -lt 1048576 ] || return 1
    [ ! -e "$B/recovered" ] && [ ! -e "$B/recovering" ] && [ ! -e "$B/abort" ] || return 1
    [ "$(readlink -f "/proc/$P/exe")" = /usr/bin/xochitl ] || return 1
    [ "$(awk '{print $22}' "/proc/$P/stat")" = "$START" ] || return 1
    tr '\0' '\n' <"/proc/$P/environ" | grep -Fxq "XOVI_ROOT=$B/runtime/" || return 1
    if grep -Fq 'Companion probe: FAILED' "$LOG"; then return 1; else [ "$?" -eq 1 ] || return 1; fi
    local line epoch now
    line=$(grep -E 'Companion visual: (ready;|gate closed)' "$LOG" | tail -n 1) || return 1
    [[ "$line" == *"Companion visual: ready; stage=$STAGE; height=$HEIGHT; docs=$DOCS; pen=false; epoch="* ]] || return 1
    epoch=${line##*epoch=}; epoch=${epoch%%[^0-9]*}
    [[ "$epoch" =~ ^[0-9]{13}$ ]] || return 1
    now=$(date +%s)
    [ "$(( now - epoch / 1000 ))" -ge 0 ] && [ "$(( now - epoch / 1000 ))" -le 2 ]
}
guard
[ ! -e "$OUT" ] && [ ! -L "$OUT" ] && [ ! -e "$OUT.part" ] && [ ! -L "$OUT.part" ]
[ "$(grep -c '^Found framebuffer! Config string is ' "$LOG")" = 1 ]
CONFIG=$(sed -n 's/^Found framebuffer! Config string is //p' "$LOG")
[[ "$CONFIG" =~ ^0x([0-9a-f]{1,12}),1620,2160,2,6528,0$ ]] || exit 1
ADDRESS=0x${BASH_REMATCH[1]}
[ -f "$READER" ] && [ ! -L "$READER" ] && [ "$(stat -c %u:%g:%a "$READER")" = 0:0:700 ]
trap 'rm -f "$OUT.part"' EXIT
# noclobber prevents overwriting another artifact. The pinned read-only helper
# reads only 6480 visible bytes per row, skipping all 48 padding bytes in memory.
set -C
/usr/bin/timeout -s KILL 5 "$READER" "$P" "$ADDRESS" >"$OUT.part"
[ "$(stat -c %s "$OUT.part")" = "$BYTES" ]
guard
mv "$OUT.part" "$OUT"
trap - EXIT
printf 'Companion visual: buffer copied; stage=%s; bytes=%s; sha256=' "$STAGE" "$BYTES"
sha256sum "$OUT" | cut -d' ' -f1
