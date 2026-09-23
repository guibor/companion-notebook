// All positive staging occurs in private temporary copies, never in the real
// workspace. No real clearance is enabled and no tablet is contacted.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {spawnSync} = require('node:child_process');
const trial = '20260922T235000Z-1';
const stage = 'build/probe-' + trial;
const sourcePath = path.resolve('ops/stage-visual-reopen.mjs');
const source = fs.readFileSync(sourcePath, 'utf8');
const base = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
const names = ['NativeHost.qml', 'PairStore.js', 'base.sha256', 'capture-frame', 'companion-notebook.qmd', 'probe.sh', 'read-frame'];
const hash = value => createHash('sha256').update(value).digest('hex');

test('uncleared visual stage refuses before evidence access or directory creation', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-visual-uncleared-'));
    try {
        for (const id of [trial, '20260922T233500Z-1', '../escape']) {
            const result = spawnSync(process.execPath, [sourcePath, id], {cwd: root, encoding: 'utf8'});
            assert.notEqual(result.status, 0);
            assert.match(result.stderr, /Visual reopen requires a fresh exact-capsule review/);
            assert.deepEqual(fs.readdirSync(root), []);
        }
    } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
function fixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-visual-staging-'));
    const localBase = root + '/accepted-base.sha256';
    assert.equal(source.split(base).length, 2);
    assert.match(source, /const clearedTrial = null;/);
    fs.writeFileSync(root + '/stage.mjs', source
        .replace('const clearedTrial = null;', "const clearedTrial = '" + trial + "';")
        .replace(base, localBase));
    fs.mkdirSync(root + '/build', {recursive: true});
    fs.cpSync('build/visual-native', root + '/build/visual-native', {recursive: true});
    fs.copyFileSync(base, localBase);
    const receiptPath = root + '/build/visual-native/composition.json';
    const receipt = JSON.parse(fs.readFileSync(receiptPath));
    return {root, localBase, receipt,
        write: () => fs.writeFileSync(receiptPath, JSON.stringify(receipt)),
        run: (id = trial) => spawnSync(process.execPath, [root + '/stage.mjs', id], {cwd: root, encoding: 'utf8'}),
        close: () => fs.rmSync(root, {recursive: true, force: true})};
}
test('reviewed visual fixture contains exactly seven pinned files and a reproducible manifest', () => {
    const f = fixture();
    try {
        const result = f.run();
        assert.equal(result.status, 0, result.stderr);
        const output = JSON.parse(result.stdout);
        const dir = f.root + '/' + stage;
        assert.deepEqual(fs.readdirSync(dir).sort(), [...names, 'SHA256SUMS'].sort());
        assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
        const expected = names.map(name => hash(fs.readFileSync(dir + '/' + name)) + '  ' + name + '\n').join('');
        assert.equal(fs.readFileSync(dir + '/SHA256SUMS', 'utf8'), expected);
        assert.equal(output.manifestSha256, hash(expected));
        assert.equal(output.controllerSha256, hash(fs.readFileSync(dir + '/probe.sh')));
        assert.equal(output.penEnabled, false); assert.equal(output.releaseQualified, false);
        for (const name of [...names, 'SHA256SUMS'])
            assert.equal(fs.statSync(dir + '/' + name).mode & 0o777, ['probe.sh', 'capture-frame', 'read-frame'].includes(name) ? 0o700 : 0o600);
        assert.notEqual(f.run().status, 0, 'a completed stage must not be reused');
        assert.equal(fs.readFileSync(dir + '/SHA256SUMS', 'utf8'), expected);
    } finally { f.close(); }
});
for (const name of names) test('visual stage rejects exact payload drift: ' + name, () => {
    const f = fixture();
    try {
        fs.appendFileSync(name === 'base.sha256' ? f.localBase : f.root + '/build/visual-native/' + name, 'changed');
        assert.notEqual(f.run().status, 0);
        assert(!fs.existsSync(f.root + '/' + stage));
    } finally { f.close(); }
});
for (const [field, value] of [
    ['status', 'target-pass'], ['profile', 'admission'], ['firmware', '3.29.0.999'],
    ['penEnabled', true], ['ordinaryDocumentInk', true], ['baseQmds', 10], ['embedded', 0],
    ['baseManifestSha256', 'wrong'], ['candidateSha256', 'wrong'],
    ['payloadSha256', {}], ['counts', {'companion-first': 29, 'companion-last': 29}]
]) test('visual stage refuses mismatched composition: ' + field, () => {
    const f = fixture();
    try {
        f.receipt[field] = value; f.write();
        assert.notEqual(f.run().status, 0);
        assert(!fs.existsSync(f.root + '/' + stage));
    } finally { f.close(); }
});
test('visual stage rejects another ID, partial stage, dangling stage and linked payload', () => {
    for (const mode of ['id', 'partial', 'dangling', 'payload-link', 'base-link', 'receipt-link']) {
        const f = fixture();
        try {
            const dir = f.root + '/' + stage;
            if (mode === 'partial') {
                fs.mkdirSync(dir); fs.writeFileSync(dir + '/keep', 'untouched');
            } else if (mode === 'dangling') fs.symlinkSync(f.root + '/missing', dir);
            else if (mode.endsWith('-link')) {
                const file = mode === 'base-link' ? f.localBase
                    : f.root + '/build/visual-native/' + (mode === 'receipt-link' ? 'composition.json' : 'NativeHost.qml');
                fs.renameSync(file, file + '.real'); fs.symlinkSync(file + '.real', file);
            }
            const result = f.run(mode === 'id' ? '20260922T233500Z-1' : trial);
            assert.notEqual(result.status, 0, mode);
            if (mode === 'partial') assert.equal(fs.readFileSync(dir + '/keep', 'utf8'), 'untouched');
            else if (mode === 'dangling') assert(fs.lstatSync(dir).isSymbolicLink());
            else assert(!fs.existsSync(dir));
        } finally { f.close(); }
    }
});
