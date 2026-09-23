// New display-only sleep test. Frozen ordinary controller remains untouched.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const prior='build/probe-20260923T052500Z-1',out='build/sleep-native';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
let source=fs.readFileSync(prior+'/probe.sh','utf8');
assert.equal(hash(source),'3d9168cb4c9bf6d07a2eefe94c769b08ed0956cf124f929580dfab72b10f69dc');
function change(before,after,count=1){assert.equal(source.split(before).length-1,count,before);source=source.replaceAll(before,()=>after);}
execFileSync('aarch64-linux-gnu-gcc',['-std=c11','-O2','-Wall','-Wextra','-Werror','-static','ops/wake-key.c','-o',out+'/wake-key']);
const helperHash=hash(fs.readFileSync(out+'/wake-key'));
change('base.sha256 probe.sh ink-events ink-events-second admission-qmldir','base.sha256 probe.sh ink-events ink-events-second wake-key admission-qmldir',2);
change('[ "$(wc -l <"$S/SHA256SUMS")" -eq 11 ]','[ "$(wc -l <"$S/SHA256SUMS")" -eq 12 ]');
change('    exact "$S/ink-events-second"',`    exact "$S/wake-key" ${helperHash} || return 1
    [ "$(stat -c %u:%g:%a "$S/wake-key")" = 0:0:700 ] || return 1
    exact "$S/ink-events-second"`);
change('ordinary ink submissions completed; panes=2; strokes=4; durable=unverified','sleep ink submissions completed; panes=2; strokes=4; durable=unverified',3);
change('mark ordinary-submission-machine-passed','mark sleep-submission-machine-passed');
change('    while [ "$(stamp)" -lt "$deadline" ]; do',`    while [ "$(stamp)" -lt "$deadline" ]; do
        # Independent of the UI timer, measured from BEFORE the native power call.
        # No sleeping receipt or live GUI event loop is needed to start recovery.
        if [ -f "$B/probe.log" ]; then
            sleep_started=$(sed -n 's/.*Companion sleep: requested; epoch-ms=\\([0-9][0-9]*\\).*/\\1/p' "$B/probe.log")
            if [ -n "$sleep_started" ]; then
                [[ "$sleep_started" =~ ^[0-9]{13}$ ]] || { recover malformed-sleep-request; trap - EXIT; exit; }
                [ -f "$B/sleep-first-seen" ] || mark sleep-first-seen "$(stamp)"
                sleep_seen=$(cat "$B/sleep-first-seen")
                [[ "$sleep_seen" =~ ^[0-9]+$ ]] || { recover malformed-sleep-clock; trap - EXIT; exit; }
                if ! grep -Fq 'Companion sleep: awake; normal=true; primary-fresh=true' "$B/probe.log" &&
                    { [ "$(( $(date +%s) * 1000 - sleep_started ))" -ge 4000 ] ||
                      [ "$(( $(stamp) - sleep_seen ))" -ge 3 ]; }; then
                    recover display-wake-deadline; trap - EXIT; exit
                fi
            fi
        fi`);
change('    release_injected_pen || return 1',`    release_injected_pen || return 1
    if [ -f "$B/wake.log" ] && grep -Fxq 'wake-batch-attempted' "$B/wake.log"; then
        exact "$S/wake-key" ${helperHash} || return 1
        "$S/wake-key" release || return 1
    fi`);
// Start a local pre-opened helper before any pen injection can reach sleep.
// No network call is involved in its <=2s receipt-to-key critical path.
change('mark pen-injection-started "$probe_pid"',`"$S/wake-key" "$probe_pid" "$B/probe.log" >"$B/wake.log" 2>&1 &
wake_pid=$!
for n in $(seq 1 30); do
    kill -0 "$wake_pid"
    if grep -Fxq 'wake helper ready; key-up=true; pre-opened=true' "$B/wake.log"; then break; fi
    sleep 0.1
done
grep -Fxq 'wake helper ready; key-up=true; pre-opened=true' "$B/wake.log"
sleep 3
mark pen-injection-started "$probe_pid"`);
// If the local helper fails, owner EXIT triggers the existing immediate watch
// recovery. A QML5s wake deadline additionally precedes the stock12s timer.
change('for n in $(seq 1 25); do\n    healthy probe',`for n in $(seq 1 35); do
    if ! kill -0 "$wake_pid" 2>/dev/null; then
        wait "$wake_pid"
        grep -Fxq 'balanced wake batch sent once; key-up=true; native-wake=unverified' "$B/wake.log"
    fi
    healthy probe`);
change('[ "$(grep -Fc \'Companion ordinary: lifecycle completed; tuck=true; reveal=true; cancel=true\' "$B/probe.log")" = 1 ]',`[ "$(grep -Fc 'Companion ordinary: lifecycle completed; tuck=true; reveal=true; cancel=true' "$B/probe.log")" = 1 ]
wait "$wake_pid"
[ "$(grep -Fc 'balanced wake batch sent once; key-up=true; native-wake=unverified' "$B/wake.log")" = 1 ]
[ "$(grep -Fc 'Companion sleep: asleep; parked=true; detached=true; epoch-ms=' "$B/probe.log")" = 1 ]
[ "$(grep -Fc 'Companion sleep: awake; normal=true; primary-fresh=true' "$B/probe.log")" = 1 ]
[ "$(grep -Fc 'Companion sleep: roundtrip passed; normal=true; pairing=true; original-pages=true; fresh-candidates=true' "$B/probe.log")" = 1 ]`);
execFileSync('/bin/bash',['-n'],{input:source});
for(const name of ['PairStore.js','libcompanionbootstrap.so','libcompanionadmissionplugin.so','admission-qmldir','ink-events','ink-events-second']){
    const expected=fs.readFileSync(prior+'/SHA256SUMS','utf8').split('\n').find(x=>x.endsWith('  '+name)).split(' ')[0];
    const bytes=fs.readFileSync(prior+'/'+name);assert.equal(hash(bytes),expected);
    fs.writeFileSync(out+'/'+name,bytes,{mode:name.startsWith('ink-events')?0o700:0o600});
}
fs.writeFileSync(out+'/probe.sh',source,{mode:0o700});
console.log(JSON.stringify({controllerSha256:hash(source),wakeHelperSha256:helperHash,staged:false}));
