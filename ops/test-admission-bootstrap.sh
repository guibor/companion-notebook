#!/bin/bash
# Standalone fake processes only. No XOVI, security helper, input, display,
# notebook access, settings changes, existing-service mutation or UI restart.
# Invoke inside a fresh transient cgroup with 45s runtime plus 2s forced cleanup;
# its cleanup
# covers exec descendants even if they stall before their own main/alarm.
set -Eeuo pipefail
umask 077
[ "$#" = 0 ]
S=$(dirname "$(readlink -f "$0")")
[[ "$S" =~ ^/tmp/companion-admission-bootstrap-[0-9]{8}-[0-9]+$ ]]
[ "$(stat -c %u:%g:%a "$S")" = 0:0:700 ]
cd "$S"
[ "$(find . -type l | wc -l)" = 0 ]
sha256sum -c SHA256SUMS >/dev/null
sha256sum -c runtime.sha256 >/dev/null
[ "$(tr -d '\r\n' </sys/devices/soc0/machine)" = 'reMarkable Ferrari' ]
[ "$(sha256sum /sys/devices/soc0/serial_number | cut -d' ' -f1)" = 106f4d0672a9c180cdb151938872747026d6d39ab56fd73ed01c814ed0ff8d38 ]
grep -Fxq 'IMG_VERSION="3.29.0.148"' /etc/os-release
[ "$(sha256sum /usr/bin/xochitl | cut -d' ' -f1)" = 4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4 ]
unit=companion-bootstrap-audit-${S##*bootstrap-}.service
[ "$(systemctl show -p MainPID --value "$unit")" = "$$" ]
[ "$(systemctl show -p KillMode --value "$unit")" = control-group ]
[ "$(systemctl show -p Restart --value "$unit")" = no ]
[ "$(systemctl show -p RuntimeMaxUSec --value "$unit")" = 45s ]
[ "$(systemctl show -p TimeoutStopUSec --value "$unit")" = 2s ]
[ "$(systemctl show -p SendSIGKILL --value "$unit")" = yes ]
state() {
    local unit p
    for unit in xochitl.service notebook-date-index.service; do
        systemctl is-active --quiet "$unit" || return 1
        [ "$(systemctl show -p NRestarts --value "$unit")" = 0 ] || return 1
        p=$(systemctl show -p MainPID --value "$unit")
        [[ "$p" =~ ^[1-9][0-9]*$ ]] || return 1
        printf '%s=%s,restarts=0\n' "$unit" "$p"
    done
}
before=$(state)
finish() {
    local status=$? after
    trap - EXIT
    after=$(state) || exit 1
    [ "$before" = "$after" ] || exit 1
    printf '%s\n' "$after"
    exit "$status"
}
trap finish EXIT
# Every executed child starts with a deliberately minimal environment. The
# bootstrap itself remains inherited by QProcess; the C child verifies that.
run() {
    local preload=$1 executable=$2
    timeout -k 2 8 env -i PATH=/usr/bin:/bin LANG=en_US.UTF-8 HOME="$S" TMPDIR="$S" \
        LD_PRELOAD="$preload" "$executable"
}
[ ! -e results ]
mkdir -m 0700 results
run "$S/libcompanionbootstrap.so" "$S/admission-preload-child" >results/child.out 2>results/child.err
[ "$(cat results/child.out)" = 6 ]
[ "$(wc -c <results/child.out)" = 2 ]
[ ! -s results/child.err ]
printf '%s\n' 'BOOTSTRAP_CHILD_PASS: inherited bootstrap present, numeric stdout, no Qt/core'

# The same foreign executable also succeeds when NO core exists beside it.
[ ! -e foreign/qml ]
run "$S/foreign/libcompanionbootstrap.so" "$S/foreign/admission-preload-child" >results/foreign.out 2>results/foreign.err
[ "$(cat results/foreign.out)" = 6 ]
[ "$(wc -c <results/foreign.out)" = 2 ]
[ ! -s results/foreign.err ]
printf '%s\n' 'BOOTSTRAP_FOREIGN_PASS: absent core leaves foreign helper unaffected'

# The old combined DSO is a negative control WITHOUT loading XOVI. This proves
# that the regression catches the dependency pollution, not merely clean env.
if run "$S/old-combined.so" "$S/admission-preload-child" >results/old.out 2>results/old.err; then
    exit 1
else
    [ "$?" = 1 ]
fi
[ ! -s results/old.out ]
[ "$(cat results/old.err)" = 'ADMISSION_CHILD_FAIL: inherited Qt or admission module' ]
printf '%s\n' 'BOOTSTRAP_NEGATIVE_PASS: old combined preload rejected for inherited Qt'

run "$S/libcompanionbootstrap.so" "$S/admission-smoke" >results/smoke.out 2>results/smoke.err
grep -Fxq 'ADMISSION_SMOKE_PASS: Qt-free exec child, preserved executable identity, actual bootstrap ABI, one shared registry, cold worker roundtrip, sealed FIFO park, final candidates then release; fake objects only' results/smoke.out
[ ! -s results/smoke.err ]
cat results/smoke.out
sha256sum -c SHA256SUMS >/dev/null
printf '%s\n' 'BOOTSTRAP_AUDIT_PASS: isolated fake processes only; no UI qualification'
