const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const stage=path.resolve('ops/stage-probe.mjs');
const id='20990101T000000Z-1';
function fixture(fn) {
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'companion-geometry-stage-'));
    try {
        const payload=path.join(root,'build/geometry-native');
        fs.mkdirSync(payload,{recursive:true});
        for(const file of ['NativeHost.qml','PairStore.js','companion-notebook.qmd','probe.sh','composition.json'])
            fs.copyFileSync('build/geometry-native/'+file,path.join(payload,file));
        fn(root,payload,()=>spawnSync(process.execPath,[stage,id,'geometry'],{cwd:root,encoding:'utf8'}));
    } finally {fs.rmSync(root,{recursive:true,force:true});}
}
test('geometry stage accepts only frozen reviewed bytes and refuses transaction reuse',()=>fixture((root,payload,run)=>{
    const result=run();assert.equal(result.status,0,result.stderr);
    assert.equal(fs.readdirSync(path.join(root,'build/probe-'+id)).length,6);
    assert.notEqual(run().status,0);
}));
for(const changed of ['NativeHost.qml','PairStore.js','companion-notebook.qmd','probe.sh'])
test('geometry stage refuses reviewed artifact drift: '+changed,()=>fixture((root,payload,run)=>{
    fs.appendFileSync(path.join(payload,changed),'\n');
    const result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/Geometry review drift/);
    assert(!fs.existsSync(path.join(root,'build/probe-'+id)));
}));
