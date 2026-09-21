const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('native/geometry-check.qml.inc','utf8');
function fixture() {
    let top=0;
    const initialCenter={x:0,y:1080};
    const calls=[];
    const tm={scale:1,viewportSize:{width:1620,height:2160},center:initialCenter,
        viewToScene:p=>({x:p.x,y:top+p.y}),setFocalPoint:(p,s)=>calls.push(['restore',p,s])};
    const root={cnPaired:true,cnInkAllowed:false,tileManager:tm,sceneView:{limitScrollingToPaper:false},cnInputHeight:700,exteriorBoundary:{x:-810,y:0,width:1620,height:2160}};
    const nav={height:700,cnLayoutBusy:true,cnJump:d=>{top=Math.max(0,Math.min(1460,top-d*560));return true;}};
    const c={root,sceneNavigation:nav,Qt:{point:(x,y)=>({x,y})},console:{log:s=>calls.push(['log',s])},
        cnUpdateInputGeometry:()=>{calls.push(['refresh']);return true;}};
    vm.createContext(c);vm.runInContext(source,c);
    return {c,root,tm,nav,calls};
}
test('geometry diagnostic restores exact focal point and gesture lock on success',()=>{
    const f=fixture();assert.equal(f.c.cnProbePaneGeometry(),true);
    assert.equal(f.nav.cnLayoutBusy,true);
    assert.deepEqual(f.calls.slice(-2),[['restore',{x:0,y:1080},1],['refresh']]);
});
test('geometry diagnostic rejects stock-clamped bottom and restores state',()=>{
    const f=fixture();f.nav.cnJump=()=>true;
    assert.throws(()=>f.c.cnProbePaneGeometry(),/Page bottom unreachable/);
    assert.equal(f.nav.cnLayoutBusy,true);assert.equal(f.calls.at(-1)[0],'restore');
    assert(!f.calls.some(c=>c[0]==='refresh'));
});
test('geometry diagnostic rejects changed scale, missing bounds, live ink and absent views',()=>{
    for(const mutate of [f=>f.root.cnInkAllowed=true,f=>f.root.sceneView=null,
        f=>f.nav.height=600,f=>f.root.sceneView.limitScrollingToPaper=true]) {
        const f=fixture();mutate(f);assert.equal(f.c.cnProbePaneGeometry(),false);assert.equal(f.calls.length,0);
    }
    const f=fixture(), old=f.nav.cnJump;f.nav.cnJump=d=>{old(d);f.tm.scale=2;return true;};
    assert.throws(()=>f.c.cnProbePaneGeometry(),/changed scale/);assert.equal(f.calls.at(-1)[0],'restore');
});
test('geometry rejects nonfinite native inputs before any movement or restoration',()=>{
    for (const value of [NaN,Infinity,-Infinity,undefined,"1"]) {
        for (const mutate of [f=>f.tm.scale=value,f=>f.tm.viewportSize.width=value,
            f=>f.tm.viewportSize.height=value,f=>f.tm.center.x=value,f=>f.tm.center.y=value,
            f=>f.nav.height=value,f=>f.root.cnInputHeight=value,f=>f.root.exteriorBoundary.x=value,
            f=>f.root.exteriorBoundary.y=value,f=>f.root.exteriorBoundary.width=value,f=>f.root.exteriorBoundary.height=value]) {
            const f=fixture();mutate(f);assert.equal(f.c.cnProbePaneGeometry(),false);assert.equal(f.calls.length,0);
        }
    }
});
test('geometry rejects nonfinite edge mappings and refused jumps without success marker',()=>{
    for (const value of [NaN,Infinity,-Infinity,undefined]) {
        const f=fixture();f.tm.viewToScene=()=>({x:0,y:value});
        assert.throws(()=>f.c.cnProbePaneGeometry(),/unreachable/);
        assert.equal(f.nav.cnLayoutBusy,true);assert.equal(f.calls.at(-1)[0],'restore');
        assert(!f.calls.some(c=>c[0]==='log'||c[0]==='refresh'));
    }
    for (const refusal of [false,undefined]) {
        const f=fixture();f.nav.cnJump=()=>refusal;
        assert.throws(()=>f.c.cnProbePaneGeometry(),/jump refused/);
        assert.equal(f.nav.cnLayoutBusy,true);assert.equal(f.calls.at(-1)[0],'restore');
        assert(!f.calls.some(c=>c[0]==='log'||c[0]==='refresh'));
    }
});
test('geometry controller keeps exact recovery and cannot accept structural marker',()=>{
    const {execFileSync}=require('node:child_process');
    execFileSync(process.execPath,['ops/build-render-controller.mjs'],{env:{...process.env,CN_PROBE:'geometry'}});
    const out=fs.readFileSync('build/geometry-native/probe.sh','utf8'), base=fs.readFileSync('ops/probe-pro329.sh','utf8');
    const recovery=s=>s.slice(s.indexOf('cleanup_host() {'),s.indexOf('# Watchdog retry accounting'));
    assert.equal(recovery(out),recovery(base));
    assert.match(out,/mark geometry-machine-passed/);
    assert.match(out,/geometry sequence and return completed; ink=false; capture=not-attempted; visual=unverified/);
    assert.doesNotMatch(out,/structural sequence and return completed/);
    execFileSync('/bin/bash',['-n','build/geometry-native/probe.sh']);
});
