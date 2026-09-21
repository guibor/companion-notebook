#!/bin/bash
# A bounded load-only trial from the accepted r1 base. Always returns to base;
# no commit/persistence action, document creation, or native notebook file writes.
set -Eeuo pipefail
umask 077
ACTION=${1:-}; ID=${2:-}; MANIFEST=${3:-}
case "$ACTION" in prepare|run|watchdog) ;; *) exit 2;; esac
[[ "$ID" =~ ^[0-9]{8}T[0-9]{6}Z-[0-9]+$ ]] || exit 2
[[ "$MANIFEST" =~ ^[a-f0-9]{64}$ ]] || exit 2
S=/home/root/.codex-staging/companion-$ID
B=/home/root/.codex-backups/companion-$ID
X=/home/root/xovi
Q=$X/exthome/qt-resource-rebuilder
R=$B/runtime
H=/home/root/.local/lib/companion-notebook
D=/home/root/.local/share/companion-notebook
BASE_DROP=/run/systemd/system/xochitl.service.d/zzzz-pro329-apps-20260921T193500Z-3.conf
DROP=/run/systemd/system/xochitl.service.d/zzzzz-companion-$ID.conf
OWNER=companion-probe-$ID.service
WATCH=companion-watch-$ID.service
LOCK=/run/companion-probe.lock

