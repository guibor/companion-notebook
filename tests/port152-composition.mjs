// Preliminary .152 resource test against the frozen prior peer snapshot.
// Version lines are retargeted ONLY in scratch test fixtures, never installables.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync as run} from 'node:child_process';
const tool='/Users/mdf/code/remarkable-beta-os/.cache/tools/qmldiff-25681c3-bin';
const old='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148';
const fw='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.152';
const peers='/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/build/pro-3.29.0.148/qmd';
const root='build/port152-fixtures';
const sha=b=>createHash('sha256').update(b).digest('hex');
run(process.execPath,['build-native.mjs'],{env:{...process.env,CN_FIRMWARE_VERSION:'3.29.0.152',CN_SOURCE_ONLY:'1',CN_USER_PILOT:'1',CN_QUICK_PAD:'1'},stdio:'inherit'});
fs.mkdirSync(root,{recursive:true});
fs.cpSync(fw+'/resources',root+'/input',{recursive:true});
fs.cpSync(old+'/appload-0.6-resources',root+'/input',{recursive:true});
const originals=[...fs.readdirSync(peers).filter(x=>x.endsWith('.qmd')).map(x=>path.join(peers,x)),old+'/appload-0.6-embedded.qmd'];
const patches=originals.map((p,i)=>{
    const out=root+'/'+i+'-'+path.basename(p);
    fs.writeFileSync(out,fs.readFileSync(p,'utf8').replace(/^VERSION .+$/m,'VERSION 3.29.0.152'));
    return out;
});
const toc=patches.find(p=>p.includes('betterToc-'));assert(toc);
const candidate=path.resolve('build/pro-3.29.0.152-unbound/quick-pad-native/companion-notebook.qmd');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const counts={};
for(const [name,order] of [['after-toc',[toc,candidate,...patches.filter(x=>x!==toc)]],['last',[...patches,candidate]]]) {
    const out=root+'/'+name;
    run(tool,['apply-diffs','--clean','--hashtab',old+'/hashtab','--version','3.29.0.152',root+'/input',out,...order],{stdio:'pipe'});
    const qml=files(out).filter(p=>p.endsWith('.qml'));
    for(const p of qml)run('qmlformat',['--ignore-settings',p],{stdio:['ignore','ignore','pipe']});
    const scene=fs.readFileSync(out+'/qml/device/view/documentview/DeviceSceneView.qml','utf8');
    assert.match(scene,/onExteriorBoundaryChanged:\s*updateViewportEdges\(\)/,'Preserve new native boundary update');
    assert.match(scene,/cnAdmissionInputsDetached/);
    const document=fs.readFileSync(out+'/qml/device/view/documentview/DocumentView.qml','utf8');
    assert.match(document,/Values.ndiAddPage/);assert.match(document,/requestTableOfContents\(true\)/);
    counts[name]=qml.length;
}
// Test fixtures for existing actual-composed-method regressions, never packages.
fs.cpSync(root+'/last','build/quick-pad-composed-last',{recursive:true});
fs.cpSync(root+'/input','build/quick-pad-composition-input',{recursive:true});
fs.cpSync('build/pro-3.29.0.152-unbound/quick-pad-native','build/quick-pad-native',{recursive:true});
fs.writeFileSync(root+'/receipt.json',JSON.stringify({status:'preliminary-source-composition-only',firmware:'3.29.0.152',counts,installable:false,
    pending:['actual .152 table','final .152 peer stack including Restyle and WebPDF','native ABI/behavior'],
    priorSnapshot:originals.map(p=>({path:p,sha256:sha(fs.readFileSync(p))}))},null,2)+'\n');
console.log(JSON.stringify(counts));
