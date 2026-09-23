const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync,spawnSync}=require('node:child_process');
test('independent sleep deadline restores even if UI stalls before any sleeping receipt',()=>{
    execFileSync(process.execPath,['ops/build-sleep-controller.mjs']);
    const s=fs.readFileSync('build/sleep-native/probe.sh','utf8');
    const start=s.indexOf('        # Independent of the UI timer');
    const end=s.indexOf('        if [ -f "$B/probe.log" ] && grep -Eq',start);
    assert(start>0&&end>start);
    const block=s.slice(start,end),dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-sleep-deadline-'));
    try{
        const prefix=`set -Eeuo pipefail\nB=$1\nrecover(){ printf 'recovered=%s\\n' "$1"; }\nmark(){ printf '%s\\n' "$2" >"$B/$1"; }\nstamp(){ printf '%s\\n' "$MONO"; }\ndate(){ printf '%s\\n' "$WALL"; }\n`;
        function run({log,mono=20,wall=1700000005,seen}){
            fs.writeFileSync(dir+'/probe.log',log);
            if(seen!==undefined)fs.writeFileSync(dir+'/sleep-first-seen',String(seen));else fs.rmSync(dir+'/sleep-first-seen',{force:true});
            const r=spawnSync('/bin/bash',['-c',prefix+block+'\nprintf "still-waiting\\n"','test',dir],{encoding:'utf8',env:{...process.env,MONO:String(mono),WALL:String(wall)}});
            assert.equal(r.status,0,r.stderr);return r.stdout;
        }
        const request='Companion sleep: requested; epoch-ms=1700000000000\x1b[0m\n';
        assert.equal(run({log:request}), 'recovered=display-wake-deadline\n'); // no asleep or GUI timer receipt
        assert.equal(run({log:request,wall:1700000001}), 'still-waiting\n');
        assert.equal(run({log:request,wall:1699999900,seen:16}), 'recovered=display-wake-deadline\n'); // wall clock moved backward
        assert.equal(run({log:request+'Companion sleep: awake; normal=true; primary-fresh=true\n'}),'still-waiting\n');
        assert.equal(run({log:request+request}),'recovered=malformed-sleep-request\n');
        assert.equal(run({log:''}),'still-waiting\n');
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
    assert(s.indexOf('owner_cgroup_empty || return 1')<s.indexOf('"$S/wake-key" release || return 1'));
    assert(s.indexOf('wake helper ready; key-up=true; pre-opened=true')<s.indexOf('mark pen-injection-started "$probe_pid"'));
});
