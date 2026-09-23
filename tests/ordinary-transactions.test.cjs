const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('native/transactions.qml.inc','utf8');
function body(text,anchor) {
  const start=text.indexOf(anchor);assert(start>=0,anchor);
  const begin=text.indexOf('{',start);let depth=1,end=begin+1;
  for(;depth&&end<text.length;end++){if(text[end]==='{')depth++;if(text[end]==='}')depth--;}
  assert.equal(depth,0);return text.slice(begin+1,end-1);
}
function fixture() {
  const calls=[];
  const host={transitionPhase:'idle',transitionGeneration:0,transitionTicks:0,transitionIntent:null,
    transitionBefore:[],transitionAfter:[],transitionApplying:false,inputGeometryPending:false,
    secondary:null,revealHeight:1080,restoring:false,choosing:false,error:'',mayShow:true,transitionAvailabilityLost:false,
    closeSecondaryParked(){assert(host.transitionApplying);assert(host.transitionOwnsPark());host.secondary=null;host.revealHeight=0;calls.push('close');},
    pageOperationsReady(){return true;},
    editOperationsReady(){return true;},
    hideWhenUnavailable(){calls.push('unavailable');},
    checkpoint(){calls.push('checkpoint');}};
  Object.defineProperties(host,{
    paired:{get:()=>!!host.secondary&&host.revealHeight>0},
    transitionBusy:{get:()=>host.transitionPhase!=='idle'}
  });
  const view=id=>({document:{id},sceneController:{},ready:true,
    cnAdmissionInputsDetached:()=>host.inputGeometryPending,
    cnInputGeometryReadiness:()=>host.inputGeometryPending?'ready':'pen-gate-open',
    cnAdmissionConstrainToPane(){assert(host.transitionOwnsPark());calls.push('clamp:'+id);return true;},
    cnUpdateInputGeometry(){assert(host.transitionOwnsPark());calls.push('refresh:'+id);return true;}});
  const primary=view('first'),secondary=view('second');host.secondary=secondary;
  const gate={phase:'ready',error:'',refuseFinish:false,
    pause(manager,g){assert.equal(this.phase,'ready');this.phase='draining';calls.push('pause:'+g);return true;},
    permitPublication(g){assert(host.inputGeometryPending);assert.equal(this.phase,'parked');this.phase='publishing';calls.push('permit:'+g);return true;},
    finish(g){assert(!host.inputGeometryPending);assert.equal(this.phase,'publishing');calls.push('finish:'+g);if(this.refuseFinish)return false;this.phase='ready';return true;}};
  const bridge={primary,viewReady:v=>v.ready,penInput:{surfaceManager:{updateRegions(){calls.push('regions');}}},
    endAnimation(){calls.push('repaint');}};
  const timer={running:false,restart(){this.running=true;},stop(){this.running=false;}};
  const c={host,bridge,admissionGate:gate,transitionTimer:timer,console:{warn:s=>calls.push(s),log:s=>calls.push(s)}};
  for(const key of Object.getOwnPropertyNames(host))Object.defineProperty(c,key,{get:()=>host[key],set:v=>{host[key]=v;},configurable:true});
  vm.createContext(c);
  for(const [name,args] of [['transitionOwnsPark',''],['transitionSnapshot',''],['transitionSame','records'],['transitionFail','reason'],
    ['requestTransition','name,apply'],['transitionPark','generation'],['applyTransition',''],
    ['transitionVisibleViews',''],['transitionAdvance',''],['transitionComplete','generation']]) {
    host[name]=vm.runInContext('(function('+args+'){'+body(source,'function '+name+'(')+'})',c);
    Object.defineProperty(c,name,{get:()=>host[name],configurable:true});
  }
  const ack=g=>{gate.phase='parked';host.transitionPark(g===undefined?host.transitionGeneration:g);};
  return {host,bridge,primary,secondary,gate,calls,timer,ack,view};
}
test('ordinary resize preserves all old input until real park, then clamps/refreshes before publication',()=>{
  const f=fixture();let applied=0;
  assert(f.host.requestTransition('resize',()=>{applied++;assert(f.host.transitionApplying);f.host.revealHeight=1440;}));
  assert.equal(f.host.revealHeight,1080);assert(!f.host.inputGeometryPending);assert.equal(applied,0);
  for(let i=0;i<10;i++)f.host.transitionAdvance();assert.equal(applied,0);
  f.ack();assert.equal(applied,1);assert(f.host.inputGeometryPending);assert.equal(f.host.revealHeight,1440);
  f.host.transitionAdvance();assert.equal(f.host.transitionPhase,'settling');assert(!f.calls.includes('finish:1'));
  f.host.transitionAdvance();assert.equal(f.host.transitionPhase,'publishing');assert(!f.host.inputGeometryPending);
  assert(!f.calls.includes('checkpoint'));f.host.transitionComplete(1);assert.equal(f.host.transitionPhase,'idle');
  assert(f.calls.indexOf('refresh:second')<f.calls.indexOf('permit:1'));
  assert(f.calls.indexOf('permit:1')<f.calls.indexOf('finish:1'));
  assert(f.calls.indexOf('finish:1')<f.calls.indexOf('checkpoint'));
});
test('an obsolete acknowledgement cannot mutate the current layout',()=>{
  const f=fixture();let calls=0;f.host.requestTransition('resize',()=>calls++);
  f.ack(0);assert.equal(calls,0);assert.equal(f.host.transitionPhase,'draining');assert(!f.host.inputGeometryPending);
  f.ack(1);assert.equal(calls,1);
});
test('changed old controller fails before mutation or handler detach',()=>{
  const f=fixture();let applied=false;f.host.requestTransition('resize',()=>{applied=true;});
  f.primary.sceneController={};f.ack();assert.equal(f.host.transitionPhase,'failed');
  assert(!applied);assert(!f.host.inputGeometryPending);assert(!f.calls.includes('finish:1'));
});
test('native load waits without publishing, then freezes the ready controller identity',()=>{
  const f=fixture();f.host.requestTransition('pair',()=>{f.secondary.ready=false;f.secondary.sceneController=null;});f.ack();
  for(let i=0;i<10;i++)f.host.transitionAdvance();assert.equal(f.host.transitionPhase,'loading');
  f.secondary.ready=true;f.secondary.sceneController={};f.host.transitionAdvance();
  assert.equal(f.host.transitionPhase,'settling');f.secondary.sceneController={};f.host.transitionAdvance();
  assert.equal(f.host.transitionPhase,'failed');assert(!f.calls.includes('permit:1'));
});
test('picker stays parked and its choice uses the same generation, not another seal',()=>{
  const f=fixture();f.host.requestTransition('choose',()=>{f.host.choosing=true;return 'choosing';});f.ack();
  assert.equal(f.host.transitionPhase,'choosing');assert(f.host.inputGeometryPending);assert(!f.timer.running);
  assert(f.host.requestTransition('pair',()=>{f.host.secondary=f.view('third');}));
  assert.equal(f.host.transitionGeneration,1);assert(!f.host.choosing);
  f.host.transitionAdvance();f.host.transitionAdvance();f.host.transitionComplete(1);assert.equal(f.host.transitionPhase,'idle');
  assert.equal(f.calls.filter(s=>s==='pause:1').length,1);assert.equal(f.host.secondary.document.id,'third');
});
test('cancelling a picker restores the same native views through final publication',()=>{
  const f=fixture();f.host.requestTransition('choose',()=>{f.host.choosing=true;return 'choosing';});f.ack();
  f.host.requestTransition('cancel',()=>{f.host.choosing=false;});
  f.host.transitionAdvance();f.host.transitionAdvance();f.host.transitionComplete(1);assert.equal(f.host.secondary,f.secondary);
  assert.equal(f.host.transitionPhase,'idle');assert(f.calls.includes('finish:1'));
});
test('a retained tucked view stays detached while only the primary transform is refreshed',()=>{
  const f=fixture();f.host.requestTransition('tuck',()=>{f.host.revealHeight=0;});f.ack();
  f.host.transitionAdvance();f.host.transitionAdvance();f.host.transitionComplete(1);
  assert(f.calls.includes('refresh:first'));assert(!f.calls.includes('refresh:second'));
  assert.equal(f.host.secondary,f.secondary);assert.equal(f.host.transitionPhase,'idle');
});
for(const phase of ['draining','loading','settling'])test('availability lost during '+phase+' closes only inside the owned park',()=>{
  const f=fixture();f.host.requestTransition('resize',()=>{f.host.revealHeight=1440;});
  if(phase!=='draining')f.ack();
  if(phase==='settling')f.host.transitionAdvance();
  f.host.mayShow=false;f.host.transitionAvailabilityLost=true;
  assert.equal(f.host.secondary,f.secondary);
  if(phase==='draining')f.ack();
  f.host.transitionAdvance();f.host.transitionAdvance();f.host.transitionComplete(1);
  assert.equal(f.host.secondary,null);assert.equal(f.host.revealHeight,0);
  assert.equal(f.host.transitionPhase,'idle');assert(f.calls.includes('close'));
});
for(const kind of ['throw','timeout','finish'])test('ordinary '+kind+' failure cannot persist or report a successful transition',()=>{
  const f=fixture();f.host.requestTransition('resize',()=>{if(kind==='throw')throw new Error('test');});f.ack();
  if(kind==='timeout'){f.primary.ready=false;f.host.transitionTicks=120;}
  if(kind==='finish')f.gate.refuseFinish=true;
  f.host.transitionAdvance();f.host.transitionAdvance();
  assert.equal(f.host.transitionPhase,'failed');assert(!f.timer.running);
  assert(!f.calls.includes('checkpoint'));assert(!f.calls.some(s=>s.startsWith('Companion transition: completed')));
});
test('a native callback failure cannot be overwritten by the enclosing apply phase',()=>{
  const f=fixture();
  f.host.requestTransition('page',()=>f.host.transitionFail('synchronous native callback failed'));
  f.ack();
  for(let i=0;i<10;i++)f.host.transitionAdvance();
  assert.equal(f.host.transitionPhase,'failed');assert(!f.host.transitionApplying);
  assert(!f.timer.running);assert(!f.calls.includes('permit:1'));assert(!f.calls.includes('checkpoint'));
});
test('ordinary head interception preserves upstream open helper anchors and covers same-document calls',()=>{
  const builder=fs.readFileSync('build-native.mjs','utf8');
  assert.doesNotMatch(builder,/RENAME _open_helper TO/);
  assert.match(builder,/REBUILD _open_helper\n\+? LOCATE BEFORE ALL/);
  assert.match(builder,/cnHost\.nativeOperation\(root, function\(\) \{ root\._open_helper\(documentToOpen, pageToOpen, highlightDetails\)/);
  assert.match(source,/enabled: \(host\.transitionBusy && host\.transitionPhase !== "choosing"\) \|\| pressed/);
  assert.doesNotMatch(source,/onPenDownChanged.*enabled|setFilterEvents|\/dev\/input|grabToImage/);
});
test('secondary stock close routes through the retained-view lifecycle, not a blank paired slot',()=>{
  const builder=fs.readFileSync('build-native.mjs','utf8');
  const wrapper=builder.slice(builder.indexOf('function cnNativeClose() {'),builder.indexOf('` + document.slice(end);'));
  assert.match(wrapper,/function close\(\) \{\s*if \(cnSecondary && cnHost\) return cnHost\.closeSecondary\(false\)/);
  assert.match(wrapper,/function cnNativeClose\(\) \{[^]*?cnStockClose\(\)/);
  const host=fs.readFileSync('native/NativeHost.qml','utf8');
  const close=body(host,'function closeSecondaryParked(');
  assert(close.indexOf('secondary = null')<close.indexOf('view.cnNativeClose()'));
  assert.match(close,/view\.cnNativeClose\(\); view\.destroy\(\)/);
});
