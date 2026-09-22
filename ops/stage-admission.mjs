// Local preparation only. Never bypass the exact single-trial review below.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
assert.fail('Admission review consumed by trial 20260922T221000Z-1; fresh review required');
// ReManager independent review, 2026-09-23 local / 2026-09-22 UTC. One always-
// reverting disposable-only trial; any run/failure consumes this clearance.
const reviewed = {
    trial:'20260922T221000Z-1',
    smoke:'5ad5cccc7a1314b21c0fc3701ba5fe20fa880b60ef094d32ae6979d84433be51',
    files:{
        'NativeHost.qml':'cfc2a10e574448c6c8023ba62f90b673bdda046c7ebf0c123b5e27ffe8c41a01',
        'companion-notebook.qmd':'85b83993815296ee8776a37681cfd6ec04e65bd93695af9aa06b2ec30764dae3',
        'probe.sh':'23a46e5b4ccf8e08e73bcc6e986e595f43207bd62fcc3dfb9f568d20bd195007',
        'libcompanionadmissionplugin.so':'0c3cdbd017cc62dee4f1d98a2e7049f582da8719b93c6d7b010668b8c3329659',
        'PairStore.js':'44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
        'ink-events':'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e',
        'ink-events-second':'f15bd56c67ced9b8ea28dd5f9a447f1ffe39f7f27aef28f0500c95125d611453',
        'admission-qmldir':'5d6bc9a2e632fe2304db143667a6ff1c95c1ccccc65000485881cf1b8a5c084e'
    }
};
assert(reviewed, 'Admission trial awaits independent exact-artifact review');
const id=process.argv[2];
assert.equal(id,reviewed.trial,'Only the specifically reviewed trial may stage');
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const payload='build/admission-native', stage='build/probe-'+id;
assert(!fs.existsSync(stage),'Never reuse a trial stage');
for(const [name,h] of Object.entries(reviewed.files)) assert.equal(hash(payload+'/'+name),h,'Review drift: '+name);
const smoke=JSON.parse(fs.readFileSync('build/admission-arm64/target-smoke.json'));
assert.equal(smoke.status,'target-admission-smoke-passed');
assert.equal(smoke.model,'reMarkable Ferrari'); assert.equal(smoke.firmware,'3.29.0.148');
assert.equal(smoke.hostFingerprint,'SHA256:dByHweKZkjDlZRBHdBisT5VD2kV85lClgtJExnDaTeE');
assert.equal(smoke.moduleSha256,reviewed.files['libcompanionadmissionplugin.so']);
assert.equal(smoke.executableSha256,reviewed.smoke);
assert.equal(hash('build/admission-arm64/admission-smoke'),reviewed.smoke);
assert.equal(smoke.exitCode,0);assert.match(smoke.stdout,/^ADMISSION_SMOKE_PASS:/);
for(const service of ['ui','dates']) {
    assert(Number.isInteger(smoke[service+'PidBefore']) && smoke[service+'PidBefore']>1);
    assert.equal(smoke[service+'PidAfter'],smoke[service+'PidBefore']);
    assert.equal(smoke[service+'RestartsBefore'],0);assert.equal(smoke[service+'RestartsAfter'],0);
}
const base='/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
assert.equal(hash(base),'5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d');
const composition=JSON.parse(fs.readFileSync(payload+'/composition.json'));
assert.equal(composition.profile,'admission'); assert.equal(composition.penEnabled,true);
assert.equal(composition.ordinaryDocumentInk,false);
assert.equal(composition.candidateSha256,reviewed.files['companion-notebook.qmd']);
for(const p of ['NativeHost.qml','PairStore.js'])assert.equal(composition.payloadSha256[p],reviewed.files[p]);
execFileSync('/bin/bash',['-n',payload+'/probe.sh']);
fs.mkdirSync(stage,{mode:0o700});
for(const p of Object.keys(reviewed.files)) {
    assert(!fs.lstatSync(payload+'/'+p).isSymbolicLink());
    fs.copyFileSync(payload+'/'+p,stage+'/'+p);
    fs.chmodSync(stage+'/'+p,['probe.sh','ink-events','ink-events-second'].includes(p)?0o700:0o600);
}
fs.copyFileSync(base,stage+'/base.sha256');fs.chmodSync(stage+'/base.sha256',0o600);
const files=fs.readdirSync(stage).sort();assert.equal(files.length,9);
fs.writeFileSync(stage+'/SHA256SUMS',files.map(p=>hash(stage+'/'+p)+'  '+p+'\n').join(''),{mode:0o600});
console.log(JSON.stringify({id,dir:path.resolve(stage),manifestSha256:hash(stage+'/SHA256SUMS'),controllerSha256:hash(stage+'/probe.sh')}));
