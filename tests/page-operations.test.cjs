const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('native/page-operations.qml.inc', 'utf8');
const transactions = fs.readFileSync('native/transactions.qml.inc', 'utf8');
function functions(text) {
    const result = [];
    const pattern = /^function (\w+)\(([^)]*)\) \{/gm;
    let match;
    while ((match = pattern.exec(text))) {
        let depth = 1, end = pattern.lastIndex;
        for (; depth && end < text.length; ++end) {
            if (text[end] === '{') ++depth;
            if (text[end] === '}') --depth;
        }
        assert.equal(depth, 0);
        result.push([match[1], '(function(' + match[2] + '){' + text.slice(pattern.lastIndex, end - 1) + '})']);
        pattern.lastIndex = end;
    }
    return result;
}
function fixture() {
    const events = [];
    const host = {transitionPhase:'idle', transitionGeneration:0, transitionTicks:0,
        transitionIntent:null, transitionBefore:[], transitionAfter:[], transitionApplying:false,
        inputGeometryPending:false, transitionAvailabilityLost:false, mayShow:true,
        restoring:false, choosing:false, secondary:null, revealHeight:1080, openGeneration:1, pagePendingAdd:null,
        checkpoint(){events.push('checkpoint');}, hideWhenUnavailable(){events.push('unavailable');}};
    const view = id => {
        const document = {id, pages:[id+'-a', id+'-b'],
            get pageCount(){return this.pages.length;}, idForPage(i){return this.pages[i] || '';}};
        return {document, currentPageId:document.pages[0], sceneController:{}, penHandler:{}, ready:true,
            cnAdmissionInputsDetached:()=>host.inputGeometryPending,
            cnInputGeometryReadiness:()=> 'ready', cnAdmissionConstrainToPane:()=>true,
            cnUpdateInputGeometry:()=>true};
    };
    const primary = view('main'), secondary = view('notes'); host.secondary = secondary;
    Object.defineProperty(host, 'paired', {get:()=>!!host.secondary});
    const gate = {phase:'ready', error:'', pause(){this.phase='draining';events.push('pause');return true;},
        permitPublication(){assert(!host.pagePendingAdd);this.phase='publishing';events.push('publish');return true;},
        finish(){this.phase='ready';events.push('finish');return true;}};
    const timer = {running:false, restart(){this.running=true;}, stop(){this.running=false;}};
    const bridge = {primary, viewReady:v=>v.ready, penInput:{surfaceManager:{updateRegions(){}}}, endAnimation(){}};
    const context = {host, bridge, admissionGate:gate, transitionTimer:timer,
        console:{warn:s=>events.push(s), log:s=>events.push(s)}};
    for (const key of Object.getOwnPropertyNames(host))
        Object.defineProperty(context,key,{get:()=>host[key],set:v=>{host[key]=v;},configurable:true});
    vm.createContext(context);
    for (const [name, code] of [...functions(transactions), ...functions(source),
            ...functions(fs.readFileSync('native/edit-operations.qml.inc','utf8'))]) {
        // Exercise the actual integrated adapter, not a test-only rewrite.
        if (name === 'transitionAdvance') assert.match(code,/if \(!pageOperationsReady\(\)\) return/);
        host[name] = vm.runInContext(code, context);
        Object.defineProperty(context,name,{get:()=>host[name],configurable:true});
    }
    const ack = () => {gate.phase='parked';host.transitionPark(host.transitionGeneration);};
    const finish = () => {host.transitionAdvance();host.transitionAdvance();host.transitionComplete(host.transitionGeneration);};
    const select = (v,index) => {v.currentPageId=v.document.idForPage(index);v.sceneController={};};
    let token;
    const start = (v=secondary, index=1, sync=false) => {
        assert(host.pageOperation(v,()=>{
            token=host.pageAddBegin(v,index); assert(token);
            if(sync) complete(v);
        }));
        ack(); return token;
    };
    const insert = (v=secondary) => v.document.pages.splice(token.index,0,v.document.id+'-new');
    const callback = (v=secondary) => host.pageAddComplete(token,(index,id)=>{
        assert(host.pageMayMutate(v)); assert.equal(v.document.idForPage(index),id);
        events.push('native-select'); select(v,index);
    });
    const complete = (v=secondary) => {insert(v);return callback(v);};
    return {host,primary,secondary,bridge,gate,timer,events,ack,finish,select,start,insert,callback,complete,view};
}
test('synchronous page navigation drains first, keeps both documents, and publishes only the new controller',()=>{
    const f=fixture(), old=f.secondary.sceneController, main=f.primary.sceneController;
    assert(f.host.pageOperation(f.secondary,()=>f.select(f.secondary,1)));
    assert.equal(f.secondary.sceneController,old);assert(!f.host.inputGeometryPending);
    f.ack();assert.notEqual(f.secondary.sceneController,old);assert.equal(f.primary.sceneController,main);
    assert.equal(f.host.secondary,f.secondary);f.finish();assert.equal(f.host.transitionPhase,'idle');
});
test('nested openPage and low-level page selection share the same park',()=>{
    const f=fixture();assert(f.host.pageOperation(f.secondary,()=>{
        assert(f.host.pageOperation(f.secondary,()=>f.select(f.secondary,1)));
    }));f.ack();f.finish();assert.equal(f.events.filter(e=>e==='pause').length,1);
});
for(const kind of ['page','controller','handler','document','owner','generation','owner-generation'])
    test('changed '+kind+' while draining cannot run the native page operation',()=>{
        const f=fixture();let called=false;
        assert(f.host.pageOperation(f.secondary,()=>{called=true;}));
        if(kind==='page') f.secondary.currentPageId='different';
        if(kind==='controller') f.secondary.sceneController={};
        if(kind==='handler') f.secondary.penHandler={};
        if(kind==='document') f.secondary.document={...f.secondary.document};
        if(kind==='owner') f.host.secondary=f.view('other');
        if(kind==='generation') ++f.host.transitionGeneration;
        if(kind==='owner-generation') ++f.host.openGeneration;
        f.ack();assert(!called);assert.equal(f.host.transitionPhase,'failed');assert(!f.events.includes('publish'));
    });
