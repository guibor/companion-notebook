// Exercise downstream staging only in isolated copies. Never overwrite the real
// target-smoke receipt, enable a real clearance, or create a workspace UI stage.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const trial='20260922T233500Z-1';
const stage='build/probe-'+trial;
const source=fs.readFileSync('ops/stage-admission-bootstrap.mjs','utf8');
test('consumed bootstrap review refuses a real repeat before evidence reads or stage writes',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'companion-bootstrap-consumed-'));
  try {
    for(const id of [trial,'20260923T000000Z-1']) {
      const result=spawnSync(process.execPath,[path.resolve('ops/stage-admission-bootstrap.mjs'),id],{cwd:root,encoding:'utf8'});
      assert.notEqual(result.status,0);
      assert.match(result.stderr,/Bootstrap UI trial requires a fresh exact-capsule review/);
      assert.deepEqual(fs.readdirSync(root),[]);
    }
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});
function fixture() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'companion-bootstrap-staging-'));
  const file=root+'/stage.mjs';
  // Artificial review only in this temp copy; actual target evidence is copied,
  // then independently corrupted to test each refusal without touching originals.
  fs.writeFileSync(file,source.replace(/const clearedTrial = (?:null|'[^']*');/,
    "const clearedTrial = '"+trial+"';"));
  fs.mkdirSync(root+'/build/admission-arm64',{recursive:true});
  fs.cpSync('build/admission-bootstrap-native',root+'/build/admission-bootstrap-native',{recursive:true});
  for(const name of ['bootstrap-target-smoke.json','admission-smoke','admission-preload-child'])
    fs.copyFileSync('build/admission-arm64/'+name,root+'/build/admission-arm64/'+name);
  const receiptPath=root+'/build/admission-arm64/bootstrap-target-smoke.json';
  const receipt=JSON.parse(fs.readFileSync(receiptPath));
  return {root,receipt,write:()=>fs.writeFileSync(receiptPath,JSON.stringify(receipt)),
    run:(id=trial)=>spawnSync(process.execPath,[file,id],{cwd:root,encoding:'utf8'}),
    close:()=>fs.rmSync(root,{recursive:true,force:true})};
}
test('fresh bootstrap stage includes exactly both modules, helper pins and accepted base',()=>{
  const f=fixture();
  try {
    const r=f.run();assert.equal(r.status,0,r.stderr);
    const names=fs.readdirSync(f.root+'/'+stage).sort();
    assert.deepEqual(names,['NativeHost.qml','PairStore.js','SHA256SUMS','admission-qmldir',
      'base.sha256','companion-notebook.qmd','ink-events','ink-events-second',
      'libcompanionadmissionplugin.so','libcompanionbootstrap.so','probe.sh'].sort());
    assert.equal(fs.readFileSync(f.root+'/'+stage+'/SHA256SUMS','utf8').trim().split('\n').length,10);
    assert.notEqual(f.run().status,0,'no stage reuse');
  } finally {f.close();}
});
for(const key of ['childInheritedBootstrap','childQtFree','foreignWithoutCorePassed',
  'oldCombinedNegativeControlPassed','workerQmlSmokePassed','postcheckCgroupAbsent',
  'protectedSettingsUnchanged','rootReadOnly']) {
  test('bootstrap stage rejects missing actual target evidence: '+key,()=>{
    const f=fixture();
    try {f.receipt[key]=false;f.write();assert.notEqual(f.run().status,0);assert(!fs.existsSync(f.root+'/'+stage));}
    finally {f.close();}
  });
}
for(const key of ['uiRestarted','xoviLoadedInTest','uiQualified']) {
  test('bootstrap stage refuses wrong evidence class: '+key,()=>{
    const f=fixture();
    try {f.receipt[key]=true;f.write();assert.notEqual(f.run().status,0);assert(!fs.existsSync(f.root+'/'+stage));}
    finally {f.close();}
  });
}
test('bootstrap stage refuses byte drift, PID changes and a different transaction',()=>{
  for(const mode of ['module','bootstrap','pid','id','composition']) {
    const f=fixture();
    try {
      if(mode==='module'||mode==='bootstrap')
        fs.appendFileSync(f.root+'/build/admission-bootstrap-native/libcompanion'+
          (mode==='module'?'admissionplugin':'bootstrap')+'.so','changed');
      if(mode==='pid') {f.receipt.uiPidAfter++;f.write();}
      if(mode==='composition') {
        const p=f.root+'/build/admission-bootstrap-native/composition.json';
        const data=JSON.parse(fs.readFileSync(p));data.ordinaryDocumentInk=true;
        fs.writeFileSync(p,JSON.stringify(data));
      }
      const r=f.run(mode==='id'?'20260922T221000Z-1':trial);
      assert.notEqual(r.status,0,mode);assert(!fs.existsSync(f.root+'/'+stage));
    } finally {f.close();}
  }
});
