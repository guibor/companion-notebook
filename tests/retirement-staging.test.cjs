// Synthetic smoke receipts live only in isolated temporary copies of the local
// stager. Never writes build/observer-arm64/target-smoke.json in this workspace.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'companion-stage-unit-'));
  fs.mkdirSync(root+'/ops');fs.mkdirSync(root+'/build');
  fs.copyFileSync('ops/stage-probe.mjs',root+'/ops/stage-probe.mjs');
  fs.cpSync('build/retirement-native',root+'/build/retirement-native',{recursive:true});
  fs.mkdirSync(root+'/build/observer-arm64');
  const receipt={_syntheticUnitTestOnly:true,status:'target-observer-smoke-passed',model:'reMarkable Ferrari',firmware:'3.29.0.148',
    hostFingerprint:'SHA256:dByHweKZkjDlZRBHdBisT5VD2kV85lClgtJExnDaTeE',
    moduleSha256:'ad1b1d17a857908250d73f076064d0e0e9e047df644e35527b899529f55e65ef',
    executableSha256:'2d3d21f352fc4570b9433389d8641ae46ed8535464bcfaa476609abe88e8d2cd',
    exitCode:0,stdout:'OBSERVER_SMOKE_PASS: synthetic unit fixture, never target evidence\n',
    uiPidBefore:7,uiPidAfter:7,datesPidBefore:8,datesPidAfter:8,uiRestartsBefore:0,uiRestartsAfter:0,datesRestartsBefore:0,datesRestartsAfter:0};
  const write=()=>fs.writeFileSync(root+'/build/observer-arm64/target-smoke.json',JSON.stringify(receipt));
  write();
  const id='20990922T040000Z-1',stage=root+'/build/probe-'+id;
  const run=()=>spawnSync(process.execPath,['ops/stage-probe.mjs',id,'retirement'],{cwd:root,encoding:'utf8'});
  return{root,stage,receipt,write,run,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('isolated staging includes all nine reviewed payload files and correct modes, never reuses a stage',()=>{
  const f=fixture();try{
    let r=f.run();assert.equal(r.status,0,r.stderr);
    assert.equal(fs.readFileSync(f.stage+'/SHA256SUMS','utf8').trim().split('\n').length,9);
    for(const line of fs.readFileSync(f.stage+'/SHA256SUMS','utf8').trim().split('\n')){
      const [hash,p]=line.split(/\s+/);assert.equal(createHash('sha256').update(fs.readFileSync(f.stage+'/'+p)).digest('hex'),hash);
      assert.equal(fs.statSync(f.stage+'/'+p).mode&0o777,['probe.sh','ink-events','ink-events-second'].includes(p)?0o700:0o600);
    }
    r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/Never reuse/);
  }finally{f.cleanup();}
});
for(const mode of ['missing','failed','wrong-device','wrong-module','ui-restarted','dates-restarted','no-pass'])
  test('isolated staging rejects '+mode+' smoke evidence before creating a stage',()=>{
    const f=fixture();try{
      if(mode==='failed')f.receipt.exitCode=1;
      if(mode==='wrong-device')f.receipt.model='reMarkable Chiappa';
      if(mode==='wrong-module')f.receipt.moduleSha256='0'.repeat(64);
      if(mode==='ui-restarted')f.receipt.uiPidAfter=9;
      if(mode==='dates-restarted')f.receipt.datesRestartsAfter=1;
      if(mode==='no-pass')f.receipt.stdout='OBSERVER_SMOKE_FAIL: synthetic';
      f.write();if(mode==='missing')fs.unlinkSync(f.root+'/build/observer-arm64/target-smoke.json');
      const r=f.run();assert.notEqual(r.status,0);assert(!fs.existsSync(f.stage));
    }finally{f.cleanup();}
  });
for(const name of ['companion-notebook.qmd','NativeHost.qml','probe.sh','ink-events-second','libcompanionlifecycleplugin.so','lifecycle-qmldir'])
  test('isolated staging rejects reviewed payload drift: '+name,()=>{
    const f=fixture();try{
      fs.appendFileSync(f.root+'/build/retirement-native/'+name,'changed');
      const r=f.run();assert.notEqual(r.status,0);assert.match(r.stderr,/Retirement review drift/);assert(!fs.existsSync(f.stage));
    }finally{f.cleanup();}
  });
