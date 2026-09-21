const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('native/pen-refresh.qml.inc','utf8');
const fn=source.slice(source.indexOf('function cnInputGeometryReadiness'));
function fixture() {
    const calls=[], strokeHandler={};
    const root={tileManager:{},sceneView:{},isLoading:false,adjustViewActive:false,
        cnInkAllowed:false,cnLayoutBusy:true,cnGeometryHidden:false,cnGeometryAttached:false};
    const manager={updateRegions(){calls.push(['regions',root.cnGeometryHidden,root.cnGeometryAttached]);}};
    root.penInput={surfaceManager:manager};
    const inputSurface={get handler(){return root.cnGeometryAttached?strokeHandler:null;},
        updateTransform(){assert(root.cnGeometryHidden);assert(root.cnGeometryAttached);assert.equal(root.penInput.surfaceManager,manager);calls.push(['transform']);}};
    const c={root,inputSurface,strokeHandler};vm.createContext(c);vm.runInContext(fn,c);
    return {c,root,calls,inputSurface};
}
test('refresh keeps manager, hides before attach, refreshes, then detaches before unhide',()=>{
    const f=fixture();assert.equal(f.c.cnUpdateInputGeometry(),true);
    assert.deepEqual(f.calls,[['regions',true,false],['transform'],['regions',true,false],['regions',false,false]]);
    assert.equal(f.root.cnGeometryHidden,false);assert.equal(f.root.cnGeometryAttached,false);
});
test('refresh refuses open ink and unsafe or unavailable geometry',()=>{
    for(const mutate of [r=>r.cnInkAllowed=true,r=>r.cnLayoutBusy=false,r=>r.isLoading=true,
        r=>r.adjustViewActive=true,r=>r.tileManager=null,r=>r.sceneView=null,r=>r.penInput.surfaceManager=null]) {
        const f=fixture();mutate(f.root);assert.equal(f.c.cnUpdateInputGeometry(),false);assert.equal(f.calls.length,0);
    }
});
test('native transform failure detaches handler and retains closed ink eligibility',()=>{
    const f=fixture();f.inputSurface.updateTransform=()=>{throw new Error('transform rejected');};
    assert.throws(()=>f.c.cnUpdateInputGeometry(),/transform rejected/);
    assert.equal(f.root.cnGeometryAttached,false);assert.equal(f.root.cnInkAllowed,false);
    assert.deepEqual(f.calls,[['regions',true,false],['regions',true,false],['regions',false,false]]);
});
