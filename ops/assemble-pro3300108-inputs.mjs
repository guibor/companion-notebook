// Assemble only coordinator-supplied local evidence; never observe a device.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {restylePayload} from './controller-pro3300108.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const runtime=JSON.parse(fs.readFileSync('profiles/runtime-pro-3.30.0.108.json'));
const table=JSON.parse(fs.readFileSync('profiles/table-pro-3.30.0.108.json'));
assert.equal(table.firmware,runtime.firmware);
assert.equal(table.stockSha256,runtime.stockSha256);
assert.equal(table.hashtabCaptureStatus,'two-canonical-captures-equal');
for(const key of ['hashtabSha256','canonicalTableSha256'])assert(/^[a-f0-9]{64}$/.test(table[key]||''));
const root='/Users/mdf/code/.worktrees/smart-remarkable-pro-3300108';
const peerBytes=fs.readFileSync(process.argv[6]||root+'/build/pro-3.30.0.108/ordered-full-stack.sha256');
if(process.argv[6])assert.equal(sha(peerBytes),process.argv[7],'Fresh peer manifest changed');
const rows=peerBytes.toString('utf8').trim().split('\n');
const qmds=rows.map(row=>{const m=row.match(/^([a-f0-9]{64})  (\/.*)$/);assert(m);return {path:m[2],sha256:m[1]};});
assert.equal(qmds.length,12);
qmds.push({...restylePayload['restyle-highlights.qmd']});
for(const q of qmds)assert.equal(sha(fs.readFileSync(q.path)),q.sha256);
const spec={firmware:runtime.firmware,build:runtime.build,buildId:runtime.buildId,stockSha256:runtime.stockSha256,
    controllerProfile:'pro3300108-combined-cold-start-v2',
    hashtabSha256:table.hashtabSha256,
    hashtabCaptureStatus:table.hashtabCaptureStatus,
    canonicalTableSha256:table.canonicalTableSha256,
    qmds,additionalResources:[root+'/build/pro-3.30.0.108/inputs'],runtime};
if(process.argv[2]){
    const bytes=fs.readFileSync(process.argv[2]);assert.equal(sha(bytes),process.argv[3],'Fresh controller inventory changed');
    spec.controller=JSON.parse(bytes);
}
assert(!process.argv[4]&&!process.argv[5],'Accepted WebPDF must not gain old-app rollback during this firmware port');
const bytes=JSON.stringify(spec,null,2)+'\n',hash=sha(bytes);
fs.mkdirSync('build/pro-3.30.0.108',{recursive:true});
const out='build/pro-3.30.0.108/coordinator-'+hash.slice(0,12)+'.json';
if(fs.existsSync(out))assert.equal(sha(fs.readFileSync(out)),hash);else fs.writeFileSync(out,bytes,{mode:0o600,flag:'wx'});
console.log(out+' '+hash);
