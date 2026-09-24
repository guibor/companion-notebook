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
    const state={Store,settings:{quickPadJson:text,sync(){state.syncs++;}},syncs:0,quickPadId:'',quickPadCorner:'right',quickPadStoreReady:false,error:''};
    vm.createContext(state);vm.runInContext(functions('native/quick-pad.qml.inc'),state);return state;
}
test('Quick Pad settings reject corruption without overwriting persisted text',()=>{
    for(const text of ['{',JSON.stringify({version:2,document:'',corner:'right'}),JSON.stringify({version:1,document:'oops',corner:'left'}),JSON.stringify({version:1,document:'',corner:'top'}),'x'.repeat(1025)]) {
        const s=store(text);s.loadQuickPad();assert.equal(s.quickPadStoreReady,false);assert(s.error);
        assert.equal(s.saveQuickPad('','right'),false);assert.equal(s.settings.quickPadJson,text);assert.equal(s.syncs,0);
    }
});
test('settings roundtrip contains only document identity and preferred corner',()=>{
    const s=store('{"version":1,"document":"","corner":"right"}');s.loadQuickPad();assert(s.quickPadStoreReady);
    assert(s.saveQuickPad('22222222-2222-4222-8222-222222222222','left'));
    const next=store(s.settings.quickPadJson);next.loadQuickPad();assert.equal(next.quickPadCorner,'left');assert.equal(next.quickPadId,s.quickPadId);
    assert.deepEqual(Object.keys(JSON.parse(s.settings.quickPadJson)).sort(),['corner','document','version']);
});
function fit(change={}) {
    const s={cnLayoutBusy:true,cnAdmissionInputsDetached:()=>true,isLoading:false,width:1620,cnInputHeight:2068,exteriorBoundary:{x:-810,y:0,width:1620,height:2160},Qt:{point:(x,y)=>({x,y})},calls:[]};
    s.tileManager={setFocalPoint:(p,scale)=>s.calls.push({p,scale})};Object.assign(s,change);
    vm.createContext(s);vm.runInContext(functions('native/quick-pad-fit.qml.inc'),s);return s;
}
test('fit uses whole page, padding and native focal point for normal and long pages',()=>{
    for(const height of [2160,6000,12000]) {
        const s=fit({exteriorBoundary:{x:-810,y:-150,width:1620,height}});assert(s.cnFitQuickPad());
        assert.equal(s.calls[0].p.x,0);assert.equal(s.calls[0].p.y,-150+height/2);
        assert(s.calls[0].scale*height<=2068);assert(s.calls[0].scale*1620<=1620);
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
