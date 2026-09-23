// Immutable, one-use packaging only. No tablet connection or activation here.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const clearedTrial = null; // Consumed: immutable capsule110500 now exists; never regenerate/replay.
const trial='20260923T110500Z-1';
assert.equal(clearedTrial,trial,'Display-sleep trial requires fresh exact-capsule clearance');
assert.equal(process.argv[2],trial,'Only the reviewed one-use trial may stage');
const out='build/probe-'+trial,payload='build/sleep-native';
try{fs.lstatSync(out);assert.fail('Never reuse a stage');}catch(e){if(e.code!=='ENOENT')throw e;}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function read(file){const st=fs.lstatSync(file);assert(st.isFile()&&!st.isSymbolicLink(),file);return fs.readFileSync(file);}
const expected={
    'NativeHost.qml':'3edad6748bcedbbc27efc520055252f11eb83967caf839971c301eaca16f43f3',
    'PairStore.js':'44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19',
    'SizeRuler.qml':'7351a5bf60c0d72ab90053af4e2629257f2f616307c7ed8ef44734dde24bea52',
    'companion-notebook.qmd':'4d99c25b02bc419907974aa34676be18790efcea7f370e376c8ab31d7aa7b223',
    'probe.sh':'1a6f70ea41abb6d4ff0b6e7c335e968c4b75eaf4b8344b973885759827779a66',
    'wake-key':'6403628e6e3edaddd0de8ab9e5a14dee21c6bf3c9769796398846c08a7cca56e',
    'libcompanionbootstrap.so':'113f6b72899225ff062d21cf3db28e2e8ec5b716a79d49f0987ae914d2d55a39',
    'libcompanionadmissionplugin.so':'e4b3d8550654409dc06703b95fc5c59ed2c98c09aa37207275c35c29bb6dd89f',
    'admission-qmldir':'5d6bc9a2e632fe2304db143667a6ff1c95c1ccccc65000485881cf1b8a5c084e',
    'ink-events':'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e',
    'ink-events-second':'f15bd56c67ced9b8ea28dd5f9a447f1ffe39f7f27aef28f0500c95125d611453'
};
const bytes={};for(const [name,sha] of Object.entries(expected)){bytes[name]=read(payload+'/'+name);assert.equal(hash(bytes[name]),sha,name);}
bytes['base.sha256']=read('/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256');
const base='5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d';
assert.equal(hash(bytes['base.sha256']),base);
const smokeBytes=read('build/admission-arm64/bootstrap-target-smoke.json');
assert.equal(hash(smokeBytes),'3b650d4dc127388ce91cf13ab11f77b6032cc2465b8cd83f271d408b9fe30305');
const smoke=JSON.parse(smokeBytes);
assert.equal(smoke.status,'target-bootstrap-isolation-smoke-passed');
assert.equal(smoke.moduleSha256,expected['libcompanionadmissionplugin.so']);
assert.equal(smoke.bootstrapSha256,expected['libcompanionbootstrap.so']);
const c=JSON.parse(read(payload+'/composition.json'));
assert.equal(c.status,'offline-companion-against-accepted-r1-base');assert.equal(c.profile,'sleep');
assert.equal(c.firmware,'3.29.0.148');assert.equal(c.penEnabled,true);assert.equal(c.ordinaryDocumentInk,false);
assert.equal(c.baseManifestSha256,base);assert.equal(c.baseQmds,11);assert.equal(c.embedded,1);
assert.equal(c.candidateSha256,expected['companion-notebook.qmd']);
assert.deepEqual(c.counts,{'companion-first':33,'companion-last':33,'appload-last':33});
assert.deepEqual(c.payloadSha256,Object.fromEntries(['NativeHost.qml','PairStore.js','SizeRuler.qml'].map(n=>[n,expected[n]])));
execFileSync('/bin/bash',['-n'],{input:bytes['probe.sh']});
const names=Object.keys(bytes).sort();assert.equal(names.length,12);
fs.mkdirSync(out,{mode:0o700});
for(const n of names)fs.writeFileSync(out+'/'+n,bytes[n],{flag:'wx',mode:['probe.sh','wake-key','ink-events','ink-events-second'].includes(n)?0o700:0o600});
const manifest=names.map(n=>hash(bytes[n])+'  '+n+'\n').join('');
fs.writeFileSync(out+'/SHA256SUMS',manifest,{flag:'wx',mode:0o600});
console.log(JSON.stringify({trial,stage:path.resolve(out),manifestSha256:hash(manifest),controllerSha256:expected['probe.sh'],ordinaryDocumentInk:false,releaseQualified:false}));
