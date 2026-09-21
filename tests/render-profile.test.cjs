const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');

test('rendering controller preserves the reviewed recovery implementation',()=>{
    execFileSync(process.execPath,['ops/build-render-controller.mjs']);
    const base=fs.readFileSync('ops/probe-pro329.sh','utf8');
    const render=fs.readFileSync('build/render-native/probe.sh','utf8');
    const recovery=s=>s.slice(s.indexOf('cleanup_host() {'),s.indexOf('# Watchdog retry accounting'));
    assert.equal(recovery(render),recovery(base));
    assert.match(render,/MemoryMax=1073741824/);
    assert.match(render,/\+ 180/);
    assert.match(render,/renderProbeOnly: true/);
    assert.match(render,/two native views and return completed; ink=false; capture=true/);
    assert.doesNotMatch(render,/mark load-only-passed/);
    assert.match(render,/for n in \$\(seq 1 80\); do\n    healthy probe\n    systemctl is-active --quiet "\$WATCH"/);
    assert.match(render,/systemctl is-active --quiet "\$WATCH"\nmark rendering-machine-passed/);
    execFileSync('/bin/bash',['-n','build/render-native/probe.sh']);
});

const bridge=fs.readFileSync('native/probe-bridge.qml.inc','utf8');
const functions=bridge.slice(bridge.indexOf('function probeReadiness()'));
const a='55555555-5555-4555-8555-555555555555',b='22222222-2222-4222-8222-222222222222';
function context() {
    const entries={[a]:{id:a,lastOpenedPage:0},[b]:{id:b,lastOpenedPage:0}};
    const calls=[];
    return {
        calls,probeMayStart:true,probeIds:[],probeOriginal:null,primary:null,probeGeneration:0,
        portrait:true,sharingActive:false,BatteryManager:{displaySleeping:false},
        Values:{cnProbeStarted:false}, Qt:{Vertical:2}, DeviceScreenInfo:{paperSize:{width:1,height:1}},
        Library:{isReady:true,entryForId:id=>entries[id]},
        LibraryController:{createDocument:(folder,title)=>{calls.push(['create',folder,title]);return calls.filter(c=>c[0]==='create').length===1?a:b;},setOrientation:()=>{}},
        DocumentController:{setTemplateForPage:(...args)=>calls.push(['template',...args])},
        root:{visible:true,passcodeHandler:{userLocked:false},explorer:{rootId:()=> 'root'},openDocument_helper:(entry,cb)=>cb(),content:{grabToImage:()=>{calls.push(['capture']);return true;}}},
        documentView:{item:{openDocumentOnPage:(entry,page)=>calls.push(['open',entry.id,page])}},
        host:{closeSecondary:()=>calls.push(['close-secondary'])},
        console:{log:()=>{},warn:()=>{}},viewReady:()=>true
    };
}
test('diagnostic claims once and creates exactly two labeled notebooks via native APIs',()=>{
    const c=context();
    vm.runInNewContext(functions+'; probeCreate();',c);
    assert.equal(c.calls.filter(x=>x[0]==='create').length,2);
    assert(c.calls.filter(x=>x[0]==='create').every(x=>x[1]==='root'&&x[2].startsWith('Companion test ')));
    assert.equal(c.calls.filter(x=>x[0]==='template').length,2);
    assert.throws(()=>vm.runInNewContext('probeCreate();',c));
    assert.equal(c.calls.filter(x=>x[0]==='create').length,2);
});
test('unavailable diagnostic creates nothing and does not close an existing view',()=>{
    const c=context(); c.probeMayStart=false; c.primary={close:()=>c.calls.push(['close-primary'])};
    assert.throws(()=>vm.runInNewContext(functions+'; probeCreate();',c));
    vm.runInNewContext('probeRestore(host);',c);
    assert.deepEqual(c.calls,[]);
});
test('capture refuses any view not matching both new disposable IDs',()=>{
    const c=context(); c.probeIds=[a,b];
    c.primary={document:{id:'11111111-1111-4111-8111-111111111111'},documentLoaded:true,sceneController:{}};
    c.host.secondary={document:{id:b},documentLoaded:true,sceneController:{}};
    assert.throws(()=>vm.runInNewContext(functions+'; probeCapture(host);',c));
    assert.deepEqual(c.calls,[]);
});
function pendingCapture() {
    const c=context(), callbacks=[], saved=[];
    c.probeIds=[a,b]; c.Values.cnProbeStarted=true;
    const view=id=>({document:{id},documentLoaded:true,currentPage:0,sceneController:{},cnProbeViewport:{},
        cnProbeCaptureViewport:cb=>{callbacks.push(cb);return true;}});
    c.primary=view(a); c.host.secondary=view(b);
    vm.runInNewContext(functions+'; probeCapture(host);',c);
    return {c,callbacks,saved,finish:()=>callbacks.forEach(cb=>cb({saveToFile:p=>{saved.push(p);return true;}}))};
}
for (const [name,change] of [
    ['navigation',c=>{c.primary.document.id='11111111-1111-4111-8111-111111111111';}],
    ['destroyed secondary',c=>{c.host.secondary=null;}],
    ['replaced secondary',c=>{c.host.secondary={...c.host.secondary};}],
    ['replaced viewport',c=>{c.primary.cnProbeViewport={};}],
    ['destroyed viewport',c=>{c.host.secondary.cnProbeViewport=null;}],
    ['cancellation',c=>vm.runInNewContext('probeInvalidate();',c)],
    ['restore',c=>vm.runInNewContext('probeRestore(host);',c)],
    ['unsafe state',c=>{c.probeMayStart=false;}]
]) test('delayed viewport callbacks refuse saving after '+name,()=>{
    const p=pendingCapture();
    if (name==='restore') p.c.probeOriginal={id:a,page:0};
    change(p.c); p.finish();
    assert.deepEqual(p.saved,[]); assert.equal(p.c.probeCaptureSaved,false);
    assert.equal(p.c.probeCaptureDone,true);
});
test('capture saves only both disposable viewport subtrees',()=>{
    const p=pendingCapture(); p.finish();
    assert.deepEqual(p.saved,['/home/root/.local/share/companion-notebook/render-primary.png','/home/root/.local/share/companion-notebook/render-secondary.png']);
    assert.equal(p.c.probeCaptureSaved,true); assert.equal(p.c.probeCaptureDone,true);
    assert.doesNotMatch(bridge,/root\.content\.grabToImage/);
});
test('original document on wrong page is reopened and cannot pass restoration early',()=>{
    const c=context(); c.Values.cnProbeStarted=true; c.probeOriginal={id:a,page:3};
    c.primary={document:{id:a},currentPage:8};
    vm.runInNewContext(functions+'; probeRestore(host);',c);
    assert.deepEqual(c.calls,[['close-secondary'],['open',a,3]]);
    assert.equal(vm.runInNewContext('probeRestored()',c),false);
    c.primary.currentPage=3;
    assert.equal(vm.runInNewContext('probeRestored()',c),true);
});
test('readiness permits an absent or empty library view but blocks a loading document',()=>{
    const c=context(); vm.runInNewContext(functions,c);
    assert.equal(vm.runInNewContext('probeReadiness()',c),'ready');
    c.primary={document:null,isLoading:true};
    assert.equal(vm.runInNewContext('probeReadiness()',c),'ready');
    c.primary.document={id:a};
    assert.equal(vm.runInNewContext('probeReadiness()',c),'document-loading');
});
for (const [reason,change] of [
    ['hidden',c=>{c.root.visible=false;}],['locked',c=>{c.root.passcodeHandler.userLocked=true;}],
    ['asleep',c=>{c.BatteryManager.displaySleeping=true;}],['library-busy',c=>{c.Library.isReady=false;}],
    ['landscape',c=>{c.portrait=false;}],['sharing',c=>{c.sharingActive=true;}]
]) test('library placeholder does not bypass '+reason+' readiness guard',()=>{
    const c=context(); c.primary={document:null,isLoading:true}; change(c);
    assert.equal(vm.runInNewContext(functions+'; probeReadiness()',c),reason);
});
test('native return to library closes only the test primary and accepts an empty placeholder',()=>{
    const c=context(); c.Values.cnProbeStarted=true;
    c.primary={document:{id:a},isLoading:false,close:()=>{c.calls.push(['close-primary']); c.primary.document=null; c.primary.isLoading=true;}};
    vm.runInNewContext(functions+'; probeRestore(host);',c);
    assert.deepEqual(c.calls,[['close-secondary'],['close-primary']]);
    assert.equal(vm.runInNewContext('probeRestored()',c),true);
});
