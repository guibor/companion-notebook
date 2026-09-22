// Local-only public Qt headers for the ARM64 observer. Never installs packages.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root = path.resolve('build/observer-sdk');
const packages = [
  ['qt6-base', 'qt6-base-dev_6.8.2+dfsg-9+deb13u2_arm64.deb', 'bf6d095482ad0ff8f805c0d3749d5c3d63f6b97a14d3c56e2111d5df6de1caa6'],
  ['qt6-declarative', 'qt6-declarative-dev_6.8.2+dfsg-7_arm64.deb', 'e3d9d9240d3f172516fb58b0fa5ec794d51de19a5b017734fb12fc914719f296'],
];
fs.mkdirSync(root,{recursive:true});
for (const [directory,name,sha] of packages) {
  const deb = path.join(root,name);
  if (!fs.existsSync(deb)) execFileSync('curl',['--fail','--silent','--show-error','--location','--connect-timeout','10','--max-time','45',
    `https://ftp.debian.org/debian/pool/main/q/${directory}/${name}`,'--output',deb],{stdio:'inherit'});
  assert.equal(createHash('sha256').update(fs.readFileSync(deb)).digest('hex'),sha,`Official Debian package checksum: ${name}`);
  const members=execFileSync('ar',['t',deb],{encoding:'utf8'}).trim().split('\n');
  const data=members.filter(x=>/^data\.tar\.(?:xz|zst|gz)$/.test(x));
  assert.equal(data.length,1,'Expected exactly one archive payload');
  const bytes=execFileSync('ar',['p',deb,data[0]],{maxBuffer:20*1024*1024});
  // Header files only: package scripts, libraries and system directories are not installed.
  execFileSync('tar',['-xf','-','-C',root,'./usr/include'],{input:bytes,maxBuffer:1024*1024});
}
console.log('Verified ARM64 Qt6.8.2 public headers extracted under '+root);
