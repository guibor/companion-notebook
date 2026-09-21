const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('native/navigation.qml.inc','utf8');
const functions=source.slice(source.indexOf('function cnConstrainToPane'),source.indexOf('// Scrollbar'));
function fixture({width=1620,height=700,scale=1,bounds={x:-810,y:0,width:1620,height:2160},top={x:-810,y:0}}={}) {
    const calls=[];
    const c={cnPaired:true,cnLayoutBusy:false,cnConstraining:false,sceneView:{},
        width,height,exteriorBoundary:bounds,Qt:{point:(x,y)=>({x,y})},
        updateScrollbars(){calls.push('scrollbars');},
        tileManager:{scale,viewToScene(){return {...top};},moveViewBy(d){calls.push(d);top.x-=d.x/scale;top.y-=d.y/scale;}}};
    vm.createContext(c);vm.runInContext(functions,c);
    return {c,calls,top};
}
test('clipped pane can reach bottom of a full-size page at unchanged scale',()=>{
    const f=fixture();
    for(let i=0;i<6;i++)f.c.cnJump(-1);
    assert.equal(f.top.y,1460);assert.equal(f.top.y+f.c.height/f.c.tileManager.scale,2160);
    assert.equal(f.c.tileManager.scale,1);
    assert.equal(f.c.height,700);
});
test('both independent panes, all allowed reveals and zooms reach the page bottom',()=>{
    for(const height of [112,248,360,700,1080,1800,2160])for(const scale of [.5,1,1.7,5]) {
        const f=fixture({height,scale});
        for(let i=0;i<150;i++)f.c.cnJump(-1);
        assert(Math.abs(f.top.y-Math.max(0,2160-height/scale))<1e-7);
        for(let i=0;i<150;i++)f.c.cnJump(1);
        assert(Math.abs(f.top.y)<1e-7);
        assert.equal(f.c.tileManager.scale,scale);
    }
});
test('native content beyond original paper is included in navigation',()=>{
    const f=fixture({bounds:{x:-810,y:-100,width:1620,height:12000},top:{x:-810,y:99999}});
    f.c.cnConstrainToPane();assert.equal(f.top.y,11200);
});
test('narrow pages are centered and wide pages are horizontally bounded',()=>{
    const narrow=fixture({scale:.5});narrow.c.cnConstrainToPane();assert.equal(narrow.top.x,-1620);
    const wide=fixture({scale:2,top:{x:10000,y:0}});wide.c.cnConstrainToPane();assert.equal(wide.top.x,0);
});
test('no transform changes during sheet drag or outside pairing',()=>{
    const f=fixture({top:{x:0,y:99999}});
    f.c.cnLayoutBusy=true;f.c.cnConstrainToPane();assert.equal(f.c.cnJump(-1),false);
    f.c.cnLayoutBusy=false;f.c.cnPaired=false;f.c.cnConstrainToPane();assert.equal(f.c.cnJump(-1),false);
    assert.equal(f.calls.length,0);
});
test('invalid geometry and reentrant clamp never move native view',()=>{
    for(const change of [c=>c.height=0,c=>c.tileManager.scale=0,c=>c.tileManager.scale=NaN,
        c=>c.exteriorBoundary=null,c=>c.cnConstraining=true,c=>c.tileManager=null]) {
        const f=fixture();change(f.c);f.c.cnConstrainToPane();assert.equal(f.calls.length,0);
    }
});
test('native move failure releases the reentrancy guard',()=>{
    const f=fixture({top:{x:0,y:99999}});
    f.c.tileManager.moveViewBy=()=>{throw new Error('native failure');};
    assert.throws(()=>f.c.cnConstrainToPane(),/native failure/);assert.equal(f.c.cnConstraining,false);
});
