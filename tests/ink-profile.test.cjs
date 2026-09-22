const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const driver=fs.readFileSync('native/ink-probe.qml.inc','utf8');
const controller=fs.readFileSync('build/ink-native/probe.sh','utf8');
function body(source,anchor) {
    const start=source.indexOf(anchor);assert(start>=0,anchor);
    const open=source.indexOf('{',start);let depth=1,end=open+1;
    for(;depth&&end<source.length;end++){if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
    assert.equal(depth,0);return source.slice(open+1,end-1);
}
function fixture() {
    const logs=[],calls=[],rect={x:10,y:20,width:300,height:50};
    const view=id=>({document:{id},cnProbeScene:{},sceneController:{},ready:true,
        cnProbeExpectedBounds(){return rect;},cnProbePreparePen(){calls.push('pen:'+id);return true;}});
    const primary=view('first'),secondary=view('second');
    const host={probePhase:0,probeTicks:0,probeDocumentLocked:false,probeWriting:false,probeFailure:'',
        probeDocuments:[],probeViews:[],probeScenes:[],probeControllers:[],probeCounts:[0,0],probeSettledTicks:0,
        width:1620,height:2160,revealHeight:0,inputGeometryPending:false,
        dragging:false,restoring:false,secondarySelected:false,secondary,penDown:false,error:'',
        synchronizePrimary(){},pick(){return true;}};
    const bridge={primary,probeMayStart:true,probeReadinessReason:'ready',viewReady:v=>v.ready,
        probeSeparate:()=>bridge.primary===primary&&host.secondary===secondary&&primary.document.id==='first'&&secondary.document.id==='second',
        probeCreate(){calls.push('create');return ['first','second'];}};
    const c={host,bridge,console:{log:s=>logs.push(s),warn:s=>logs.push(s)},running:true};
    c.stop=()=>{c.running=false;};c.inkProbeTimer={stop:c.stop};
    for(const key of Object.keys(host))Object.defineProperty(c,key,{get:()=>host[key],set:value=>{host[key]=value;},configurable:true});
    vm.createContext(c);
    for(const [name,args] of [['probeFail','reason'],['probeStable',''],['probeAllows','view'],['probeSubmitted','view,stroke']]) {
        host[name]=vm.runInContext('(function('+args+'){'+body(driver,'function '+name+'(')+'})',c);
        Object.defineProperty(c,name,{get:()=>host[name],configurable:true});
    }
    const tick=()=>vm.runInContext('(function(){'+body(driver,'onTriggered:')+'})()',c);
    const arm=()=>{for(let i=0;i<5&&host.probePhase<4&&c.running;i++)tick();assert.equal(host.probePhase,4,host.probeFailure);};
    const stroke=()=>({pointCount:31,boundingRect:{...rect}});
    return {host,bridge,primary,secondary,calls,logs,tick,arm,c,stroke};
}
test('ink driver enables both exact native views without selection, not foreign views',()=>{
    const f=fixture();assert(!f.host.probeAllows(f.primary));f.arm();
    assert(f.host.probeDocumentLocked);assert(!f.host.secondarySelected);
    assert(f.host.probeAllows(f.primary));assert(f.host.probeAllows(f.secondary));assert(!f.host.probeAllows({}));
    assert.deepEqual(f.calls,['create','pen:first','pen:second']);
});
test('ink driver checks both submissions then closes future ink and reports no durability claim',()=>{
    const f=fixture();f.arm();
    f.host.probeSubmitted(f.primary,f.stroke());f.tick();assert.equal(f.host.probePhase,4);
    f.host.penDown=true;f.host.probeSubmitted(f.secondary,f.stroke());f.tick();assert.equal(f.host.probePhase,4);
    f.host.penDown=false;f.tick();assert.equal(f.host.probePhase,5);assert(!f.host.probeWriting);
    for(let i=0;i<100;i++)f.tick();assert.equal(f.host.probePhase,6);assert(!f.c.running);
    assert(f.logs.at(-1).endsWith('panes=2; durable=unverified'));
    assert.equal(f.bridge.primary,f.primary);assert.equal(f.host.secondary,f.secondary);
});
test('native autosave loading is not confused with a foreign or replaced document',()=>{
    const f=fixture();f.arm();f.bridge.probeReadinessReason='document-loading';
    assert(f.host.probeAllows(f.secondary));f.tick();assert(!f.host.probeFailure);
});
test('ink does not arm during loading, pending geometry or physical pen activity',()=>{
    for(const change of [f=>f.primary.ready=false,f=>f.host.inputGeometryPending=true]) {
        const f=fixture();f.tick();f.tick();f.tick();change(f);f.tick();assert(!f.host.probeWriting);assert.equal(f.host.probePhase,3);
    }
    const f=fixture();f.host.penDown=true;f.tick();assert.match(f.host.probeFailure,/physical pen/);assert.equal(f.calls.length,0);
});
for(const [name,change] of [
    ['foreign document',f=>f.primary.document.id='foreign'],
    ['replaced scene',f=>f.secondary.cnProbeScene={}],
    ['replaced controller',f=>f.primary.sceneController={}],
    ['replaced view',f=>f.host.secondary={}],
    ['pane movement',f=>f.host.revealHeight=1000],
    ['orientation',f=>f.host.height=1620],
    ['drag',f=>f.host.dragging=true],
    ['restore',f=>f.host.restoring=true],
    ['selected pane',f=>f.host.secondarySelected=true],
    ['screen locked',f=>f.bridge.probeReadinessReason='locked']
])test('ink closes future gate without restoring personal view after '+name,()=>{
    const f=fixture();f.arm();change(f);f.tick();assert(f.host.probeFailure);assert(!f.host.probeWriting);assert(!f.c.running);
    assert(!f.calls.includes('restore'));assert(f.host.probeDocumentLocked);
});
test('ink rejects duplicate, foreign, empty, excessive or wrongly mapped submissions',()=>{
    for(const variant of ['duplicate','foreign','empty','excessive','mapping','nan']) {
        const f=fixture();f.arm();const stroke=f.stroke();let view=f.primary;
        if(variant==='duplicate')f.host.probeSubmitted(view,stroke);
        if(variant==='foreign')view={};
        if(variant==='empty')stroke.pointCount=0;
        if(variant==='excessive')stroke.pointCount=501;
        if(variant==='mapping')stroke.boundingRect.y+=31;
        if(variant==='nan')stroke.boundingRect.x=NaN;
        f.host.probeSubmitted(view,stroke);assert(f.host.probeFailure,variant);assert(!f.host.probeWriting);
    }
});
test('fixed ink diagnostic remains bounded if no native stroke arrives',()=>{
    const f=fixture();f.arm();for(let i=0;i<1100&&f.c.running;i++)f.tick();
    assert.match(f.host.probeFailure,/timed out/);assert(!f.host.probeWriting);
});
test('ink recovery performs independent release before base changes with finite restart budgets',()=>{
    const recover=controller.slice(controller.indexOf('recover() {'),controller.indexOf('# Watchdog retry accounting'));
    assert(recover.indexOf('systemctl stop "$OWNER"')<recover.indexOf('owner_cgroup_empty || return 1'));
    assert(recover.indexOf('owner_cgroup_empty || return 1')<recover.indexOf('release_injected_pen || return 1'));
    assert(recover.indexOf('release_injected_pen || return 1')<recover.indexOf('verify_device || return 1'));
    assert(recover.indexOf('release_injected_pen || return 1')<recover.indexOf('systemctl stop xochitl.service'));
    for(const marker of ['base-start-attempted','stock-start-attempted','watch-attempts'])assert(controller.includes(marker));
    assert.match(controller,/RuntimeMaxSec=420/);assert.match(controller,/MemoryMax=1073741824/);
    assert.match(controller,/mark deadline "\$\(\( \$\(stamp\) \+ 180 \)\)"/);
    assert.match(controller,/mark ink-submission-machine-passed/);
    assert(controller.includes('mark owner "$$ $(awk \'{print $22}\' /proc/$$/stat)"'), 'Generated shell must retain real owner PID, not JS replacement-dollar escapes');
    assert.doesNotMatch(controller,/mount\s+-o\s+remount|\/boot\/|\/dev\/mmc|\.local\/share\/remarkable\/xochitl/);
    assert(controller.indexOf('mark pen-injection-started "$probe_pid"\nsync')<controller.indexOf('"$S/ink-events" draw'));
    assert.equal(spawnSync('/bin/bash',['-n','build/ink-native/probe.sh']).status,0);
});
test('actual recovery refuses a surviving event-writer even with MainPID zero',()=>{
    const recovery=controller.slice(controller.indexOf('recover() {'),controller.indexOf('# Watchdog retry accounting'));
    const script=`set -Eeuo pipefail
OWNER=owner; B=/unused
mark() { :; }
systemctl() { return 1; }
pid() { printf 0; }
owner_cgroup_empty() { return 1; }
release_injected_pen() { printf 'UNSAFE_RELEASE\\n'; }
verify_device() { printf 'UNSAFE_RESTART_PATH\\n'; return 1; }
${recovery}
if recover test; then printf 'unexpected success\\n'; else printf 'refused\\n'; fi
`;
    const r=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
    assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,'refused\n');
});
test('cgroup emptiness checks descendants, unit state and recorded exact path',()=>{
    const check=controller.slice(controller.indexOf('owner_cgroup_empty() {'),controller.indexOf('release_injected_pen() {'));
    for(const scenario of ['empty','gone','populated','unknown','active','foreign']) {
        const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-cgroup-'));
        try {
            fs.writeFileSync(path.join(dir,'owner-cgroup'),'/system.slice/owner');
            const script=`set -Eeuo pipefail
B=${JSON.stringify(dir)}; OWNER=owner
findmnt() { printf cgroup2; }
readlink() { printf '%s' "$2"; }
systemctl() { case "$3" in ActiveState) printf '${scenario==='active'?'active':'inactive'}';; ControlGroup) printf '${scenario==='foreign'?'/foreign':'/system.slice/owner'}';; esac; }
absent() { ${scenario==='gone'?'return 0':'return 1'}; }
awk() { printf '${scenario==='populated'?'1':scenario==='unknown'?'':'0'}'; }
[() { case "$1" in -f|-d) return 0;; -L) return 1;; -z) builtin test -z "$2";; *) builtin test "$1" "$2" "$3";; esac; }
${check}
if owner_cgroup_empty; then printf pass; else printf refused; fi
`;
            const r=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
            assert.equal(r.status,0,r.stderr);assert.equal(r.stdout,['empty','gone'].includes(scenario)?'pass':'refused',scenario);
        } finally {fs.rmSync(dir,{recursive:true,force:true});}
    }
});
test('actual independent release is required, idempotent, and fails closed',()=>{
    const release=controller.slice(controller.indexOf('release_injected_pen() {'),controller.indexOf('recover() {'));
    for(const variant of ['not-started','already-released','success','failure','hash-drift']) {
        const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-ink-release-'));
        try {
            if(variant!=='not-started')fs.writeFileSync(path.join(dir,'pen-injection-started'),'pid');
            if(variant==='already-released')fs.writeFileSync(path.join(dir,'pen-release-verified'),'owner');
            fs.writeFileSync(path.join(dir,'ink-events'),'#!/bin/bash\nprintf "release\\n"\n'+(variant==='failure'?'exit 1\n':'exit 0\n'),{mode:0o700});
            const script=`set -Eeuo pipefail
B=${JSON.stringify(dir)}; S=$B
exact() { ${variant==='hash-drift'?'return 1':'return 0'}; }
mark() { printf '%s' "$2" >"$B/$1"; }
sync() { :; }
${release}
if release_injected_pen; then printf 'pass\\n'; else printf 'refused\\n'; fi
if release_injected_pen; then printf 'pass\\n'; else printf 'refused\\n'; fi
`;
            const r=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
            if(variant==='failure'||variant==='hash-drift') {
                assert.match(r.stdout,/refused/);assert(!fs.existsSync(path.join(dir,'pen-release-verified')));
            } else {
                assert(!r.stdout.includes('refused'));
                assert.equal((r.stdout.match(/release\n/g)||[]).length,variant==='success'?1:0);
            }
        } finally {fs.rmSync(dir,{recursive:true,force:true});}
    }
});
