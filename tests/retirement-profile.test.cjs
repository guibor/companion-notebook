const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {spawnSync}=require('node:child_process');
const driver=fs.readFileSync('native/retirement-probe.qml.inc','utf8');
const factory=fs.readFileSync('native/handler-factory.qml.inc','utf8');
function body(source,anchor){
  const start=source.indexOf(anchor);assert(start>=0,anchor);
  const open=source.indexOf('{',start);let depth=1,end=open+1;
  for(;depth&&end<source.length;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
  assert.equal(depth,0);return source.slice(open+1,end-1);
}
function fixture(){
  const logs=[],calls=[],bounds={x:10,y:20,width:300,height:50};
  const view=id=>({document:{id},cnProbeScene:{},sceneController:{},penHandler:{id},ready:true,retireReady:true,
    cnProbeExpectedBounds(){return bounds;},cnProbePreparePen(){return true;},
    cnRetirementReadiness(){return this.retireReady?'ready':'active-gesture';},
    cnRetireHandler(){calls.push('retire:'+id);this.penHandler=null;return true;},
    cnCreateHandler(){calls.push('create:'+id);this.penHandler={id};return true;},
    cnUpdateInputGeometry(){calls.push('transform:'+id);return true;}});
  const primary=view('first'),secondary=view('second');
  const host={probePhase:0,probeTicks:0,probeDocumentLocked:false,probeWriting:false,probeFailure:'',
    probeDocuments:[],probeViews:[],probeScenes:[],probeControllers:[],probeCounts:[0,0],probeSettledTicks:0,
    probeRound:1,probeHeight:1080,probeRetired:false,probeMoveStep:0,probeMoveStarted:0,
    width:1620,height:2160,revealHeight:0,inputGeometryPending:false,dragging:false,restoring:false,
    secondarySelected:false,secondary,penDown:false,error:'',synchronizePrimary(){},pick(){return true;}};
  const bridge={primary,probeMayStart:true,probeReadinessReason:'ready',viewReady:v=>v.ready,
    probeSeparate:()=>bridge.primary===primary&&host.secondary===secondary&&primary.document.id==='first'&&secondary.document.id==='second',
    probeCreate:()=>['first','second'],beginAnimation(){calls.push('animation:start');},endAnimation(){calls.push('animation:end');}};
  const observer={armed:false,refuse:false,arm(a,b,g){calls.push('arm');assert(a&&b&&a!==b);this.armed=!this.refuse;return this.armed;},
    cancel(){this.armed=false;calls.push('cancel');},lastError:()=> 'refused'};
  const c={host,bridge,retirementObserver:observer,console:{log:s=>logs.push(s),warn:s=>logs.push(s)},running:true,moving:false};
  c.retirementProbeTimer={stop(){c.running=false;}};
  c.retirementMoveTimer={start(){c.moving=true;},stop(){c.moving=false;}};
  for(const key of Object.keys(host))Object.defineProperty(c,key,{get:()=>host[key],set:v=>{host[key]=v;},configurable:true});
  vm.createContext(c);
  for(const [name,args] of [['probeFail','reason'],['probeStable',''],['probeAllows','view'],['probeSubmitted','view,stroke'],['probePanesReady',''],['probeOpenGate','']]){
    host[name]=vm.runInContext('(function('+args+'){'+body(driver,'function '+name+'(')+'})',c);
    Object.defineProperty(c,name,{get:()=>host[name],configurable:true});
  }
  const tick=()=>{c.stop=c.retirementProbeTimer.stop;vm.runInContext('(function(){'+body(driver.slice(driver.indexOf('id: retirementProbeTimer')),'onTriggered:')+'})()',c);};
  const move=()=>{c.stop=c.retirementMoveTimer.stop;vm.runInContext('(function(){'+body(driver.slice(driver.indexOf('id: retirementMoveTimer')),'onTriggered:')+'})()',c);};
  const ack=gen=>vm.runInContext('(function(generation){'+body(driver,'onRetired: function(')+'})',c)(gen);
  const arm=()=>{for(let i=0;i<5&&host.probePhase<4&&c.running;i++)tick();assert.equal(host.probePhase,4,host.probeFailure);};
  const stroke=()=>({pointCount:31,boundingRect:{...bounds}});
  const submitPair=()=>{host.probeSubmitted(primary,stroke());host.probeSubmitted(secondary,stroke());tick();};
  return{host,bridge,primary,secondary,observer,c,calls,logs,tick,move,ack,arm,stroke,submitPair};
}
test('retirement diagnostic waits for both native retirements before live movement or fresh handlers',()=>{
  const f=fixture();f.arm();assert(f.host.probeAllows(f.primary)&&f.host.probeAllows(f.secondary));
  f.submitPair();assert.equal(f.host.probePhase,5);assert(!f.host.probeWriting);
  f.tick();assert.equal(f.host.probePhase,6);assert.deepEqual(f.calls,['arm','retire:first','retire:second']);
  for(let i=0;i<5;i++)f.tick();assert.equal(f.host.revealHeight,1080);assert(!f.primary.penHandler);
  f.ack(1);f.tick();assert(f.c.moving);assert.equal(f.host.probePhase,7);
  for(let i=0;i<12;i++)f.move();assert.equal(f.host.revealHeight,1320);assert.equal(f.host.probePhase,8);
  assert(!f.primary.penHandler&&!f.secondary.penHandler);f.tick();f.tick();
  assert.equal(f.host.probePhase,10);assert(f.host.probeWriting);assert(!f.host.secondarySelected);
  assert.deepEqual(f.calls.slice(-4),['create:first','create:second','transform:first','transform:second']);
  f.submitPair();assert.equal(f.host.probePhase,11);assert(!f.host.probeWriting);
  for(let i=0;i<100;i++)f.tick();assert.equal(f.host.probePhase,12);assert(!f.c.running);
  assert(f.logs.at(-1).includes('strokes=4; durable=unverified'));
});
test('retirement has no timer-based success or fallback rearm',()=>{
  const f=fixture();f.arm();f.submitPair();f.tick();f.host.probeTicks=1400;f.tick();
  assert.match(f.host.probeFailure,/timed out/);assert.equal(f.host.revealHeight,1080);
  assert(!f.host.probeWriting&&!f.c.running);assert(!f.calls.some(x=>x.startsWith('create:')));
});
test('premature, wrong-generation and stale retirement acknowledgements fail closed',()=>{
  for(const kind of ['premature','generation','duplicate']){
    const f=fixture();f.arm();
    if(kind!=='premature'){f.submitPair();f.tick();}
    if(kind==='duplicate'){f.ack(1);f.tick();}
    f.ack(kind==='generation'?2:1);assert(f.host.probeFailure,kind);assert(!f.host.probeWriting);
    assert(!f.calls.some(x=>x.startsWith('create:')));
  }
});
test('physical pen, active gesture and observer refusal prevent retirement',()=>{
  const pen=fixture();pen.arm();pen.submitPair();pen.host.penDown=true;pen.tick();assert.equal(pen.host.probePhase,5);assert.deepEqual(pen.calls,[]);
  for(const kind of ['gesture','observer']){
    const f=fixture();f.arm();f.submitPair();
    if(kind==='gesture')f.primary.retireReady=false;else f.observer.refuse=true;
    f.tick();assert(f.host.probeFailure);assert(f.primary.penHandler&&f.secondary.penHandler);
  }
});
test('movement rejects any new pen or resurrected old handler',()=>{
  for(const kind of ['pen','handler','identity']){
    const f=fixture();f.arm();f.submitPair();f.tick();f.ack(1);f.tick();
    if(kind==='pen')f.host.penDown=true;
    if(kind==='handler')f.primary.penHandler={};
    if(kind==='identity')f.secondary.sceneController={};
    f.move();assert(f.host.probeFailure);assert(!f.c.moving&&!f.host.probeWriting);assert.equal(f.host.revealHeight,1080);
  }
});
test('factory detaches both consumers and clears published handle before normal destruction',()=>{
  const source=body(factory,'function cnRetireHandler(');
  assert(source.indexOf('cnRetirementReadiness()')<source.indexOf('cnHandlerDetached = true'));
  assert(source.indexOf('root.viewport.penInputHandler !== null')<source.indexOf('root.strokeHandler = null'));
  assert(source.indexOf('root.strokeHandler = null')<source.indexOf('prior.destroy()'));
  assert.doesNotMatch(factory,/aboutToBeDestroyed\s*\(|deleteLater|worker\s*\.|timeSincePenUp|Component.onDestruction/);
  for(const guard of ['root.penGestureHandler','toolMenuGesture.activeItem','root.itemSelectionMode','root.pdfTextSelectionMode'])assert(factory.includes(guard));
});
test('retirement recovery invalidates the first release before the second writer starts',()=>{
  const source=fs.readFileSync('build/retirement-native/probe.sh','utf8');
  assert(source.indexOf('mv "$B/pen-release-verified" "$B/pen-release-round1"')<source.indexOf('"$S/ink-events-second" draw'));
  assert(source.indexOf('"$S/ink-events-second" draw')<source.indexOf('mark pen-release-verified owner-round2'));
  assert(source.includes('owner_cgroup_empty || return 1\n    release_injected_pen || return 1'));
  assert(source.includes('"$S/ink-events" release || return 1'));
  assert.match(source,/mark deadline "\$\(\( \$\(stamp\) \+ 180 \)\)"/);
  assert.match(source,/RuntimeMaxSec=420/);
  assert.match(source,/QML_IMPORT_PATH=\/home\/root\/\.local\/lib\/companion-notebook\/qml/);
  assert.match(source,/verify_observer "\$H" \|\| return 1/);
  assert.match(source,/mark retirement-submission-machine-passed/);
  assert.doesNotMatch(source,/mount\s+-o\s+remount|\/boot\/|\/dev\/mmc|\.local\/share\/remarkable\/xochitl/);
  assert.equal(spawnSync('/bin/bash',['-n','build/retirement-native/probe.sh']).status,0);
});
test('second helper changes only one fixed coordinate expression, with no generic input interface',()=>{
  const source=fs.readFileSync('ops/ink-events.c','utf8');
  const second=fs.readFileSync('build/retirement-native/ink-events-second.c','utf8');
  assert.equal(second,source.replace('draw(550,450,850,500) && pause_ms(600) && draw(700,1500,1000,1570)',
    'draw(550,650,850,700) && pause_ms(600) && draw(700,1700,1000,1770)'));
});
test('reviewed retirement cannot stage without target module smoke evidence',()=>{
  const id='20990922T030000Z-1';
  const r=spawnSync(process.execPath,['ops/stage-probe.mjs',id,'retirement'],{encoding:'utf8'});
  assert.notEqual(r.status,0);assert.match(r.stderr,/requires actual target module smoke PASS/);
  assert(!fs.existsSync('build/probe-'+id));
});
