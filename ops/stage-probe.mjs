import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const id = process.argv[2];
const profile = process.argv[3] || 'load';
assert(['load','render','structural','geometry','ink','retirement'].includes(profile));
// Trial 20260921T205838Z-1 crashed the native e-ink renderer during grabToImage.
// Keep offline builds/tests available, but do not package another hardware trial
// until a replacement diagnostic has its own independent safety review.
assert.notEqual(profile, 'render',
    'Rendering probes suspended after native SIGSEGV; see playbook/RENDER-PROBE.md');
assert.notEqual(profile, 'geometry',
    'Geometry review consumed by successful 20260921T224844Z-1; fresh review required');
assert.notEqual(profile, 'ink',
    'Ink review consumed by trial 20260922T043500Z-1; inspect its result before any new clearance');
assert.notEqual(profile, 'retirement',
    'Retirement review consumed by trial 20260922T173005Z-1; fresh review required');
const payload = profile === 'load' ? 'build/native' : `build/${profile}-native`;
const controller = profile === 'load' ? 'ops/probe-pro329.sh' : payload+'/probe.sh';
assert.match(id || '', /^\d{8}T\d{6}Z-\d+$/);
const dir = `build/probe-${id}`;
assert(!fs.existsSync(dir), 'Never reuse a probe stage');
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if (profile === 'retirement') {
    // Independent v2 frozen-artifact review, 2026-09-22. ONE disposable-only,
    // always-revert test; conditional on the actual target ABI/import preflight.
    const reviewed = {
        'companion-notebook.qmd':'456f01db54f8d702ef39981e8a47acbec6fe56c6bb2971c6f5b702bbd0dc3679',
        'NativeHost.qml':'309bac33376a0990063d2c327d63e99a4e40f3756d0572d87558d678f04a3a80',
        'PairStore.js':'44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
        'probe.sh':'2fe7bdbaa4a7e9ad6b80ef417b02c3790d67be45fa9728267f6e60bac83177e4',
        'ink-events':'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e',
        'ink-events-second':'f15bd56c67ced9b8ea28dd5f9a447f1ffe39f7f27aef28f0500c95125d611453',
        'lifecycle-qmldir':'fbc4c0fd3629f913f04dc6a2c56599074631e6a232d9bab770da811b4c3e23ae',
        'libcompanionlifecycleplugin.so':'ad1b1d17a857908250d73f076064d0e0e9e047df644e35527b899529f55e65ef'
    };
    for (const [p,h] of Object.entries(reviewed)) assert.equal(hash(payload+'/'+p),h,'Retirement review drift: '+p);
    const smokePath='build/observer-arm64/target-smoke.json';
    assert(fs.existsSync(smokePath),'Reviewed retirement profile requires actual target module smoke PASS');
    const smoke=JSON.parse(fs.readFileSync(smokePath));
    assert.equal(smoke.status,'target-observer-smoke-passed');
    assert.equal(smoke.model,'reMarkable Ferrari');
    assert.equal(smoke.firmware,'3.29.0.148');
    assert.equal(smoke.hostFingerprint,'SHA256:dByHweKZkjDlZRBHdBisT5VD2kV85lClgtJExnDaTeE');
    assert.equal(smoke.moduleSha256,reviewed['libcompanionlifecycleplugin.so']);
    assert.equal(smoke.executableSha256,'2d3d21f352fc4570b9433389d8641ae46ed8535464bcfaa476609abe88e8d2cd');
    assert.equal(smoke.exitCode,0);
    assert.match(smoke.stdout,/^OBSERVER_SMOKE_PASS:/m);
    assert.doesNotMatch(smoke.stdout,/OBSERVER_SMOKE_FAIL|OBSERVER_SMOKE_IMPORT/);
    for(const service of ['ui','dates']) {
        assert(Number.isInteger(smoke[service+'PidBefore'])&&smoke[service+'PidBefore']>1);
        assert.equal(smoke[service+'PidAfter'],smoke[service+'PidBefore']);
        assert.equal(smoke[service+'RestartsBefore'],0);assert.equal(smoke[service+'RestartsAfter'],0);
    }
}
if (profile === 'structural') {
    // Independent local review, 2026-09-22. Only these frozen bytes are cleared
    // for preparation of one bounded always-revert trial, never a release.
    const reviewed = {
        'companion-notebook.qmd': 'bffff7eb404b251075471b0f37b047a6e470b48ac6b2319429498e76f6631614',
        'NativeHost.qml': 'dbb8aa5ce089e83f345bc72a84ff94e70639caae4954187e726cd99e5c87777a',
        'PairStore.js': '44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
        'probe.sh': '99980076ef07dbda84bddafbbf77f4bedb365d372f41fdbfb9a95ee8c8335bd0'
    };
    for (const [name, sha] of Object.entries(reviewed))
        assert.equal(hash(`${payload}/${name}`), sha, 'Structural review drift: '+name);
}
if (profile === 'geometry') {
    // Independent narrow review of HEAD 3a7bf6d, 2026-09-22: ONE
    // pen-disabled, no-capture, always-reverting geometry diagnostic only.
    const reviewed = {
        'companion-notebook.qmd': '8b101631f8a5a55d1e93c874a4a8e6d2fe670f97e62341f2b8810334de20a081',
        'NativeHost.qml': '9a78b1c45130bbbf8b2be34d2ed6ce99d60ce357075930950514fd99508e9974',
        'PairStore.js': '44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
        'probe.sh': '47326d9285f4f8cd505e0d9cee454fe762a1110b6a2ec9c6e62d372311e6782a'
    };
    for (const [name, sha] of Object.entries(reviewed))
        assert.equal(hash(`${payload}/${name}`), sha, 'Geometry review drift: '+name);
}
if (profile === 'ink') {
    // Independent v2 review, 2026-09-22: ONE fixed-layout, two-disposable-note
    // interior-ink diagnostic only. Always reverts; not a personal pilot.
    const reviewed = {
        'companion-notebook.qmd': '148b9b1b8adfbfbf8bd7e9511bd0692c366af5e74ee16b0c67f399ad9c3c0503',
        'NativeHost.qml': '97956c1520daadc2e4c0aa085ccdbe67ae0fee2d8ba80239a9de7dff30b37772',
        'PairStore.js': '44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
        'probe.sh': 'b9b5fee626014bcdc0e45b421d9e4f50b53cecca0fe5b3fcfa263a94749c68f6',
        'ink-events': 'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e'
    };
    for (const [name, sha] of Object.entries(reviewed))
        assert.equal(hash(`${payload}/${name}`), sha, 'Ink review drift: '+name);
}
const base = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
assert.equal(hash(base), '5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d');
const receipt = JSON.parse(fs.readFileSync(payload+'/composition.json'));
assert.equal(receipt.profile,profile);
assert.equal(receipt.candidateSha256, hash(payload+'/companion-notebook.qmd'));
assert.equal(receipt.penEnabled, profile === 'ink' || profile === 'retirement');
if (profile === 'ink' || profile === 'retirement') assert.equal(receipt.ordinaryDocumentInk, false);
for (const p of ['NativeHost.qml','PairStore.js']) assert.equal(receipt.payloadSha256[p],hash(`${payload}/${p}`));
execFileSync('/bin/bash', ['-n', controller]);
fs.mkdirSync(dir, {mode:0o700});
for (const p of ['NativeHost.qml', 'PairStore.js', 'companion-notebook.qmd']) {
    fs.copyFileSync(`${payload}/${p}`, `${dir}/${p}`);
    fs.chmodSync(`${dir}/${p}`, 0o600);
}
fs.copyFileSync(base, `${dir}/base.sha256`);
fs.copyFileSync(controller, `${dir}/probe.sh`);
if (profile === 'ink' || profile === 'retirement') {
    fs.copyFileSync(`${payload}/ink-events`, `${dir}/ink-events`);
    fs.chmodSync(`${dir}/ink-events`,0o700);
}
if (profile === 'retirement') {
    for(const p of ['ink-events-second','lifecycle-qmldir','libcompanionlifecycleplugin.so']) {
        fs.copyFileSync(`${payload}/${p}`,`${dir}/${p}`);
        fs.chmodSync(`${dir}/${p}`,p==='ink-events-second'?0o700:0o600);
    }
}
fs.chmodSync(`${dir}/base.sha256`,0o600); fs.chmodSync(`${dir}/probe.sh`,0o700);
const files = fs.readdirSync(dir).sort();
fs.writeFileSync(`${dir}/SHA256SUMS`, files.map(p => `${hash(`${dir}/${p}`)}  ${p}\n`).join(''), {mode:0o600});
console.log(JSON.stringify({id,dir,manifestSha256:hash(`${dir}/SHA256SUMS`),controllerSha256:hash(`${dir}/probe.sh`)}));
