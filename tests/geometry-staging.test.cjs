const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
test('consumed geometry review refuses another stage before any writes',()=>{
    const root=fs.mkdtempSync(path.join(os.tmpdir(),'companion-geometry-consumed-'));
    try {
        const result=spawnSync(process.execPath,[path.resolve('ops/stage-probe.mjs'),'20990101T000000Z-1','geometry'],{cwd:root,encoding:'utf8'});
        assert.notEqual(result.status,0);
        assert.match(result.stderr,/Geometry review consumed/);
        assert.deepEqual(fs.readdirSync(root),[]);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
});
