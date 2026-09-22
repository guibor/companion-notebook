// Local build only; separate review/staging clearance is mandatory.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const original='build/ink-native/probe.sh',out='build/retirement-native';
assert.equal(hash(original),'b9b5fee626014bcdc0e45b421d9e4f50b53cecca0fe5b3fcfa263a94749c68f6','Keep the accepted fixed-ink recovery unchanged');
let result=fs.readFileSync(original,'utf8');
const replace=(a,b)=>{assert.equal(result.split(a).length,2,'Expected one anchor: '+a);result=result.replace(a,()=>b);};
const elf=JSON.parse(fs.readFileSync('build/observer-arm64/elf-review.json'));
const plugin='build/observer-arm64/qml/Companion/Lifecycle/libcompanionlifecycleplugin.so';
const qmldir='native-observer/qmldir';
assert.equal(hash(plugin),elf.binarySha256);
for(const [p,h] of Object.entries(elf.sourceHashes)) assert.equal(hash('native-observer/'+p),h);
assert.equal(hash('build/ink-native/ink-events'),'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e');
fs.mkdirSync(out,{recursive:true});
assert.equal(hash('ops/ink-events.c'),'49a15876efd326407b994acac950b859ad908888ba3510efb8c26a77415f6507');
const before='draw(550,450,850,500) && pause_ms(600) && draw(700,1500,1000,1570)';
const after='draw(550,650,850,700) && pause_ms(600) && draw(700,1700,1000,1770)';
const helperSource=fs.readFileSync('ops/ink-events.c','utf8');
assert.equal(helperSource.split(before).length,2);
fs.writeFileSync(out+'/ink-events-second.c',helperSource.replace(before,after));
execFileSync('aarch64-linux-gnu-gcc',['-O2','-Wall','-Wextra','-Werror','-static','-s',out+'/ink-events-second.c','-o',out+'/ink-events-second']);
const secondHash=hash(out+'/ink-events-second');
replace('# A bounded fixed-layout native-ink diagnostic in two new disposable notes.',
  '# A bounded native-handler retirement/recreation diagnostic in two new disposable notes.');
replace('Environment="XOVI_ROOT=%s/"\\nMemoryMax=',
  'Environment="XOVI_ROOT=%s/"\\nEnvironment="QML_IMPORT_PATH=/home/root/.local/lib/companion-notebook/qml"\\nMemoryMax=');
replace('UnsetEnvironment=LD_PRELOAD XOVI_ROOT ', 'UnsetEnvironment=QML_IMPORT_PATH LD_PRELOAD XOVI_ROOT ');
replace('SHA256SUMS NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh ink-events | sort)',
  'SHA256SUMS NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh ink-events ink-events-second lifecycle-qmldir libcompanionlifecycleplugin.so | sort)');
replace('NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh ink-events | sort)',
  'NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh ink-events ink-events-second lifecycle-qmldir libcompanionlifecycleplugin.so | sort)');
replace('[ "$(wc -l <"$S/SHA256SUMS")" -eq 6 ]','[ "$(wc -l <"$S/SHA256SUMS")" -eq 9 ]');
replace('verify_prepared() {',`verify_observer() {
    local h=$1
    private "$h/qml" && private "$h/qml/Companion" && private "$h/qml/Companion/Lifecycle" || return 1
    [ "$(names "$h/qml")" = Companion ] || return 1
    [ "$(names "$h/qml/Companion")" = Lifecycle ] || return 1
    [ "$(names "$h/qml/Companion/Lifecycle")" = "$(printf '%s\\n' qmldir libcompanionlifecycleplugin.so | sort)" ] || return 1
    exact "$h/qml/Companion/Lifecycle/qmldir" ${hash(qmldir)} || return 1
    exact "$h/qml/Companion/Lifecycle/libcompanionlifecycleplugin.so" ${hash(plugin)}
}
verify_prepared() {`);
replace('NativeHost.qml PairStore.js | sort)" ] || return 1\n    exact "$B/host-prepared/NativeHost.qml"',
  'NativeHost.qml PairStore.js qml | sort)" ] || return 1\n    exact "$B/host-prepared/NativeHost.qml"');
replace('    exact "$B/host-prepared/PairStore.js" "$(hash "$S/PairStore.js")"',
  '    exact "$B/host-prepared/PairStore.js" "$(hash "$S/PairStore.js")" || return 1\n    verify_observer "$B/host-prepared"');
replace('NativeHost.qml PairStore.js | sort)" ] || return 1\n        exact "$H/NativeHost.qml"',
  'NativeHost.qml PairStore.js qml | sort)" ] || return 1\n        verify_observer "$H" || return 1\n        exact "$H/NativeHost.qml"');
replace('    cp "$S/NativeHost.qml" "$S/PairStore.js" "$B/host-prepared/"',
  `    cp "$S/NativeHost.qml" "$S/PairStore.js" "$B/host-prepared/"
    mkdir -m 0700 "$B/host-prepared/qml" "$B/host-prepared/qml/Companion" "$B/host-prepared/qml/Companion/Lifecycle"
    cp "$S/lifecycle-qmldir" "$B/host-prepared/qml/Companion/Lifecycle/qmldir"
    cp "$S/libcompanionlifecycleplugin.so" "$B/host-prepared/qml/Companion/Lifecycle/"`);
