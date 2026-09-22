const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const driver=fs.readFileSync('native/visual-reopen.qml.inc','utf8');
const open=fs.readFileSync('native/visual-open.qml.inc','utf8');
function body(source,anchor) {
  const start=source.indexOf(anchor); assert(start>=0);
  const first=source.indexOf('{',start);let n=1,end=first+1;
  for(;n&&end<source.length;end++){if(source[end]==='{')n++;if(source[end]==='}')n--;}
  assert.equal(n,0);return source.slice(first+1,end-1);
}
function fixture() {
  const logs=[],calls=[];
  const view=id=>({document:{id},sceneController:{},cnInkAllowed:false,ready:true,cnRefresh(){calls.push('refresh:'+id);}});
  const primary=view('first'),secondary=view('second');
  const host={probePhase:0,probeTicks:0,visualSettled:0,visualHeld:0,visualStage:0,probeFailure:'',
    probeDocuments:[],visualViews:[],visualControllers:[],secondary,penDown:false,error:'',
    restoring:false,dragging:false,width:1620,height:2160,revealHeight:0,
    synchronizePrimary(){},pick(id){return id==='second';}};
  const bridge={primary,probeMayStart:true,probeReadinessReason:'ready',
    probeCreate(){calls.push('open-saved');return ['first','second'];},viewReady:v=>v&&v.ready,
    probeSeparate:()=>bridge.primary===primary&&host.secondary===secondary&&primary.document.id==='first'&&secondary.document.id==='second'};
  const c={host,bridge,Date,console:{log:m=>logs.push(m),warn:m=>logs.push(m)},visualTimer:{stop(){c.stopped=true;}}};
  for(const key of Object.keys(host))Object.defineProperty(c,key,{get:()=>host[key],set:v=>{host[key]=v;}});
  vm.createContext(c);
  for(const [name,args] of [['probeFail','reason'],['visualStable','']]) {
    host[name]=vm.runInContext('(function('+args+'){'+body(driver,'function '+name+'(')+'})',c);
    c[name]=host[name];
  }
  const tick=()=>vm.runInContext('(function(){'+body(driver,'onTriggered:')+'})()',c);
  const ready=()=>{for(let i=0;i<25;i++)tick();assert.equal(host.probePhase,3);assert(!host.probeFailure,host.probeFailure);};
  return{host,bridge,primary,secondary,logs,calls,c,tick,ready};
}
test('visual reopen keeps native ink disabled and holds both known controllers through two positions',()=>{
  const f=fixture();f.ready();
  assert(f.logs.some(s=>s.includes('ready; stage=1; height=1320')));
  for(let i=0;i<240;i++)f.tick();
  assert(f.logs.some(s=>s.includes('ready; stage=2; height=1680')));
  assert(!f.host.probeFailure);assert.equal(f.host.visualControllers[0],f.primary.sceneController);
  assert.equal(f.host.visualControllers[1],f.secondary.sceneController);
  assert.equal(f.calls.filter(x=>x==='open-saved').length,1);
  assert(!f.primary.cnInkAllowed&&!f.secondary.cnInkAllowed);
});
for(const [name,mutate] of [
  ['pen',f=>f.host.penDown=true],['landscape',f=>f.bridge.probeReadinessReason='landscape'],
  ['lock',f=>f.bridge.probeReadinessReason='locked'],['sleep',f=>f.bridge.probeReadinessReason='asleep'],
  ['sharing',f=>f.bridge.probeReadinessReason='sharing'],['foreign document',f=>f.secondary.document.id='other'],
  ['controller replacement',f=>f.primary.sceneController={}],['ink allowed',f=>f.primary.cnInkAllowed=true],
  ['unexpected geometry',f=>f.host.revealHeight=1400]
])test('visual gate refuses '+name+' without reopening personal notes',()=>{
  const f=fixture();f.ready();mutate(f);f.tick();assert(f.c.stopped);assert(f.host.probeFailure);
  assert(f.logs.some(s=>s==='Companion visual: gate closed'));
  assert(f.logs.at(-1).includes('Companion probe: FAILED visual'));
  assert.equal(f.calls.filter(s=>s==='open-saved').length,1);
});
test('visual readiness waits for loading, then times out instead of declaring success',()=>{
  const f=fixture();f.ready();f.primary.ready=false;const n=f.logs.length;
  for(let i=0;i<50;i++)f.tick();assert.equal(f.logs.length,n);
  f.host.probeTicks=1500;f.tick();assert.match(f.host.probeFailure,/timed out/);
});
test('visual open refuses any different label, page, type, orientation or locked entry',()=>{
  const ids=['9baaab38-b382-4f8c-9871-2932c2afe4ca','3ded6fc6-4f79-401e-99ec-dae6a934ae4a'];
  for(const invalid of ['none','archived','lockedByPassword','loadError','fileType','pageCount','orientation','label','page']) {
    const entries=ids.map((id,i)=>({id,archived:false,lockedByPassword:false,loadError:false,fileType:1,pageCount:1,orientation:2,
      visibleName:'Companion test '+(i===0?'Reference ':'Notes ')+'test',pageForId(){return 0;}}));
    if(['archived','lockedByPassword','loadError'].includes(invalid))entries[1][invalid]=true;
    if(['fileType','pageCount','orientation'].includes(invalid))entries[1][invalid]=9;
    if(invalid==='label')entries[1].visibleName='Personal notebook';
    if(invalid==='page')entries[1].pageForId=()=>-1;
    let opened=0;
    const c={probeMayStart:true,Values:{cnProbeStarted:false},probeInvalidate(){},Document:{Notebook:1},Qt:{Vertical:2},
      Library:{entryForId:id=>entries[ids.indexOf(id)]},root:{openDocument_helper(){opened++;}},console:{log(){}},probeIds:[]};
    vm.createContext(c);const run=()=>vm.runInContext('(function(){'+body(open,'function probeCreate()')+'})()',c);
    if(invalid==='none'){assert.deepEqual(Array.from(run()),ids);assert.equal(opened,1);}
    else {assert.throws(run,/Disposable reopen identity refused/);assert.equal(opened,0);assert(!c.Values.cnProbeStarted);}
  }
});
test('visual profile has no QML pixel grabs, native file edits, document creation or restored personal view',()=>{
  for(const source of [open,driver])assert.doesNotMatch(source,/grabToImage|grabWindow|saveToFile|createDocument\(|setTemplate|probeRestore\(|addDrawingLine|\.rm\b|Canvas|ShaderEffect/);
});
test('visual controller keeps exact structural recovery and checks disposable files only before activation',()=>{
  const original=fs.readFileSync('build/structural-native/probe.sh','utf8');
  const candidate=fs.readFileSync('build/visual-native/probe.sh','utf8');
  for(const name of ['recover','cleanup_host','verify_device','healthy','publish_policy'])
    assert.equal(body(candidate,name+'()'),body(original,name+'()'),name);
  assert(candidate.includes('mark deadline "$(( $(stamp) + 180 ))"'));
  assert(candidate.includes('RuntimeMaxSec=420'));
  assert(body(candidate,'verify_prepared()').includes('verify_disposable_preimages'));
  assert(!body(candidate,'recover()').includes('verify_disposable'));
  assert.doesNotMatch(candidate,/ink-events|libcompanionlifecycleplugin/);
  assert(candidate.includes("if grep -Eq 'grabToImage|grabWindow|probeCapture|saveToFile"));
  assert.equal(spawnSync('/bin/bash',['-n','build/visual-native/probe.sh']).status,0);
});
test('external acquisition is a bounded read of one exact image with pre/post guards and exclusive scratch output',()=>{
  const capture=fs.readFileSync('ops/capture-visual-frame.sh','utf8');
  assert.equal(spawnSync('/bin/bash',['-n','ops/capture-visual-frame.sh']).status,0);
  assert(capture.includes('BYTES=14100480'));
  assert(capture.includes('1620,2160,2,6528,0$'));
  assert(capture.includes('timeout -s KILL 5 dd if="/proc/$P/mem"'));
  assert(capture.indexOf('\nguard\n')<capture.indexOf('timeout -s KILL 5 dd'));
  assert(capture.lastIndexOf('\nguard\n')>capture.indexOf('timeout -s KILL 5 dd'));
  assert(capture.includes('set -C\n'));assert(capture.includes('[ ! -L "$OUT.part" ]'));
  assert(capture.includes('[ "$(stat -c %s "$OUT.part")" = "$BYTES" ]'));
  assert.doesNotMatch(capture,/of=\/proc|\/dev\/input|kill\s|ssh\s|curl\s|socket|grabToImage/);
});
test('fresh native visual heartbeat parser distinguishes closure, wrong stage and stale epochs',()=>{
  const helper=fs.readFileSync('ops/capture-visual-frame.sh','utf8');
  const start=helper.indexOf('    [[ "$line" ==');
  const end=helper.indexOf('\n}',start);
  assert(start>0&&end>start);
  const predicate=helper.slice(start,end);
  const docs='9baaab38-b382-4f8c-9871-2932c2afe4ca,3ded6fc6-4f79-401e-99ec-dae6a934ae4a';
  const good='Companion visual: ready; stage=1; height=1320; docs='+docs+'; pen=false; epoch=1790099300500';
  for(const [line,pass] of [[good,true],[good+'\x1b[0m (source.qml:5)',true],
    [good.replace('stage=1','stage=2'),false],[good.replace('1320','1680'),false],
    [good.replace('pen=false','pen=true'),false],[good.replace(docs,'personal'),false],
    [good.replace('1790099300500','1790099290000'),false],['Companion visual: gate closed',false]]) {
    const shell=`STAGE=1; HEIGHT=1320; DOCS=${docs}\ndate(){ printf 1790099301; }\ncheck(){ local epoch now; ${predicate}\n}\nline=$1\ncheck`;
    const r=spawnSync('/bin/bash',['-c',shell,'fixture',line],{encoding:'utf8'});
    assert.equal(r.status===0,pass,line+' '+r.stderr);
  }
});
