// Offline renderer. No SSH, publication, service operations or guessed live pins.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {targets} from './firmware-target.mjs';

export const baselinePath='/Users/mdf/code/companion-notebook/build/pilot-20260923T234000Z-1/probe.sh';
export const baselineSha256='69f47fdd9a1e29b89153b2bd51ff6afbe1e00952eee9398e32b61318987d4d98';
export const restylePayload={
    'restyle-highlights.qmd':{path:'/Users/mdf/code/remarkable-web-pdf-pro-3.29.0.152/.cache/pro-3.29.0.152-reviewed/restyle-with-webpdf.qmd',sha256:'8da621f11a4e0c1e29e33d1c27e3bc69c2fdfed15ee8c2ac4a760e56570973ec'},
    'restyle-qmldir':{path:'/Users/mdf/code/remarkable-restyle/.cache/pro-3.29.0.152-highlights-enabled/restyle-qmldir',sha256:'1466ee581f558129f703189295216d2f1eebfffe0366afc899146207cd3d47f3'},
    'librestylehighlightsplugin.so':{path:'/Users/mdf/code/remarkable-restyle/.cache/pro-3.29.0.152-highlights-enabled/librestylehighlightsplugin.so',sha256:'f770c556b641ddf7cdcef1964766cb473a66d1e863aab34d4c5f8f9ca3c5244c'}
};
const digest=b=>createHash('sha256').update(b).digest('hex');
const X='/home/root/xovi', Q=X+'/exthome/qt-resource-rebuilder';
const H='/home/root/.local/lib/companion-notebook', D='/home/root/.local/share/companion-notebook';
const runtime=JSON.parse(fs.readFileSync(new URL('../profiles/runtime-pro-3.29.0.152.json',import.meta.url)));
const hash=s=>assert(/^[a-f0-9]{64}$/.test(s||''),'Missing SHA256');
const safePath=s=>assert(typeof s==='string'&&/^\/[A-Za-z0-9_./+-]+$/.test(s)&&!s.split('/').some(x=>x==='..'||x==='.')&&!s.includes('//'),'Unsafe absolute path');
const quote=s=>"'"+s+"'"; // All interpolated inputs are allowlisted below.
const pins=list=>list.map(f=>`    exact ${quote(f.path)} ${f.sha256} || return 1`).join('\n');
function entries(list,label) {
    assert(Array.isArray(list)&&list.length>0,`Missing fresh ${label}`);
    for(const f of list){safePath(f.path);hash(f.sha256);}
    assert.equal(new Set(list.map(f=>f.path)).size,list.length,`Duplicate ${label}`);
}

