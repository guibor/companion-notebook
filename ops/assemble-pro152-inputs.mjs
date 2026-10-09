// Assemble only coordinator-supplied local evidence; never observe a device.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const runtime=JSON.parse(fs.readFileSync('profiles/runtime-pro-3.29.0.152.json'));
const root='/Users/mdf/code/.worktrees/smart-remarkable-pro-3290152';
const rows=fs.readFileSync(root+'/build/pro-3.29.0.152/ordered-full-stack.sha256','utf8').trim().split('\n');
const qmds=rows.map(row=>{const m=row.match(/^([a-f0-9]{64})  (\/.*)$/);assert(m);return {path:m[2],sha256:m[1]};});
assert.equal(qmds.length,12);
qmds.push({path:'/Users/mdf/code/remarkable-web-pdf-pro-3.29.0.152/.cache/pro-3.29.0.152-reviewed/restyle-with-webpdf.qmd',sha256:'8da621f11a4e0c1e29e33d1c27e3bc69c2fdfed15ee8c2ac4a760e56570973ec'});
for(const q of qmds)assert.equal(sha(fs.readFileSync(q.path)),q.sha256);
const spec={firmware:runtime.firmware,build:runtime.build,buildId:runtime.buildId,stockSha256:runtime.stockSha256,
    hashtabSha256:'5d5e9e6fe21a9dfbed27306aa57b137e3efdf59f5ba904df4440e222cdd2fe86',
    hashtabCaptureStatus:'two-canonical-captures-equal',
    canonicalTableSha256:'620a29ae311272d471fa87263541b8ad9874b890a5b8aa17681033773cf1f624',
    qmds,additionalResources:[root+'/build/pro-3.29.0.152/inputs'],runtime};
if(process.argv[2]){
    const bytes=fs.readFileSync(process.argv[2]);assert.equal(sha(bytes),process.argv[3],'Fresh controller inventory changed');
    spec.controller=JSON.parse(bytes);
}
const bytes=JSON.stringify(spec,null,2)+'\n',hash=sha(bytes);
fs.mkdirSync('build/pro-3.29.0.152',{recursive:true});
const out='build/pro-3.29.0.152/coordinator-'+hash.slice(0,12)+'.json';
if(fs.existsSync(out))assert.equal(sha(fs.readFileSync(out)),hash);else fs.writeFileSync(out,bytes,{mode:0o600,flag:'wx'});
console.log(out+' '+hash);
