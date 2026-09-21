const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const driver=fs.readFileSync('native/structural-probe.qml.inc','utf8');
function body(source,anchor) {
    const start=source.indexOf(anchor); assert(start>=0,anchor);
    const open=source.indexOf('{',start); let depth=1,end=open+1;
    for (;depth&&end<source.length;end++) { if(source[end]==='{')depth++; if(source[end]==='}')depth--; }
    assert.equal(depth,0); return source.slice(open+1,end-1);
}
function fixture() {
    const logs=[],calls=[];
    const item=()=>({width:600,height:900});
    const primary={...item(),document:{id:'first'},cnInkAllowed:false,cnSelected:true,cnProbeViewport:item(),cnProbeScene:item()};
    const secondary={...item(),document:{id:'second'},cnInkAllowed:false,cnSelected:false,cnProbeViewport:item(),cnProbeScene:item()};
    const host={height:900,probePhase:0,probeSucceeded:false,probeFailure:'',probeTicks:0,probeDocuments:[],probeView:null,
        probePrimary:null,probeGeometry:[],probeDragStep:0,probeObservationTicks:0,probeLastReadiness:'',
        penDown:false,error:'',restoring:false,idle:true,dragging:false,secondary,
        synchronizePrimary(){},pick(){return true;},beginDrag(){host.dragging=true;return true;},moveDrag(){calls.push('move');},
        finishDrag(){host.dragging=false;},selectPane(){primary.cnSelected=false;secondary.cnSelected=true;return true;},
        tuck(){calls.push('tuck');return true;},openSecondary(){calls.push('reopen');return true;}};
    const bridge={primary,probeMayStart:true,probeReadinessReason:'ready',
        probeCreate(){calls.push('create');return ['first','second'];},viewReady(){return true;},
        probeSeparate(){return primary.document.id==='first'&&host.secondary===secondary&&secondary.document.id==='second';},
        probeInvalidate(){},probeRestore(){calls.push('restore');},probeRestored(){return true;}};
    const c={host,bridge,console:{log:s=>logs.push(s),warn:s=>logs.push(s)},running:true};
    c.stop=()=>{c.running=false;};
    host.probeFail=message=>{host.probeFailure=message;c.running=false;bridge.probeRestore();};
    vm.createContext(c);
    host.probeAssertStructure=()=>vm.runInContext(body(driver,'function probeAssertStructure()'),Object.assign(c,{
        probePrimary:host.probePrimary,secondary:host.secondary,probeView:host.probeView,probeGeometry:host.probeGeometry}));
    const tick=()=>vm.runInContext('(function(){'+body(driver,'onTriggered:')+'})()',c);
    const until=phase=>{for(let n=0;host.probePhase!==phase&&c.running&&n<170;n++)tick();assert.equal(host.probePhase,phase);};
    return {host,bridge,primary,secondary,calls,logs,tick,until,c};
}
test('structural generated artifacts contain no capture or layer API',()=>{
    for(const name of ['NativeHost.qml','companion-notebook.qmd']) {
        const content=fs.readFileSync('build/structural-native/'+name,'utf8');
        assert.doesNotMatch(content,/grabToImage|grabWindow|probeCapture|saveToFile|ShaderEffect|layer\s*\./);
    }
    const qmd=fs.readFileSync('build/structural-native/companion-notebook.qmd','utf8');
    // Stock identifiers are hashed in QMD output; decoded expressions are
    // checked against real resources by native-composition.mjs.
    assert.match(qmd,/cnInkAllowed:/);
    assert.match(qmd,/cnProbeScene:/);
    assert.match(qmd,/function probeSeparate/);
});
test('structural controller preserves recovery and demands its own nonvisual marker',()=>{
    execFileSync(process.execPath,['ops/build-render-controller.mjs'],{env:{...process.env,CN_PROBE:'structural'}});
    const base=fs.readFileSync('ops/probe-pro329.sh','utf8'), out=fs.readFileSync('build/structural-native/probe.sh','utf8');
    const recovery=s=>s.slice(s.indexOf('cleanup_host() {'),s.indexOf('# Watchdog retry accounting'));
    assert.equal(recovery(out),recovery(base));
    assert.match(out,/mark structural-machine-passed/);
    assert.doesNotMatch(out,/mark rendering-machine-passed|capture=true|\[ -s "\$D\/render/);
    assert.match(out,/capture=not-attempted; visual=unverified/);
    assert.match(out,/if grep -Eq 'grabToImage/);
    execFileSync('/bin/bash',['-n','build/structural-native/probe.sh']);
});
test('actual structural driver waits 40 observation ticks and returns before nonvisual success',()=>{
    const f=fixture();f.until(6);
    assert.equal(f.calls.filter(c=>c==='move').length,10);
    for(let n=0;n<39;n++)f.tick();
    assert.equal(f.host.probePhase,6);assert(!f.host.probeSucceeded);
    f.tick();assert.equal(f.host.probePhase,7);f.tick();assert.equal(f.host.probePhase,8);
    assert.equal(f.calls.filter(c=>c==='restore').length,1);f.tick();
    assert(f.host.probeSucceeded);assert(!f.c.running);
    assert(f.logs.at(-1).endsWith('ink=false; capture=not-attempted; visual=unverified'));
});
for(const [name,change] of [
    ['unsafe state',f=>{f.bridge.probeReadinessReason='locked';}],
    ['foreign document',f=>{f.secondary.document.id='foreign';}],
    ['replaced viewport',f=>{f.secondary.cnProbeViewport={width:600,height:900};}],
    ['changed dimensions',f=>{f.primary.cnProbeViewport.height=800;}],
    ['destroyed scene',f=>{f.primary.cnProbeScene=null;}],
    ['ink allowed',f=>{f.secondary.cnInkAllowed=true;}],
    ['pen down',f=>{f.host.penDown=true;}]
])test('actual structural driver aborts on '+name,()=>{
    const f=fixture();f.until(6);change(f);f.tick();
    assert(f.host.probeFailure);assert(!f.host.probeSucceeded);assert(!f.c.running);
    assert.equal(f.calls.filter(c=>c==='restore').length,1);
});
test('structural driver cannot report success before exact native return',()=>{
    const f=fixture();f.until(8);f.bridge.probeRestored=()=>false;
    for(let n=0;n<170&&f.c.running;n++)f.tick();
    assert.match(f.host.probeFailure,/timed out/);assert(!f.host.probeSucceeded);
});
