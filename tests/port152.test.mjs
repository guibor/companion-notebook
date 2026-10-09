import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {firmwareTarget,targets} from '../ops/firmware-target.mjs';
const env={CN_FIRMWARE_VERSION:'3.29.0.152',CN_USER_PILOT:'1',CN_QUICK_PAD:'1'};
test('new target fails closed without a reviewed table',()=>{
    assert.throws(()=>firmwareTarget(env),/coordinator-verified/);
    assert.throws(()=>firmwareTarget({...env,CN_HASHTAB_SHA256:targets['3.29.0.148'].tableSha256}),/Old .148/);
});
test('new target cannot run historical diagnostics',()=>{
    for(const field of ['CN_PROBE','CN_ORDINARY_PROBE'])
        assert.throws(()=>firmwareTarget({...env,CN_SOURCE_ONLY:'1',[field]:'1'}),/historical/);
});
test('exact stock pin is checked even in source-only mode',()=>{
    assert.throws(()=>firmwareTarget({...env,CN_SOURCE_ONLY:'1',RM_FIRMWARE:'/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148'}));
    assert.equal(firmwareTarget({...env,CN_SOURCE_ONLY:'1'}).stockSha256,targets['3.29.0.152'].stockSha256);
});
test('historical installer refuses the new version before reading old capsule',()=>{
    assert.throws(()=>execFileSync(process.execPath,['ops/build-pilot.mjs','20261010T020000Z-1'],{env:{...process.env,...env},stdio:'pipe'}),e=>/Historical .148 controller/.test(e.stderr.toString()));
});
test('port does not alter metadata or native admission sources',()=>{
    for(const file of ['src/PairStore.js','native/quick-pad.qml.inc','native/corner-companion.qml.inc',
        'native-admission/admissiongate.cpp','native-admission/preload.cpp']) {
        const baseline=execFileSync('git',['show','40cae4a:'+file]);
        assert.deepEqual(fs.readFileSync(file),baseline,file);
    }
});
test('final packager rejects changed coordinator input and incomplete peers',()=>{
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-port152-'));
    try {
        const file=dir+'/coordinator.json';
        const spec={firmware:'3.29.0.152',build:targets['3.29.0.152'].build,
            buildId:targets['3.29.0.152'].buildId,stockSha256:targets['3.29.0.152'].stockSha256,
            hashtabSha256:'a'.repeat(64),qmds:[]};
        const bytes=JSON.stringify(spec);fs.writeFileSync(file,bytes);
        const invoke=hash=>execFileSync(process.execPath,['ops/prepare-pro152.mjs',file,hash],{stdio:'pipe'});
        assert.throws(()=>invoke('0'.repeat(64)),e=>/Coordinator input changed/.test(e.stderr.toString()));
        const hash=createHash('sha256').update(bytes).digest('hex');
        assert.throws(()=>invoke(hash),e=>/qmds.length>0/.test(e.stderr.toString()));
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
