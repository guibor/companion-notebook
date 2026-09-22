// Prepare a standalone import test; no SSH, UI, input or service operations.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const id=process.argv[2];
assert.match(id||'',/^\d{8}T\d{6}Z-\d+$/);
const root='build/observer-arm64',dir='build/observer-preflight-'+id;
assert(!fs.existsSync(dir),'Do not reuse a preflight stage');
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const receipt=JSON.parse(fs.readFileSync(root+'/elf-review.json'));
assert.equal(receipt.status,'cross-built-symbol-compatible-not-device-qualified');
assert.equal(hash(root+'/observer-smoke'),receipt.smoke.binarySha256);
assert.equal(hash(root+'/qml/Companion/Lifecycle/libcompanionlifecycleplugin.so'),receipt.binarySha256);
assert.equal(hash(root+'/qml/Companion/Lifecycle/qmldir'),receipt.sourceHashes.qmldir);
for(const [p,h] of Object.entries(receipt.sourceHashes))assert.equal(hash('native-observer/'+p),h);
const files=['observer-smoke','qml/Companion/Lifecycle/qmldir','qml/Companion/Lifecycle/libcompanionlifecycleplugin.so'];
fs.mkdirSync(dir,{mode:0o700});
for(const sub of ['qml','qml/Companion','qml/Companion/Lifecycle'])fs.mkdirSync(dir+'/'+sub,{mode:0o700});
for(const p of files){
  assert(!fs.lstatSync(root+'/'+p).isSymbolicLink());
  fs.copyFileSync(root+'/'+p,dir+'/'+p);
  fs.chmodSync(dir+'/'+p,p==='observer-smoke'?0o700:0o600);
}
fs.writeFileSync(dir+'/SHA256SUMS',files.map(p=>hash(dir+'/'+p)+'  '+p+'\n').join(''),{mode:0o600});
console.log(JSON.stringify({id,dir:path.resolve(dir),manifestSha256:hash(dir+'/SHA256SUMS'),binarySha256:receipt.smoke.binarySha256,moduleSha256:receipt.binarySha256}));
