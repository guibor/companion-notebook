import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const id = process.argv[2];
assert.match(id || '', /^\d{8}T\d{6}Z-\d+$/);
const dir = `build/probe-${id}`;
assert(!fs.existsSync(dir), 'Never reuse a probe stage');
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const base = '/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
assert.equal(hash(base), '5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d');
const receipt = JSON.parse(fs.readFileSync('build/native/composition.json'));
assert.equal(receipt.candidateSha256, hash('build/native/companion-notebook.qmd'));
assert.equal(receipt.penEnabled, false);
for (const p of ['NativeHost.qml','PairStore.js']) assert.equal(receipt.payloadSha256[p],hash(`build/native/${p}`));
execFileSync('/bin/bash', ['-n', 'ops/probe-pro329.sh']);
fs.mkdirSync(dir, {mode:0o700});
for (const p of ['NativeHost.qml', 'PairStore.js', 'companion-notebook.qmd']) {
    fs.copyFileSync(`build/native/${p}`, `${dir}/${p}`);
    fs.chmodSync(`${dir}/${p}`, 0o600);
}
fs.copyFileSync(base, `${dir}/base.sha256`);
fs.copyFileSync('ops/probe-pro329.sh', `${dir}/probe.sh`);
fs.chmodSync(`${dir}/base.sha256`,0o600); fs.chmodSync(`${dir}/probe.sh`,0o700);
const files = fs.readdirSync(dir).sort();
fs.writeFileSync(`${dir}/SHA256SUMS`, files.map(p => `${hash(`${dir}/${p}`)}  ${p}\n`).join(''), {mode:0o600});
console.log(JSON.stringify({id,dir,manifestSha256:hash(`${dir}/SHA256SUMS`),controllerSha256:hash(`${dir}/probe.sh`)}));
