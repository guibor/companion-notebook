const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function functions(text) {
    const entries=[], pattern=/^function (\w+)\(([^)]*)\) \{/gm;
    let match;
    while((match=pattern.exec(text))) {
        let depth=1,end=pattern.lastIndex;
        for(;depth && end<text.length;++end) {
            if(text[end]==='{')++depth;
            if(text[end]==='}')--depth;
        }
        assert.equal(depth,0);
        entries.push([match[1],'(function('+match[2]+'){'+text.slice(pattern.lastIndex,end-1)+'})']);
        pattern.lastIndex=end;
    }
    return entries;
}
function fixture() {
    const events=[];
    const host={transitionPhase:'idle',transitionGeneration:0,transitionTicks:0,transitionIntent:null,
        transitionBefore:[],transitionAfter:[],transitionApplying:false,inputGeometryPending:false,
        transitionAvailabilityLost:false,mayShow:true,secondary:null,openGeneration:1,pagePendingAdd:null,
        restoring:false,choosing:false,revealHeight:1080,checkpoint(){events.push('checkpoint');},
        hideWhenUnavailable(){events.push('unavailable');}};
    const view=id=>({document:{id},currentPageId:id+'-page',sceneController:{},penHandler:{},ready:true,
        tool:{kind:'pen',color:1,width:2},lines:['a','b'],redo:[],
        cnAdmissionInputsDetached:()=>host.inputGeometryPending,cnInputGeometryReadiness:()=> 'ready',
        cnAdmissionConstrainToPane:()=>true,cnUpdateInputGeometry:()=>true});
    const primary=view('main'),secondary=view('notes');host.secondary=secondary;
    Object.defineProperty(host,'paired',{get:()=>!!host.secondary});
    const gate={phase:'ready',error:'',pause(){this.phase='draining';events.push('pause');return true;},
        permitPublication(){this.phase='publishing';events.push('publish');return true;},
        finish(){this.phase='ready';events.push('finish');return true;}};
    const timer={running:false,restart(){this.running=true;},stop(){this.running=false;}};
    const bridge={primary,inputAvailable:true,viewReady:v=>v.ready,penInput:{surfaceManager:{updateRegions(){}}},endAnimation(){}};
    const context={host,bridge,admissionGate:gate,transitionTimer:timer,
        console:{warn:s=>events.push(s),log:s=>events.push(s)}};
    for(const key of Object.getOwnPropertyNames(host))Object.defineProperty(context,key,
        {get:()=>host[key],set:v=>{host[key]=v;},configurable:true});
    vm.createContext(context);
    for(const file of ['native/transactions.qml.inc','native/page-operations.qml.inc','native/edit-operations.qml.inc'])
        for(const [name,code] of functions(fs.readFileSync(file,'utf8'))) {
            host[name]=vm.runInContext(code,context);
            Object.defineProperty(context,name,{get:()=>host[name],configurable:true});
        }
    const ack=()=>{gate.phase='parked';host.transitionPark(host.transitionGeneration);};
    const finish=()=>{host.transitionAdvance();host.transitionAdvance();host.transitionComplete(host.transitionGeneration);};
    const assertClosed=()=>{
        for(let i=0;i<125;++i)host.transitionAdvance();
        assert.equal(host.transitionPhase,'failed');assert(!timer.running);
        assert(!events.includes('publish'));assert(!events.includes('finish'));
    };
    return {host,primary,secondary,gate,bridge,timer,events,ack,finish,view,assertClosed};
}
for(const which of ['primary','secondary'])test('entire '+which+' tool setter group waits for park and leaves the other pane alone',()=>{
    const f=fixture(),v=f[which],other=f[which==='primary'?'secondary':'primary'];
    const original={...v.tool},untouched={...other.tool},controller=v.sceneController,handler=v.penHandler;
    const states=[];
    assert(f.host.editOperation(v,()=>{
        assert(f.host.transitionOwnsPark());assert(f.host.inputGeometryPending);
        v.tool.kind='eraser';states.push(f.host.transitionPhase);
        v.tool.color=7;states.push(f.host.transitionPhase);
        v.tool.width=4;states.push(f.host.transitionPhase);
    }));
    assert.deepEqual(v.tool,original);assert.deepEqual(other.tool,untouched);
    f.ack();assert.deepEqual(v.tool,{kind:'eraser',color:7,width:4});
    assert(states.every(s=>s==='draining'));assert.equal(f.events.filter(s=>s==='pause').length,1);
    assert.equal(v.sceneController,controller);assert.equal(v.penHandler,handler);
    assert.deepEqual(other.tool,untouched);f.finish();assert.equal(f.host.transitionPhase,'idle');
});
test('undo then redo uses the selected native controller without changing page or the other pane',()=>{
    const f=fixture(),v=f.secondary,controller=v.sceneController,page=v.currentPageId;
    assert(f.host.editOperation(v,()=>{v.redo.push(v.lines.pop());}));
    assert.deepEqual(v.lines,['a','b']);f.ack();f.finish();
    assert.deepEqual(v.lines,['a']);assert.deepEqual(f.primary.lines,['a','b']);
    assert(f.host.editOperation(v,()=>{v.lines.push(v.redo.pop());}));f.ack();f.finish();
    assert.deepEqual(v.lines,['a','b']);assert.deepEqual(v.redo,[]);
    assert.equal(v.sceneController,controller);assert.equal(v.currentPageId,page);
});
test('nested setter groups reuse the existing native park',()=>{
    const f=fixture();
    assert(f.host.pageOperation(f.secondary,()=>{
        assert(f.host.editOperation(f.secondary,()=>{
            f.secondary.tool.kind='eraser';
            assert(f.host.editOperation(f.secondary,()=>{f.secondary.tool.width=5;}));
        }));
    }));f.ack();f.finish();
    assert.equal(f.events.filter(s=>s==='pause').length,1);assert.equal(f.secondary.tool.width,5);
    assert.equal(f.host.transitionPhase,'idle');
});
function change(f,kind) {
    if(kind==='document')f.secondary.document={...f.secondary.document};
    if(kind==='document-id')f.secondary.document.id='different';
    if(kind==='page')f.secondary.currentPageId='different';
    if(kind==='controller')f.secondary.sceneController={};
    if(kind==='handler')f.secondary.penHandler={};
    if(kind==='owner')f.host.secondary=f.view('replacement');
    if(kind==='generation')++f.host.transitionGeneration;
    if(kind==='owner-generation')++f.host.openGeneration;
}
for(const kind of ['document','document-id','page','controller','handler','owner','generation','owner-generation']) {
    test('changed '+kind+' before park rejects edit without mutation',()=>{
        const f=fixture();let called=false;
        assert(f.host.editOperation(f.secondary,()=>{called=true;}));change(f,kind);f.ack();
        assert(!called);f.assertClosed();
    });
    test('edit changing '+kind+' fails before native input publication',()=>{
        const f=fixture();let called=false;
        assert(f.host.editOperation(f.secondary,()=>{called=true;change(f,kind);}));f.ack();
        assert(called);f.assertClosed();
    });
}
test('nested edit failure remains failed even if its caller catches the exception',()=>{
    const f=fixture();
    assert(f.host.requestTransition('edit-parent',()=>{
        try {f.host.editOperation(f.secondary,()=>{f.secondary.currentPageId='wrong';});}
        catch(error){assert.match(String(error),/edit changed/);}
    }));f.ack();f.assertClosed();
});
test('throwing native setter group fails closed without speculative rollback',()=>{
    const f=fixture();
    assert(f.host.editOperation(f.secondary,()=>{
        f.secondary.tool.kind='eraser';throw new Error('native setter error');
    }));f.ack();assert.equal(f.secondary.tool.kind,'eraser');f.assertClosed();
});
test('native synchronous failure is retained after the edit returns',()=>{
    const f=fixture();
    assert(f.host.editOperation(f.secondary,()=>f.host.transitionFail('native refused')));
    f.ack();f.assertClosed();
});
test('an edit cannot start on an unknown or closed pane',()=>{
    const f=fixture();let called=false;
    assert(!f.host.editOperation(f.view('unknown'),()=>{called=true;}));
    f.secondary.document=null;assert(!f.host.editOperation(f.secondary,()=>{called=true;}));
    assert(!called);assert.equal(f.host.transitionPhase,'idle');assert(!f.events.includes('pause'));
});
test('second user edit while draining is refused without changing tool state',()=>{
    const f=fixture();let extra=false;
    assert(f.host.editOperation(f.secondary,()=>{f.secondary.tool.width=7;}));
    assert(!f.host.editOperation(f.secondary,()=>{extra=true;}));
    assert.equal(f.secondary.tool.width,2);f.ack();f.finish();assert(!extra);assert.equal(f.secondary.tool.width,7);
});
test('pending native add disallows an unrelated edit even inside applying phase',()=>{
    const f=fixture();let called=false;
    assert(f.host.requestTransition('pending-add',()=>{
        f.host.pagePendingAdd={view:f.secondary,completing:false};
        assert(!f.host.editOperation(f.secondary,()=>{called=true;}));
        f.host.pagePendingAdd=null;
    }));f.ack();f.finish();assert(!called);assert.equal(f.host.transitionPhase,'idle');
});
for(const kind of ['park','geometry','availability'])test('edit cannot silently discard '+kind+' ownership',()=>{
    const f=fixture();
    assert(f.host.editOperation(f.secondary,()=>{
        if(kind==='park')f.gate.phase='ready';
        if(kind==='geometry')f.host.inputGeometryPending=false;
        if(kind==='availability')f.host.transitionAvailabilityLost=true;
    }));f.ack();f.assertClosed();
});

