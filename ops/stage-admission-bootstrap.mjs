// One new always-reverting disposable test. Historical admission stays consumed.
// Local preparation only; this script never connects or restarts the tablet.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const clearedTrial = null; // Consumed by attempt 20260922T233500Z-1; never retry in place.
const reviewed = {
    trial:'20260922T233500Z-1',
    smoke:'63dbe2b6882974a8a5a1af75ea4f531f16a02ec806ef633c41a49737205965a5',
    child:'37a4d50d013f0368457ac4ae87d034b8eebe09874769dfc02a690dbddb0f0794',
    files:{
        'NativeHost.qml':'cfc2a10e574448c6c8023ba62f90b673bdda046c7ebf0c123b5e27ffe8c41a01',
        'companion-notebook.qmd':'85b83993815296ee8776a37681cfd6ec04e65bd93695af9aa06b2ec30764dae3',
        'probe.sh':'8c4bf787d371661d5a772bdaa23416ab547c49f52b27075604928a8a4cfae29c',
        'libcompanionbootstrap.so':'113f6b72899225ff062d21cf3db28e2e8ec5b716a79d49f0987ae914d2d55a39',
        'libcompanionadmissionplugin.so':'e4b3d8550654409dc06703b95fc5c59ed2c98c09aa37207275c35c29bb6dd89f',
        'PairStore.js':'44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
        'ink-events':'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e',
        'ink-events-second':'f15bd56c67ced9b8ea28dd5f9a447f1ffe39f7f27aef28f0500c95125d611453',
        'admission-qmldir':'5d6bc9a2e632fe2304db143667a6ff1c95c1ccccc65000485881cf1b8a5c084e'
    }
};
assert.equal(clearedTrial,reviewed.trial,'Bootstrap UI trial requires a fresh exact-capsule review');
const id=process.argv[2];
assert.equal(id,reviewed.trial,'Only the specifically reviewed trial may stage');
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const payload='build/admission-bootstrap-native', stage='build/probe-'+id;
assert(!fs.existsSync(stage),'Never reuse a trial stage');
for(const [name,h] of Object.entries(reviewed.files)) {
    assert(!fs.lstatSync(payload+'/'+name).isSymbolicLink());
    assert.equal(hash(payload+'/'+name),h,'Review drift: '+name);
}
const smoke=JSON.parse(fs.readFileSync('build/admission-arm64/bootstrap-target-smoke.json'));
assert.equal(smoke.status,'target-bootstrap-isolation-smoke-passed');
assert.equal(smoke.model,'reMarkable Ferrari'); assert.equal(smoke.firmware,'3.29.0.148');
assert.equal(smoke.hostFingerprint,'SHA256:dByHweKZkjDlZRBHdBisT5VD2kV85lClgtJExnDaTeE');
assert.equal(smoke.moduleSha256,reviewed.files['libcompanionadmissionplugin.so']);
assert.equal(smoke.bootstrapSha256,reviewed.files['libcompanionbootstrap.so']);
assert.equal(smoke.executableSha256,reviewed.smoke);
assert.equal(smoke.childSha256,reviewed.child);
assert.equal(hash('build/admission-arm64/admission-smoke'),reviewed.smoke);
assert.equal(hash('build/admission-arm64/admission-preload-child'),reviewed.child);
assert.equal(smoke.exitCode,0);
for(const property of ['childInheritedBootstrap','childQtFree','foreignWithoutCorePassed',
    'oldCombinedNegativeControlPassed','workerQmlSmokePassed','postcheckCgroupAbsent',
    'protectedSettingsUnchanged','rootReadOnly']) assert.equal(smoke[property],true,property);
for(const property of ['uiRestarted','xoviLoadedInTest','uiQualified']) assert.equal(smoke[property],false,property);
for(const service of ['ui','dates']) {
    assert(Number.isInteger(smoke[service+'PidBefore']) && smoke[service+'PidBefore']>1);
    assert.equal(smoke[service+'PidAfter'],smoke[service+'PidBefore']);
    assert.equal(smoke[service+'RestartsBefore'],0);assert.equal(smoke[service+'RestartsAfter'],0);
}
const base='/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
assert.equal(hash(base),'5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d');
const composition=JSON.parse(fs.readFileSync(payload+'/composition.json'));
assert.equal(composition.profile,'admission'); assert.equal(composition.firmware,'3.29.0.148');
assert.equal(composition.penEnabled,true); assert.equal(composition.ordinaryDocumentInk,false);
assert.equal(composition.baseManifestSha256,hash(base));
assert.equal(composition.candidateSha256,reviewed.files['companion-notebook.qmd']);
for(const p of ['NativeHost.qml','PairStore.js'])assert.equal(composition.payloadSha256[p],reviewed.files[p]);
assert.deepEqual(composition.counts,{'companion-first':30,'companion-last':30,'appload-last':30});
execFileSync('/bin/bash',['-n',payload+'/probe.sh']);
fs.mkdirSync(stage,{mode:0o700});
for(const p of Object.keys(reviewed.files)) {
    fs.copyFileSync(payload+'/'+p,stage+'/'+p);
    fs.chmodSync(stage+'/'+p,['probe.sh','ink-events','ink-events-second'].includes(p)?0o700:0o600);
}
fs.copyFileSync(base,stage+'/base.sha256');fs.chmodSync(stage+'/base.sha256',0o600);
const files=fs.readdirSync(stage).sort();assert.equal(files.length,10);
fs.writeFileSync(stage+'/SHA256SUMS',files.map(p=>hash(stage+'/'+p)+'  '+p+'\n').join(''),{mode:0o600});
console.log(JSON.stringify({id,dir:path.resolve(stage),manifestSha256:hash(stage+'/SHA256SUMS'),controllerSha256:hash(stage+'/probe.sh')}));
