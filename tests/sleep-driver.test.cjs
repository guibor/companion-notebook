const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('native/sleep-probe.qml.inc','utf8');
function fixture(){
    let now=10000;
    const logs=[],view=id=>({document:{id},currentPageId:id+'-page',cnProbeScene:{},sceneController:{},cnAdmissionInputsDetached:()=>true});
    const first=view('first'),second=view('second');
    const bridge={primary:first,probeSleeping:false,probeDisplayState:0,inputAvailable:true,viewReady:()=>true};
    const host={probeSleepBusy:false,probeSleepDone:false,probeSleepStep:0,probeSleepStarted:0,probeSleepPages:[],
        probeViews:[first,second],probeScenes:[first.cnProbeScene,second.cnProbeScene],
        probeControllers:[first.sceneController,second.sceneController],probeDocuments:['first','second'],
        secondary:second,penDown:false,inputVisibilityHeld:true,inputGeometryPending:false,transitionPhase:'idle',
        probeStable:()=>true,transitionOwnsPark:()=>host.transitionPhase==='suspended'||host.transitionPhase==='applying',
        requestTransition:(name,fn)=>{host.transitionPhase='draining';host.pending=fn;return true;},
        openSecondary:()=>{host.secondary=view('second');host.inputVisibilityHeld=true;return true;}};
    Object.defineProperty(host,'idle',{get:()=>host.transitionPhase==='idle'});
    bridge.probeSleepOwned=()=>{assert(host.transitionOwnsPark());assert(host.inputGeometryPending);assert(!host.inputVisibilityHeld);
        bridge.probeSleeping=true;bridge.probeDisplayState=2;bridge.inputAvailable=false;};
    const c={host,bridge,console:{log:x=>logs.push(x)},Date:{now:()=>now}};
    for(const key of Object.getOwnPropertyNames(host))Object.defineProperty(c,key,{get:()=>host[key],set:v=>{host[key]=v;},configurable:true});
    vm.createContext(c);
    const re=/^function (\w+)\(([^)]*)\) \{/gm;let m;
    while((m=re.exec(source))){let depth=1,end=re.lastIndex;for(;depth&&end<source.length;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
        host[m[1]]=vm.runInContext('(function('+m[2]+'){'+source.slice(re.lastIndex,end-1)+'})',c);
        const name=m[1];Object.defineProperty(c,name,{get:()=>host[name],configurable:true});re.lastIndex=end;
    }
    return{host,bridge,logs,first,second,advance:ms=>{now+=ms;},park(){host.transitionPhase='applying';host.inputGeometryPending=true;host.inputVisibilityHeld=false;host.pending();host.secondary=null;host.transitionPhase='suspended';},wake(){bridge.probeSleeping=false;bridge.probeDisplayState=0;bridge.inputAvailable=true;host.transitionPhase='idle';host.inputGeometryPending=false;}};
}
test('sleep test requests only under detached park and requires actual normal wake and fresh pair',()=>{
    const f=fixture();f.host.probeSleepBegin();assert(!f.bridge.probeSleeping);
    f.park();assert(f.bridge.probeSleeping);assert(!f.host.probeSleepTick());
    assert.equal(f.host.probeSleepStep,1);assert(f.logs[0].includes('asleep; parked=true; detached=true'));
    assert(f.host.probeSleepSolePrimary(f.first));assert(!f.host.probeSleepSolePrimary(f.second));
    assert(!f.host.probeSleepTick());f.wake();assert(!f.host.probeSleepTick());assert(f.host.probeSleepTick());
    assert(f.host.probeSleepDone);assert(!f.host.probeSleepBusy);assert.equal(f.logs.length,3);
    assert(!f.host.probeSleepSolePrimary(f.first));
});
test('sleep is never invoked on an active stroke or without the prearmed hold',()=>{
    for(const key of ['penDown','inputVisibilityHeld']){const f=fixture();f.host[key]=key==='penDown';assert.throws(()=>f.host.probeSleepBegin(),/not ready/);assert(!f.bridge.probeSleeping);}
});
test('old candidates must detach before any power call',()=>{
    const f=fixture();f.first.cnAdmissionInputsDetached=()=>false;f.host.probeSleepBegin();assert.throws(()=>f.park(),/retained old input/);assert(!f.bridge.probeSleeping);
});
test('a missed native wake fails within five seconds, not the generic trial timeout',()=>{
    const f=fixture();f.host.probeSleepBegin();f.park();f.host.probeSleepTick();f.advance(5001);assert.throws(()=>f.host.probeSleepTick(),/wake deadline/);assert(!f.host.probeSleepDone);
});
test('awake-but-not-Normal, foreign owner and missing fresh input are never success',()=>{
    for(const kind of ['state','owner','input']){const f=fixture();f.host.probeSleepBegin();f.park();f.host.probeSleepTick();f.wake();
        if(kind==='state')f.bridge.probeDisplayState=1;if(kind==='owner')f.first.sceneController={};if(kind==='input')f.host.inputGeometryPending=true;
        assert.throws(()=>f.host.probeSleepTick());assert(!f.host.probeSleepDone);}
});
test('sleep profile cannot fabricate wake or alter device power policy',()=>{
    for(const file of ['native/sleep-probe.qml.inc','ops/wake-key.c','ops/build-sleep-controller.mjs']){
        const s=fs.readFileSync(file,'utf8');assert.doesNotMatch(s,/\.onWakeup\(|\.onActivity\(|setSuspendEnabled\(|rtcwake|wakealarm|EVIOCGRAB|systemctl (?:suspend|reboot)|shutdown -/);
    }
});