hash() { sha256sum "$1" | cut -d' ' -f1; }
exact() { [ -f "$1" ] && [ ! -L "$1" ] && [ "$(readlink -f "$1")" = "$1" ] && [ "$(hash "$1")" = "$2" ]; }
absent() { [ ! -e "$1" ] && [ ! -L "$1" ]; }
pid() { systemctl show -p MainPID --value "$1"; }
stamp() { awk '{print int($1)}' /proc/uptime; }
mark() { printf '%s\n' "$2" >"$B/.$$.marker"; mv "$B/.$$.marker" "$B/$1"; }
private() { [ -d "$1" ] && [ ! -L "$1" ] && [ "$(readlink -f "$1")" = "$1" ] && [ "$(stat -c %u:%g:%a "$1")" = 0:0:700 ]; }
names() { local p; for p in "$1"/* "$1"/.[!.]* "$1"/..?*; do [ -e "$p" ] || [ -L "$p" ] || continue; printf '%s\n' "${p##*/}"; done | sort; }
verify_device() {
    [ "$(tr -d '\r\n' </sys/devices/soc0/machine)" = 'reMarkable Ferrari' ] || return 1
    [ "$(hash /sys/devices/soc0/serial_number)" = 106f4d0672a9c180cdb151938872747026d6d39ab56fd73ed01c814ed0ff8d38 ] || return 1
    grep -Fxq 'IMG_VERSION="3.29.0.148"' /etc/os-release || return 1
    [ "$(tr -d '[:space:]' </etc/version)" = 20260911125116 ] || return 1
    exact /usr/bin/xochitl 4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4 || return 1
    [ "$(findmnt -n -o OPTIONS / | tr ',' '\n' | grep -c '^ro$')" = 1 ]
}
verify_base_files() {
    exact "$S/base.sha256" 5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d || return 1
    [ "$(names "$Q")" = "$( { awk '{print $2}' "$S/base.sha256"; printf 'hashtab\n'; } | sort)" ] || return 1
    local expected name
    while read -r expected name; do exact "$Q/$name" "$expected" || return 1; done <"$S/base.sha256"
    exact "$Q/hashtab" 1f2a0f7177dac3cdfc030ff32b4643170dd2ef6e2f6c6369b4c4168513ce01f0 || return 1
    exact "$X/xovi.so" d4df820c25c634c511de11067279d8310fa4f656dc52bd4540db6beac4ffd446 || return 1
    exact "$X/extensions.d/qt-resource-rebuilder.so" 6726f561557406f36347e43fc2b44a88deef4fb273d2ece88f48f427dad8800f || return 1
    exact "$X/extensions.d/appload.so" 5b2dd6c066da6932d88a1d62be1068ca5ba751f481636dd51f727221db62e3ad || return 1
    exact "$X/extensions.d/xovi-message-broker.so" 61c0c7b0d4e2c7623147a87c63d6a4aaec868019e67fb0e1bdb1fcb215f6e155 || return 1
    exact "$X/extensions.d/framebuffer-spy.so" 0a999dffbcb4026b59d6626a15360ef9388747448fdeeb97e4dab155425e3e1e || return 1
    while IFS= read -r name; do
        case "$name" in
            appload.so|framebuffer-spy.so|qt-resource-rebuilder.so|xovi-message-broker.so) ;;
            ._appload.so|._qt-resource-rebuilder.so|._xovi-message-broker.so)
                exact "$X/extensions.d/$name" a502dbe0e569c3718c449b86480d0cd4cdc23e3a450814de360e5b0a5e08c5d3 || return 1;;
            *) return 1;;
        esac
    done < <(names "$X/extensions.d")
    exact "$X/exthome/appload/remarkable-dispatch/remarkable-dispatch" f9896596941caa77ae9a1ba88da8e1ca09cc4f08f0f52560b800b54efe8875cc
}
verify_scratch() {
    local dir=$R/exthome/qt-resource-rebuilder expected name
    [ "$(readlink "$R/extensions.d")" = "$X/extensions.d" ] || return 1
    [ "$(readlink "$R/exthome/appload")" = "$X/exthome/appload" ] || return 1
    [ "$(names "$dir")" = "$( { awk '{print $2}' "$S/base.sha256"; printf 'hashtab\ncompanion-notebook.qmd\n'; } | sort)" ] || return 1
    while read -r expected name; do exact "$dir/$name" "$expected" || return 1; done <"$S/base.sha256"
    exact "$dir/hashtab" 1f2a0f7177dac3cdfc030ff32b4643170dd2ef6e2f6c6369b4c4168513ce01f0 || return 1
    exact "$dir/companion-notebook.qmd" "$(hash "$S/companion-notebook.qmd")"
}
render_policy() {
    case "$1" in
        probe) printf '[Service]\nEnvironment="XOVI_ROOT=%s/"\nStandardOutput=append:%s/probe.log\nStandardError=append:%s/probe.log\n' "$R" "$B" "$B";;
        stock) printf '[Service]\nUnsetEnvironment=LD_PRELOAD XOVI_ROOT QMLDIFF_HASHTAB_CREATE QML_DISABLE_DISK_CACHE QML_XHR_ALLOW_FILE_WRITE QML_XHR_ALLOW_FILE_READ\n';;
        *) return 1;;
    esac
}
verify_policy_sources() {
    local mode expected
    for mode in probe stock; do
        expected=$(render_policy "$mode" | sha256sum | cut -d' ' -f1) || return 1
        exact "$B/policy-$mode.conf" "$expected" || return 1
    done
}
verify_prepared() {
    verify_scratch || return 1
    verify_policy_sources || return 1
    private "$B/host-prepared" || return 1
    private "$B/data-prepared" || return 1
    [ -z "$(names "$B/data-prepared")" ] || return 1
    [ "$(names "$B/host-prepared")" = "$(printf '%s\n' NativeHost.qml PairStore.js | sort)" ] || return 1
    exact "$B/host-prepared/NativeHost.qml" "$(hash "$S/NativeHost.qml")" || return 1
    exact "$B/host-prepared/PairStore.js" "$(hash "$S/PairStore.js")"
}
verify_stage() {
    private "$S" || return 1
    exact "$S/SHA256SUMS" "$MANIFEST" || return 1
    [ "$(names "$S")" = "$(printf '%s\n' SHA256SUMS NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh | sort)" ] || return 1
    [ "$(awk 'NF==2 {print $2}' "$S/SHA256SUMS" | sort)" = "$(printf '%s\n' NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh | sort)" ] || return 1
    [ "$(wc -l <"$S/SHA256SUMS")" -eq 5 ] || return 1
    [ "$(find "$S" -type l | wc -l)" -eq 0 ] || return 1
    (cd "$S" && sha256sum -c SHA256SUMS) >/dev/null || return 1
    grep -Fq 'property bool inkQualified: false' "$S/NativeHost.qml"
}
verify_base_policy() {
    exact /run/systemd/system/xochitl.service 0cbc768bc2b28a15992e11185538c9ae7ce496fb354a75ab112ddd7f646ca863 || return 1
    exact /run/systemd/system/xochitl.service.d/xochitl-service-override.conf 9b9b319cc0c9173bcfee48ed9210937d292f4a8cea5e26011e5d23ee624af83c || return 1
    exact "$BASE_DROP" 269653a30afe656c8e839cac03ba97be49c25eee949c6f9a8529337427103496 || return 1
    [ "$(systemctl show -p FragmentPath --value xochitl.service)" = /run/systemd/system/xochitl.service ] || return 1
    [ -z "$(systemctl show -p OnFailure --value xochitl.service)" ] || return 1
    [ "$(systemctl show -p Restart --value xochitl.service)" = no ]
}
verify_policy() {
    verify_base_policy || return 1
    local paths="/run/systemd/system/xochitl.service.d/xochitl-service-override.conf $BASE_DROP"
    if [ "$1" != base ]; then
        exact "$DROP" "$(hash "$B/policy-$1.conf")" || return 1
        paths="$paths $DROP"
    else absent "$DROP" || return 1; fi
    [ "$(systemctl show -p DropInPaths --value xochitl.service)" = "$paths" ]
}
healthy() {
    local mode=$1 p env item expected
    systemctl is-active --quiet xochitl.service || return 1
    p=$(pid xochitl.service); [[ "$p" =~ ^[1-9][0-9]*$ ]] || return 1
    [ "$(readlink -f "/proc/$p/exe")" = /usr/bin/xochitl ] || return 1
    [ "$(systemctl show -p NRestarts --value xochitl.service)" = 0 ] || return 1
    env=$(tr '\0' '\n' <"/proc/$p/environ") || return 1
    if [ "$mode" = stock ]; then
        ! printf '%s\n' "$env" | grep -Eq '^(LD_PRELOAD|XOVI_ROOT|QML_DISABLE_DISK_CACHE|QMLDIFF_HASHTAB_CREATE)=' || return 1
        ! grep -Fq "$X/xovi.so" "/proc/$p/maps" || return 1
    else
        expected="$X/services/xochitl.service/"; [ "$mode" != probe ] || expected="$R/"
        printf '%s\n' "$env" | grep -Fxq "XOVI_ROOT=$expected" || return 1
        printf '%s\n' "$env" | grep -Fxq "LD_PRELOAD=$X/xovi.so" || return 1
        for expected in QML_DISABLE_DISK_CACHE=1 QML_XHR_ALLOW_FILE_WRITE=1 QML_XHR_ALLOW_FILE_READ=1 MALLOC_ARENA_MAX=8; do
            printf '%s\n' "$env" | grep -Fxq "$expected" || return 1
        done
        ! printf '%s\n' "$env" | grep -q '^QMLDIFF_HASHTAB_CREATE=' || return 1
        for item in "$X/xovi.so" "$X/extensions.d/qt-resource-rebuilder.so" "$X/extensions.d/appload.so" "$X/extensions.d/xovi-message-broker.so" "$X/extensions.d/framebuffer-spy.so"; do
            awk -v p="$item" '$NF==p {f=1} END {exit !f}' "/proc/$p/maps" || return 1
        done
    fi
}
settings() {
    sha256sum /home/root/.config/gestik.json /home/root/.local/share/gestik-beta/gestik.json \
        /home/root/.local/share/notebook-date-index/settings.json \
        /home/root/.local/share/notebook-date-index/token \
        /home/root/.local/share/notebook-date-index/sync.json \
        "$X/exthome/appload/remarkable-dispatch/settings.env"
    local p
    for p in "$X/exthome/appload/smart-remarkable/.env" /home/root/.config/smart-remarkable/settings.conf \
        /home/root/.ssh/id_dropbear_smart_remarkable_bridge /home/root/.ssh/known_hosts; do
        [ ! -e "$p" ] || sha256sum "$p"
    done
}
no_other_owner() {
    absent /run/pro329-apps-activation.lock || return 1
    local units p exe
    units=$(systemctl list-units --type=service --state=active,activating,deactivating --no-legend --plain | awk '{print $1}') || return 1
    ! printf '%s\n' "$units" | grep -Ev "^($OWNER|$WATCH)$" | grep -Eq '^(companion-(probe|watch)|pro329-(r1|apps)-(install|watchdog)|remagic-live|remarkable-beta-os-(hashtab|pro-bettertoc)|smart-remarkable-llm|dates-.*-(install|rollback)|dispatch-.*-(install|rollback)|notebook-ui-repair|rmstream-shortcut-(install|rollback))' || return 1
    for p in /proc/[0-9]*/exe; do
        [ -L "$p" ] || continue; exe=$(readlink -f "$p" 2>/dev/null || true)
        case "$exe" in */smart_remarkable|*/riddle|*/remarkable-dispatch|*/rmstream|"$X/exthome/appload/rmstream/"*|*/vellum|*/apk|*/apk.vellum) return 1;; esac
    done
}
owner_alive() {
    local p start
    read -r p start <"$B/owner" || return 1
    [ "$(pid "$OWNER")" = "$p" ] && [ -r "/proc/$p/stat" ] && [ "$(awk '{print $22}' "/proc/$p/stat")" = "$start" ]
}
publish_policy() {
    local mode=$1 temp=$DROP.ready.$$
    absent "$temp" || return 1
    if ! absent "$DROP"; then
        exact "$DROP" "$(hash "$B/policy-probe.conf")" || exact "$DROP" "$(hash "$B/policy-stock.conf")" || return 1
    fi
    cp "$B/policy-$mode.conf" "$temp" || return 1
    chmod 0644 "$temp" || return 1
    exact "$temp" "$(hash "$B/policy-$mode.conf")" || return 1
    mv "$temp" "$DROP" || return 1
    systemctl daemon-reload || return 1
    verify_policy "$mode"
}
cleanup_host() {
    if ! absent "$H"; then
        [ "$(names "$H")" = "$(printf '%s\n' NativeHost.qml PairStore.js | sort)" ] || return 1
        exact "$H/NativeHost.qml" "$(hash "$S/NativeHost.qml")" || return 1
        exact "$H/PairStore.js" "$(hash "$S/PairStore.js")" || return 1
        absent "$B/host-retained" || return 1
        mv "$H" "$B/host-retained" || return 1
    fi
    if ! absent "$D"; then
        private "$D" || return 1
        absent "$B/settings-retained" || return 1
        mv "$D" "$B/settings-retained" || return 1
    fi
}
recover() {
    mark recovering "$1"
    systemctl kill --kill-whom=all --signal=KILL "$OWNER" 2>/dev/null || true
    systemctl stop "$OWNER" 2>/dev/null || true
    [ "$(pid "$OWNER")" = 0 ] || return 1
    verify_device || return 1
    verify_base_files || return 1
    verify_base_policy || return 1
    verify_policy_sources || return 1
    local restored=base
    if [ -f "$B/stock-start-attempted" ]; then
        # Durable restart budget: a retry only finishes cleanup of healthy stock.
        verify_policy stock || return 1
        healthy stock || return 1
        restored=stock
    else
        if ! absent "$DROP"; then
            exact "$DROP" "$(hash "$B/policy-probe.conf")" || exact "$DROP" "$(hash "$B/policy-stock.conf")" || return 1
            rm "$DROP" || return 1
            systemctl daemon-reload || return 1
        fi
        verify_policy base || return 1
        if ! healthy base && [ ! -f "$B/base-start-attempted" ]; then
            mark base-start-attempted before-stop-start || return 1
            sync || return 1
            systemctl stop xochitl.service || return 1
            systemctl reset-failed xochitl.service || return 1
            systemctl start xochitl.service || true
            for n in $(seq 1 25); do healthy base && break; sleep 1; done
        fi
        if ! healthy base; then
            publish_policy stock || return 1
            mark stock-start-attempted before-stop-start || return 1
            sync || return 1
            systemctl stop xochitl.service || return 1
            systemctl reset-failed xochitl.service || return 1
            systemctl start xochitl.service || return 1
            for n in $(seq 1 25); do healthy stock && break; sleep 1; done
            healthy stock || return 1
            restored=stock
        fi
    fi
    cleanup_host || return 1
    sha256sum -c "$B/settings.sha256" >/dev/null || return 1
    [ "$(pid notebook-date-index.service)" = "$(cat "$B/dates-pid")" ] || return 1
    verify_device || return 1
    if ! absent "$LOCK"; then rmdir "$LOCK" || return 1; fi
    mark recovered "$restored:$(pid xochitl.service)"
}

