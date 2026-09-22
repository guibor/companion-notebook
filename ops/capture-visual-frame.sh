#!/bin/bash
# Read-only copy of the already-loaded spy buffer, only while exact disposable
# views are visibly held by the visual diagnostic. No Qt grabs or input writes.
set -Eeuo pipefail
umask 077
ID=${1:-}; P=${2:-}; STAGE=${3:-}
[[ "$ID" =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+$ && "$P" =~ ^[1-9][0-9]*$ ]] || exit 2
case "$STAGE" in 1) HEIGHT=1320;; 2) HEIGHT=1680;; *) exit 2;; esac
B=/home/root/.codex-backups/companion-$ID
LOG=$B/probe.log
OUT=$B/frame-$STAGE.rgb32
DOCS=9baaab38-b382-4f8c-9871-2932c2afe4ca,3ded6fc6-4f79-401e-99ec-dae6a934ae4a
BYTES=14100480
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
ADDRESS=$(( 16#${BASH_REMATCH[1]} ))
[ "$ADDRESS" -ge 65536 ] && [ "$ADDRESS" -le 281474962610175 ]
trap 'rm -f "$OUT.part"' EXIT
# noclobber ensures this capsule never overwrites another artifact. dd reads
# only one bounded native RGB32 image; it cannot write tablet memory.
set -C
/usr/bin/timeout -s KILL 5 dd if="/proc/$P/mem" bs=65536 \
    iflag=skip_bytes,count_bytes skip="$ADDRESS" count="$BYTES" >"$OUT.part" 2>/dev/null
[ "$(stat -c %s "$OUT.part")" = "$BYTES" ]
guard
mv "$OUT.part" "$OUT"
trap - EXIT
printf 'Companion visual: buffer copied; stage=%s; bytes=%s; sha256=' "$STAGE" "$BYTES"
sha256sum "$OUT" | cut -d' ' -f1
