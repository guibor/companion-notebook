// Local capsule preparation only. Does not connect, install, or authorize UI use.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const id=process.argv[2];
assert.match(id ?? '', /^\d{8}-\d+$/);
const out='build/bootstrap-smoke-'+id;
assert(!fs.existsSync(out),'Never overwrite a smoke capsule');
const built='build/admission-arm64';
const elf=JSON.parse(fs.readFileSync(built+'/elf-review.json'));
const files={
    'libcompanionbootstrap.so':[built+'/libcompanionbootstrap.so',elf.bootstrap.sha256],
    'admission-preload-child':[built+'/admission-preload-child',elf.child.sha256],
    'admission-smoke':[built+'/admission-smoke',elf.smoke.sha256],
    'qml/Companion/Admission/libcompanionadmissionplugin.so':[
        built+'/qml/Companion/Admission/libcompanionadmissionplugin.so',elf.module.sha256],
    'qml/Companion/Admission/qmldir':['native-admission/qmldir',elf.sourceHashes.qmldir],
    'foreign/libcompanionbootstrap.so':[built+'/libcompanionbootstrap.so',elf.bootstrap.sha256],
    'foreign/admission-preload-child':[built+'/admission-preload-child',elf.child.sha256],
    'old-combined.so':['build/probe-20260922T221000Z-1/libcompanionadmissionplugin.so',
        '0c3cdbd017cc62dee4f1d98a2e7049f582da8719b93c6d7b010668b8c3329659']
};
for(const [file,h] of Object.entries(elf.sourceHashes)) assert.equal(hash('native-admission/'+file),h);
for(const [file,h] of Object.values(files)) assert.equal(hash(file),h);
for(const receipt of [elf.bootstrap,elf.child])
    assert(receipt.dependencies.every(p=>['libc.so.6','libdl.so.2'].includes(p)));
const providers={
    'libQt6Core.so.6':'/usr/lib/libQt6Core.so.6.10.3','libQt6Gui.so.6':'/usr/lib/libQt6Gui.so.6.10.3',
    'libQt6Qml.so.6':'/usr/lib/libQt6Qml.so.6.10.3','libstdc++.so.6':'/usr/lib/libstdc++.so.6.0.36',
    'libgcc_s.so.1':'/usr/lib/libgcc_s.so.1','libc.so.6':'/usr/lib/libc.so.6',
    'libdl.so.2':'/usr/lib/libdl.so.2','libpthread.so.0':'/usr/lib/libpthread.so.0'};
const libraries={};
for(const key of ['module','smoke','bootstrap','child'])
    for(const [lib,h] of Object.entries(elf[key].runtimeHashes)) {
        assert(providers[lib]);
        assert(!libraries[lib] || libraries[lib]===h);
        libraries[lib]=h;
    }
fs.mkdirSync(out,{mode:0o700});
for(const [target,[source]] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(out+'/'+target),{recursive:true,mode:0o700});
    fs.copyFileSync(source,out+'/'+target);
    fs.chmodSync(out+'/'+target,target.endsWith('qmldir')?0o600:0o700);
}
fs.copyFileSync('ops/test-admission-bootstrap.sh',out+'/audit.sh');
fs.chmodSync(out+'/audit.sh',0o700);
fs.writeFileSync(out+'/runtime.sha256',Object.entries(libraries).sort().map(([lib,h])=>h+'  '+providers[lib]+'\n').join(''),{mode:0o600});
const names=[...Object.keys(files),'audit.sh','runtime.sha256'].sort();
fs.writeFileSync(out+'/SHA256SUMS',names.map(p=>hash(out+'/'+p)+'  '+p+'\n').join(''),{mode:0o600});
console.log(JSON.stringify({capsule:path.resolve(out),manifestSha256:hash(out+'/SHA256SUMS'),
    remote:'/tmp/companion-admission-bootstrap-'+id,uiQualification:false}));
