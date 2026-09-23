const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('native/lifecycle-probe.qml.inc','utf8');
function fixture() {
    const events=[],docs=[{id:'main',pages:['main-0']},{id:'notes',pages:['notes-0']}];
    const host={probeLifecycleStep:0,probeLifecycleBusy:false,probeLifecycleDone:false,
        probeOriginalPages:[],probeAddedPages:[],probeClosedView:null,probeDocuments:['main','notes'],
        transitionPhase:'idle',revealHeight:1440,companionId:'notes',probeViews:[],probeScenes:[],probeControllers:[],
        transitionOwnsPark:()=>false,probeIdentities:()=>true,probeStable:()=>true,selectPane:()=>true};
    Object.defineProperty(host,'idle',{get:()=>host.transitionPhase==='idle'});
    Object.defineProperty(host,'paired',{get:()=>!!host.secondary&&host.revealHeight>0});
    function queue(name,fn){assert(host.idle);events.push(name);host.transitionPhase='draining';host.pending=fn;}
    function view(document) {
        const v={document,index:0,sceneController:{},cnProbeScene:{},redo:false,undo:true,tool:'primary'};
        Object.defineProperty(v,'currentPageId',{get:()=>v.document.pages[v.index]});
        v.cnProbeState=()=>({page:v.currentPageId,index:v.index,pages:document.pages.length,
            undo:v.undo,redo:v.redo,tool:v.tool,writing:v.tool==='primary'});
        v.cnProbeHistory=action=>queue(document.id+'-'+action,()=>{v.redo=action==='undo';});
        v.cnProbeAdd=()=>queue(document.id+'-add',()=>{document.pages.push(document.id+'-1');v.index=1;v.sceneController={};});
        v.cnProbePage=index=>queue(document.id+'-page',()=>{v.index=index;v.sceneController={};});
        v.cnProbeClose=()=>queue('close',()=>{host.secondary=null;host.revealHeight=0;});
        return v;
    }
    const bridge={primary:view(docs[0]),viewReady:()=>true};host.secondary=view(docs[1]);
    host.action=name=>{
        if(name==='＋')host.secondary.cnProbeAdd();
        else if(name==='Redo')host.secondary.cnProbeHistory('redo');
        else queue(name,()=>{host.secondary.tool=name==='Erase'?'eraser':'primary';});
        return true;
    };
    host.openSecondary=()=>{queue('reopen',()=>{host.secondary=view(docs[1]);host.revealHeight=1440;});return true;};
    const context={host,bridge,console:{log:s=>events.push(s)}};
    for(const key of Object.getOwnPropertyNames(host))Object.defineProperty(context,key,
        {get:()=>host[key],set:value=>{host[key]=value;},configurable:true});
    vm.createContext(context);
    const pattern=/^function (\w+)\(([^)]*)\) \{/gm;let match;
    while((match=pattern.exec(source))){
        let depth=1,end=pattern.lastIndex;
        for(;depth&&end<source.length;++end){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
        assert.equal(depth,0);
        const code='(function('+match[2]+'){'+source.slice(pattern.lastIndex,end-1)+'})';
        const name=match[1];host[name]=vm.runInContext(code,context);
        Object.defineProperty(context,name,{get:()=>host[name],configurable:true});pattern.lastIndex=end;
    }
    return {host,bridge,docs,events,ack(){assert.equal(host.transitionPhase,'draining');host.pending();host.transitionPhase='idle';}};
}
test('integrated lifecycle driver exercises history/tools/pages/native close without extra ink',()=>{
    const f=fixture(),old=f.host.secondary;
    for(let i=0;i<20&&!f.host.probeLifecycleDone;i++){
        const done=f.host.probeLifecycleTick();if(done)break;
        const step=f.host.probeLifecycleStep;
        assert(!f.host.probeLifecycleTick());assert.equal(f.host.probeLifecycleStep,step);
        f.ack();
    }
    assert(f.host.probeLifecycleDone);assert(!f.host.probeLifecycleBusy);
    assert.notEqual(f.host.secondary,old);assert.equal(f.host.secondary.currentPageId,'notes-0');
    assert.equal(f.bridge.primary.currentPageId,'main-0');
    assert.deepEqual(f.docs.map(d=>d.pages.length),[2,2]);
    assert.deepEqual(f.events.filter(e=>!e.startsWith('Companion')),['notes-undo','notes-redo','main-undo','main-redo','Erase','Pen','notes-add','notes-page','main-add','main-page','close','reopen']);
    assert.equal(f.events.filter(e=>e.startsWith('Companion lifecycle:')).length,4);
});
test('missing native history refuses the lifecycle before any mutation',()=>{
    const f=fixture();f.host.secondary.undo=false;
    assert.throws(()=>f.host.probeLifecycleTick(),/no history/);assert.deepEqual(f.events,[]);
});
test('unexpected document ownership never dispatches a lifecycle action',()=>{
    const f=fixture();f.host.secondary.document={id:'foreign',pages:['foreign-0']};
    assert.throws(()=>f.host.probeLifecycleTick(),/document changed/);assert.deepEqual(f.events,[]);
});
test('failed native undo cannot be reported as history success',()=>{
    const f=fixture();f.host.probeLifecycleTick();f.ack();f.host.secondary.redo=false;
    assert.throws(()=>f.host.probeLifecycleTick(),/did not expose redo/);
});
test('unexpected async page result cannot become a successful page receipt',()=>{
    const f=fixture();
    while(f.host.probeLifecycleStep<7){f.host.probeLifecycleTick();f.ack();}
    f.docs[1].pages.push('foreign');
    assert.throws(()=>f.host.probeLifecycleTick(),/new page was not selected/);
});
test('failure to clear secondary slot blocks native reopen',()=>{
    const f=fixture();
    while(f.host.probeLifecycleStep<11){f.host.probeLifecycleTick();f.ack();}
    f.host.secondary=f.host.probeClosedView;
    assert.throws(()=>f.host.probeLifecycleTick(),/retained an occupied pane/);
});
test('close publishes only its exact remaining primary without weakening freshness',()=>{
    const f=fixture();
    while(f.host.probeLifecycleStep<11){f.host.probeLifecycleTick();f.ack();}
    const primary=f.bridge.primary;
    assert.equal(f.host.secondary,null);
    assert(f.host.probeSolePrimary(primary));
    assert(!f.host.probeSolePrimary(f.host.probeClosedView));
    const controller=primary.sceneController;primary.sceneController={};
    assert(!f.host.probeSolePrimary(primary));primary.sceneController=controller;
    const scene=primary.cnProbeScene;primary.cnProbeScene={};
    assert(!f.host.probeSolePrimary(primary));primary.cnProbeScene=scene;
    const id=primary.document.id;primary.document.id='foreign';
    assert(!f.host.probeSolePrimary(primary));primary.document.id=id;
    f.host.probeLifecycleBusy=false;assert(!f.host.probeSolePrimary(primary));
    f.host.probeLifecycleBusy=true;f.host.probeLifecycleStep=12;
    assert(f.host.probeSolePrimary(primary));
    f.host.probeLifecycleStep=13;
    assert(!f.host.probeSolePrimary(primary));
});
test('generated lifecycle gate admits the sole-primary candidate and bar has actual redo',()=>{
    const generated=fs.readFileSync('build/lifecycle-native/NativeHost.qml','utf8');
    const fn=generated.match(/function probeAllows\(view\) \{([\s\S]*?)\n\}/)[1];
    const context={probeWriting:true,probeDocuments:['main','notes'],host:{},secondary:null,
        bridge:{primary:{document:{id:'main'}},probeSeparate:()=>false},probeSolePrimary:()=>true};
    vm.createContext(context);
    const allows=vm.runInContext('(function(view){'+fn+'})',context);
    assert(allows(context.bridge.primary));
    assert(!allows({document:{id:'main'}}));
    context.probeSolePrimary=()=>false;assert(!allows(context.bridge.primary));
    context.probeSolePrimary=()=>true;context.probeWriting=false;assert(!allows(context.bridge.primary));
    for(const order of ['companion-first','companion-last','appload-last']) {
        const composed=fs.readFileSync('build/composed-'+order+'/qml/device/view/documentview/DocumentView.qml','utf8');
        assert(composed.includes('case "Redo": sceneController.redo(); break'),order+' bar redo');
    }
});
