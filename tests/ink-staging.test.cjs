const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const stage=path.resolve('ops/stage-probe.mjs');
const blocked=fs.readFileSync(stage,'utf8').includes("assert.notEqual(profile, 'ink'");
const payloadFiles=['NativeHost.qml','PairStore.js','companion-notebook.qmd','probe.sh','ink-events','composition.json'];
function fixture(run) {
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-ink-stage-'));
    try {
        const payload=path.join(dir,'build/ink-native');fs.mkdirSync(payload,{recursive:true});
        for(const name of payloadFiles)fs.copyFileSync('build/ink-native/'+name,path.join(payload,name));
        const invoke=()=>spawnSync(process.execPath,[stage,'20990101T000000Z-1','ink'],{cwd:dir,encoding:'utf8'});
        run({dir,payload,invoke});
    } finally {fs.rmSync(dir,{recursive:true,force:true});}
}
test('ink stage contains exactly the reviewed helper/payload and rejects reused ID',{skip:blocked},()=>fixture(({dir,invoke})=>{
    const result=invoke();assert.equal(result.status,0,result.stderr);
    const out=path.join(dir,'build/probe-20990101T000000Z-1');
    assert.equal(fs.readdirSync(out).length,7);
    assert.equal(fs.statSync(path.join(out,'ink-events')).mode&0o777,0o700);
    assert.equal(fs.readFileSync(path.join(out,'SHA256SUMS'),'utf8').trim().split('\n').length,6);
    assert.notEqual(invoke().status,0);
}));
for(const name of payloadFiles.filter(p=>p!=='composition.json'))test('ink staging refuses changed '+name,{skip:blocked},()=>fixture(({dir,payload,invoke})=>{
    fs.appendFileSync(path.join(payload,name),'drift');
    assert.notEqual(invoke().status,0);
    assert(!fs.existsSync(path.join(dir,'build/probe-20990101T000000Z-1')));
}));
test('ink staging rejects ordinary-document eligibility claim',{skip:blocked},()=>fixture(({dir,payload,invoke})=>{
    const p=path.join(payload,'composition.json'),receipt=JSON.parse(fs.readFileSync(p));
    receipt.ordinaryDocumentInk=true;fs.writeFileSync(p,JSON.stringify(receipt));
    assert.notEqual(invoke().status,0);
    assert(!fs.existsSync(path.join(dir,'build/probe-20990101T000000Z-1')));
}));
