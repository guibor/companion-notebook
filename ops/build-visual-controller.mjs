// Local-only derivative: no pen events, observer module or Qt capture paths.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const original='build/structural-native/probe.sh',out='build/visual-native';
// A fixture-enabled desktop executable is never used by this build path.
execFileSync(process.execPath,['ops/build-visual-reader.mjs'],{stdio:'inherit'});
assert.equal(hash(original),'99980076ef07dbda84bddafbbf77f4bedb365d372f41fdbfb9a95ee8c8335bd0');
let source=fs.readFileSync(original,'utf8');
const replace=(a,b)=>{assert.equal(source.split(a).length,2,'Visual controller anchor: '+a);source=source.replace(a,()=>b);};
replace('# A bounded no-capture structural trial from accepted r1 base; not visual acceptance.\n# Native APIs create test notebooks; no ink or direct notebook-file edits. Always reverts.',
  '# A pen-disabled reopen of two exact saved disposable notes. Always reverts.\n# External read-only spy-buffer copies only; no Qt grabs or personal-note captures.');
for(const prefix of ['SHA256SUMS ',''])replace(prefix+'NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh | sort)',
  prefix+'NativeHost.qml PairStore.js companion-notebook.qmd base.sha256 probe.sh capture-frame read-frame | sort)');
replace('[ "$(wc -l <"$S/SHA256SUMS")" -eq 5 ]','[ "$(wc -l <"$S/SHA256SUMS")" -eq 7 ]');
replace("    grep -Fq 'capture=not-attempted; visual=unverified' \"$S/NativeHost.qml\" || return 1",
  `    exact "$S/capture-frame" ${hash('ops/capture-visual-frame.sh')} || return 1
    [ "$(stat -c %u:%g:%a "$S/capture-frame")" = 0:0:700 ] || return 1
    exact "$S/read-frame" ${hash(out+'/read-frame')} || return 1
    [ "$(stat -c %u:%g:%a "$S/read-frame")" = 0:0:700 ] || return 1
    grep -Fq 'Companion visual: ready;' "$S/NativeHost.qml" || return 1`);
// Note-file checks are BEFORE activation only, never in recovery: native open
// can update its own metadata and must not prevent base restoration.
replace('verify_prepared() {',`verify_disposable_preimages() {
    local base=/home/root/.local/share/remarkable/xochitl
    exact "$base/3fe4ae5a-a74e-4de3-994c-b1c40b1ccbe2/363535fe-0e4d-4953-b623-87875ebd58e6.rm" 53b159e7885d54de600519e5dd5d8cc033cc92d3c693122c6c0552721359f342 || return 1
    exact "$base/e761bdbe-f6b0-495d-8224-cacd07fff3c8/75c51ba3-c1f1-49ed-b47c-d0374af12c1c.rm" 4ec4156e42b98dcb31a15edbe34213fa72a4c05db84954ffbe158fa6775c0114
}
verify_prepared() {
    verify_disposable_preimages || return 1`);
const start=source.indexOf('for n in $(seq 1 25); do\n    if grep',source.indexOf('probe_pid=$(pid xochitl.service)'));
const end=source.indexOf('[ "$(grep -Ec',start);
assert(start>0&&end>start);
source=source.slice(0,start)+`for phase in 1 2; do
    for n in $(seq 1 70); do
        [ -r "/proc/$probe_pid/stat" ]
        if grep -Fq 'Companion probe: FAILED' "$B/probe.log"; then exit 1; else [ "$?" -eq 1 ]; fi
        if grep -Fq "Companion visual: ready; stage=$phase;" "$B/probe.log"; then break; fi
        sleep 1
    done
    systemctl is-active --quiet "$WATCH"
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    exact "$S/read-frame" ${hash(out+'/read-frame')}
    "$S/capture-frame" "$ID" "$probe_pid" "$phase"
done
healthy probe
[ "$(pid xochitl.service)" = "$probe_pid" ]
`+source.slice(end);
replace('mark structural-machine-passed "$probe_pid"','mark visual-buffer-machine-passed "$probe_pid"');
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync('ops/capture-visual-frame.sh',out+'/capture-frame');
fs.chmodSync(out+'/capture-frame',0o700);
fs.writeFileSync(out+'/probe.sh',source,{mode:0o700});
execFileSync('/bin/bash',['-n',out+'/probe.sh']);
execFileSync('/bin/bash',['-n',out+'/capture-frame']);
console.log('Visual controller built locally; no staging clearance: '+hash(out+'/probe.sh'));
