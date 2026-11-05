// Exact-target composition only; native runtime and editing gates are separate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync as run} from 'node:child_process';
import {verifyPro330SecondaryRequirements} from '../ops/port-pro330-toolbar.mjs';
const root=path.resolve('build/pro-3.30.0.108-composition');
const fw='/Users/mdf/code/.worktrees/remarkable-beta-os-pro-3300108/.cache/firmware/3.30.0.108';
const smart='/Users/mdf/code/.worktrees/smart-remarkable-pro-3300108/build/pro-3.30.0.108';
const tool='/Users/mdf/code/remarkable-beta-os/.cache/tools/qmldiff-25681c3-bin';
const tableSha='d13c4ce53669d4b72fb26fdc94678d400fd395224476e7f6a69b805fce3d0c25';
run(process.execPath,['build-native.mjs'],{env:{...process.env,CN_FIRMWARE_VERSION:'3.30.0.108',CN_HASHTAB_SHA256:tableSha,CN_SOURCE_ONLY:'0',CN_USER_PILOT:'1',CN_QUICK_PAD:'1'},stdio:'inherit'});
const qmd=path.resolve('build/pro-3.30.0.108/quick-pad-native/companion-notebook.qmd');
const peers=fs.readdirSync(smart+'/qmd').sort().map(n=>smart+'/qmd/'+n);
assert.equal(peers.length,11);
const toc=peers.find(n=>n.includes('betterToc-'));assert(toc);
const appload='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.152/appload-0.6-embedded.qmd';
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(d+'/'+e.name):[d+'/'+e.name]);
fs.mkdirSync(root,{recursive:true});
const counts={};
for(const [name,patches]of [['after-toc',[appload,toc,qmd,...peers.filter(p=>p!==toc)]],['last',[appload,...peers,qmd]]]){
 const out=root+'/'+name;
 const log=run(tool,['apply-diffs','--clean','--hashtab',fw+'/hashtab','--version','3.30.0.108',smart+'/inputs',out,...patches],{encoding:'utf8'});
 fs.writeFileSync(root+'/'+name+'.log',log);
 for(const f of files(out).filter(f=>f.endsWith('.qml'))){
  const text=fs.readFileSync(f,'utf8');
  run('qmlformat',['--ignore-settings',f],{stdio:['ignore','ignore','pipe']});
  assert.doesNotMatch(text,/\btype:\s*ToolbarTool(?:Item)?\.Type\./);
  if(text.includes('KeyboardSettings.'))assert.match(text,/^import xofm\.libs\.keyboardsettings(?: [0-9.]+)?$/m);
 }
 const read=p=>fs.readFileSync(out+'/'+p,'utf8');
 const main=read('qml/device/view/main/MainView.qml');
 const stockDoc=fs.readFileSync(fw+'/resources/qml/device/view/documentview/DocumentView.qml','utf8');
 assert.equal(verifyPro330SecondaryRequirements(main,stockDoc),21);
 assert.throws(()=>verifyPro330SecondaryRequirements(main.replace(/navigationManager: root.navigationManager/,''),stockDoc));
 const redraw=main.match(/CnEpaper\.ScreenModeItem\s*\{[\s\S]*?visible:\s*([^\n]+)/)?.[1];
 assert(redraw,'Missing panel redraw scope');
 assert.equal(vm.runInNewContext(redraw,{cnHost:null}),false);
 for(const phase of ['cold','idle','draining','choosing','suspended','failed','loading','settling','publishing']) {
  assert.equal(vm.runInNewContext(redraw,{cnHost:{dragging:false,transitionPhase:phase}}),
   ['loading','settling','publishing'].includes(phase),'Unexpected waveform during '+phase);
 }
 assert.equal(vm.runInNewContext(redraw,{cnHost:{dragging:true,transitionPhase:'idle'}}),true);
 const toolbar=read('qt/qml/xofm/libs/toolbar/qml/ToolbarItem.qml');
 assert.equal((toolbar.match(/\bonShowableToolsCountChanged\s*:/g)||[]).length,1);
 assert.match(toolbar,/onShowableToolsCountChanged:\s*cnPublishToolbarCapacity\(\)/);
 const doc=read('qml/device/view/documentview/DocumentView.qml');
 assert.match(doc,/Values.ndiAddPage/);assert.match(doc,/requestTableOfContents\(true\)/);
 assert.match(doc,/toolbar\.Toolbar\.eraser\.eraserThicknessSelected\(thickness\)/);
 assert.match(doc,/toolbar\.Toolbar\.history\.undoSelected\(\)/);
 const scene=read('qml/device/view/documentview/DeviceSceneView.qml');
 assert.match(scene,/cnPaired: root.cnPaired/);assert.match(scene,/cnAdmissionInputsDetached/);
 assert.match(read('qml/device/view/documentview/StrokeInput.qml'),/root.cnPaired/);
 assert.match(read('qml/device/view/documentview/ViewportBindings.qml'),/root.cnQuickPadCompositing/);
 counts[name]=files(out).filter(f=>f.endsWith('.qml')).length;
}
assert.equal(counts['after-toc'],counts.last);
fs.writeFileSync(root+'/receipt.json',JSON.stringify({status:'exact-base-plus-companion-composition-passed',counts,remaining:['native isolated smoke','Restyle and WebPDF composition','guarded runtime activation','physical interactions']},null,2)+'\n');
console.log(JSON.stringify(counts));
