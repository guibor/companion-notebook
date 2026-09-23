// One bounded test of actual host controls on two newly created disposable
// notebooks. Local packaging only: never connects, activates or installs.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const clearedTrial = null; // Consumed by corrected attempt 20260923T052500Z-1; never replay in place.
const reviewed = {
    trial: '20260923T052500Z-1',
    base: '5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d',
    smoke: '63dbe2b6882974a8a5a1af75ea4f531f16a02ec806ef633c41a49737205965a5',
    child: '37a4d50d013f0368457ac4ae87d034b8eebe09874769dfc02a690dbddb0f0794',
    files: {
        'NativeHost.qml': '5fc3a2c6b419c6e8b7b77ea35e5beed53523835b42d3007d076271ee0ecbfa30',
        'PairStore.js': '44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
        'SizeRuler.qml': '7351a5bf60c0d72ab90053af4e2629257f2f616307c7ed8ef44734dde24bea52',
        'companion-notebook.qmd': '7179f1bd432288c5f7e7b3e3d19743ebf9942930ae6fff026a6b8f8ebed7197f',
        'probe.sh': '3d9168cb4c9bf6d07a2eefe94c769b08ed0956cf124f929580dfab72b10f69dc',
        'libcompanionbootstrap.so': '113f6b72899225ff062d21cf3db28e2e8ec5b716a79d49f0987ae914d2d55a39',
        'libcompanionadmissionplugin.so': 'e4b3d8550654409dc06703b95fc5c59ed2c98c09aa37207275c35c29bb6dd89f',
        'admission-qmldir': '5d6bc9a2e632fe2304db143667a6ff1c95c1ccccc65000485881cf1b8a5c084e',
        'ink-events': 'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e',
        'ink-events-second': 'f15bd56c67ced9b8ea28dd5f9a447f1ffe39f7f27aef28f0500c95125d611453'
    }
};
assert.equal(clearedTrial, reviewed.trial, 'Ordinary disposable trial requires a fresh exact-capsule review');
const id = process.argv[2];
assert.equal(id, reviewed.trial, 'Only the specifically reviewed ordinary trial may stage');
const payload = 'build/ordinary-native', stage = 'build/probe-' + id;
try { fs.lstatSync(stage); assert.fail('Never reuse an ordinary trial stage'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function readRegular(file) {
    const stat = fs.lstatSync(file);
    assert(stat.isFile() && !stat.isSymbolicLink(), 'Require a regular reviewed file: ' + file);
    return fs.readFileSync(file);
}
const bytes = {};
for (const [name, expected] of Object.entries(reviewed.files)) {
    bytes[name] = readRegular(payload + '/' + name);
    assert.equal(hash(bytes[name]), expected, 'Ordinary review drift: ' + name);
}
// Reuse the actual successful target bootstrap-isolation receipt, not a local
// mock. The controller independently rechecks current device/base/backup state.
const smokeRoot = 'build/admission-arm64/';
const smoke = JSON.parse(readRegular(smokeRoot + 'bootstrap-target-smoke.json'));
assert.equal(smoke.status, 'target-bootstrap-isolation-smoke-passed');
assert.equal(smoke.model, 'reMarkable Ferrari');
assert.equal(smoke.firmware, '3.29.0.148');
assert.equal(smoke.hostFingerprint, 'SHA256:dByHweKZkjDlZRBHdBisT5VD2kV85lClgtJExnDaTeE');
assert.equal(smoke.moduleSha256, reviewed.files['libcompanionadmissionplugin.so']);
assert.equal(smoke.bootstrapSha256, reviewed.files['libcompanionbootstrap.so']);
assert.equal(smoke.executableSha256, reviewed.smoke);
assert.equal(smoke.childSha256, reviewed.child);
assert.equal(hash(readRegular(smokeRoot + 'admission-smoke')), reviewed.smoke);
assert.equal(hash(readRegular(smokeRoot + 'admission-preload-child')), reviewed.child);
assert.equal(smoke.exitCode, 0);
for (const key of ['childInheritedBootstrap', 'childQtFree', 'foreignWithoutCorePassed',
    'oldCombinedNegativeControlPassed', 'workerQmlSmokePassed', 'postcheckCgroupAbsent',
    'protectedSettingsUnchanged', 'rootReadOnly']) assert.equal(smoke[key], true, key);
for (const key of ['uiRestarted', 'xoviLoadedInTest', 'uiQualified']) assert.equal(smoke[key], false, key);
for (const service of ['ui', 'dates']) {
    assert(Number.isInteger(smoke[service + 'PidBefore']) && smoke[service + 'PidBefore'] > 1);
    assert.equal(smoke[service + 'PidAfter'], smoke[service + 'PidBefore']);
    assert.equal(smoke[service + 'RestartsBefore'], 0);
    assert.equal(smoke[service + 'RestartsAfter'], 0);
}
const base = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
bytes['base.sha256'] = readRegular(base);
assert.equal(hash(bytes['base.sha256']), reviewed.base, 'Accepted base manifest drift');
const composition = JSON.parse(readRegular(payload + '/composition.json'));
assert.equal(composition.status, 'offline-companion-against-accepted-r1-base');
assert.equal(composition.profile, 'ordinary');
assert.equal(composition.firmware, '3.29.0.148');
assert.equal(composition.penEnabled, true);
assert.equal(composition.ordinaryDocumentInk, false);
assert.equal(composition.baseQmds, 11);
assert.equal(composition.embedded, 1);
assert.equal(composition.baseManifestSha256, reviewed.base);
assert.equal(composition.candidateSha256, reviewed.files['companion-notebook.qmd']);
assert.deepEqual(composition.payloadSha256, Object.fromEntries(
    ['NativeHost.qml', 'PairStore.js', 'SizeRuler.qml'].map(name => [name, reviewed.files[name]])));
assert.deepEqual(composition.counts, {'companion-first': 30, 'companion-last': 30, 'appload-last': 30});
// Parse and write the same cached bytes, even if another local build runs later.
execFileSync('/bin/bash', ['-n'], {input: bytes['probe.sh']});
const names = Object.keys(bytes).sort();
assert.equal(names.length, 11);
fs.mkdirSync(stage, {mode: 0o700});
for (const name of names) fs.writeFileSync(stage + '/' + name, bytes[name], {
    flag: 'wx', mode: ['probe.sh', 'ink-events', 'ink-events-second'].includes(name) ? 0o700 : 0o600
});
const manifest = names.map(name => hash(bytes[name]) + '  ' + name + '\n').join('');
fs.writeFileSync(stage + '/SHA256SUMS', manifest, {flag: 'wx', mode: 0o600});
console.log(JSON.stringify({id, dir: path.resolve(stage), manifestSha256: hash(manifest),
    controllerSha256: reviewed.files['probe.sh'], penEnabled: true,
    ordinaryDocumentInk: false, releaseQualified: false}));
