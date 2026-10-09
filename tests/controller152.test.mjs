import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {renderController,validateController,baselinePath} from '../ops/controller-pro152.mjs';
const runtime=JSON.parse(fs.readFileSync('profiles/runtime-pro-3.29.0.152.json'));
const X='/home/root/xovi',Q=X+'/exthome/qt-resource-rebuilder',H='/home/root/.local/lib/companion-notebook';
const D='/home/root/.local/share/companion-notebook';
const a='a'.repeat(64),b='b'.repeat(64);
// Synthetic local-only inventories. Never used by the packager or saved as a
// coordinator receipt; real generation also binds stock, peers and the table.
function fixture(){
    const qmds=[{name:'bettertoc.qmd',sha256:a}];
    const roots=[];
    const baseMaps=[X+'/xovi.so',X+'/extensions.d/qt-resource-rebuilder.so'];
    const vendor='/usr/lib/systemd/system/xochitl.service',override=vendor+'.d/xochitl-service-override.conf';
    const shadow=vendor.replace('/usr/lib/','/run/'),os=override.replace('/usr/lib/','/run/');
    return {...runtime,hashtabSha256:a,hashtabCaptureStatus:'two-canonical-captures-equal',runtime,
        controller:{observedFirmware:'3.29.0.152',source:'ReManager fresh device observation',
            serialSha256:'106f4d0672a9c180cdb151938872747026d6d39ab56fd73ed01c814ed0ff8d38',
            qmds,files:[...baseMaps.map(path=>({path,sha256:a})),...['SelectionHost.qml','SelectionLinks.qml','Links.js'].map(n=>({path:X+'/exthome/appload/remarkable-web-pdf/integration/'+n,sha256:a})),{path:Q+'/hashtab',sha256:a},...qmds.map(q=>({path:Q+'/'+q.name,sha256:q.sha256}))],
            directories:[{path:Q,names:['hashtab',...qmds.map(q=>q.name)]},{path:X+'/extensions.d',names:['qt-resource-rebuilder.so']}],
            settings:[D+'/pairs.ini','/home/root/.config/gestik.json','/home/root/.local/share/gestik-beta/gestik.json',
                '/home/root/.local/share/notebook-date-index/settings.json','/home/root/.local/share/notebook-date-index/token',
                '/home/root/.local/share/notebook-date-index/sync.json',X+'/exthome/appload/remarkable-dispatch/settings.env'].map(path=>({path,sha256:a})),
            hostFiles:[{path:H+'/NativeHost.qml',sha256:b}],
            policy:{fragmentPath:shadow,dropInPaths:[os],onFailure:'',restart:'no',
                files:[{path:vendor,sha256:runtime.vendorPolicyHashes.unit},{path:override,sha256:runtime.vendorPolicyHashes.sameBasenameOverride},{path:shadow,sha256:a},{path:os,sha256:a}],
                vendorShadows:{unit:{vendorPath:vendor,shadowPath:shadow},sameBasenameOverride:{vendorPath:override,shadowPath:os}}},
            qmlImportRoots:roots,baseMaps,baseEnvironment:{LD_PRELOAD:X+'/xovi.so',XOVI_ROOT:X+'/services/xochitl.service/',QML_DISABLE_DISK_CACHE:'1',QML_XHR_ALLOW_FILE_WRITE:'1',QML_XHR_ALLOW_FILE_READ:'1',MALLOC_ARENA_MAX:'8'},
            absentLocks:['/run/pro329-apps-activation.lock']}};
}
const original=fs.readFileSync(baselinePath,'utf8');
const rendered=renderController(fixture()).source;
const section=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
test('rendered .152 controller parses, has no old replay or settings seed',()=>{
    assert.equal(spawnSync('/bin/bash',['-n'],{input:rendered,encoding:'utf8'}).status,0);
    assert.doesNotMatch(rendered,/202609|3\.29\.0\.148|old_pairs|pairs-seed|data-prepared|settings-retained|BASE_DROP/);
    assert.doesNotMatch(rendered,/mount\s|\/dev\/input|\/boot\//);
    assert.match(rendered,/IMG_VERSION="3\.29\.0\.152"/);
    assert.match(rendered,/verify_current_settings/);
    assert.doesNotMatch(rendered,/(?:cp|mv|rm) [^\n]*"\$D(?:"|\/)/);
});
test('watchdog ownership, suspend-aware loop and bounded recovery are unchanged',()=>{
    for(const [a,b]of [['owner_cgroup_empty() {','\n# Watchdog retry accounting'],
        ['# Watchdog retry accounting','\nverify_stage\n'],
        ['if [ "$ACTION" = watchdog ]; then\n    verify_policy_sources','\n[ "$ACTION" = run ]']])
        assert.equal(section(rendered,a,b),section(original,a,b),a);
    assert(rendered.indexOf('systemctl is-active --quiet "$WATCH"')<rendered.indexOf('mv "$H" "$B/host-before"'));
    assert.match(rendered,/KillMode --value "\$OWNER"\)" = control-group/);
});
test('explicit current settings, native peer maps and effective policy shadows are mandatory',()=>{
    for(const mutate of [s=>delete s.controller,s=>s.controller.settings.pop(),s=>s.controller.hostFiles=[],
        s=>delete s.controller.policy.vendorShadows,s=>s.controller.policy.restart='on-failure',
        s=>s.controller.policy.onFailure='old-restorer.service',s=>delete s.controller.qmlImportRoots,
        s=>s.controller.baseMaps.shift(),s=>s.hashtabCaptureStatus='first-capture-only',
        s=>s.controller.observedFirmware='3.29.0.148',s=>s.runtime={...runtime,libraries:{}},
        s=>s.controller.files[0].path='/tmp/$(touch-bad)',s=>s.controller.files[0].path='/a/../b']){
        const spec=fixture();mutate(spec);assert.throws(()=>validateController(spec));
    }
    assert.throws(()=>renderController(fixture(),original+'\n'),/template changed/);
});
test('fresh pins retain both Gestik preimages and append the real native import root',()=>{
    assert.match(rendered,/tar -cf -[^\n]*home\/root\/\.config\/gestik.json[^\n]*home\/root\/\.local\/share\/gestik-beta\/gestik.json[^\n]*\| gzip -1 >"\$B\/preimages.tgz"/);
    assert.match(rendered,/QML_IMPORT_PATH=\/home\/root\/\.local\/lib\/companion-notebook\/qml:%s\/restyle-qml/);
    assert.match(rendered,/restyle-highlights.qmd restyle-qmldir librestylehighlightsplugin.so/);
    assert.match(rendered,/\[Unit\]\\nOnFailureJobMode=replace\\nStartLimitAction=none\\n\[Service\]\\nRestart=no/);
    assert.doesNotMatch(rendered,/OnFailure=\\n/,'Cannot clear systemd dependency targets with an empty late drop-in');
});

