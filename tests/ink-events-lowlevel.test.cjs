const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');

test('actual C helper rejects bounded I/O failures and balances cleanup without a device',()=>{
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-ink-lowlevel-'));
    try {
        fs.mkdirSync(path.join(dir,'linux'));
        fs.copyFileSync(path.join(__dirname,'ink-events-lowlevel-linux-input.h'),path.join(dir,'linux/input.h'));
        const exe=path.join(dir,'ink-events-test');
        const build=spawnSync('cc',['-std=c11','-D_DARWIN_C_SOURCE','-D_POSIX_C_SOURCE=200809L','-Wall','-Wextra','-Werror',
            '-I',dir,path.join(__dirname,'ink-events-lowlevel-harness.c'),'-o',exe],
            {encoding:'utf8',timeout:20000});
        assert.equal(build.status,0,build.stderr || String(build.error));
        const run=spawnSync(exe,[],{encoding:'utf8',timeout:10000});
        assert.equal(run.status,0,run.stdout+'\n'+run.stderr+'\n'+String(run.error||run.signal||''));
        assert.match(run.stdout,/production ink-event low-level tests passed; no device access/);
        assert.match(run.stdout,/real child terminated/);
    } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
