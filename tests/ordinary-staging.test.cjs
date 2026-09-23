// Positive staging and damaged receipts exist only in private temporary copies.
// The real one-run clearance is never enabled, nor is a real stage created here.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {spawnSync} = require('node:child_process');
const trial = '20260923T052500Z-1', stage = 'build/probe-' + trial;
const sourcePath = path.resolve('ops/stage-ordinary.mjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const base = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
const names = ['NativeHost.qml', 'PairStore.js', 'SizeRuler.qml', 'admission-qmldir', 'base.sha256',
    'companion-notebook.qmd', 'ink-events', 'ink-events-second', 'libcompanionadmissionplugin.so',
    'libcompanionbootstrap.so', 'probe.sh'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
test('uncleared ordinary stage rejects every request before evidence reads or writes', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-ordinary-uncleared-'));
    try {
        for (const id of [trial, '20260922T233500Z-1', '../escape']) {
            const r = spawnSync(process.execPath, [sourcePath, id], {cwd: root, encoding: 'utf8'});
            assert.notEqual(r.status, 0);
            assert.match(r.stderr, /Ordinary disposable trial requires a fresh exact-capsule review/);
            assert.deepEqual(fs.readdirSync(root), []);
        }
    } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
function fixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-ordinary-staging-'));
    const localBase = root + '/base.sha256';
    assert.equal(source.split(base).length, 2);
    assert.match(source, /const clearedTrial = null;/);
    fs.writeFileSync(root + '/stage.mjs', source.replace('const clearedTrial = null;',
        "const clearedTrial = '" + trial + "';").replace(base, localBase));
    fs.mkdirSync(root + '/build/admission-arm64', {recursive: true});
    fs.cpSync('build/ordinary-native', root + '/build/ordinary-native', {recursive: true});
    fs.copyFileSync(base, localBase);
    for (const name of ['bootstrap-target-smoke.json', 'admission-smoke', 'admission-preload-child'])
        fs.copyFileSync('build/admission-arm64/' + name, root + '/build/admission-arm64/' + name);
    const smokePath = root + '/build/admission-arm64/bootstrap-target-smoke.json';
    const compositionPath = root + '/build/ordinary-native/composition.json';
    const smoke = JSON.parse(fs.readFileSync(smokePath));
    const composition = JSON.parse(fs.readFileSync(compositionPath));
    return {root, localBase, smokePath, compositionPath, smoke, composition,
        writeSmoke: () => fs.writeFileSync(smokePath, JSON.stringify(smoke)),
        writeComposition: () => fs.writeFileSync(compositionPath, JSON.stringify(composition)),
        run: (id = trial) => spawnSync(process.execPath, [root + '/stage.mjs', id], {cwd: root, encoding: 'utf8'}),
        close: () => fs.rmSync(root, {recursive: true, force: true})};
}
test('exact ordinary fixture stages only eleven private payloads with a reproducible manifest', () => {
    const f = fixture();
    try {
        const r = f.run(); assert.equal(r.status, 0, r.stderr);
        const result = JSON.parse(r.stdout), dir = f.root + '/' + stage;
        assert.deepEqual(fs.readdirSync(dir).sort(), [...names, 'SHA256SUMS'].sort());
        assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
        const expected = names.map(name => hash(fs.readFileSync(dir + '/' + name)) + '  ' + name + '\n').join('');
        assert.equal(fs.readFileSync(dir + '/SHA256SUMS', 'utf8'), expected);
        assert.equal(result.manifestSha256, hash(expected));
        assert.equal(result.controllerSha256, hash(fs.readFileSync(dir + '/probe.sh')));
        assert.equal(result.penEnabled, true); assert.equal(result.ordinaryDocumentInk, false);
        assert.equal(result.releaseQualified, false);
        for (const name of [...names, 'SHA256SUMS']) assert.equal(fs.statSync(dir + '/' + name).mode & 0o777,
            ['probe.sh', 'ink-events', 'ink-events-second'].includes(name) ? 0o700 : 0o600);
        assert.notEqual(f.run().status, 0, 'never reuse a completed stage');
        assert.equal(fs.readFileSync(dir + '/SHA256SUMS', 'utf8'), expected);
    } finally { f.close(); }
});
for (const name of names) test('ordinary stage refuses exact payload drift: ' + name, () => {
    const f = fixture();
    try {
        fs.appendFileSync(name === 'base.sha256' ? f.localBase : f.root + '/build/ordinary-native/' + name, 'drift');
        assert.notEqual(f.run().status, 0); assert(!fs.existsSync(f.root + '/' + stage));
    } finally { f.close(); }
});
test('ordinary stage refuses changed qualification/composition fields', () => {
    for (const [key, value] of [['status', 'target-pass'], ['profile', 'load'], ['firmware', '3.29.0.999'],
        ['penEnabled', false], ['ordinaryDocumentInk', true], ['baseQmds', 10], ['embedded', 0],
        ['baseManifestSha256', 'wrong'], ['candidateSha256', 'wrong'], ['payloadSha256', {}],
        ['counts', {'companion-first': 30, 'companion-last': 30}]]) {
        const f = fixture();
        try {
            f.composition[key] = value; f.writeComposition();
            assert.notEqual(f.run().status, 0, key); assert(!fs.existsSync(f.root + '/' + stage));
        } finally { f.close(); }
    }
});
test('ordinary stage requires actual matching bootstrap target evidence with unchanged service PIDs', () => {
    const changes = [
        ...['childInheritedBootstrap', 'childQtFree', 'foreignWithoutCorePassed', 'oldCombinedNegativeControlPassed',
            'workerQmlSmokePassed', 'postcheckCgroupAbsent', 'protectedSettingsUnchanged', 'rootReadOnly'].map(key => [key, false]),
        ...['uiRestarted', 'xoviLoadedInTest', 'uiQualified'].map(key => [key, true]),
        ['status', 'local-pass'], ['model', 'reMarkable Chiappa'], ['firmware', '3.29.0.999'],
        ['hostFingerprint', 'wrong'], ['moduleSha256', 'wrong'], ['bootstrapSha256', 'wrong'],
        ['executableSha256', 'wrong'], ['childSha256', 'wrong'], ['exitCode', 1],
        ['uiPidBefore', 0], ['uiPidAfter', 0], ['datesPidBefore', 0], ['datesPidAfter', 0],
        ['uiRestartsBefore', 1], ['uiRestartsAfter', 1], ['datesRestartsBefore', 1], ['datesRestartsAfter', 1]
    ];
    for (const [key, value] of changes) {
        const f = fixture();
        try {
            f.smoke[key] = value; f.writeSmoke();
            assert.notEqual(f.run().status, 0, key); assert(!fs.existsSync(f.root + '/' + stage));
        } finally { f.close(); }
    }
});
test('ordinary stage refuses wrong trial, partial/dangling stages and nonregular evidence', () => {
    for (const mode of ['id', 'partial', 'dangling', 'host-link', 'ruler-link', 'base-link',
        'composition-link', 'smoke-link', 'smoke-missing', 'smoke-executable-drift', 'child-drift', 'host-directory']) {
        const f = fixture();
        try {
            const dir = f.root + '/' + stage;
            if (mode === 'partial') { fs.mkdirSync(dir); fs.writeFileSync(dir + '/keep', 'untouched'); }
            else if (mode === 'dangling') fs.symlinkSync(f.root + '/missing', dir);
            else if (mode.endsWith('-link')) {
                const file = {'host-link': f.root + '/build/ordinary-native/NativeHost.qml',
                    'ruler-link': f.root + '/build/ordinary-native/SizeRuler.qml', 'base-link': f.localBase,
                    'composition-link': f.compositionPath, 'smoke-link': f.smokePath}[mode];
                fs.renameSync(file, file + '.real'); fs.symlinkSync(file + '.real', file);
            } else if (mode === 'smoke-missing') fs.unlinkSync(f.smokePath);
            else if (mode === 'smoke-executable-drift' || mode === 'child-drift')
                fs.appendFileSync(f.root + '/build/admission-arm64/' + (mode === 'child-drift' ? 'admission-preload-child' : 'admission-smoke'), 'drift');
            else if (mode === 'host-directory') {
                const file = f.root + '/build/ordinary-native/NativeHost.qml'; fs.unlinkSync(file); fs.mkdirSync(file);
            }
            assert.notEqual(f.run(mode === 'id' ? '20260922T233500Z-1' : trial).status, 0, mode);
            if (mode === 'partial') assert.equal(fs.readFileSync(dir + '/keep', 'utf8'), 'untouched');
            else if (mode === 'dangling') assert(fs.lstatSync(dir).isSymbolicLink());
            else assert(!fs.existsSync(dir));
        } finally { f.close(); }
    }
});