# Watchdog retry accounting precedes fallible stage/device/payload gates.
# systemd additionally bounds starts even if the state directory itself fails.
if [ "$ACTION" = watchdog ]; then
    [ "$(pid "$WATCH")" = "$$" ]
    private "$B"
    attempts=0; [ ! -f "$B/watch-attempts" ] || attempts=$(cat "$B/watch-attempts")
    [[ "$attempts" =~ ^[0-2]$ ]] || exit 1
    if [ "$attempts" -eq 2 ]; then mark manual-intervention-required watchdog-retry-limit; exit 0; fi
    mark watch-attempts "$((attempts + 1))"
    trap 'mark manual-intervention-required watchdog-execution-failed' EXIT
fi
verify_stage
verify_device
verify_base_files
if [ "$ACTION" = prepare ]; then
    no_other_owner; healthy base; verify_policy base
    absent "$B"; absent "$H"; absent "$D"; absent "$LOCK"
    [ "$(df -Pk /home | awk 'NR==2 {print $4}')" -gt 131072 ]
    mkdir -m 0700 "$B"
    settings >"$B/settings.sha256"
    pid xochitl.service >"$B/base-pid"; pid notebook-date-index.service >"$B/dates-pid"
    systemctl is-active --quiet notebook-date-index.service
    tar -czf "$B/preimages.tgz" -C / run/systemd/system/xochitl.service run/systemd/system/xochitl.service.d \
        home/root/xovi/exthome/qt-resource-rebuilder home/root/.config/gestik.json home/root/.local/share/gestik-beta/gestik.json
    tar -tzf "$B/preimages.tgz" >/dev/null
    mkdir -p "$R/exthome/qt-resource-rebuilder"
    mkdir -m 0700 "$B/host-prepared" "$B/data-prepared"
    cp "$S/NativeHost.qml" "$S/PairStore.js" "$B/host-prepared/"
    ln -s "$X/extensions.d" "$R/extensions.d"
    ln -s "$X/exthome/appload" "$R/exthome/appload"
    cp "$Q/hashtab" "$R/exthome/qt-resource-rebuilder/hashtab"
    while read -r _ name; do cp "$Q/$name" "$R/exthome/qt-resource-rebuilder/$name"; done <"$S/base.sha256"
    cp "$S/companion-notebook.qmd" "$R/exthome/qt-resource-rebuilder/companion-notebook.qmd"
    (cd "$R/exthome/qt-resource-rebuilder" && sha256sum -c "$S/base.sha256") >/dev/null
    exact "$R/exthome/qt-resource-rebuilder/companion-notebook.qmd" "$(hash "$S/companion-notebook.qmd")"
    render_policy probe >"$B/policy-probe.conf"
    render_policy stock >"$B/policy-stock.conf"
    verify_prepared
    mark prepared "$MANIFEST"; sync
    printf 'backup=%s/preimages.tgz\nsha256=%s\n' "$B" "$(hash "$B/preimages.tgz")"
    exit 0
