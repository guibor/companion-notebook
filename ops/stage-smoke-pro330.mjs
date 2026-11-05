// Stage a hash-bound fake-object smoke. Does not activate UI integrations.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync as run} from 'node:child_process';
const root=path.resolve('.'),built=root+'/build/pro-3.30.0.108-admission-arm64';
const audit=JSON.parse(fs.readFileSync(built+'/elf-review.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const id=new Date().toISOString().replaceAll(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')+'-'+process.pid;
const out=root+'/build/smoke-pro330-'+id,S='/home/root/.codex-staging/companion-smoke-pro330-'+id;
const ssh=['-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','IdentitiesOnly=yes','-o','ConnectTimeout=8','-o','ServerAliveInterval=10','-o','ServerAliveCountMax=3','-i',process.env.HOME+'/.ssh/id_ed25519_remarkable_new','root@10.100.102.101'];
const remote=(cmd,input)=>run('ssh',[...ssh,cmd],{input,encoding:'utf8',timeout:90000,maxBuffer:1024*1024});
for(const [n,h]of Object.entries(audit.sourceHashes))assert.equal(hash(fs.readFileSync(root+'/native-admission/'+n)),h);
fs.mkdirSync(out,{mode:0o700});
for(const [file,expected]of Object.entries({
 'libcompanionbootstrap.so':audit.bootstrap.sha256,'admission-preload-child':audit.child.sha256,
 'admission-smoke':audit.smoke.sha256,'qml/Companion/Admission/libcompanionadmissionplugin.so':audit.module.sha256,
 'qml/Companion/Admission/qmldir':audit.sourceHashes.qmldir})){
 const b=fs.readFileSync(built+'/'+file);assert.equal(hash(b),expected);
 fs.mkdirSync(path.dirname(out+'/'+file),{recursive:true,mode:0o700});fs.writeFileSync(out+'/'+file,b,{mode:0o700});
}
fs.copyFileSync(root+'/ops/smoke-pro330.sh',out+'/audit.sh');
const libraries={};
const names={'libQt6Core.so.6':'libQt6Core.so.6.10.3','libQt6Gui.so.6':'libQt6Gui.so.6.10.3','libQt6Qml.so.6':'libQt6Qml.so.6.10.3','libstdc++.so.6':'libstdc++.so.6.0.36'};
for(const key of ['module','bootstrap','smoke','child'])for(const [n,h]of Object.entries(audit[key].runtimeHashes)){
 if(libraries[n])assert.equal(libraries[n],h);libraries[n]=h;
}
fs.writeFileSync(out+'/runtime.sha256',Object.entries(libraries).sort().map(([n,h])=>h+'  /usr/lib/'+(names[n]||n)+'\n').join(''));
const files=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(d+'/'+e.name):[d+'/'+e.name]);
fs.writeFileSync(out+'/SHA256SUMS',files(out).sort().map(f=>hash(fs.readFileSync(f))+'  '+path.relative(out,f)+'\n').join(''));
const manifest=hash(fs.readFileSync(out+'/SHA256SUMS'));
const archive=run('tar',['-czf','-','-C',out,'.'],{env:{...process.env,COPYFILE_DISABLE:'1'}});
console.log(remote(`set -e; umask 077; test ! -e '${S}'; mkdir -m700 '${S}'; tar -xzf - -C '${S}'; chown -R root:root '${S}'; chmod -R u+rwX,go-rwx '${S}'; chmod 700 '${S}/admission-smoke' '${S}/admission-preload-child'; cd '${S}'; sha256sum -c SHA256SUMS; systemd-run --unit='companion-pro330-smoke-${id}' --property=Type=exec --property=KillMode=control-group --property=RuntimeMaxSec=45 --property=TimeoutStopSec=2 --property=NoNewPrivileges=yes --property=PrivateDevices=yes /bin/bash '${S}/audit.sh' '${S}' '${manifest}'`,archive));
fs.writeFileSync(out+'/receipt.json',JSON.stringify({stage:S,id,manifest,status:'staged-smoke-running',notUiQualification:true},null,2)+'\n');
console.log(out);