export function validateController(spec) {
    const t=targets['3.29.0.152'], c=spec.controller;
    assert.equal(spec.firmware,t.version||'3.29.0.152');
    assert.equal(spec.stockSha256,t.stockSha256);assert.equal(spec.build,t.build);assert.equal(spec.buildId,t.buildId);
    hash(spec.hashtabSha256);assert.notEqual(spec.hashtabSha256,targets['3.29.0.148'].tableSha256);
    assert.equal(spec.hashtabCaptureStatus,'two-canonical-captures-equal','Final table capture required');
    assert(c&&c.observedFirmware==='3.29.0.152','Fresh controller inventory required');
    assert.equal(c.source,'ReManager fresh device observation');hash(c.serialSha256);
    assert.equal(c.serialSha256,'106f4d0672a9c180cdb151938872747026d6d39ab56fd73ed01c814ed0ff8d38');
    assert.equal(spec.runtime?.stockSha256,t.stockSha256);
    for(const [soname,v]of Object.entries(runtime.libraries)) {
        assert.equal(spec.runtime.libraries[soname]?.sha256,v.sha256,`Runtime changed: ${soname}`);
        assert.equal(spec.runtime.libraries[soname]?.devicePath,v.devicePath);
    }
    entries(c.files,'base file inventory');entries(c.settings,'current settings inventory');
    entries(c.hostFiles,'current host preimages');entries(c.policy.files,'service policy inventory');
    const byPath=new Map(c.files.map(f=>[f.path,f.sha256]));
    assert.equal(byPath.get(Q+'/hashtab'),spec.hashtabSha256,'Actual base table missing');
    assert(c.qmds?.length>0,'Missing staged base QMD inventory');
    const names=new Set();
    for(const q of c.qmds){assert(/^[a-zA-Z0-9_.-]+\.qmd$/.test(q.name));hash(q.sha256);assert(!names.has(q.name));names.add(q.name);
        assert(!/restyle|companion/i.test(q.name),'Base must exclude separately staged Companion/Restyle');assert.equal(byPath.get(Q+'/'+q.name),q.sha256);}
    // The complete loaded extension tree must be enumerated, not an old allowlist.
    assert(c.directories?.some(x=>x.path===X+'/extensions.d'),'Missing extension directory inventory');
    assert(c.directories.some(x=>x.path===Q),'Missing QMD directory inventory');
    for(const dir of c.directories){safePath(dir.path);assert(dir.names?.length>0);
        assert.equal(new Set(dir.names).size,dir.names.length);
        for(const n of dir.names){assert(/^[A-Za-z0-9_.+-]+$/.test(n)&&n!=='.'&&n!=='..');assert(byPath.has(dir.path+'/'+n),'Directory entry must have a fresh file pin');}}
    const qdir=c.directories.find(x=>x.path===Q);
    assert.deepEqual([...qdir.names].sort(),[...names,'hashtab'].sort());
    const settings=new Map(c.settings.map(f=>[f.path,f.sha256]));
    for(const p of [D+'/pairs.ini','/home/root/.config/gestik.json','/home/root/.local/share/gestik-beta/gestik.json',
        '/home/root/.local/share/notebook-date-index/settings.json','/home/root/.local/share/notebook-date-index/token',
        '/home/root/.local/share/notebook-date-index/sync.json',X+'/exthome/appload/remarkable-dispatch/settings.env'])
        assert(settings.has(p),'Missing current settings: '+p);
    for(const f of c.hostFiles)assert(f.path.startsWith(H+'/'),'Host inventory outside module root');
    assert(c.hostFiles.some(f=>f.path===H+'/NativeHost.qml'));
    const p=c.policy, files=new Map(p.files.map(f=>[f.path,f.sha256]));
    safePath(p.fragmentPath);assert(files.has(p.fragmentPath));
    assert(p.dropInPaths?.length>0);for(const s of p.dropInPaths){safePath(s);assert(files.has(s));}
    assert.deepEqual(p.dropInPaths.map(s=>s.split('/').at(-1)),p.dropInPaths.map(s=>s.split('/').at(-1)).sort(),'Drop-in order must be explicit');
    assert(p.dropInPaths.every(s=>s.split('/').at(-1)<'zzzzz-companion-0000'),'Fresh base drop-in would override Companion');
    assert.equal(p.onFailure,'');assert.equal(p.restart,'no');
    // Require freshly observed coordinator-owned /run shadows for both vendor
    // sources. We verify/retain these; never replay the old .148 /run policy.
    for(const [key,expected]of Object.entries(runtime.vendorPolicyHashes)) {
        const v=p.vendorShadows?.[key];assert(v,'Missing failure-policy shadow: '+key);
        safePath(v.vendorPath);safePath(v.shadowPath);
        assert(v.vendorPath.startsWith('/usr/lib/systemd/system/'));
        assert.equal(v.shadowPath,v.vendorPath.replace('/usr/lib/','/run/'));
        assert.equal(files.get(v.vendorPath),expected,'Vendor policy changed');assert(files.has(v.shadowPath));
        assert(v.shadowPath===p.fragmentPath||p.dropInPaths.includes(v.shadowPath),'Shadow not effective');
    }
    assert(p.fragmentPath.startsWith('/run/systemd/system/'));
    assert.equal(c.baseEnvironment?.LD_PRELOAD,X+'/xovi.so');
    assert(c.baseEnvironment.XOVI_ROOT?.startsWith(X+'/'));
    for(const [k,v]of Object.entries({QML_DISABLE_DISK_CACHE:'1',QML_XHR_ALLOW_FILE_WRITE:'1',QML_XHR_ALLOW_FILE_READ:'1',MALLOC_ARENA_MAX:'8'}))assert.equal(c.baseEnvironment[k],v);
    assert(!Object.hasOwn(c.baseEnvironment,'QMLDIFF_HASHTAB_CREATE'));
    for(const [k,v]of Object.entries(c.baseEnvironment)){assert(/^[A-Z_0-9]+$/.test(k));assert(/^[A-Za-z0-9_./:+-]+$/.test(v));}
    assert(Array.isArray(c.qmlImportRoots),'Explicit current import roots required (may be empty)');
    for(const root of c.qmlImportRoots){safePath(root);assert(!root.startsWith(H));assert(c.files.some(f=>f.path.startsWith(root+'/')));}
    assert.equal(c.baseEnvironment.QML_IMPORT_PATH,c.qmlImportRoots.length?c.qmlImportRoots.join(':'):undefined);
    assert(c.baseMaps?.includes(X+'/xovi.so'));
    for(const m of c.baseMaps){safePath(m);assert(byPath.has(m));assert(!m.includes('libcompanion'));}
    assert(!c.baseMaps.some(m=>/restyle/i.test(m)),'Combined controller stages its own reviewed Restyle module');
    // WebPDF is a QML/Go application, not a native QML module. Its selection
    // files are absolute-path resources; do not invent a WebPDF DSO/import root.
    for(const name of ['SelectionHost.qml','SelectionLinks.qml','Links.js'])
        assert(byPath.has(X+'/exthome/appload/remarkable-web-pdf/integration/'+name),'Missing WebPDF selection resource');
    assert(Array.isArray(c.absentLocks)&&c.absentLocks.includes('/run/pro329-apps-activation.lock'));
    for(const lock of c.absentLocks){safePath(lock);assert(lock.startsWith('/run/'));}
    return c;
}

