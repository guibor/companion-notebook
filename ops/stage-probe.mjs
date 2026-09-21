import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const id = process.argv[2];
const profile = process.argv[3] || 'load';
assert(['load','render','structural','geometry'].includes(profile));
// Trial 20260921T205838Z-1 crashed the native e-ink renderer during grabToImage.
// Keep offline builds/tests available, but do not package another hardware trial
// until a replacement diagnostic has its own independent safety review.
assert.notEqual(profile, 'render',
    'Rendering probes suspended after native SIGSEGV; see playbook/RENDER-PROBE.md');
const payload = profile === 'load' ? 'build/native' : `build/${profile}-native`;
const controller = profile === 'load' ? 'ops/probe-pro329.sh' : payload+'/probe.sh';
assert.match(id || '', /^\d{8}T\d{6}Z-\d+$/);
const dir = `build/probe-${id}`;
assert(!fs.existsSync(dir), 'Never reuse a probe stage');
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
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
const base = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
assert.equal(hash(base), '5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d');
const receipt = JSON.parse(fs.readFileSync(payload+'/composition.json'));
assert.equal(receipt.profile,profile);
assert.equal(receipt.candidateSha256, hash(payload+'/companion-notebook.qmd'));
assert.equal(receipt.penEnabled, false);
for (const p of ['NativeHost.qml','PairStore.js']) assert.equal(receipt.payloadSha256[p],hash(`${payload}/${p}`));
execFileSync('/bin/bash', ['-n', controller]);
fs.mkdirSync(dir, {mode:0o700});
for (const p of ['NativeHost.qml', 'PairStore.js', 'companion-notebook.qmd']) {
    fs.copyFileSync(`${payload}/${p}`, `${dir}/${p}`);
    fs.chmodSync(`${dir}/${p}`, 0o600);
}
fs.copyFileSync(base, `${dir}/base.sha256`);
fs.copyFileSync(controller, `${dir}/probe.sh`);
fs.chmodSync(`${dir}/base.sha256`,0o600); fs.chmodSync(`${dir}/probe.sh`,0o700);
const files = fs.readdirSync(dir).sort();
fs.writeFileSync(`${dir}/SHA256SUMS`, files.map(p => `${hash(`${dir}/${p}`)}  ${p}\n`).join(''), {mode:0o600});
console.log(JSON.stringify({id,dir,manifestSha256:hash(`${dir}/SHA256SUMS`),controllerSha256:hash(`${dir}/probe.sh`)}));
