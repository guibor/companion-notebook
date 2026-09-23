const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const prior='build/probe-20260923T052500Z-1';
test('lifecycle controller preserves frozen recovery and independent input helpers',()=>{
    const original=fs.readFileSync(prior+'/probe.sh','utf8');
    assert.equal(createHash('sha256').update(original).digest('hex'),'3d9168cb4c9bf6d07a2eefe94c769b08ed0956cf124f929580dfab72b10f69dc');
    execFileSync(process.execPath,['ops/build-lifecycle-controller.mjs']);
    let actual=fs.readFileSync('build/lifecycle-native/probe.sh','utf8');
    assert.equal(actual.split('lifecycle ink submissions completed;').length-1,3);
    assert.equal(actual.split('for n in $(seq 1 60); do').length-1,2);
    actual=actual.replaceAll('lifecycle ink submissions completed;','ordinary ink submissions completed;')
        .replace('mark lifecycle-submission-machine-passed','mark ordinary-submission-machine-passed');
    const marker='for n in $(seq 1 60); do\n    healthy probe';
    const at=actual.lastIndexOf(marker);assert(at>0);
    actual=actual.slice(0,at)+actual.slice(at).replace(marker,'for n in $(seq 1 25); do\n    healthy probe');
    const extra=actual.split('\n').filter(line=>line.startsWith('[ "$(grep -Fc \'Companion lifecycle:'));
    assert.equal(extra.length,4);
    actual=actual.split('\n').filter(line=>!extra.includes(line)).join('\n');
    assert.equal(actual,original,'No other recovery/runtime/helper policy may change');
    for(const file of ['ink-events','ink-events-second','libcompanionbootstrap.so','libcompanionadmissionplugin.so','admission-qmldir','PairStore.js'])
        assert.deepEqual(fs.readFileSync('build/lifecycle-native/'+file),fs.readFileSync(prior+'/'+file));
});
