// Local-only derivative for exercising the real host controls on disposable
// notebooks. No staging clearance, persistent installation or device access.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const prior = 'build/admission-bootstrap-native', out = 'build/ordinary-native';
assert.equal(hash(prior + '/probe.sh'), '8c4bf787d371661d5a772bdaa23416ab547c49f52b27075604928a8a4cfae29c');
let source = fs.readFileSync(prior + '/probe.sh', 'utf8');
const replace = (before, after, count = 1) => {
    assert.equal(source.split(before).length - 1, count, 'Ordinary controller anchor: ' + before);
    source = source.replaceAll(before, () => after);
};
replace('A bounded native-worker admission/park diagnostic in two new disposable notes.',
    'A bounded ordinary-host lifecycle diagnostic in two new disposable notes.');
// SizeRuler is a normal-host dependency: prepare, verify and retain it with the
// host on recovery. Only the inventory/hash additions below change cleanup.
replace('NativeHost.qml PairStore.js', 'NativeHost.qml PairStore.js SizeRuler.qml', 4);
replace('[ "$(wc -l <"$S/SHA256SUMS")" -eq 10 ]', '[ "$(wc -l <"$S/SHA256SUMS")" -eq 11 ]');
replace('    exact "$B/host-prepared/PairStore.js" "$(hash "$S/PairStore.js")" || return 1',
    '    exact "$B/host-prepared/PairStore.js" "$(hash "$S/PairStore.js")" || return 1\n' +
    '    exact "$B/host-prepared/SizeRuler.qml" "$(hash "$S/SizeRuler.qml")" || return 1');
replace('        exact "$H/PairStore.js" "$(hash "$S/PairStore.js")" || return 1',
    '        exact "$H/PairStore.js" "$(hash "$S/PairStore.js")" || return 1\n' +
    '        exact "$H/SizeRuler.qml" "$(hash "$S/SizeRuler.qml")" || return 1');
replace('    cp "$S/NativeHost.qml" "$S/PairStore.js" "$S/libcompanionbootstrap.so" "$B/host-prepared/"',
    '    cp "$S/NativeHost.qml" "$S/PairStore.js" "$S/SizeRuler.qml" "$S/libcompanionbootstrap.so" "$B/host-prepared/"');
replace("grep -Fq 'property bool inkQualified: false'", "grep -Fq 'property bool inkQualified: true'");
replace("grep -Fq 'property bool renderProbeOnly: true'", "grep -Fq 'property bool renderProbeOnly: false'");
replace("    grep -Fq 'durable=unverified' \"$S/NativeHost.qml\" || return 1",
    `    grep -Fq 'Companion probe: ordinary ink submissions completed; panes=2; strokes=4; durable=unverified' "$S/NativeHost.qml" || return 1
    grep -Fq 'Companion ordinary: lifecycle completed; tuck=true; reveal=true; cancel=true' "$S/NativeHost.qml" || return 1`);
// Preserve all time/restart/cgroup/release limits. A normal-host transaction
// failure now closes both owner polling and the existing watchdog fail scan.
replace("grep -Fq 'Companion probe: FAILED'",
    "grep -Eq 'Companion (probe|transition): FAILED|Companion: host load failed|Type [A-Za-z0-9_]+ unavailable|Non-existent attached object'", 5);
replace('Companion admission: round=2; height=1440; fresh-candidates=true',
    'Companion ordinary: preset completed; height=1440; fresh-candidates=true', 2);
replace(`grep -Fq 'Companion admission: drained during stroke; submissions=2; generation=1' "$B/probe.log"
grep -Fq 'Companion admission: transition requested during second stroke' "$B/probe.log"
`, '');
replace('Companion probe: admission ink submissions completed; panes=2; strokes=4; durable=unverified',
    'Companion probe: ordinary ink submissions completed; panes=2; strokes=4; durable=unverified', 2);
replace(`grep -Fq 'Companion probe: ordinary ink submissions completed; panes=2; strokes=4; durable=unverified' "$B/probe.log"
[ "$(grep -Fc 'Companion ink: submitted pane=0;' "$B/probe.log")" = 2 ]`,
    `grep -Fq 'Companion probe: ordinary ink submissions completed; panes=2; strokes=4; durable=unverified' "$B/probe.log"
[ "$(grep -Fc 'Companion ordinary: lifecycle completed; tuck=true; reveal=true; cancel=true' "$B/probe.log")" = 1 ]
[ "$(grep -Fc 'Companion ink: submitted pane=0;' "$B/probe.log")" = 2 ]`);
replace('mark admission-submission-machine-passed "$probe_pid"', 'mark ordinary-submission-machine-passed "$probe_pid"');

// Reuse only the unchanged, already qualified bootstrap/core and fixed input
// helpers. Host/QMD/PairStore/SizeRuler are produced separately by the owner.
const common = {
    'libcompanionbootstrap.so': '113f6b72899225ff062d21cf3db28e2e8ec5b716a79d49f0987ae914d2d55a39',
    'libcompanionadmissionplugin.so': 'e4b3d8550654409dc06703b95fc5c59ed2c98c09aa37207275c35c29bb6dd89f',
    'admission-qmldir': '5d6bc9a2e632fe2304db143667a6ff1c95c1ccccc65000485881cf1b8a5c084e',
    'ink-events': 'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e',
    'ink-events-second': 'f15bd56c67ced9b8ea28dd5f9a447f1ffe39f7f27aef28f0500c95125d611453'
};
const bytes = {};
for (const [name, expected] of Object.entries(common)) {
    const file = prior + '/' + name;
    const stat = fs.lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink(), 'Require regular frozen helper: ' + name);
    bytes[name] = fs.readFileSync(file);
    assert.equal(createHash('sha256').update(bytes[name]).digest('hex'), expected, name);
}
execFileSync('/bin/bash', ['-n'], {input: source});
fs.mkdirSync(out, {recursive: true});
for (const [name, data] of Object.entries(bytes)) {
    fs.writeFileSync(out + '/' + name, data);
    fs.chmodSync(out + '/' + name, name.startsWith('ink-events') ? 0o700 : 0o600);
}
fs.writeFileSync(out + '/probe.sh', source, {mode: 0o700});
fs.chmodSync(out + '/probe.sh', 0o700);
assert.equal(hash(prior + '/probe.sh'), '8c4bf787d371661d5a772bdaa23416ab547c49f52b27075604928a8a4cfae29c');
console.log('Ordinary disposable controller built locally; no staging clearance: ' + hash(out + '/probe.sh'));
