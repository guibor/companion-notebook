import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {firmwareTarget,targets} from '../ops/firmware-target.mjs';

const env={CN_FIRMWARE_VERSION:'3.29.0.153',CN_USER_PILOT:'1',CN_QUICK_PAD:'1'};
test('.153 requires its exact stock and a reviewed table for bound output',()=>{
    assert.throws(()=>firmwareTarget(env),/coordinator-verified/);
    assert.throws(()=>firmwareTarget({...env,CN_HASHTAB_SHA256:targets['3.29.0.148'].tableSha256}),/Old .148/);
    assert.throws(()=>firmwareTarget({...env,CN_SOURCE_ONLY:'1',RM_FIRMWARE:'/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148'}),/stock firmware mismatch/);
    const target=firmwareTarget({...env,CN_SOURCE_ONLY:'1'});
    assert.equal(target.stockSha256,targets['3.29.0.153'].stockSha256);
    assert.match(target.root,/3290153/);
});
test('.153 refuses old diagnostic profiles and historical installer',()=>{
    for(const field of ['CN_PROBE','CN_ORDINARY_PROBE'])
        assert.throws(()=>firmwareTarget({...env,CN_SOURCE_ONLY:'1',[field]:'1'}),/historical/);
    assert.throws(()=>execFileSync(process.execPath,['ops/build-pilot.mjs','20261016T000000Z-1'],{
        env:{...process.env,...env},stdio:'pipe'}),e=>/Historical .148 controller/.test(e.stderr.toString()));
});
test('.153 preserves accepted app sources, scroll correction and native admission',()=>{
    for(const file of ['native/navigation.qml.inc','ops/quick-pad-build.mjs',
        'src/PairStore.js','native/quick-pad.qml.inc','native/corner-companion.qml.inc',
        'native-admission/admissiongate.cpp','native-admission/preload.cpp'])
        assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show','8268ba2:'+file]),file);
});
test('.153 unbound build is isolated and contains the standard notebook scroll fix',()=>{
    execFileSync(process.execPath,['build-native.mjs'],{env:{...process.env,...env,CN_SOURCE_ONLY:'1'},stdio:'pipe'});
    const q=fs.readFileSync('build/pro-3.29.0.153-unbound/quick-pad-native/companion-notebook.qmd','utf8');
    assert.match(q,/VERSION 3\.29\.0\.153/);
    assert.match(q,/\(notePage && !cnQuickPad\) \? Math.max\(minY, topLeft.y\)/);
});
