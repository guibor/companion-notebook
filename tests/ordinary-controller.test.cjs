const {test, before} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync, spawnSync} = require('node:child_process');
const priorPath = 'build/admission-bootstrap-native/probe.sh';
const currentPath = 'build/ordinary-native/probe.sh';
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const frozen = '8c4bf787d371661d5a772bdaa23416ab547c49f52b27075604928a8a4cfae29c';
let prior, source;
function body(text, anchor) {
    const start = text.indexOf(anchor); assert(start >= 0, anchor);
    const first = text.indexOf('{', start); let depth = 1, end = first + 1;
    for (; depth && end < text.length; ++end) {
        if (text[end] === '{') ++depth;
        if (text[end] === '}') --depth;
    }
    assert.equal(depth, 0); return text.slice(first + 1, end - 1);
}
before(() => {
    assert.equal(hash(priorPath), frozen);
    execFileSync(process.execPath, ['ops/build-ordinary-controller.mjs']);
    assert.equal(hash(priorPath), frozen);
    prior = fs.readFileSync(priorPath, 'utf8'); source = fs.readFileSync(currentPath, 'utf8');
});
test('ordinary derivative preserves exact recovery, independent pen release and runtime policy', () => {
    for (const fn of ['recover', 'release_injected_pen', 'owner_cgroup_empty', 'publish_policy',
        'render_policy', 'verify_policy', 'verify_policy_sources', 'verify_device', 'verify_base_files',
        'healthy', 'settings', 'no_other_owner', 'owner_alive', 'verify_observer'])
        assert.equal(body(source, fn + '()'), body(prior, fn + '()'), fn);
    assert.equal(body(source, 'cleanup_host()'), body(prior, 'cleanup_host()')
        .replace('NativeHost.qml PairStore.js', 'NativeHost.qml PairStore.js SizeRuler.qml')
        .replace('        exact "$H/PairStore.js" "$(hash "$S/PairStore.js")" || return 1',
            '        exact "$H/PairStore.js" "$(hash "$S/PairStore.js")" || return 1\n' +
            '        exact "$H/SizeRuler.qml" "$(hash "$S/SizeRuler.qml")" || return 1'));
    assert(source.includes('mark deadline "$(( $(stamp) + 180 ))"'));
    assert(source.includes('RuntimeMaxSec=420'));
    assert(source.includes('StartLimitBurst=2'));
    assert(source.includes('if [ "$attempts" -eq 2 ]; then'));
    assert.equal(spawnSync('/bin/bash', ['-n', currentPath]).status, 0);
});
test('exact stage inventory has eleven payloads and prepares the ruler with its hash', () => {
    const stage = body(source, 'verify_stage()');
    const expected = ['NativeHost.qml', 'PairStore.js', 'SizeRuler.qml', 'companion-notebook.qmd',
        'base.sha256', 'probe.sh', 'ink-events', 'ink-events-second', 'admission-qmldir',
        'libcompanionadmissionplugin.so', 'libcompanionbootstrap.so'];
    for (const prefix of ['SHA256SUMS ', ''])
        assert(stage.includes(prefix + expected.join(' ') + ' | sort)'));
    assert(stage.includes('[ "$(wc -l <"$S/SHA256SUMS")" -eq 11 ]'));
    assert(stage.includes("grep -Fq 'property bool inkQualified: true'"));
    assert(stage.includes("grep -Fq 'property bool renderProbeOnly: false'"));
    assert(stage.includes('Companion ordinary: lifecycle completed; tuck=true; reveal=true; cancel=true'));
    assert(source.includes('cp "$S/NativeHost.qml" "$S/PairStore.js" "$S/SizeRuler.qml" "$S/libcompanionbootstrap.so" "$B/host-prepared/"'));
    assert(body(source, 'verify_prepared()').includes('exact "$B/host-prepared/SizeRuler.qml" "$(hash "$S/SizeRuler.qml")" || return 1'));
});
test('both fixed input helpers and both resident modules remain byte-identical', () => {
    for (const name of ['ink-events', 'ink-events-second', 'libcompanionbootstrap.so',
        'libcompanionadmissionplugin.so', 'admission-qmldir'])
        assert.equal(hash('build/ordinary-native/' + name), hash('build/admission-bootstrap-native/' + name), name);
    assert(source.includes('absent "$B/pen-release-round1"\nmv "$B/pen-release-verified" "$B/pen-release-round1"'));
    assert.equal(source.split('"$S/ink-events" draw "$probe_pid" "$B/probe.log"').length, 2);
    assert.equal(source.split('"$S/ink-events-second" draw "$probe_pid" "$B/probe.log"').length, 2);
    assert.doesNotMatch(source, /read-frame|capture-frame|setFilterEvents|ExecStart|--preload|ld-linux/);
});
function shellFixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-ordinary-controller-'));
    const B = root + '/backup', S = root + '/stage', H = root + '/host', D = root + '/data';
    fs.mkdirSync(B); fs.mkdirSync(S);
    const setup = `set -e\nB=$1; S=$2; H=$3; D=$4\n` +
        `hash(){ shasum -a 256 "$1" | cut -d' ' -f1; }\n` +
        `exact(){ [ -f "$1" ] && [ ! -L "$1" ] && [ "$(hash "$1")" = "$2" ]; }\n` +
        `absent(){ [ ! -e "$1" ] && [ ! -L "$1" ]; }\n` +
        `private(){ [ -d "$1" ] && [ ! -L "$1" ]; }\n` +
        `names(){${body(source, 'names()')}}\n` +
        `verify_scratch(){ :; }; verify_policy_sources(){ :; }; verify_observer(){ :; }\n`;
    const run = script => spawnSync('/bin/bash', ['-c', setup + script, 'fixture', B, S, H, D], {encoding: 'utf8'});
    const host = destination => {
        fs.mkdirSync(destination); fs.mkdirSync(destination + '/qml');
        for (const name of ['NativeHost.qml', 'PairStore.js', 'SizeRuler.qml', 'libcompanionbootstrap.so']) {
            fs.writeFileSync(S + '/' + name, 'reviewed-' + name);
            fs.copyFileSync(S + '/' + name, destination + '/' + name);
        }
    };
    return {root, B, S, H, D, host, run, close: () => fs.rmSync(root, {recursive: true, force: true})};
}
for (const mode of ['valid', 'missing', 'changed', 'symlink', 'extra']) {
    test('actual prepare/cleanup functions enforce the ruler cohort: ' + mode, () => {
        for (const action of ['verify_prepared', 'cleanup_host']) {
            const f = shellFixture();
            try {
                const dir = action === 'verify_prepared' ? f.B + '/host-prepared' : f.H;
                f.host(dir); fs.mkdirSync(f.B + '/data-prepared');
                const ruler = dir + '/SizeRuler.qml';
                if (mode === 'missing') fs.unlinkSync(ruler);
                if (mode === 'changed') fs.appendFileSync(ruler, 'drift');
                if (mode === 'symlink') { fs.unlinkSync(ruler); fs.symlinkSync(f.S + '/SizeRuler.qml', ruler); }
                if (mode === 'extra') fs.writeFileSync(dir + '/extra', 'unexpected');
                const result = f.run(action + '(){' + body(source, action + '()') + '}\n' + action);
                assert.equal(result.status === 0, mode === 'valid', action + ':' + mode + ':' + result.stderr);
                if (action === 'cleanup_host') {
                    assert.equal(fs.existsSync(f.B + '/host-retained/SizeRuler.qml'), mode === 'valid');
                    assert.equal(fs.existsSync(f.H), mode !== 'valid');
                }
            } finally { f.close(); }
        }
    });
}
test('all owner and watchdog failure scans catch both probe and transaction failures', () => {
    const scan = "grep -Eq 'Companion (probe|transition): FAILED|Companion: host load failed|Type [A-Za-z0-9_]+ unavailable|Non-existent attached object'";
    assert.equal(source.split(scan).length - 1, 5);
    assert(!source.includes("grep -Fq 'Companion probe: FAILED'"));
    const gate = source.split('\n').find(line => line.trim().startsWith('if ' + scan));
    assert(gate);
    for (const [log, good] of [['ready\n', true], ['Companion probe: FAILED test\n', false],
        ['Companion transition: FAILED test\n', false], ['Companion: host load failed\n', false],
        ['Type SizeRuler unavailable\n', false], ['Non-existent attached object\n', false], [null, false]]) {
        const f = shellFixture();
        try {
            if (log !== null) fs.writeFileSync(f.B + '/probe.log', log);
            assert.equal(f.run(gate).status === 0, good, String(log));
        } finally { f.close(); }
    }
});
test('second fixed helper requires the ordinary preset receipt and exactly two open gates', () => {
    const marker = 'Companion ordinary: preset completed; height=1440; fresh-candidates=true';
    const lines = source.split('\n').filter(line => line.startsWith("grep -Fq '" + marker) ||
        line.startsWith('[ "$(grep -Fc \'Companion ink: gate open;'));
    assert.equal(lines.length, 2);
    assert.doesNotMatch(source, /drained during stroke|transition requested during second stroke|Companion admission: round=2/);
    const open = 'Companion ink: gate open; size=1620x2160; docs=test\n';
    for (const [log, good] of [[open + open + marker + '\n', true], [open + marker + '\n', false],
        [open + open, false], [open + open + open + marker + '\n', false]]) {
        const f = shellFixture();
        try { fs.writeFileSync(f.B + '/probe.log', log); assert.equal(f.run(lines.join('\n')).status === 0, good); }
        finally { f.close(); }
    }
});
test('ordinary completion requires lifecycle receipt and two correct submissions per pane', () => {
    const completion = 'Companion probe: ordinary ink submissions completed; panes=2; strokes=4; durable=unverified';
    const lifecycle = 'Companion ordinary: lifecycle completed; tuck=true; reveal=true; cancel=true';
    const start = source.indexOf("\ngrep -Fq '" + completion + "' \"$B/probe.log\"\n");
    const end = source.indexOf('\n[ ! -e "$D/render-primary.png" ]', start);
    assert(start > 0 && end > start);
    const gate = source.slice(start, end);
    const lines = [completion, lifecycle, 'Companion ink: submitted pane=0;', 'Companion ink: submitted pane=0;',
        'Companion ink: submitted pane=1;', 'Companion ink: submitted pane=1;'];
    for (const [label, log, good] of [['all', lines, true], ...lines.map((_, i) =>
        ['missing-' + i, lines.filter((_, n) => n !== i), false]), ['duplicate-lifecycle', [...lines, lifecycle], false],
        ['old-profile', lines.map(s => s.replace('ordinary ink', 'admission ink')), false]]) {
        const f = shellFixture();
        try { fs.writeFileSync(f.B + '/probe.log', log.join('\n') + '\n'); assert.equal(f.run(gate).status === 0, good, label); }
        finally { f.close(); }
    }
    assert(source.includes('mark ordinary-submission-machine-passed "$probe_pid"'));
    assert(source.indexOf(gate) < source.lastIndexOf('healthy probe'));
});
