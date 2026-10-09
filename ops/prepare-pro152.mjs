// Offline integration payload only. ReManager owns controller/activation.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync as run} from 'node:child_process';
import {targets} from './firmware-target.mjs';
const specFile=process.argv[2],specHash=process.argv[3];
assert(specFile&&/^[a-f0-9]{64}$/.test(specHash||''),'Usage: node ops/prepare-pro152.mjs coordinator.json SHA256');
const sha=b=>createHash('sha256').update(b).digest('hex');
const specBytes=fs.readFileSync(specFile);assert.equal(sha(specBytes),specHash,'Coordinator input changed');
const spec=JSON.parse(specBytes),target=targets['3.29.0.152'];
assert.equal(spec.firmware,'3.29.0.152');assert.equal(spec.stockSha256,target.stockSha256);
assert.equal(spec.build,target.build);assert.equal(spec.buildId,target.buildId);
assert(/^[a-f0-9]{64}$/.test(spec.hashtabSha256||''));
assert(Array.isArray(spec.qmds)&&spec.qmds.length>0);
for(const peer of spec.qmds) {
    assert(/^[a-f0-9]{64}$/.test(peer.sha256));
    assert.equal(sha(fs.readFileSync(peer.path)),peer.sha256,'Peer changed: '+peer.path);
}
assert.equal(new Set(spec.qmds.map(x=>path.basename(x.path))).size,spec.qmds.length,'Duplicate peer filename');
for(const name of ['bettertoc','restyle','webpdf'])
    assert(spec.qmds.some(p=>path.basename(p.path).toLowerCase().replaceAll('-','').includes(name)),`Missing final ${name} integration`);
const prior='/Users/mdf/code/companion-notebook/build/admission-arm64';
const audit=JSON.parse(fs.readFileSync(prior+'/elf-review.json','utf8'));
const expected={...audit.module.runtimeHashes,...audit.bootstrap.runtimeHashes};
assert(spec.runtime && spec.runtime.firmware===spec.firmware && spec.runtime.stockSha256===target.stockSha256,
    'Require coordinator device-observed runtime manifest for .152');
for(const [soname,digest]of Object.entries(expected)) {
    assert.equal(spec.runtime.libraries[soname]?.sha256,digest,`Changed or missing native provider: ${soname}; re-audit/rebuild needed`);
    const observed=spec.runtime.libraries[soname];
    assert(observed.devicePath.startsWith('/usr/lib/'));
    if(observed.localPath)assert.equal(sha(fs.readFileSync(observed.localPath)),digest);
}
run(process.execPath,['ops/audit-pro152.mjs'],{stdio:'inherit'});
run(process.execPath,['build-native.mjs'],{env:{...process.env,CN_FIRMWARE_VERSION:spec.firmware,CN_HASHTAB_SHA256:spec.hashtabSha256,CN_SOURCE_ONLY:'0',CN_USER_PILOT:'1',CN_QUICK_PAD:'1'},stdio:'inherit'});
const root='build/pro-3.29.0.152',generated=root+'/quick-pad-native';
const fw='/Users/mdf/code/remarkable-beta-os/.cache/firmware/3.29.0.152';
const input=root+'/composition-input';
fs.rmSync(input,{recursive:true,force:true});
fs.mkdirSync(input,{recursive:true});fs.cpSync(fw+'/resources',input,{recursive:true});
for(const resource of spec.additionalResources||[])fs.cpSync(resource,input,{recursive:true});
const peers=spec.qmds.map(p=>p.path),toc=peers.find(p=>path.basename(p).toLowerCase().startsWith('bettertoc'));
const candidate=path.resolve(generated+'/companion-notebook.qmd');
const tool='/Users/mdf/code/remarkable-beta-os/.cache/tools/qmldiff-25681c3-bin';
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const counts={};
for(const [name,patches]of [['after-toc',[toc,candidate,...peers.filter(p=>p!==toc)]],['last',[...peers,candidate]]]) {
    const out=root+'/composed-'+name;
    run(tool,['apply-diffs','--clean','--hashtab',fw+'/hashtab','--version',spec.firmware,input,out,...patches],{stdio:'pipe'});
    const qml=files(out).filter(p=>p.endsWith('.qml'));
    for(const p of qml)run('qmlformat',['--ignore-settings',p],{stdio:['ignore','ignore','pipe']});
    assert.match(fs.readFileSync(out+'/qml/device/view/documentview/DeviceSceneView.qml','utf8'),/onExteriorBoundaryChanged:\s*updateViewportEdges\(\)/);
    counts[name]=qml.length;
}
// Output only this app's payload; no peer replacement or settings seed.
const output=root+'/handoff-'+specHash.slice(0,12);assert(!fs.existsSync(output),'Do not overwrite a handoff');
fs.mkdirSync(output,{mode:0o700});
const payload={};
for(const file of ['NativeHost.qml','PairStore.js','SizeRuler.qml','companion-notebook.qmd'])payload[file]=fs.readFileSync(generated+'/'+file);
for(const [file,source,expectedHash]of [
    ['libcompanionbootstrap.so',prior+'/libcompanionbootstrap.so',audit.bootstrap.sha256],
    ['libcompanionadmissionplugin.so',prior+'/qml/Companion/Admission/libcompanionadmissionplugin.so',audit.module.sha256],
    ['admission-qmldir',prior+'/qml/Companion/Admission/qmldir',audit.sourceHashes.qmldir]]) {
    payload[file]=fs.readFileSync(source);assert.equal(sha(payload[file]),expectedHash);
}
for(const [file,data]of Object.entries(payload))fs.writeFileSync(output+'/'+file,data,{mode:0o600,flag:'wx'});
fs.writeFileSync(output+'/SHA256SUMS',Object.keys(payload).sort().map(f=>sha(payload[f])+'  '+f+'\n').join(''),{mode:0o600});
fs.writeFileSync(output+'/controller-inputs.json',JSON.stringify({firmware:spec.firmware,build:spec.build,buildId:spec.buildId,stockSha256:target.stockSha256,
    coordinatorInputSha256:specHash,hashtabSha256:spec.hashtabSha256,peers:spec.qmds,runtime:spec.runtime,composition:counts,
    settingsPolicy:'Preserve current /home/root/.local/share/companion-notebook/pairs.ini verbatim; do not seed from historical backup or ship settings',
    moduleRoot:'/home/root/.local/lib/companion-notebook',preloadOrder:['/home/root/.local/lib/companion-notebook/libcompanionbootstrap.so','/home/root/xovi/xovi.so'],
    qmlImportRoots:['/home/root/.local/lib/companion-notebook/qml','PRESERVE_CURRENT_RESTYLE_AND_WEBPDF_IMPORT_ROOTS'],
    status:'offline-composed-native-provider-identical-not-activated',controllerIncluded:false,
    remaining:['coordinator-owned fresh backup and service inventory','session-independent rollback before activation','target startup/physical acceptance']},null,2)+'\n');
console.log(output);
