// One pen-disabled reopen of two already-saved disposable notebooks. Local only:
// no tablet connection, activation, pixel acquisition, or ordinary-use clearance.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const clearedTrial = null; // Consumed by attempt 20260922T235000Z-1; never replay this stage.
const reviewed = {
    trial: '20260922T235000Z-1',
    base: '5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d',
    files: {
        'NativeHost.qml': '569cb8f35c1fe81797de1698097642f1e64f8ea614161cf5f736715da0b28a35',
        'PairStore.js': '44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
        'companion-notebook.qmd': '4af9849230f197494b747a72ced6f19ec24d0e6011c50e5f43c72c9b1ba0e3a8',
        'probe.sh': 'bc54affc03e615947c4d5e20fff99412070dd208959ffea4a86dad1b77d51333',
        'capture-frame': 'be728b309e0fd26546fd6e116da74632c08b9374ea2458836108cdfd8524d99e',
        'read-frame': '838391b9281ae41b69bb42ae5d4e0be15e373ec7275dc40ab6980a37320c863f'
    }
};
assert.equal(clearedTrial, reviewed.trial, 'Visual reopen requires a fresh exact-capsule review');
const id = process.argv[2];
assert.equal(id, reviewed.trial, 'Only the specifically reviewed visual trial may stage');
const payload = 'build/visual-native', stage = 'build/probe-' + id;
// lstat also detects a dangling symlink: neither it nor a partial stage may be reused.
try {
    fs.lstatSync(stage);
    assert.fail('Never reuse a visual trial stage');
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function readRegular(file) {
    const stat = fs.lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink(), 'Require a regular reviewed file: ' + file);
    return fs.readFileSync(file);
}
const bytes = {};
for (const [name, expected] of Object.entries(reviewed.files)) {
    bytes[name] = readRegular(payload + '/' + name);
    assert.equal(hash(bytes[name]), expected, 'Visual review drift: ' + name);
}
const base = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
bytes['base.sha256'] = readRegular(base);
assert.equal(hash(bytes['base.sha256']), reviewed.base, 'Accepted base manifest drift');

const composition = JSON.parse(readRegular(payload + '/composition.json'));
assert.equal(composition.status, 'offline-companion-against-accepted-r1-base');
assert.equal(composition.profile, 'visual');
assert.equal(composition.firmware, '3.29.0.148');
assert.equal(composition.penEnabled, false);
assert.equal(composition.ordinaryDocumentInk, false);
assert.equal(composition.baseQmds, 11);
assert.equal(composition.embedded, 1);
assert.equal(composition.baseManifestSha256, reviewed.base);
assert.equal(composition.candidateSha256, reviewed.files['companion-notebook.qmd']);
assert.deepEqual(composition.payloadSha256, {
    'NativeHost.qml': reviewed.files['NativeHost.qml'],
    'PairStore.js': reviewed.files['PairStore.js']
});
assert.deepEqual(composition.counts, {'companion-first': 29, 'companion-last': 29, 'appload-last': 29});
// Parse exactly the cached, hash-checked bytes that will be staged, not a file
// another local build might replace between verification and copying.
for (const name of ['probe.sh', 'capture-frame'])
    execFileSync('/bin/bash', ['-n'], {input: bytes[name]});

const names = Object.keys(bytes).sort();
assert.equal(names.length, 7);
fs.mkdirSync(stage, {mode: 0o700});
for (const name of names)
    fs.writeFileSync(stage + '/' + name, bytes[name], {
        flag: 'wx', mode: ['probe.sh', 'capture-frame', 'read-frame'].includes(name) ? 0o700 : 0o600
    });
const manifest = names.map(name => hash(bytes[name]) + '  ' + name + '\n').join('');
fs.writeFileSync(stage + '/SHA256SUMS', manifest, {flag: 'wx', mode: 0o600});
console.log(JSON.stringify({id, dir: path.resolve(stage), manifestSha256: hash(manifest),
    controllerSha256: reviewed.files['probe.sh'], penEnabled: false, releaseQualified: false}));