// Model the real outer native pressed-group ordering, not only the isolated
// requestPenSelect signal. Composition tests separately pin these entry guards.
for(const kind of ['writing','eraser'])test(kind+' press parks before selectedPen and every following signal',()=>{
    const f=fixture(),v=f.secondary;
    const old={kind:'pen'},next={kind:kind==='eraser'?'eraser':'pencil'};
    const toolbar={selectedPen:old,activeTool:old.kind};
    const guarded=()=>!f.host.pageMayMutate(v);
    const requestPenSelect=pen=>{
        if(guarded())return f.host.editOperation(v,()=>requestPenSelect(pen));
        toolbar.selectedPen=pen;toolbar.activeTool=pen.kind;
    };
    const selectedSignal=()=>{
        if(guarded())return f.host.editOperation(v,selectedSignal);
        v.tool.kind=next.kind;
    };
    const pressed=()=>{
        if(guarded())return f.host.editOperation(v,pressed);
        requestPenSelect(next);
        if(kind==='writing')toolbar.selectedPen=next;
        selectedSignal();
    };
    assert(pressed());assert.equal(toolbar.selectedPen,old);
    assert.equal(toolbar.activeTool,'pen');assert.equal(v.tool.kind,'pen');
    f.ack();assert.equal(toolbar.selectedPen,next);
    assert.equal(toolbar.activeTool,next.kind);assert.equal(v.tool.kind,next.kind);
    f.finish();assert.equal(f.host.transitionPhase,'idle');
    assert.equal(f.events.filter(x=>x==='pause').length,1);
});
test('erase-all wraps selectPen and content deletion in the same owned park',()=>{
    const f=fixture(),v=f.secondary;let selection=false;
    const eraseAll=()=>{
        if(!f.host.pageMayMutate(v))return f.host.editOperation(v,eraseAll);
        selection=true;v.tool.kind='pen';v.lines=[];
    };
    assert(eraseAll());assert(!selection);assert.deepEqual(v.lines,['a','b']);
    f.ack();assert(selection);assert.deepEqual(v.lines,[]);
    assert.deepEqual(f.primary.lines,['a','b']);f.finish();
    assert.equal(f.events.filter(x=>x==='pause').length,1);
});
test('deferred tool normalization runs as a whole group before input publication',()=>{
    const f=fixture(),v=f.secondary;let normalized=0;
    v.cnNormalizeTools=()=>{
        assert(f.host.pageMayMutate(v));assert(!f.events.includes('publish'));
        if(v.tool.kind==='highlighter') {v.tool.color=3;v.tool.width=8;}
        normalized++;
    };
    assert(f.host.editOperation(v,()=>{v.tool.kind='highlighter';}));f.ack();
    // Native Qt.callLater may run during loading. The attempted edit is refused,
    // but transitionAdvance normalizes the CURRENT selected tool before finish.
    assert(!f.host.editOperation(v,()=>{throw new Error('stale queued callback');}));
    assert.equal(v.tool.color,1);assert.equal(v.tool.width,2);
    f.finish();assert.equal(normalized,2);
    assert.deepEqual(v.tool,{kind:'highlighter',color:3,width:8});
    assert.equal(f.events.filter(x=>x==='pause').length,1);
    assert.equal(f.host.transitionPhase,'idle');
});
test('normalization cannot swap the native controller or reopen a different page',()=>{
    const f=fixture();
    f.secondary.cnNormalizeTools=()=>{f.secondary.sceneController={};};
    assert(f.host.editOperation(f.secondary,()=>{f.secondary.tool.width=8;}));f.ack();
    f.host.transitionAdvance();f.assertClosed();assert(!f.host.transitionApplying);
});
test('normalization does not run until both native panes are ready',()=>{
    const f=fixture();let count=0;f.secondary.cnNormalizeTools=()=>count++;
    f.secondary.ready=false;
    assert(f.host.editOperation(f.secondary,()=>{f.secondary.tool.width=8;}));f.ack();
    f.host.transitionAdvance();assert.equal(count,0);assert(!f.events.includes('publish'));
    f.secondary.ready=true;f.finish();assert.equal(count,2);
});
test('unavailable primary returned to stock does not normalize a hidden pen',()=>{
    const f=fixture();let called=false;f.primary.cnNormalizeTools=()=>{called=true;};
    assert(f.host.requestTransition('hide',()=>{f.host.secondary=null;f.host.mayShow=false;}));f.ack();
    f.finish();assert(!called);assert.equal(f.host.transitionPhase,'idle');
});
