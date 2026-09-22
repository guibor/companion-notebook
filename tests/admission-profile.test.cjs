const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const driver=fs.readFileSync('build/admission-native/NativeHost.qml','utf8');
function body(source,anchor){
  const start=source.indexOf(anchor);assert(start>=0,anchor);
  const open=source.indexOf('{',start);let depth=1,end=open+1;
  for(;depth&&end<source.length;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
  assert.equal(depth,0);return source.slice(open+1,end-1);
}
function fixture(){
  const logs=[],calls=[],bounds={x:10,y:20,width:300,height:50};
  const host={probePhase:0,probeTicks:0,probeDocumentLocked:false,probeWriting:false,probeFailure:'',
    probeDocuments:[],probeViews:[],probeScenes:[],probeControllers:[],probeCounts:[0,0],probePending:[null,null],
    probeRound:1,probeHeight:1080,probeStartupReady:true,probeSettledTicks:0,
    width:1620,height:2160,revealHeight:0,inputGeometryPending:false,dragging:false,restoring:false,
    secondarySelected:false,penDown:false,error:'',synchronizePrimary(){},pick(){return true;}};
  const view=id=>({document:{id},cnProbeScene:{},sceneController:{},penHandler:{id},ready:true,
    cnProbeExpectedBounds(){return bounds;},cnProbePreparePen(){return true;},
    cnAdmissionInputsDetached(){return !host.probeWriting;},
    cnAdmissionConstrainToPane(){assert(!host.probeWriting);calls.push('constrain:'+id);return true;},
    cnUpdateInputGeometry(){assert(!host.probeWriting);calls.push('transform:'+id);return true;}});
  const primary=view('first'),secondary=view('second');host.secondary=secondary;
  const gate={error:'',paused:false,publishing:false,released:false,refuseFinish:false,
    pause(manager,g){calls.push('pause:'+g);this.paused=true;return true;},
    permitPublication(g){assert(!host.probeWriting);assert.equal(host.revealHeight,1440);this.publishing=true;calls.push('permit:'+g);return true;},
    finish(g){assert(this.publishing);assert(host.probeWriting);calls.push('finish:'+g);this.released=!this.refuseFinish;return this.released;}};
  const bridge={primary,penInput:{surfaceManager:{updateRegions(){calls.push('regions');}}},
    probeMayStart:true,probeReadinessReason:'ready',viewReady:v=>v.ready,
    probeSeparate:()=>bridge.primary===primary&&host.secondary===secondary,
    probeCreate:()=>['first','second'],endAnimation(){calls.push('repaint');}};
  const c={host,bridge,admissionGate:gate,console:{log:s=>logs.push(s),warn:s=>logs.push(s)},running:true};
  c.admissionProbeTimer={stop(){c.running=false;}}; c.stop=c.admissionProbeTimer.stop;
  for(const key of Object.keys(host))Object.defineProperty(c,key,{get:()=>host[key],set:v=>{host[key]=v;},configurable:true});
  vm.createContext(c);
  for(const [name,args] of [['probeFail','reason'],['probeStable',''],['probeAllows','view'],
    ['probeBeforeSubmit','view,stroke,targetController,inputHandler'],['probeSubmitted','view,stroke'],['probePanesReady','']]){
    host[name]=vm.runInContext('(function('+args+'){'+body(driver,'function '+name+'(')+'})',c);
    Object.defineProperty(c,name,{get:()=>host[name],configurable:true});
  }
  const tick=()=>vm.runInContext('(function(){'+body(driver.slice(driver.indexOf('id: admissionProbeTimer')),'onTriggered:')+'})()',c);
  const ack=g=>vm.runInContext('(function(generation){'+body(driver,'onParked: function(')+'})',c)(g);
  const down=()=>vm.runInContext('(function(down){'+body(driver.slice(driver.indexOf('Admission.AdmissionGate')),'function onPenDownChanged(')+'})',c)(true);
  const arm=()=>{for(let i=0;i<5&&host.probePhase<4&&c.running;i++)tick();assert.equal(host.probePhase,4,host.probeFailure);};
  const submit=v=>{const stroke={pointCount:31,boundingRect:{...bounds}};assert(host.probeBeforeSubmit(v,stroke,v.sceneController,v.penHandler),host.probeFailure);host.probeSubmitted(v,stroke);};
  return{host,bridge,primary,secondary,gate,c,calls,logs,tick,ack,down,arm,submit};
}
test('admission leaves native state unchanged while second stroke drains, then publishes only final geometry',()=>{
  const f=fixture();f.arm();f.submit(f.primary);
  f.host.penDown=true;f.down();assert.equal(f.host.probePhase,5);
  assert(f.host.probeWriting);assert(!f.host.inputGeometryPending);assert.equal(f.host.revealHeight,1080);
  for(let i=0;i<4;i++)f.tick();assert.equal(f.host.revealHeight,1080);
  f.submit(f.secondary);f.host.penDown=false;f.ack(1);
  assert.equal(f.host.probePhase,6);assert(!f.host.probeWriting);assert.equal(f.host.revealHeight,1440);
  f.tick();assert.equal(f.host.probePhase,7);assert(!f.gate.released);
  f.tick();assert.equal(f.host.probePhase,10);assert(f.gate.released);assert(f.host.probeWriting);
  assert(f.calls.indexOf('transform:second')<f.calls.indexOf('permit:1'));
  assert(f.calls.indexOf('constrain:first')<f.calls.indexOf('transform:first'));
  assert(f.calls.indexOf('permit:1')<f.calls.indexOf('finish:1'));
  f.submit(f.primary);f.submit(f.secondary);f.tick();assert.equal(f.host.probePhase,11);
  f.ack(2);assert(!f.host.probeWriting);assert.equal(f.host.probePhase,12);
  for(let i=0;i<100;i++)f.tick();assert.equal(f.host.probePhase,13);assert(!f.c.running);
  assert(!f.calls.includes('finish:2'));assert.match(f.logs.at(-1),/strokes=4; durable=unverified/);
});
test('no early park acknowledgment or timer can move a queued stroke',()=>{
  const f=fixture();f.arm();f.submit(f.primary);f.host.penDown=true;f.down();
  f.host.penDown=false;f.ack(1);
  assert.match(f.host.probeFailure,/earlier strokes/);assert.equal(f.host.revealHeight,1080);
  assert(!f.calls.some(x=>x.startsWith('transform:')));assert(!f.gate.released);
});
test('missing fresh candidates fails without release or successful transition marker',()=>{
  const f=fixture();f.arm();f.submit(f.primary);f.down();f.submit(f.secondary);f.ack(1);
  f.gate.refuseFinish=true;f.tick();f.tick();
  assert.match(f.host.probeFailure,/fresh native candidates/);assert(!f.gate.released);
  assert(!f.logs.some(x=>x.includes('fresh-candidates=true')));
});
test('an absent startup hook cannot create notebooks or arm ink',()=>{
  const f=fixture();f.host.probeStartupReady=false;
  for(let i=0;i<10;i++)f.tick();assert.equal(f.host.probePhase,0);assert(!f.host.probeWriting);
  assert.equal(f.host.probeDocuments.length,0);
});
test('admission controller retains exact recovery functions and finite restart budgets',()=>{
  const prior=fs.readFileSync('build/retirement-native/probe.sh','utf8');
  const current=fs.readFileSync('build/admission-native/probe.sh','utf8');
  for(const fn of ['recover','release_injected_pen','owner_cgroup_empty','cleanup_host','publish_policy'])
    assert.equal(body(current,fn+'()'),body(prior,fn+'()'),fn);
  assert.match(current,/RuntimeMaxSec=420/);assert.match(current,/\$\(stamp\) \+ 180/);
  assert.match(current,/LD_PRELOAD=\/home\/root\/\.local\/lib\/companion-notebook\/qml\/Companion\/Admission/);
  assert.doesNotMatch(current,/mount\s+-o\s+remount|\/boot\/|\/dev\/mmc|\.local\/share\/remarkable\/xochitl/);
});
test('locked diagnostic suppresses queued navigation mutation even with an out-of-bounds view',()=>{
  const qmd=fs.readFileSync('build/admission-native/Navigation.composed.qml','utf8');
  let moves=0;
  const c={cnAdmissionLocked:true,cnPaired:true,cnLayoutBusy:false,cnConstraining:false,
    width:1620,height:1328,exteriorBoundary:{x:0,y:0,width:1620,height:2160},sceneView:{},
    tileManager:{scale:1,viewToScene:()=>({x:0,y:1500}),moveViewBy(){moves++;}},
    Qt:{point:(x,y)=>({x,y})}};
  vm.createContext(c);
  const constrain=vm.runInContext('(function(whileParked){'+body(qmd,'function cnConstrainToPane(whileParked)')+'})',c);
  constrain();assert.equal(moves,0,'post-release deferred call is blocked');
  c.cnLayoutBusy=true;constrain(true);assert.equal(moves,1,'explicit parked clamp runs');
  c.cnLayoutBusy=false;constrain();assert.equal(moves,1,'later queued callback remains blocked');
});
test('consumed admission review refuses every stage before reading evidence or writing files',()=>{
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'companion-admission-consumed-'));
  try {
    for(const id of ['20260922T221000Z-1','20260923T000000Z-2']) {
      const result=spawnSync(process.execPath,[path.resolve('ops/stage-admission.mjs'),id],{cwd,encoding:'utf8'});
      assert.notEqual(result.status,0);
      assert.match(result.stderr,/Admission review consumed by trial 20260922T221000Z-1/);
      assert.deepEqual(fs.readdirSync(cwd),[]);
    }
  } finally {fs.rmSync(cwd,{recursive:true,force:true});}
});
