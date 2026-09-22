// A mechanically bounded derivative of the independently reviewed load-only
// controller. The generated controller requires its own review before use.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const geometry = process.env.CN_PROBE === 'geometry';
const ink = process.env.CN_PROBE === 'ink';
const structural = process.env.CN_PROBE === 'structural' || geometry || ink;
assert(!process.env.CN_PROBE || structural || process.env.CN_PROBE === 'render');
const source=fs.readFileSync('ops/probe-pro329.sh','utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'e219d071e62a5170f2799ba6b406a086495bc995e4976b7371265f9cf14116fb');
let result=source;
function replace(before,after) {
    assert.equal(result.split(before).length,2,`Expected one controller anchor: ${before}`);
    // Replacement strings interpret $$ and $&. Shell dollars must stay literal.
    result=result.replace(before,()=>after);
}
replace('# A bounded load-only trial from the accepted r1 base. Always returns to base;\n# no commit/persistence action, document creation, or native notebook file writes.',
    '# A bounded two-disposable-document rendering trial from accepted r1 base.\n# Native APIs create test notebooks; no ink or direct notebook-file edits. Always reverts.');
replace("    grep -Fq 'property bool inkQualified: false' \"$S/NativeHost.qml\"",
    "    grep -Fq 'property bool inkQualified: false' \"$S/NativeHost.qml\" || return 1\n    grep -Fq 'property bool renderProbeOnly: true' \"$S/NativeHost.qml\"");
replace(' + 90 ))"',' + 180 ))"');
replace('--property=RuntimeMaxSec=300','--property=RuntimeMaxSec=420');
// The independent watchdog observes native failure even while the owner is
// busy with its full health checks. Recovery itself and restart budgets do not change.
replace('        if ! owner_alive || [ -f "$B/abort" ]; then recover owner-ended; trap - EXIT; exit; fi',
    `        if [ -f "$B/probe.log" ] && grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then
            recover native-failure; trap - EXIT; exit
        fi
        if ! owner_alive || [ -f "$B/abort" ]; then recover owner-ended; trap - EXIT; exit; fi`);
replace('for n in $(seq 1 25); do\n    healthy probe',
    `for n in $(seq 1 25); do
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    healthy probe`);
replace('Environment="XOVI_ROOT=%s/"\\nStandardOutput=',
    'Environment="XOVI_ROOT=%s/"\\nMemoryMax=1073741824\\nStandardOutput=');
replace('    verify_base_policy || return 1\n    local paths=',
    '    verify_base_policy || return 1\n    if [ "$1" = probe ]; then [ "$(systemctl show -p MemoryMax --value xochitl.service)" = 1073741824 ] || return 1; fi\n    local paths=');
replace("grep -Fq 'Companion: host ready; ink=false; settings=true' \"$B/probe.log\"",
    `for n in $(seq 1 80); do
    healthy probe
    systemctl is-active --quiet "$WATCH"
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    if grep -Fq 'Companion probe: two native views and return completed; ink=false; capture=true' "$B/probe.log"; then break; fi
    sleep 1
done
grep -Fq 'Companion probe: two native views and return completed; ink=false; capture=true' "$B/probe.log"
[ -s "$D/render-primary.png" ]
[ -s "$D/render-secondary.png" ]`);
const strictErrors="'Failed to load file|ReferenceError|TypeError|is not a type|Cannot assign|Unable to assign|QQmlComponent: Component is not ready|Binding loop|module .* is not installed'";
replace(`! grep -Eiq ${strictErrors} "$B/probe.log"`,
    `if grep -Eiq ${strictErrors} "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi`);
replace('mark load-only-passed "$probe_pid"','systemctl is-active --quiet "$WATCH"\nmark rendering-machine-passed "$probe_pid"');
if (structural) {
    replace('# A bounded two-disposable-document rendering trial from accepted r1 base.',
        '# A bounded no-capture structural trial from accepted r1 base; not visual acceptance.');
    const oldMarker='Companion probe: two native views and return completed; ink=false; capture=true';
    assert.equal(result.split(oldMarker).length,3);
    result=result.replaceAll(oldMarker,'Companion probe: structural sequence and return completed; ink=false; capture=not-attempted; visual=unverified');
    replace('[ -s "$D/render-primary.png" ]\n[ -s "$D/render-secondary.png" ]',
        '[ ! -e "$D/render-primary.png" ]\n[ ! -e "$D/render-secondary.png" ]');
    replace('mark rendering-machine-passed "$probe_pid"','mark structural-machine-passed "$probe_pid"');
    replace("    grep -Fq 'property bool renderProbeOnly: true' \"$S/NativeHost.qml\"",
        `    grep -Fq 'property bool renderProbeOnly: true' "$S/NativeHost.qml" || return 1
    grep -Fq 'capture=not-attempted; visual=unverified' "$S/NativeHost.qml" || return 1
    if grep -Eq 'grabToImage|grabWindow|probeCapture|saveToFile|ShaderEffect|layer[[:space:]]*\\.' "$S/NativeHost.qml" "$S/companion-notebook.qmd"; then
        return 1
    else
        [ "$?" -eq 1 ] || return 1
    fi`);
}
if (geometry) {
    result=result.replaceAll('structural sequence and return completed','geometry sequence and return completed')
        .replace('mark structural-machine-passed', 'mark geometry-machine-passed');
}
if (ink) {
    const helper=fs.readFileSync('build/ink-native/ink-events');
    assert.equal(helper.subarray(0,4).toString('hex'),'7f454c46');
    assert.equal(helper.readUInt16LE(18),183,'ARM64 helper required');
    const helperHash=createHash('sha256').update(helper).digest('hex');
    replace('# A bounded no-capture structural trial from accepted r1 base; not visual acceptance.\n# Native APIs create test notebooks; no ink or direct notebook-file edits. Always reverts.',
        '# A bounded fixed-layout native-ink diagnostic in two new disposable notes.\n# Always reverts; no personal pilot, firmware changes or direct notebook-file edits.');
    replace('SHA256SUMS NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh | sort)',
        'SHA256SUMS NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh ink-events | sort)');
    replace('NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh | sort)',
        'NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh ink-events | sort)');
    replace('[ "$(wc -l <"$S/SHA256SUMS")" -eq 5 ]', '[ "$(wc -l <"$S/SHA256SUMS")" -eq 6 ]');
    replace("grep -Fq 'capture=not-attempted; visual=unverified' \"$S/NativeHost.qml\"",
        `exact "$S/ink-events" ${helperHash} || return 1
    [ "$(stat -c %u:%g:%a "$S/ink-events")" = 0:0:700 ] || return 1
    grep -Fq 'durable=unverified' "$S/NativeHost.qml"`);
    replace('recover() {', `owner_cgroup_empty() {
    # cgroup v2 populated includes descendants; MainPID=0 alone is insufficient.
    local group state current path
    group=$(cat "$B/owner-cgroup") || return 1
    [ "$group" = "/system.slice/$OWNER" ] || return 1
    [ "$(findmnt -n -o FSTYPE /sys/fs/cgroup)" = cgroup2 ] || return 1
    [ -f /sys/fs/cgroup/cgroup.controllers ] || return 1
    [ "$(readlink -f /sys/fs/cgroup/system.slice)" = /sys/fs/cgroup/system.slice ] || return 1
    state=$(systemctl show -p ActiveState --value "$OWNER") || return 1
    case "$state" in inactive|failed) ;; *) return 1;; esac
    current=$(systemctl show -p ControlGroup --value "$OWNER") || return 1
    [ -z "$current" ] || [ "$current" = "$group" ] || return 1
    path=/sys/fs/cgroup$group
    if absent "$path"; then return 0; fi
    [ -d "$path" ] && [ ! -L "$path" ] || return 1
    [ "$(readlink -f "$path")" = "$path" ] || return 1
    [ "$(awk '$1=="populated" {print $2}' "$path/cgroup.events")" = 0 ]
}
release_injected_pen() {
    # The owner cgroup (including event writer) MUST be dead first. Never start
    # base/stock while an interrupted synthetic down could still be latched.
    [ -f "$B/pen-injection-started" ] || return 0
    [ ! -f "$B/pen-release-verified" ] || return 0
    exact "$S/ink-events" ${helperHash} || return 1
    "$S/ink-events" release || return 1
    mark pen-release-verified watchdog || return 1
    sync
}
recover() {`);
    replace('    [ "$(pid "$OWNER")" = 0 ] || return 1\n    verify_device',
        '    [ "$(pid "$OWNER")" = 0 ] || return 1\n    owner_cgroup_empty || return 1\n    release_injected_pen || return 1\n    verify_device');
    replace('[ "$(systemctl show -p KillMode --value "$OWNER")" = control-group ]',
        `[ "$(systemctl show -p KillMode --value "$OWNER")" = control-group ]
[ "$(systemctl show -p Restart --value "$OWNER")" = no ]
owner_group=$(systemctl show -p ControlGroup --value "$OWNER")
[ "$owner_group" = "/system.slice/$OWNER" ]
[ "$(findmnt -n -o FSTYPE /sys/fs/cgroup)" = cgroup2 ]
[ -r "/sys/fs/cgroup$owner_group/cgroup.events" ]`);
    replace('mark owner "$$ $(awk \'{print $22}\' /proc/$$/stat)"',
        `mark owner "$$ $(awk '{print $22}' /proc/$$/stat)"
mark owner-cgroup "$owner_group"`);
    replace('    mark prepared "$MANIFEST"; sync',
        '    "$S/ink-events" inspect\n    mark prepared "$MANIFEST"; sync');
    replace('no_other_owner; healthy base; verify_policy base\nverify_prepared',
        'no_other_owner; healthy base; verify_policy base\n"$S/ink-events" inspect\nverify_prepared');
    const previous=`for n in $(seq 1 80); do
    healthy probe
    systemctl is-active --quiet "$WATCH"
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    if grep -Fq 'Companion probe: structural sequence and return completed; ink=false; capture=not-attempted; visual=unverified' "$B/probe.log"; then break; fi
    sleep 1
done
grep -Fq 'Companion probe: structural sequence and return completed; ink=false; capture=not-attempted; visual=unverified' "$B/probe.log"`;
    replace(previous,`for n in $(seq 1 60); do
    healthy probe
    systemctl is-active --quiet "$WATCH"
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    if grep -Fq 'Companion ink: gate open; size=1620x2160; docs=' "$B/probe.log"; then break; fi
    sleep 1
done
grep -Fq 'Companion ink: gate open; size=1620x2160; docs=' "$B/probe.log"
"$S/ink-events" inspect
mark pen-injection-started "$probe_pid"
sync
"$S/ink-events" draw "$probe_pid" "$B/probe.log"
mark pen-release-verified owner
sync
for n in $(seq 1 25); do
    healthy probe
    systemctl is-active --quiet "$WATCH"
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    if grep -Fq 'Companion probe: fixed ink submissions completed; panes=2; durable=unverified' "$B/probe.log"; then break; fi
    sleep 1
done
grep -Fq 'Companion probe: fixed ink submissions completed; panes=2; durable=unverified' "$B/probe.log"
[ "$(grep -Fc 'Companion ink: submitted pane=0;' "$B/probe.log")" = 1 ]
[ "$(grep -Fc 'Companion ink: submitted pane=1;' "$B/probe.log")" = 1 ]`);
    replace('mark structural-machine-passed "$probe_pid"','mark ink-submission-machine-passed "$probe_pid"');
}
const output=ink ? 'build/ink-native' : geometry ? 'build/geometry-native' : structural ? 'build/structural-native' : 'build/render-native';
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(output+'/probe.sh',result,{mode:0o700});
console.log((ink?'Fixed ink':structural?'Structural':'Rendering')+' controller (requires independent review): '+createHash('sha256').update(result).digest('hex'));
