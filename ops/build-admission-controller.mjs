// Build only; fresh exact-artifact review and target smoke remain mandatory.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const prior='build/retirement-native/probe.sh', out='build/admission-native';
assert.equal(hash(prior),'2fe7bdbaa4a7e9ad6b80ef417b02c3790d67be45fa9728267f6e60bac83177e4');
const elf=JSON.parse(fs.readFileSync('build/admission-arm64/elf-review.json'));
const plugin='build/admission-arm64/qml/Companion/Admission/libcompanionadmissionplugin.so';
assert.equal(hash(plugin),elf.module.sha256);
for(const [p,h] of Object.entries(elf.sourceHashes)) assert.equal(hash('native-admission/'+p),h);
let result=fs.readFileSync(prior,'utf8');
const once=(a,b)=>{assert.equal(result.split(a).length,2,'Controller anchor: '+a);result=result.replace(a,()=>b);};
result=result.replaceAll('Lifecycle','Admission').replaceAll('lifecycle','admission')
    .replaceAll('ad1b1d17a857908250d73f076064d0e0e9e047df644e35527b899529f55e65ef',elf.module.sha256)
    .replaceAll('fbc4c0fd3629f913f04dc6a2c56599074631e6a232d9bab770da811b4c3e23ae',hash('native-admission/qmldir'))
    .replaceAll('retirement','admission');
once('native-handler admission/recreation diagnostic','native-worker admission/park diagnostic');
once('        ! grep -Fq "$X/xovi.so" "/proc/$p/maps" || return 1',
    '        ! grep -Fq "$X/xovi.so" "/proc/$p/maps" || return 1\n        ! grep -Fq libcompanionadmissionplugin.so "/proc/$p/maps" || return 1');
once('Environment="XOVI_ROOT=%s/"\\n',
    'Environment="LD_PRELOAD=/home/root/.local/lib/companion-notebook/qml/Companion/Admission/libcompanionadmissionplugin.so:/home/root/xovi/xovi.so"\\nEnvironment="XOVI_ROOT=%s/"\\n');
once('        printf \'%s\\n\' "$env" | grep -Fxq "LD_PRELOAD=$X/xovi.so" || return 1',
    `        expected="$X/xovi.so"
        if [ "$mode" = probe ]; then
            expected="$H/qml/Companion/Admission/libcompanionadmissionplugin.so:$expected"
            grep -Fq "$H/qml/Companion/Admission/libcompanionadmissionplugin.so" "/proc/$p/maps" || return 1
        else
            ! grep -Fq libcompanionadmissionplugin.so "/proc/$p/maps" || return 1
        fi
        printf '%s\\n' "$env" | grep -Fxq "LD_PRELOAD=$expected" || return 1`);
once('Companion admission: both native handlers retired; generation=1',
    'Companion admission: drained during stroke; submissions=2; generation=1');
once('Companion admission: live geometry moved; steps=12;',
    'Companion admission: transition requested during second stroke');
result=result.replaceAll('Companion admission: round=2; height=1320',
    'Companion admission: round=2; height=1440; fresh-candidates=true');
const providers={
    'libQt6Core.so.6':'/usr/lib/libQt6Core.so.6.10.3','libQt6Gui.so.6':'/usr/lib/libQt6Gui.so.6.10.3',
    'libQt6Qml.so.6':'/usr/lib/libQt6Qml.so.6.10.3','libstdc++.so.6':'/usr/lib/libstdc++.so.6.0.36',
    'libgcc_s.so.1':'/usr/lib/libgcc_s.so.1','libc.so.6':'/usr/lib/libc.so.6',
    'libdl.so.2':'/usr/lib/libdl.so.2','libpthread.so.0':'/usr/lib/libpthread.so.0'};
const extra=Object.entries(elf.module.runtimeHashes).filter(([name])=>
    !result.includes('    exact '+providers[name]+' ')).map(([name,h])=>{
        assert(providers[name]); return `    exact ${providers[name]} ${h} || return 1`;
    }).join('\n');
once('    [ "$(findmnt -n -o OPTIONS / | tr \',\' \'\\n\' | grep -c \'^ro$\')" = 1 ]',
    extra+'\n    [ "$(findmnt -n -o OPTIONS / | tr \',\' \'\\n\' | grep -c \'^ro$\')" = 1 ]');
// Same 25-second observation, full checks bracket cheaper per-second checks.
const stability=`for n in $(seq 1 25); do
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    healthy probe
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    systemctl is-active --quiet "$WATCH"
    sleep 1
done`;
once(stability,`healthy probe
for n in $(seq 1 25); do
    if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    [ "$(systemctl show -p NRestarts --value xochitl.service)" = 0 ]
    systemctl is-active --quiet xochitl.service
    systemctl is-active --quiet "$WATCH"
    sleep 1
done
healthy probe`);
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(plugin,out+'/libcompanionadmissionplugin.so');
fs.copyFileSync('native-admission/qmldir',out+'/admission-qmldir');
for(const [p,h] of Object.entries({
    'ink-events':'bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e',
    'ink-events-second':'f15bd56c67ced9b8ea28dd5f9a447f1ffe39f7f27aef28f0500c95125d611453'})) {
    assert.equal(hash('build/retirement-native/'+p),h);
    fs.copyFileSync('build/retirement-native/'+p,out+'/'+p);
}
fs.writeFileSync(out+'/probe.sh',result,{mode:0o700});
execFileSync('/bin/bash',['-n',out+'/probe.sh']);
console.log('Admission controller built, not cleared for staging: '+hash(out+'/probe.sh'));