export function renderController(spec,baseline=fs.readFileSync(baselinePath,'utf8')) {
    assert.equal(digest(baseline),baselineSha256,'Reviewed watchdog template changed');
    const c=validateController(spec);
    let s=baseline;
    function change(a,b,count=1){assert.equal(s.split(a).length-1,count,'Template drift: '+a);s=s.replaceAll(a,()=>b);}
    function fn(name,body){const a=s.indexOf(name+'() {'),b=s.indexOf('\n}\n',a);assert(a>=0&&b>a,name);s=s.slice(0,a)+name+'() {\n'+body+'\n}'+s.slice(b+2);}
    const inventory=c.directories.map(d=>`    [ "$(names ${quote(d.path)})" = "$(printf '%s\\n' ${d.names.map(quote).join(' ')} | sort)" ] || return 1`).join('\n');
    const baseManifest=c.qmds.map(q=>q.sha256+'  '+q.name+'\n').join('');
    change('BASE_DROP=/run/systemd/system/xochitl.service.d/zzzz-pro329-apps-20260921T193500Z-3.conf\n','');
    change('3.29.0.148','3.29.0.152');change('20260911125116',spec.build);
    change('4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4',spec.stockSha256);
    change('1f2a0f7177dac3cdfc030ff32b4643170dd2ef6e2f6c6369b4c4168513ce01f0',spec.hashtabSha256,2);
    fn('verify_base_files',`    exact "$S/base.sha256" ${digest(baseManifest)} || return 1\n${pins(c.files)}\n${inventory}`);
    fn('verify_base_policy',`${pins(c.policy.files)}
    [ "$(systemctl show -p FragmentPath --value xochitl.service)" = ${quote(c.policy.fragmentPath)} ] || return 1
    [ -z "$(systemctl show -p OnFailure --value xochitl.service)" ] || return 1
    [ "$(systemctl show -p Restart --value xochitl.service)" = no ]`);
    change('local paths="/run/systemd/system/xochitl.service.d/xochitl-service-override.conf $BASE_DROP"',`local paths=${quote(c.policy.dropInPaths.join(' '))}`);
    change('[Service]\\nEnvironment="LD_PRELOAD=', '[Unit]\\nOnFailureJobMode=replace\\nStartLimitAction=none\\n[Service]\\nRestart=no\\nEnvironment="LD_PRELOAD=');
    const extraImports=c.qmlImportRoots.length?':'+c.qmlImportRoots.join(':'):'';
    change('QML_IMPORT_PATH=/home/root/.local/lib/companion-notebook/qml"',`QML_IMPORT_PATH=/home/root/.local/lib/companion-notebook/qml:%s/restyle-qml${extraImports}"`);
    change('"$R" "$B" "$B";;','"$R" "$B" "$B" "$B";;');
    change("stock) printf '[Service]", "stock) printf '[Unit]\\nOnFailureJobMode=replace\\nStartLimitAction=none\\n[Service]\\nRestart=no");
    change('expected="$X/services/xochitl.service/";',`expected=${quote(c.baseEnvironment.XOVI_ROOT)};`);
    const envChecks=Object.entries(c.baseEnvironment).filter(([k])=>!['LD_PRELOAD','XOVI_ROOT','QML_IMPORT_PATH'].includes(k)).map(([k,v])=>quote(k+'='+v)).join(' ');
    change('for expected in QML_DISABLE_DISK_CACHE=1 QML_XHR_ALLOW_FILE_WRITE=1 QML_XHR_ALLOW_FILE_READ=1 MALLOC_ARENA_MAX=8;',`for expected in ${envChecks};`);
    change('for item in "$X/xovi.so" "$X/extensions.d/qt-resource-rebuilder.so" "$X/extensions.d/appload.so" "$X/extensions.d/xovi-message-broker.so" "$X/extensions.d/framebuffer-spy.so";',`for item in ${c.baseMaps.map(quote).join(' ')};`);
    change('        ! printf \'%s\\n\' "$env" | grep -q \'^QMLDIFF_HASHTAB_CREATE=\' || return 1',`        expected=${quote(c.qmlImportRoots.join(':'))}
        if [ "$mode" = probe ]; then
            expected="$H/qml:$B/restyle-qml${extraImports}"
            awk -v p="$B/restyle-qml/Restyle/Highlights/librestylehighlightsplugin.so" '$NF==p {f=1} END {exit !f}' "/proc/$p/maps" || return 1
        fi
        if [ -n "$expected" ]; then printf '%s\\n' "$env" | grep -Fxq "QML_IMPORT_PATH=$expected" || return 1
        else ! printf '%s\\n' "$env" | grep -q '^QML_IMPORT_PATH=' || return 1; fi
        ! printf '%s\\n' "$env" | grep -q '^QMLDIFF_HASHTAB_CREATE=' || return 1`);
    change("printf 'hashtab\\ncompanion-notebook.qmd\\n';","printf 'hashtab\\ncompanion-notebook.qmd\\nrestyle-highlights.qmd\\n';");
    change('    exact "$dir/companion-notebook.qmd" "$(hash "$S/companion-notebook.qmd")"',`    exact "$dir/companion-notebook.qmd" "$(hash "$S/companion-notebook.qmd")" || return 1
    exact "$dir/restyle-highlights.qmd" "$(hash "$S/restyle-highlights.qmd")" || return 1
    exact "$B/restyle-qml/Restyle/Highlights/qmldir" "$(hash "$S/restyle-qmldir")" || return 1
    exact "$B/restyle-qml/Restyle/Highlights/librestylehighlightsplugin.so" "$(hash "$S/librestylehighlightsplugin.so")"`);
    change('libcompanionbootstrap.so | sort)','libcompanionbootstrap.so restyle-highlights.qmd restyle-qmldir librestylehighlightsplugin.so | sort)',2);
    change('[ "$(wc -l <"$S/SHA256SUMS")" -eq 9 ]','[ "$(wc -l <"$S/SHA256SUMS")" -eq 12 ]');
    change('    grep -Fq \'import Companion.Admission 1.0 as Admission\'',Object.entries(restylePayload).map(([name,v])=>`    exact "$S/${name}" ${v.sha256} || return 1`).join('\n')+'\n    grep -Fq \'import Companion.Admission 1.0 as Admission\'');
    change('    render_policy probe >"$B/policy-probe.conf"',`    mkdir -p "$B/restyle-qml/Restyle/Highlights"
    cp "$S/restyle-qmldir" "$B/restyle-qml/Restyle/Highlights/qmldir"
    cp "$S/librestylehighlightsplugin.so" "$B/restyle-qml/Restyle/Highlights/"
    cp "$S/restyle-highlights.qmd" "$R/exthome/qt-resource-rebuilder/"
    render_policy probe >"$B/policy-probe.conf"`);
    fn('settings',`    sha256sum ${c.settings.map(f=>quote(f.path)).join(' ')}`);
    change('    absent /run/pro329-apps-activation.lock || return 1',c.absentLocks.map(p=>`    absent ${quote(p)} || return 1`).join('\n'));
    const helpers=`verify_current_settings() {
${pins(c.settings)}
}
verify_old_host() {
    local root=$1 p
    private "$root" || return 1
    [ "$(find "$root" -type l | wc -l)" -eq 0 ] || return 1
    [ "$(find "$root" -type f | sed "s|^$root/||" | sort)" = "$(printf '%s\\n' ${c.hostFiles.map(f=>quote(f.path.slice(H.length+1))).join(' ')} | sort)" ] || return 1
${c.hostFiles.map(f=>`    exact "$root/${f.path.slice(H.length+1)}" ${f.sha256} || return 1`).join('\n')}
}
`;
    change('verify_prepared() {',helpers+'verify_prepared() {');
    const seedStart=s.indexOf('    private "$B/data-prepared"'),seedEnd=s.indexOf('    [ "$(names "$B/host-prepared")',seedStart);
    assert(seedStart>0&&seedEnd>seedStart);s=s.slice(0,seedStart)+s.slice(seedEnd);
    fn('cleanup_host',`    # Preserve the live data directory in place, including edits after activation.
    # Recovery never seeds pairs.ini and never restores either Gestik preimage.
    if ! absent "$B/host-before"; then
        verify_old_host "$B/host-before" || return 1
        if ! absent "$H"; then
            verify_observer "$H" || return 1
            for f in NativeHost.qml PairStore.js SizeRuler.qml; do exact "$H/$f" "$(hash "$S/$f")" || return 1; done
            absent "$B/host-retained" || return 1
            mv "$H" "$B/host-retained" || return 1
        fi
        mv "$B/host-before" "$H" || return 1
    fi
    verify_old_host "$H" || return 1
    private "$D" || return 1`);
    change('    absent "$B"; absent "$H"; absent "$D"; absent "$LOCK"','    absent "$B"; absent "$LOCK"; verify_old_host "$H"; private "$D"; verify_current_settings');
    const tarStart=s.indexOf('    tar -czf "$B/preimages.tgz"'),tarEnd=s.indexOf('    tar -tzf',tarStart);
    assert(tarEnd>tarStart);
    const backups=[...new Set([...c.policy.files,...c.settings,...c.files,...c.hostFiles].map(f=>f.path.slice(1)))];
    s=s.slice(0,tarStart)+`    tar -cf - -C / ${backups.map(quote).join(' ')} | gzip -1 >"$B/preimages.tgz"\n`+s.slice(tarEnd);
    const prepStart=s.indexOf('    mkdir -m 0700 "$B/host-prepared" "$B/data-prepared"'),prepEnd=s.indexOf('    cp "$S/NativeHost.qml"',prepStart);
    assert(prepEnd>prepStart);s=s.slice(0,prepStart)+'    mkdir -m 0700 "$B/host-prepared"\n'+s.slice(prepEnd);
    change('absent "$H"; absent "$D"; absent "$B/owner"','verify_old_host "$H"; private "$D"; verify_current_settings; absent "$B/owner"; absent "$B/host-before"');
    change('mv "$B/host-prepared" "$H"\nmv "$B/data-prepared" "$D"','mv "$H" "$B/host-before"\nmv "$B/host-prepared" "$H"');
    const start=s.indexOf('sleep 3\nhealthy probe\nprobe_pid='),end=s.indexOf('mark pilot-running "$probe_pid"',start);
    assert(start>0&&end>start,'Startup template drift');
    s=s.slice(0,start)+`# A cold QML rebuild can outlive the former three-second map check.
# Keep all readiness gates, but wait for them together under the live watchdog.
probe_pid=$(pid xochitl.service)
[[ "$probe_pid" =~ ^[1-9][0-9]*$ ]]
mark startup-waiting cold-qml-module-readiness
startup_ready=0
for n in $(seq 1 60); do
    systemctl is-active --quiet "$WATCH" || exit 1
    systemctl is-active --quiet xochitl.service || exit 1
    [ "$(pid xochitl.service)" = "$probe_pid" ] || exit 1
    [ "$(systemctl show -p NRestarts --value xochitl.service)" = 0 ] || exit 1
    if healthy probe &&
        grep -Fq 'Companion: host ready; ink=true; settings=true' "$B/probe.log" &&
        grep -Fq 'WebPDF: selection host ready' "$B/probe.log"; then
        startup_ready=1
        break
    fi
    sleep 1
done
[ "$startup_ready" = 1 ] || exit 1
`+s.slice(end);
    assert(!/202609|3\.29\.0\.148|old_pairs|pairs-seed|data-prepared|settings-retained|BASE_DROP/.test(s),'Historical replay remains');
    assert(!/mount\s|\/dev\/input|\/boot\//.test(s));
    return {source:s,baseManifest};
}