replace('    grep -Fq \'durable=unverified\' "$S/NativeHost.qml" || return 1',
  `    exact "$S/libcompanionlifecycleplugin.so" ${hash(plugin)} || return 1
    exact "$S/lifecycle-qmldir" ${hash(qmldir)} || return 1
    exact "$S/ink-events-second" ${secondHash} || return 1
    [ "$(stat -c %u:%g:%a "$S/ink-events-second")" = 0:0:700 ] || return 1
    grep -Fq 'import Companion.Lifecycle 1.0 as Lifecycle' "$S/NativeHost.qml" || return 1
    grep -Fq 'durable=unverified' "$S/NativeHost.qml" || return 1`);
// Verify the actual provider bytes on the target, not just the firmware string.
const runtimePaths={'libQt6Core.so.6':'/usr/lib/libQt6Core.so.6.10.3','libQt6Qml.so.6':'/usr/lib/libQt6Qml.so.6.10.3',
  'libstdc++.so.6':'/usr/lib/libstdc++.so.6.0.36','libgcc_s.so.1':'/usr/lib/libgcc_s.so.1','libc.so.6':'/usr/lib/libc.so.6'};
const runtimeChecks=Object.entries(elf.runtimeHashes).map(([lib,h])=>{
  assert(runtimePaths[lib]);return `    exact ${runtimePaths[lib]} ${h} || return 1`;
}).join('\n');
replace('    [ "$(findmnt -n -o OPTIONS / | tr \',\' \'\\n\' | grep -c \'^ro$\')" = 1 ]',
  runtimeChecks+'\n    [ "$(findmnt -n -o OPTIONS / | tr \',\' \'\\n\' | grep -c \'^ro$\')" = 1 ]');
replace('mark pen-release-verified owner\nsync\nfor n in $(seq 1 25); do',
  `mark pen-release-verified owner
sync
for n in $(seq 1 30); do
    healthy probe
    systemctl is-active --quiet "$WATCH"
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    if grep -Fq 'Companion retirement: round=2; height=1320' "$B/probe.log"; then break; fi
    sleep 1
done
grep -Fq 'Companion retirement: both native handlers retired; generation=1' "$B/probe.log"
grep -Fq 'Companion retirement: live geometry moved; steps=12;' "$B/probe.log"
grep -Fq 'Companion retirement: round=2; height=1320' "$B/probe.log"
[ "$(grep -Fc 'Companion ink: gate open; size=1620x2160; docs=' "$B/probe.log")" = 2 ]
"$S/ink-events" inspect
absent "$B/pen-release-round1"
mv "$B/pen-release-verified" "$B/pen-release-round1"
mark pen-injection-started "$probe_pid round2"
sync
"$S/ink-events-second" draw "$probe_pid" "$B/probe.log"
mark pen-release-verified owner-round2
sync
for n in $(seq 1 25); do`);
result=result.replaceAll('fixed ink submissions completed; panes=2; durable=unverified',
  'retirement ink submissions completed; panes=2; strokes=4; durable=unverified');
for(const pane of [0,1]) replace(`[ "$(grep -Fc 'Companion ink: submitted pane=${pane};' "$B/probe.log")" = 1 ]`,
  `[ "$(grep -Fc 'Companion ink: submitted pane=${pane};' "$B/probe.log")" = 2 ]`);
replace('mark ink-submission-machine-passed "$probe_pid"','mark retirement-submission-machine-passed "$probe_pid"');
// Keep the same 25 healthy-PID/watchdog checks, but observe stability after the
// controlled strokes, with input closed. Waiting here before watching the gate
// previously left disposable input open and unmonitored for many seconds.
const stability=`for n in $(seq 1 25); do
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    healthy probe
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    systemctl is-active --quiet "$WATCH"
    sleep 1
done`;
replace(stability,'# Start monitoring the ready gate immediately; stability is checked with input closed below.');
const finalLogScan=`if grep -Eiq 'Failed to load file|ReferenceError|TypeError|is not a type|Cannot assign|Unable to assign|QQmlComponent: Component is not ready|Binding loop|module .* is not installed' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi`;
replace('mark retirement-submission-machine-passed "$probe_pid"',
  stability+'\n'+finalLogScan+'\nmark retirement-submission-machine-passed "$probe_pid"');
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(plugin,out+'/libcompanionlifecycleplugin.so');
fs.copyFileSync(qmldir,out+'/lifecycle-qmldir');
fs.copyFileSync('build/ink-native/ink-events',out+'/ink-events');
fs.writeFileSync(out+'/probe.sh',result,{mode:0o700});
execFileSync('/bin/bash',['-n',out+'/probe.sh']);
console.log('Retirement controller built, no staging clearance: '+hash(out+'/probe.sh'));
