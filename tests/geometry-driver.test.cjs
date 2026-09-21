const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const built=fs.readFileSync('build/geometry-native/NativeHost.qml','utf8');
const start=built.lastIndexOf('onTriggered: {')+'onTriggered: '.length;
let depth=1,end=start+1;
for(;depth&&end<built.length;end++){if(built[end]==='{')depth++;if(built[end]==='}')depth--;}
assert.equal(depth,0);
const tickSource='(function()'+built.slice(start,end)+')()';
function fixture() {
    const calls=[],logs=[];
    const view=i=>({cnSelected:!i,reason:'ready',ready:true,
        cnProbePaneGeometry(){calls.push('scroll'+i);return true;},
        cnInputGeometryReadiness(){return this.reason;},
        cnUpdateInputGeometry(){calls.push('refresh'+i);return true;}});
    const primary=view(0),secondary=view(1);
    const host={probePhase:5,probeTicks:0,probeObservationTicks:0,probeInputRefreshed:false,
        penDown:false,error:'',secondary,inputGeometryPending:false,probeFailure:'',
        probeAssertStructure(){},probeFail:s=>{host.probeFailure=s;},
        selectPane(){primary.cnSelected=false;secondary.cnSelected=true;return true;},
        tuck(){return true;},openSecondary(){return true;},probeView:secondary};
    const bridge={primary,probeReadinessReason:'ready',viewReady:v=>v.ready};
    const c={host,bridge,console:{log:s=>logs.push(s)}};vm.createContext(c);
    return {host,primary,secondary,calls,logs,tick:()=>vm.runInContext(tickSource,c)};
}
test('actual geometry driver scrolls both panes then refreshes only on a later ready tick',()=>{
    const f=fixture();f.tick();assert.deepEqual(f.calls,['scroll0','scroll1']);
    assert.equal(f.host.probePhase,6);
    f.primary.ready=false;f.tick();assert.equal(f.calls.length,2);
    f.primary.ready=true;f.host.inputGeometryPending=true;f.tick();assert.equal(f.calls.length,2);
    f.host.inputGeometryPending=false;f.tick();assert.deepEqual(f.calls,['scroll0','scroll1','refresh0','refresh1']);
    assert(f.host.probeInputRefreshed);assert.equal(f.host.probeObservationTicks,1);
    f.tick();assert.equal(f.calls.length,4);
});
test('actual geometry driver waits for native loading before synchronous scroll',()=>{
    const f=fixture();f.secondary.ready=false;f.tick();assert.equal(f.calls.length,0);assert.equal(f.host.probePhase,5);
});
test('actual geometry driver rejects unsafe refresh reason and false native result',()=>{
    for(const mutate of [f=>f.primary.reason='pen-gate-open',f=>f.secondary.cnUpdateInputGeometry=()=>false]) {
        const f=fixture();f.tick();mutate(f);f.tick();
        assert.match(f.host.probeFailure,/Input refresh refused pane=/);assert(!f.host.probeInputRefreshed);
    }
});
test('actual geometry driver retains bounded timeout while native loading never settles',()=>{
    const f=fixture();f.secondary.ready=false;
    for(let i=0;i<161;i++)f.tick();
    assert.match(f.host.probeFailure,/timed out/);assert.equal(f.calls.length,0);
});