// Execute the actual generated recovery body in an isolated mock environment.
// No systemctl binary, device, settings or real service path is accessed.
function recovery({baseFails=false,foreign=false,childAlive=false,retry=false}={}){
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cn152-recovery-'));
    try{
        fs.mkdirSync(dir+'/state');fs.mkdirSync(dir+'/lock');fs.writeFileSync(dir+'/drop',foreign?'foreign':'probe');
        fs.writeFileSync(dir+'/state/dates-pid','19');fs.writeFileSync(dir+'/state/settings.sha256','');
        const script=`set -Eeuo pipefail
B=${JSON.stringify(dir+'/state')}; DROP=${JSON.stringify(dir+'/drop')}; LOCK=${JSON.stringify(dir+'/lock')}
OWNER=owner; MODE=probe; STARTS=0; CLEANUPS=0
hash(){ case "$1" in */policy-probe.conf) printf probe;; */policy-stock.conf) printf stock;; *) cat "$1";; esac; }
exact(){ [ -f "$1" ] && [ "$(cat "$1")" = "$2" ]; }
absent(){ [ ! -e "$1" ]; }
mark(){ printf '%s\\n' "$2" >"$B/$1"; }
pid(){ case "$1" in owner) printf 0;; notebook-date-index.service) printf 19;; *) printf 22;; esac; }
verify_device(){ :; }; verify_base_files(){ :; }; verify_base_policy(){ :; }; verify_policy_sources(){ :; }
verify_policy(){ if [ "$1" = base ]; then absent "$DROP"; fi; }
healthy(){ [ "$MODE" = "$1" ]; }
publish_policy(){ printf '%s' "$1" >"$DROP"; }
owner_cgroup_empty(){ return ${childAlive?1:0}; }
cleanup_host(){ CLEANUPS=$((CLEANUPS+1)); [ "$CLEANUPS" -gt ${retry?1:0} ]; }
sha256sum(){ :; }; sleep(){ :; }; sync(){ :; }
systemctl(){ if [ "$1" = start ]; then STARTS=$((STARTS+1)); if [ -f "$DROP" ] && [ "$(cat "$DROP")" = stock ]; then MODE=stock; elif [ ${baseFails?1:0} = 0 ]; then MODE=base; else MODE=failed; fi; fi; }
${section(rendered,'recover() {','\n# Watchdog retry accounting')}
${retry?'recover first || true':''}
if recover test; then printf 'PASS:%s:%s' "$MODE" "$STARTS"; else printf 'REFUSED:%s' "$STARTS"; fi
`;
        const r=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
test('generated recovery: one base restart and no unnecessary stock restart',()=>assert.equal(recovery(),'PASS:base:1'));
test('generated recovery: failed base gets one stock attempt, retry cannot restart again',()=>assert.equal(recovery({baseFails:true,retry:true}),'PASS:stock:2'));
test('generated recovery: surviving owner child prevents all restarts',()=>assert.equal(recovery({childAlive:true}),'REFUSED:0'));
test('generated recovery: foreign drop-in is preserved with no restart',()=>assert.equal(recovery({foreign:true}),'REFUSED:0'));

for(const [scenario,readyAfter,status]of [['cold-start',7,0],['timeout',61,1],['pid-changed',7,1],['watchdog-lost',7,1]]){
    test('bounded startup keeps mapping/readiness gates: '+scenario,()=>{
        const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cn152-startup-'));
        try{
            fs.writeFileSync(dir+'/probe.log','Companion: host ready; ink=true; settings=true\nWebPDF: selection host ready\n');
            const body=section(rendered,'probe_pid=$(pid xochitl.service)\n[[','mark pilot-running');
            const r=spawnSync('/bin/bash',['-c',`set -Eeuo pipefail
B=${JSON.stringify(dir)}; WATCH=watch; POLLS=0
pid(){ if [ ${JSON.stringify(scenario)} = pid-changed ] && [ "$POLLS" -ge 2 ]; then printf 24; else printf 23; fi; }
mark(){ :; }
systemctl(){ if [ "$1" = show ]; then printf 0; elif [ "$3" = watch ] && [ ${JSON.stringify(scenario)} = watchdog-lost ] && [ "$POLLS" -ge 2 ]; then return 1; fi; }
healthy(){ POLLS=$((POLLS+1)); [ "$POLLS" -ge ${readyAfter} ]; }
sleep(){ :; }
${body}
printf 'READY:%s' "$POLLS"
`],{encoding:'utf8'});
            assert.equal(r.status,status,r.stderr);
            if(status===0)assert.equal(r.stdout,'READY:7');
            else assert.doesNotMatch(r.stdout,/READY/);
        }finally{fs.rmSync(dir,{recursive:true,force:true});}
    });
}

for(const phase of ['before-host-move','after-old-host-move','after-new-host-move','foreign-host']){
    test('settings untouched and old module restored: '+phase,()=>{
        const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cn152-settings-'));
        try{
            for(const p of ['backup','stage','data'])fs.mkdirSync(dir+'/'+p);
            fs.writeFileSync(dir+'/data/pairs.ini','latest-user-edits\n');
            const old=phase==='before-host-move'?'/host':'/backup/host-before';fs.mkdirSync(dir+old);fs.writeFileSync(dir+old+'/old','original-module');
            if(phase==='after-new-host-move'||phase==='foreign-host'){
                fs.mkdirSync(dir+'/host');for(const f of ['NativeHost.qml','PairStore.js','SizeRuler.qml'])fs.writeFileSync(dir+'/host/'+f,phase==='foreign-host'?'foreign':'new');
            }
            for(const f of ['NativeHost.qml','PairStore.js','SizeRuler.qml'])fs.writeFileSync(dir+'/stage/'+f,'new');
            const script=`set -Eeuo pipefail
B=${JSON.stringify(dir+'/backup')}; H=${JSON.stringify(dir+'/host')}; D=${JSON.stringify(dir+'/data')}; S=${JSON.stringify(dir+'/stage')}
absent(){ [ ! -e "$1" ]; }; private(){ [ -d "$1" ]; }
hash(){ cat "$1"; }; exact(){ [ "$(cat "$1")" = "$2" ]; }
verify_old_host(){ [ -f "$1/old" ]; }; verify_observer(){ :; }
${section(rendered,'cleanup_host() {','owner_cgroup_empty() {')}
if cleanup_host; then cleanup_host; printf PASS; else printf REFUSED; fi
`;
            const r=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
            assert.equal(r.stdout,phase==='foreign-host'?'REFUSED':'PASS');
            assert.equal(fs.readFileSync(dir+'/data/pairs.ini','utf8'),'latest-user-edits\n');
            if(phase!=='foreign-host')assert.equal(fs.readFileSync(dir+'/host/old','utf8'),'original-module');
        }finally{fs.rmSync(dir,{recursive:true,force:true});}
    });
}