for(const which of ['primary','secondary']) test('async add on '+which+' holds old page until one valid callback',()=>{
    const f=fixture(), v=f[which], other=f[which==='primary'?'secondary':'primary'];
    const untouched=other.sceneController, previous=v.sceneController;
    const token=f.start(v);assert.equal(token.view,v);assert.equal(token.pageId,v.currentPageId);
    for(let i=0;i<5;++i)f.host.transitionAdvance();
    assert.equal(f.host.transitionPhase,'loading');assert(f.host.inputGeometryPending);
    assert.equal(v.sceneController,previous);assert(!f.events.includes('publish'));
    assert(!f.host.pageOperation(v,()=>assert.fail('pending add must block another page operation')));
    assert(f.complete(v));assert.equal(f.host.pagePendingAdd,null);
    assert.equal(f.host.transitionAfter.find(r=>r.view===v).controller,v.sceneController);
    assert.equal(other.sceneController,untouched);assert.equal(f.host.secondary,f.secondary);
    assert(!f.host.pageAddComplete(token,()=>assert.fail('duplicate callback')));
    f.finish();assert.equal(f.host.transitionPhase,'idle');assert.equal(f.events.filter(e=>e==='native-select').length,1);
});
test('native callback may complete synchronously inside the original applying phase',()=>{
    const f=fixture();f.start(f.secondary,1,true);
    assert(!f.host.transitionApplying);assert.equal(f.host.pagePendingAdd,null);
    assert.equal(f.host.transitionAfter.find(r=>r.view===f.secondary).controller,f.secondary.sceneController);
    f.finish();assert.equal(f.host.transitionPhase,'idle');
});
for(const kind of ['page','controller','handler','document','closed','owner','generation','owner-generation','park','geometry','availability','failed'])
    test('stale async '+kind+' rejects callback before native mutation',()=>{
        const f=fixture(), token=f.start();f.insert();
        if(kind==='page')f.secondary.currentPageId='different';
        if(kind==='controller')f.secondary.sceneController={};
        if(kind==='handler')f.secondary.penHandler={};
        if(kind==='document')f.secondary.document={...f.secondary.document};
        if(kind==='closed')f.secondary.document=null;
        if(kind==='owner')f.host.secondary=f.view('other');
        if(kind==='generation')++f.host.transitionGeneration;
        if(kind==='owner-generation')++f.host.openGeneration;
        if(kind==='park')f.gate.phase='ready';
        if(kind==='geometry')f.host.inputGeometryPending=false;
        if(kind==='availability')f.host.transitionAvailabilityLost=true;
        if(kind==='failed')f.host.transitionPhase='failed';
        let called=0;assert(!f.host.pageAddComplete(token,()=>++called));
        assert.equal(called,0);assert.equal(f.host.transitionPhase,'failed');assert(!f.events.includes('publish'));
        assert(!f.host.pageAddComplete(token,()=>++called));assert.equal(called,0);
    });