fi
private "$B"
[ "$(cat "$B/prepared")" = "$MANIFEST" ]
if [ "$ACTION" = watchdog ]; then
    verify_policy_sources
    mark watchdog-ready ready
    deadline=$(cat "$B/deadline"); [[ "$deadline" =~ ^[0-9]+$ ]]
    if [ -f "$B/recovered" ]; then trap - EXIT; exit 0; fi
    while [ "$(stamp)" -lt "$deadline" ]; do
        if ! owner_alive || [ -f "$B/abort" ]; then recover owner-ended; trap - EXIT; exit; fi
        sleep 1
    done
    recover deadline
    trap - EXIT
    exit
fi
[ "$ACTION" = run ]
[ "$(pid "$OWNER")" = "$$" ]
[ "$(systemctl show -p Type --value "$OWNER")" = exec ]
[ "$(systemctl show -p KillMode --value "$OWNER")" = control-group ]
[ "$(cat "$B/mac-backup-verified")" = "mac-backup:$(hash "$B/preimages.tgz")" ]
no_other_owner; healthy base; verify_policy base
verify_prepared
[ "$(pid xochitl.service)" = "$(cat "$B/base-pid")" ]
[ "$(pid notebook-date-index.service)" = "$(cat "$B/dates-pid")" ]
sha256sum -c "$B/settings.sha256" >/dev/null
absent "$H"; absent "$D"; absent "$B/owner"
mkdir "$LOCK"
mark owner "$$ $(awk '{print $22}' /proc/$$/stat)"
mark deadline "$(( $(stamp) + 90 ))"
systemd-run --unit="${WATCH%.service}" --property=Type=exec --property=KillMode=control-group \
    --property=StartLimitIntervalSec=3600 --property=StartLimitBurst=2 --property=StartLimitAction=none \
    --property=Restart=on-failure --property=RestartSec=1 --property=RuntimeMaxSec=300 \
    /bin/bash "$S/probe.sh" watchdog "$ID" "$MANIFEST"
for n in $(seq 1 10); do [ ! -f "$B/watchdog-ready" ] || break; sleep 1; done
[ -f "$B/watchdog-ready" ]; systemctl is-active --quiet "$WATCH"
trap 'touch "$B/abort"' EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
mv "$B/host-prepared" "$H"
mv "$B/data-prepared" "$D"
publish_policy probe
systemctl restart xochitl.service
sleep 3
healthy probe
probe_pid=$(pid xochitl.service)
for n in $(seq 1 25); do
    healthy probe
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    systemctl is-active --quiet "$WATCH"
    sleep 1
done
grep -Fq 'Companion: host ready; ink=false; settings=true' "$B/probe.log"
[ "$(grep -Ec '\[qmldiff\]: Loading file [^ ]+\.qmd$' "$B/probe.log")" -eq 12 ]
! grep -Eiq 'Failed to load file|ReferenceError|TypeError|is not a type|Cannot assign|Unable to assign|QQmlComponent: Component is not ready|Binding loop|module .* is not installed' "$B/probe.log"
mark load-only-passed "$probe_pid"
# Deliberately end without a commit; watchdog proves automatic base recovery.
exit 0
