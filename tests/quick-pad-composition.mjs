// Local private-cache composition only. Does not contact or mutate a tablet.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync as run} from 'node:child_process';
const fw='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.148';
const peers='/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/build/pro-3.29.0.148/qmd';
const manifest='/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256';
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(fs.readFileSync(manifest)), '5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d');
const peerFiles=fs.readdirSync(peers).filter(x=>x.endsWith('.qmd')).map(x=>path.join(peers,x));
assert.deepEqual(peerFiles.map(x=>sha(fs.readFileSync(x))).sort(),fs.readFileSync(manifest,'utf8').trim().split('\n').map(x=>x.split(/\s+/)[0]).sort());
const app=fw+'/appload-0.6-embedded.qmd';
assert.equal(sha(fs.readFileSync(app)), '69147587485e8f90336f8e504f48ffebb39212b47572d9cd990b7cfd12ec692a');
run(process.execPath,['build-native.mjs'],{env:{...process.env,CN_USER_PILOT:'1',CN_QUICK_PAD:'1'},stdio:'inherit'});
const input='build/quick-pad-composition-input';
fs.mkdirSync(input,{recursive:true});
fs.cpSync(fw+'/resources',input,{recursive:true});
fs.cpSync(fw+'/appload-0.6-resources',input,{recursive:true});
const candidate=path.resolve('build/quick-pad-native/companion-notebook.qmd');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const counts={};
// The existing pilot inserts its toolbar entry before BetterTOC's tocButton.
// Keep that real dependency first; never claim arbitrary-order compatibility.
const toc=peerFiles.find(p=>path.basename(p).startsWith('betterToc-'));
assert(toc);
for(const [name,patches] of [['after-toc',[toc,candidate,app,...peerFiles.filter(p=>p!==toc)]],['last',[app,...peerFiles,candidate]],['appload-last',[...peerFiles,candidate,app]]]) {
    const out='build/quick-pad-composed-'+name;
    run('/Users/mdf/code/remarkable-beta-os/.cache/tools/qmldiff-25681c3-bin',['apply-diffs','--clean','--hashtab',fw+'/hashtab','--version','3.29.0.148',input,out,...patches],{stdio:'pipe'});
    const qml=files(out).filter(p=>p.endsWith('.qml'));
    for(const p of qml) run('qmlformat',['--ignore-settings',p],{stdio:['ignore','ignore','pipe']});
    const scene=fs.readFileSync(out+'/qml/device/view/documentview/DeviceSceneView.qml','utf8');
    assert.equal((scene.replace(/\s/g,'').match(/height:root.cnQuickPadReadOnly\?0:Math.max/g)||[]).length,2,'Both pen region and blocker are empty on source');
    assert.match(scene,/tileManager.setFocalPoint/);
    const document=fs.readFileSync(out+'/qml/device/view/documentview/DocumentView.qml','utf8');
    assert.match(document,/!cnHost.quickPadActive \|\| cnSecondary/);
    assert.match(document,/Values.ndiAddPage/); assert.match(document,/requestTableOfContents\(true\)/);
    const main=fs.readFileSync(out+'/qml/device/view/main/MainView.qml','utf8');
    assert.match(main.replace(/\s/g,''),/entry.pageCount-1/); assert.match(main,/Document.Notebook/);
    counts[name]=qml.length;
}
run('qmlformat',['--ignore-settings','build/quick-pad-native/NativeHost.qml'],{stdio:['ignore','ignore','pipe']});
fs.writeFileSync('build/quick-pad-native/composition.json',JSON.stringify({status:'offline-only',counts,firmware:'3.29.0.148',nativeInkVerified:false,qmd:sha(fs.readFileSync(candidate))},null,2)+'\n');
console.log(JSON.stringify(counts));
