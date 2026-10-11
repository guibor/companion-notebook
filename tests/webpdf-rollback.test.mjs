import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {renderWebpdfRollback,validateWebpdfRollback,webpdfTarget} from '../ops/webpdf-rollback.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const reviewed=JSON.parse(fs.readFileSync(new URL('../profiles/webpdf-page-links-transition.json',import.meta.url)));
function transitionFixture(){return {transition:reviewed.transition,target:webpdfTarget,
    previousApp:'/home/root/.codex-backups/webpdf-update-20261011T000000Z/previous-app',
    backupArchive:'/home/root/.codex-backups/webpdf-update-20261011T000000Z/before.tar.gz',
    backupArchiveSha256:sha('archive'),oldFiles:{...reviewed.oldFiles,SHA256SUMS:sha('old-manifest')},
    newFiles:{...reviewed.newFiles,SHA256SUMS:sha('new-manifest')}};}
test('only exact reviewed protocol transition permits backend replacement',()=>{
    const r=transitionFixture();validateWebpdfRollback(r,[]);
    for(const mutate of [r=>delete r.transition,r=>r.transition='anything',
        r=>r.newFiles['backend/entry']=sha('foreign'),r=>r.oldFiles['backend/entry']=sha('foreign'),
        r=>delete r.newFiles['licenses/github.com-pdfcpu-pdfcpu-LICENSE.txt'],
        r=>r.newFiles.extra=sha('extra'),r=>r.newFiles['manifest.json']=sha('foreign'),
        r=>delete r.newFiles.SHA256SUMS]){
        const other=transitionFixture();mutate(other);assert.throws(()=>validateWebpdfRollback(other,[]));
    }
    assert.throws(()=>validateWebpdfRollback(r,[{path:webpdfTarget+'/backend/entry',sha256:sha('mismatch')}]));
});
for(const mode of ['normal','after-first-move','after-second-move','accepted','foreign','mapped','backend','backend-mapped'])test('paired app rollback: '+mode,()=>{
    const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'cn-webpdf-')));
    try{
        const target=dir+'/app',old=dir+'/old',B=dir+'/state';
        for(const p of [target,old,B])fs.mkdirSync(p);
        fs.writeFileSync(target+'/file','new');fs.writeFileSync(old+'/file','old');fs.writeFileSync(dir+'/archive','backup');
        for(const p of [target,old])fs.mkdirSync(p+'/backend');
        fs.writeFileSync(target+'/backend/entry','protocol3');fs.writeFileSync(old+'/backend/entry','protocol2');
        fs.writeFileSync(dir+'/maps',mode==='backend-mapped'?target+'/backend/entry':'unrelated');
        const r={target,previousApp:old,backupArchive:dir+'/archive',backupArchiveSha256:sha('backup'),
            oldFiles:{file:sha('old'),'backend/entry':sha('protocol2')},newFiles:{file:sha('new'),'backend/entry':sha('protocol3')}};
        if(mode.startsWith('after-')){
            fs.writeFileSync(B+'/webpdf-rollback-intent','paired-v1');fs.renameSync(target,B+'/webpdf-new-retained');
            if(mode==='after-second-move')fs.renameSync(old,target);
        }
        if(mode==='foreign')fs.writeFileSync(target+'/extra','foreign');
        const script=`set -Eeuo pipefail
B=${JSON.stringify(B)}; ACTION=watchdog
absent(){ [ ! -e "$1" ] && [ ! -L "$1" ]; }
exact(){ [ -f "$1" ] && [ ! -L "$1" ] && [ "$(shasum -a 256 "$1" | cut -d' ' -f1)" = "$2" ]; }
mark(){ printf '%s' "$2" >"$B/$1"; }
verify_policy(){ [ "$1" = base ]; }; healthy(){ [ "$1" = base ]; }; sync(){ :; }
pgrep(){ return ${mode==='backend'?0:1}; }
${renderWebpdfRollback(r).replace('/proc/[0-9]*/maps',dir+'/maps')}
${mode==='mapped'?'webpdf_quiescent(){ return 1; }':''}
${mode==='accepted'?'mark webpdf-accepted "$WEBPDF_ACCEPTED"':''}
if restore_webpdf_pair; then echo PASS; else echo REFUSED; fi
`;
        const result=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
        assert.equal(result.status,0,result.stderr);
        const refused=['foreign','mapped','backend','backend-mapped'].includes(mode);
        assert.equal(result.stdout.trim(),refused?'REFUSED':'PASS',result.stderr);
        assert.equal(fs.readFileSync(target+'/file','utf8'),refused||mode==='accepted'?'new':'old');
        assert.equal(fs.readFileSync(target+'/backend/entry','utf8'),refused||mode==='accepted'?'protocol3':'protocol2');
        if(!refused&&mode!=='accepted'){
            const again=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
            assert.equal(again.stdout.trim(),'PASS',again.stderr);
        }
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
