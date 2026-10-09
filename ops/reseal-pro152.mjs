// Controller-only reseal of an already composed, manifest-pinned handoff.
// Refuses every coordinator change except the explicit controller profile.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {renderController} from './controller-pro152.mjs';
const [old,oldHash,file,inputHash]=process.argv.slice(2);
const sha=b=>createHash('sha256').update(b).digest('hex');
assert(old&&file&&/^[a-f0-9]{64}$/.test(oldHash)&&/^[a-f0-9]{64}$/.test(inputHash));
const bytes=fs.readFileSync(file);assert.equal(sha(bytes),inputHash);const spec=JSON.parse(bytes);
const manifest=fs.readFileSync(old+'/SHA256SUMS','utf8');assert.equal(sha(manifest),oldHash);
const receipt=JSON.parse(fs.readFileSync(old+'/controller-inputs.json'));
const priorBytes=fs.readFileSync(path.join(path.dirname(file),'coordinator-'+receipt.coordinatorInputSha256.slice(0,12)+'.json'));
assert.equal(sha(priorBytes),receipt.coordinatorInputSha256);
const prior=JSON.parse(priorBytes),current={...spec};delete prior.controllerProfile;delete current.controllerProfile;
assert.deepEqual(current,prior,'Reuse requires identical peers/runtime/target/live inventory');
assert.equal(receipt.controllerIncluded,true);
assert.equal(receipt.composition['after-toc'],34);assert.equal(receipt.composition.last,34);
const payload={};
for(const row of manifest.trim().split('\n')){
    const m=row.match(/^([a-f0-9]{64})  ([A-Za-z0-9_.-]+)$/);assert(m);
    assert(!fs.lstatSync(old+'/'+m[2]).isSymbolicLink());
    payload[m[2]]=fs.readFileSync(old+'/'+m[2]);assert.equal(sha(payload[m[2]]),m[1]);
}
assert.equal(Object.keys(payload).length,12);
const controller=renderController(spec);assert.equal(controller.baseManifest,payload['base.sha256'].toString());
execFileSync('/bin/bash',['-n'],{input:controller.source});payload['probe.sh']=Buffer.from(controller.source);
const out=path.join(path.dirname(file),'handoff-'+inputHash.slice(0,12));assert(!fs.existsSync(out));
fs.mkdirSync(out,{mode:0o700});
for(const [name,b]of Object.entries(payload))fs.writeFileSync(out+'/'+name,b,{mode:0o600,flag:'wx'});
const nextManifest=Object.keys(payload).sort().map(n=>sha(payload[n])+'  '+n+'\n').join('');
fs.writeFileSync(out+'/SHA256SUMS',nextManifest,{mode:0o600});
fs.writeFileSync(out+'/controller-inputs.json',JSON.stringify({...receipt,coordinatorInputSha256:inputHash,
    reusedCompositionFrom:{directory:old,manifestSha256:oldHash},controllerProfile:spec.controllerProfile,
    status:'controller-only-reseal-identical-app-bytes-not-activated'},null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({directory:out,manifestSha256:sha(nextManifest),controllerSha256:sha(payload['probe.sh']),unchangedPayloadFiles:11},null,2));
