const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Store=require('../src/PairStore.js');
function functions(path) {
    const source=fs.readFileSync(path,'utf8'); let result='';
    for(const match of source.matchAll(/^function \w+\([^\n]*\) \{/gm)) {
        const start=match.index; let i=source.indexOf('{',start), depth=1;
        for(++i;depth;++i) { if(source[i]==='{')depth++; if(source[i]==='}')depth--; }
        result+=source.slice(start,i)+'\n';
    }
    return result;
}
function store(text) {
    const state={Store,quickPadSettings:{quickPadJson:text,sync(){state.syncs++;}},syncs:0,quickPadId:'',quickPadCorner:'right',quickPadSize:'wide',quickPadStoreReady:false,error:''};
    vm.createContext(state);vm.runInContext(functions('native/quick-pad.qml.inc'),state);return state;
}
test('Quick Pad settings reject corruption without overwriting persisted text',()=>{
    for(const text of ['{',JSON.stringify({version:2,document:'',corner:'right'}),JSON.stringify({version:1,document:'oops',corner:'left'}),JSON.stringify({version:1,document:'',corner:'top'}),'x'.repeat(1025)]) {
        const s=store(text);s.loadQuickPad();assert.equal(s.quickPadStoreReady,false);assert(s.error);
        assert.equal(s.saveQuickPad('','right'),false);assert.equal(s.quickPadSettings.quickPadJson,text);assert.equal(s.syncs,0);
    }
});
test('settings migrate old corner-only records and persist validated size',()=>{
    const s=store('{"version":1,"document":"","corner":"right"}');s.loadQuickPad();assert(s.quickPadStoreReady);
    assert.equal(s.quickPadSize,'wide');assert.equal(s.syncs,0);
    assert.equal(s.saveQuickPad('','right','gigantic'),false);
    assert(s.saveQuickPad('22222222-2222-4222-8222-222222222222','left'));
    const next=store(s.quickPadSettings.quickPadJson);next.loadQuickPad();assert.equal(next.quickPadCorner,'left');assert.equal(next.quickPadId,s.quickPadId);
    assert.deepEqual(Object.keys(JSON.parse(s.quickPadSettings.quickPadJson)).sort(),['corner','document','size','version']);
    assert(s.saveQuickPad(s.quickPadId,'right','roomy'));
    const roomy=store(s.quickPadSettings.quickPadJson);roomy.loadQuickPad();assert.equal(roomy.quickPadSize,'roomy');
});
function fit(change={}) {
    const s={cnLayoutBusy:true,cnAdmissionInputsDetached:()=>true,isLoading:false,width:1620,cnInputHeight:2068,exteriorBoundary:{x:-810,y:0,width:1620,height:2160},Qt:{point:(x,y)=>({x,y})},calls:[]};
    s.tileManager={setFocalPoint:(p,scale)=>s.calls.push({p,scale})};Object.assign(s,change);
    vm.createContext(s);vm.runInContext(functions('native/quick-pad-fit.qml.inc'),s);return s;
}
test('fit width never shrinks long pages and starts within vertical bounds',()=>{
    for(const height of [2160,6000,12000]) {
        const s=fit({exteriorBoundary:{x:-810,y:-150,width:1620,height}});assert(s.cnFitQuickPad());
        assert.equal(s.calls[0].p.x,0);assert.equal(s.calls[0].p.y,-150+2068/.96/2);
        assert.equal(s.calls[0].scale,.96);
    }
});
test('fit width preserves a valid saved vertical focus',()=>{
    const s=fit({width:1080,cnInputHeight:720,exteriorBoundary:{x:-810,y:0,width:1620,height:12000}});
    s.tileManager.center={x:100,y:8000};assert(s.cnFitQuickPad());
    assert.equal(s.calls[0].p.y,8000);assert(Math.abs(s.calls[0].scale-.64)<1e-12);
});
test('warm width fit is a no-op but real zoom and center changes still refit',()=>{
    const s=fit({width:1080,cnInputHeight:720});
    assert(s.cnFitQuickPad());const first=s.calls[0];
    s.tileManager.center=first.p;s.tileManager.scale=first.scale;
    assert(s.cnFitQuickPad());assert.equal(s.calls.length,1);
    s.tileManager.scale+=1e-7;
    assert(s.cnFitQuickPad());assert.equal(s.calls.length,1);
    s.tileManager.scale=1;
    assert(s.cnFitQuickPad());assert.equal(s.calls.length,2);
    s.tileManager.scale=first.scale;s.tileManager.center={x:20,y:first.p.y};
    assert(s.cnFitQuickPad());assert.equal(s.calls.length,3);
});
test('generated pad clamp exposes blank tail only in the pad notebook',()=>{
    const q=fs.readFileSync('build/quick-pad-composed-last/qml/device/view/documentview/Navigation.qml','utf8');
    const from=q.indexOf('function cnConstrainToPane('),to=q.indexOf('function cnJump(',from);
    const code=q.slice(from,to);
    for(const pad of [false,true])for(const note of [false,true]) {
        let top={x:-810,y:1e6};
        const s={cnAdmissionLocked:false,cnPaired:true,cnLayoutBusy:false,cnConstraining:false,cnQuickPad:pad,notePage:note,sceneView:{},width:1080,height:720,exteriorBoundary:{x:-810,y:0,width:1620,height:2160},Qt:{point:(x,y)=>({x,y})}};
        s.tileManager={scale:2/3,viewToScene:()=>top,moveViewBy:d=>{top={x:top.x-d.x/(2/3),y:top.y-d.y/(2/3)}}};
        vm.createContext(s);vm.runInContext(code,s);s.cnConstrainToPane();
        assert(Math.abs(top.y-(2160-1080*(pad&&note?.2:1)))<1e-6);
        if(pad&&note) { s.exteriorBoundary.height=3000;top.y=1e6;s.cnConstrainToPane();assert(Math.abs(top.y-2784)<1e-6); }
    }
});
test('fit refuses invalid geometry, live input and loading without moving native view',()=>{
    for(const c of [{cnLayoutBusy:false},{cnAdmissionInputsDetached:()=>false},{isLoading:true},{tileManager:null},{width:0},{cnInputHeight:0},{exteriorBoundary:{x:0,y:0,width:Infinity,height:20}},{exteriorBoundary:{x:NaN,y:0,width:20,height:20}}]) {
        const s=fit(c);assert.equal(s.cnFitQuickPad(),false);assert.equal(s.calls.length,0);
    }
});
test('native bridge always opens the current last page and rejects an ineligible pad',()=>{
    const source=fs.readFileSync('ops/quick-pad-build.mjs','utf8');
    const start=source.indexOf('function openPadView(');
    const body=source.slice(start,source.indexOf('\n}',start)+2);
    for(const count of [1,7,42]) {
        const entry={pageCount:count,lastOpenedPage:0};let opened=-1;
        const c={Library:{entryForId:()=>entry},canOpenPad:()=>true};vm.createContext(c);vm.runInContext(body,c);
        c.openPadView({openDocumentOnPage:(e,index)=>{assert.equal(e,entry);opened=index;}},'pad');
        assert.equal(opened,count-1);
        c.canOpenPad=()=>false;assert.throws(()=>c.openPadView({},'pad'),/unavailable/);
    }
});
test('actual generated ink gate excludes a tucked secondary but enables the source',()=>{
    const source=fs.readFileSync('build/quick-pad-composed-last/qml/device/view/documentview/DocumentView.qml','utf8');
    const expr=source.match(/readonly\s+property\s+bool\s+cnInkAllowed:\s*([^\n]+)/)[1];
    for(const secondary of [false,true])for(const paired of [false,true])for(const pending of [false,true]) {
        const c={cnHost:{inputGeometryPending:pending,inkQualified:true},cnSecondary:secondary,cnPaired:paired};
        assert.equal(vm.runInNewContext(expr,c),!pending&&(!secondary||paired));
    }
});
test('hidden toolbar cannot publish capacity, including a queued callback after owner assignment',()=>{
    const source=fs.readFileSync('build/quick-pad-composed-last/qt/qml/xofm/libs/toolbar/qml/Toolbar.qml','utf8');
    const start=source.indexOf('function cnPublishToolbarCapacity(');
    let end=source.indexOf('{',start)+1,depth=1;
    while(depth) { if(source[end]==='{')depth++; if(source[end]==='}')depth--; end++; }
    const queued=[],calls=[];
    const c={cnDocumentViewOwner:null,showableToolsCount:15,Qt:{callLater:fn=>queued.push(fn)},toolbarProvider:{updateToolbarTools:n=>calls.push(n)}};
    c.root=c;vm.createContext(c);vm.runInContext(source.slice(start,end),c);
    c.cnPublishToolbarCapacity();c.cnDocumentViewOwner={cnSecondary:true};queued.shift()();assert.deepEqual(calls,[]);
    c.cnPublishToolbarCapacity();assert.equal(queued.length,0);
    c.cnDocumentViewOwner={cnSecondary:false};c.cnPublishToolbarCapacity();queued.shift()();assert.deepEqual(calls,[15]);
    assert.match(source,/onShowableToolsCountChanged:\s*\{\s*cnPublishToolbarCapacity\(\)/);
});