test('an obsolete token cannot consume or change a newer pending token',()=>{
    const f=fixture(), old=f.start();assert(f.complete());f.finish();
    const next=f.start(f.secondary,2);
    assert(!f.host.pageAddComplete(old,()=>assert.fail('obsolete callback')));
    assert.equal(f.host.pagePendingAdd,next);assert(!next.used);
});
for(const kind of ['no-add','wrong-index','two-adds','removed-old','duplicate','empty'])
    test('callback validates newly added page map: '+kind,()=>{
        const f=fixture(), token=f.start();
        if(kind==='wrong-index')f.secondary.document.pages.push('new');
        if(kind==='two-adds')f.secondary.document.pages.splice(1,0,'new','new2');
        if(kind==='removed-old')f.secondary.document.pages.splice(0,2,'replacement','new','another');
        if(kind==='duplicate')f.secondary.document.pages.splice(1,0,f.secondary.document.pages[0]);
        if(kind==='empty')f.secondary.document.pages.splice(1,0,'');
        let called=false;assert(!f.host.pageAddComplete(token,()=>{called=true;}));
        assert(!called);assert.equal(f.host.transitionPhase,'failed');assert(!f.events.includes('publish'));
    });
test('a callback selecting the wrong page fails without reopening input',()=>{
    const f=fixture(),token=f.start();f.insert();
    assert(!f.host.pageAddComplete(token,()=>{}));
    assert.equal(f.host.transitionPhase,'failed');assert(!f.host.transitionApplying);assert(!f.events.includes('publish'));
});
test('callback exceptions restore applying flag and fail closed',()=>{
    const f=fixture(),token=f.start();f.insert();
    assert(!f.host.pageAddComplete(token,()=>{throw new Error('native error');}));
    assert(!f.host.transitionApplying);assert.equal(f.host.transitionPhase,'failed');assert(!f.events.includes('publish'));
});
test('a native add that never calls back uses the existing transaction timeout',()=>{
    const f=fixture();f.start();for(let i=0;i<121;++i)f.host.transitionAdvance();
    assert.equal(f.host.transitionPhase,'failed');assert(!f.timer.running);assert(!f.events.includes('publish'));
});
test('owner loss while waiting is caught by the advance gate before publication',()=>{
    const f=fixture();f.start();f.host.secondary=null;f.host.transitionAdvance();
    assert.equal(f.host.transitionPhase,'failed');assert(!f.events.includes('publish'));
});
test('parked add cannot start with invalid index or without a native park',()=>{
    const f=fixture();assert.equal(f.host.pageAddBegin(f.secondary,1),null);
    assert.equal(f.host.transitionPhase,'failed');
    const g=fixture();assert(g.host.pageOperation(g.secondary,()=>{
        assert.equal(g.host.pageAddBegin(g.secondary,NaN),null);
    }));g.ack();assert.equal(g.host.pagePendingAdd,null);assert.equal(g.host.transitionPhase,'failed');
    assert(!g.events.includes('publish'));
});
test('synchronous callback refusal is not overwritten by applyTransition loading',()=>{
    const f=fixture();let called=false;
    assert(f.host.pageOperation(f.secondary,()=>{
        const token=f.host.pageAddBegin(f.secondary,1);
        assert(!f.host.pageAddComplete(token,()=>{called=true;})); // Native add did not produce a page.
    }));f.ack();
    for(let i=0;i<125;++i)f.host.transitionAdvance();
    assert(!called);assert.equal(f.host.transitionPhase,'failed');assert(!f.timer.running);
    assert(!f.events.includes('publish'));assert(!f.events.includes('finish'));
});
test('a nested invalid add is not overwritten by the outer applying phase',()=>{
    const f=fixture();
    assert(f.host.pageOperation(f.secondary,()=>{
        f.host.pageOperation(f.secondary,()=>f.host.pageAddBegin(f.secondary,-1));
    }));f.ack();for(let i=0;i<125;++i)f.host.transitionAdvance();
    assert.equal(f.host.transitionPhase,'failed');assert(!f.timer.running);
    assert(!f.events.includes('publish'));assert(!f.events.includes('finish'));
});
test('transaction adapter preserves synchronous add refusal even outside pageOperation wrapper',()=>{
    const f=fixture();let called=false;
    assert(f.host.requestTransition('page-test',()=>{
        const token=f.host.pageAddBegin(f.secondary,1);
        assert(!f.host.pageAddComplete(token,()=>{called=true;}));
    }));f.ack();
    assert.equal(f.host.transitionPhase,'failed');
    for(let i=0;i<125;++i)f.host.transitionAdvance();
    assert(!called);assert.equal(f.host.transitionPhase,'failed');assert(!f.timer.running);
    assert(!f.events.includes('publish'));assert(!f.events.includes('finish'));
});
