const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
test('actual wake helper handles short/error writes, stale receipts and up-only recovery without a device',()=>{
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-wake-'));
    try{
        fs.mkdirSync(dir+'/linux');fs.copyFileSync(__dirname+'/ink-events-lowlevel-linux-input.h',dir+'/linux/input.h');
        const build=spawnSync('cc',['-std=c11','-D_DARWIN_C_SOURCE','-D_POSIX_C_SOURCE=200809L','-Wall','-Wextra','-Werror',
            '-I',dir,__dirname+'/wake-key-harness.c','-o',dir+'/test'],{encoding:'utf8',timeout:20000});
        assert.equal(build.status,0,build.stderr);
        const run=spawnSync(dir+'/test',[],{encoding:'utf8',timeout:10000});
        assert.equal(run.status,0,run.stdout+'\n'+run.stderr+'\n'+run.signal);
        assert.match(run.stdout,/production wake helper failure tests passed; no device access/);
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
