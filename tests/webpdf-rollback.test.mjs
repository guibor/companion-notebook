import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {renderWebpdfRollback} from '../ops/webpdf-rollback.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
for(const mode of ['normal','after-first-move','after-second-move','accepted','foreign','mapped','backend'])test('paired app rollback: '+mode,()=>{
    const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'cn-webpdf-')));
    try{
        const target=dir+'/app',old=dir+'/old',B=dir+'/state';
        for(const p of [target,old,B])fs.mkdirSync(p);
        fs.writeFileSync(target+'/file','new');fs.writeFileSync(old+'/file','old');fs.writeFileSync(dir+'/archive','backup');
        const r={target,previousApp:old,backupArchive:dir+'/archive',backupArchiveSha256:sha('backup'),oldFiles:{file:sha('old')},newFiles:{file:sha('new')}};
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
${renderWebpdfRollback(r)}
${mode==='mapped'?'webpdf_quiescent(){ return 1; }':''}
${mode==='accepted'?'mark webpdf-accepted "$WEBPDF_ACCEPTED"':''}
if restore_webpdf_pair; then echo PASS; else echo REFUSED; fi
`;
        const result=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
        assert.equal(result.status,0,result.stderr);
        const refused=['foreign','mapped','backend'].includes(mode);
        assert.equal(result.stdout.trim(),refused?'REFUSED':'PASS',result.stderr);
        assert.equal(fs.readFileSync(target+'/file','utf8'),refused||mode==='accepted'?'new':'old');
        if(!refused&&mode!=='accepted'){
            const again=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
            assert.equal(again.stdout.trim(),'PASS',again.stderr);
        }
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
