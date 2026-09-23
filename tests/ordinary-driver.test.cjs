const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('native/ordinary-probe.qml.inc','utf8');
const start=source.indexOf('onTriggered: {')+'onTriggered: {'.length;
assert(start>20);
let end=start,depth=1;
for(;depth&&end<source.length;++end){
    if(source[end]==='{')++depth;
    if(source[end]==='}')--depth;
}
assert.equal(depth,0);
const handler='(function(){'+source.slice(start,end-1)+'})';
function fixture() {
    const events=[];
    const host={probeTicks:0,probePhase:3,probeDocumentLocked:false,penDown:false,
        transitionPhase:'idle',error:'',probeFailure:'',
        probeFail(message){this.probeFailure=message;},
        requestTransition(name,operation){
            assert.equal(this.transitionPhase,'idle');events.push(name);
            this.transitionPhase='draining';this.pending=operation;return true;
        },
        chooseSize(ratio){assert.equal(events.filter(x=>x==='tool').length,2);
            assert.equal(this.transitionPhase,'idle');events.push(ratio);return true;},
        probeIdentities(){return true;}};
    const view=()=>({cnProbeScene:{},sceneController:{},cnProbePreparePen(){
        assert.equal(host.transitionPhase,'parked');events.push('tool');return true;}});
    const bridge={primary:view(),probeReadinessReason:'ready',probeSeparate:()=>true};
    host.secondary=view();
    const run=vm.runInNewContext(handler,{host,bridge,console:{log(){}}});
    const ack=()=>{host.transitionPhase='parked';host.pending();host.transitionPhase='idle';};
    return {host,bridge,events,run,ack};
}
test('next ordinary driver prepares both native pens in one park before resizing',()=>{
    const f=fixture();f.run();
    assert.equal(f.host.probePhase,21);assert.deepEqual(f.events,['probe-tools']);
    assert(!f.host.probeDocumentLocked);
    f.run();assert.deepEqual(f.events,['probe-tools']); // still draining
    f.ack();assert.deepEqual(f.events,['probe-tools','tool','tool']);
    f.run();assert.equal(f.host.probePhase,20);assert(f.host.probeDocumentLocked);
    assert.deepEqual(f.events,['probe-tools','tool','tool',0.5]);
    assert.equal(f.host.probeFailure,'');
});
test('refused pen-preparation transition stops without changing either tool',()=>{
    const f=fixture();f.host.requestTransition=()=>false;f.run();
    assert.match(f.host.probeFailure,/pen preparation refused/);
    assert.deepEqual(f.events,[]);assert(!f.host.probeDocumentLocked);
});
test('changed disposable ownership after tool preparation blocks preset and ink',()=>{
    const f=fixture();f.run();f.ack();f.host.probeIdentities=()=>false;f.run();
    assert.match(f.host.probeFailure,/changed disposable ownership/);
    assert(!f.host.probeDocumentLocked);assert(!f.events.includes(0.5));
});
test('failed native preparation reports to the enclosing parked transaction',()=>{
    const f=fixture();f.host.secondary.cnProbePreparePen=()=>false;f.run();
    assert.throws(f.ack,/native writing tool unavailable/);
    assert(!f.host.probeDocumentLocked);assert(!f.events.includes(0.5));
});
