#!/bin/bash
# Fake-object native smoke only. No xochitl preload, notebooks or display/input.
set -Eeuo pipefail
umask 077
S=${1:?}; EXPECTED=${2:?}
[[ "$S" =~ ^/home/root/.codex-staging/companion-smoke-pro330-[0-9TZ-]+$ ]]
[[ "$EXPECTED" =~ ^[a-f0-9]{64}$ ]]
test "$(stat -c %u:%g:%a "$S")" = 0:0:700
cd "$S"
test "$(sha256sum SHA256SUMS | cut -d' ' -f1)" = "$EXPECTED"
sha256sum -c SHA256SUMS >/dev/null
sha256sum -c runtime.sha256 >/dev/null
test "$(cat /sys/devices/soc0/machine)" = 'reMarkable Ferrari'
test "$(sha256sum /usr/bin/xochitl | cut -d' ' -f1)" = 31d33b05e85af85b06a5a92edf710532a0a122ed4cf51e702c19eed0feb6753b
test "$(findmnt -n -o OPTIONS / | tr ',' '\n' | grep -c '^ro$')" = 1
state() { systemctl show xochitl.service -p MainPID -p NRestarts -p ActiveState; }
before=$(state)
test "$(systemctl show xochitl -p ActiveState --value)" = active
test "$(systemctl show xochitl -p NRestarts --value)" = 0
trap 'test "$(state)" = "$before"' EXIT
test ! -e results; mkdir -m700 results
run() {
 timeout -k 2 10 env -i PATH=/usr/bin:/bin LANG=en_US.UTF-8 HOME="$S" TMPDIR="$S" \
   LD_PRELOAD="$S/libcompanionbootstrap.so" "$S/$1"
}
run admission-preload-child >results/child.out 2>results/child.err
test "$(cat results/child.out)" = 6
test ! -s results/child.err
run admission-smoke >results/smoke.out 2>results/smoke.err
grep -Fxq 'ADMISSION_SMOKE_PASS: Qt-free exec child, preserved executable identity, actual bootstrap ABI, one shared registry, cold worker roundtrip, sealed FIFO park, final candidates then release; fake objects only' results/smoke.out
test ! -s results/smoke.err
test "$(state)" = "$before"
sha256sum -c SHA256SUMS >/dev/null
printf 'companion_pro330_isolated_smoke=passed\n%s\n' "$before" >passed
cat passed
