// User-authorized hands-on pilot. Reuse recovery machinery, not a test capsule.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const id=process.argv[2];
assert(/^\d{8}T\d{6}Z-\d+$/.test(id||''));
const previous=process.argv[3];
assert(!previous || (/^\d{8}T\d{6}Z-\d+$/.test(previous) && previous !== id));
const prior='build/probe-20260923T052500Z-1',out='build/pilot-'+id;
assert(!fs.existsSync(out), 'Do not overwrite an existing pilot package');
const hash=b=>createHash('sha256').update(b).digest('hex');
execFileSync(process.execPath,['build-native.mjs'],{env:{...process.env,CN_USER_PILOT:'1'},stdio:'inherit'});
let source=fs.readFileSync(prior+'/probe.sh','utf8');
assert.equal(hash(source),'3d9168cb4c9bf6d07a2eefe94c769b08ed0956cf124f929580dfab72b10f69dc');
function change(before,after,count=1){assert.equal(source.split(before).length-1,count,before);source=source.replaceAll(before,()=>after);}
change('# A bounded ordinary-host lifecycle diagnostic in two new disposable notes.\n# Always reverts; no personal pilot, firmware changes or direct notebook-file edits.',
    '# User-controlled experimental pilot; no synthetic input or notebook creation.\n# Runtime-only activation. Native failure or manual stop restores the accepted base.');
change('case "$ACTION" in prepare|run|watchdog)', 'case "$ACTION" in prepare|run|watchdog|stop)');
change('OWNER=companion-probe-$ID.service','OWNER=companion-pilot-$ID.service');
change('WATCH=companion-watch-$ID.service','WATCH=companion-pilot-watch-$ID.service');
change('companion-(probe|watch)','companion-(probe|watch|pilot)');
change(' probe.sh ink-events ink-events-second admission-qmldir',' probe.sh admission-qmldir',2);
change('[ "$(wc -l <"$S/SHA256SUMS")" -eq 11 ]','[ "$(wc -l <"$S/SHA256SUMS")" -eq 9 ]');
source=source.split('\n').filter(line=>!line.includes('exact "$S/ink-events')
    && !line.includes('stat -c %u:%g:%a "$S/ink-events')
    && !line.includes('grep -Fq \'Companion probe: ordinary ink submissions completed')
    && !line.includes('grep -Fq \'Companion ordinary: lifecycle completed')
    && !line.includes('"$S/ink-events" inspect')).join('\n');
const releaseStart=source.indexOf('release_injected_pen() {'),releaseEnd=source.indexOf('recover() {',releaseStart);
assert(releaseStart>0&&releaseEnd>releaseStart);
source=source.slice(0,releaseStart)+source.slice(releaseEnd);
change('    release_injected_pen || return 1\n','');
if (previous) {
    change('    [ -z "$(names "$B/data-prepared")" ] || return 1', `    if [ -f "$B/pairs-seed.sha256" ]; then
        [ "$(names "$B/data-prepared")" = pairs.ini ] || return 1
        sha256sum -c "$B/pairs-seed.sha256" >/dev/null || return 1
    else [ -z "$(names "$B/data-prepared")" ] || return 1; fi`);
    change('    mkdir -m 0700 "$B/host-prepared" "$B/data-prepared"', `    mkdir -m 0700 "$B/host-prepared" "$B/data-prepared"
    old_pairs=/home/root/.codex-backups/companion-${previous}/settings-retained/pairs.ini
    if [ -f "$old_pairs" ] && [ ! -L "$old_pairs" ]; then
        cp "$old_pairs" "$B/data-prepared/pairs.ini"
        chmod 600 "$B/data-prepared/pairs.ini"
        sha256sum "$B/data-prepared/pairs.ini" >"$B/pairs-seed.sha256"
    fi`);
}
// User settings may legitimately change during a hands-on session: preserve
// them; never overwrite them with the pre-pilot snapshot during recovery.
change('    sha256sum -c "$B/settings.sha256" >/dev/null || return 1',
    '    sha256sum -c "$B/settings.sha256" >/dev/null || mark settings-changed preserved');
// Keep startup/backup/fallback functions, replacing the scripted test lifetime.
change('    deadline=$(cat "$B/deadline"); [[ "$deadline" =~ ^[0-9]+$ ]]', '    missed_heartbeats=0; heartbeat_count=0');
change('    while [ "$(stamp)" -lt "$deadline" ]; do',`    while :; do
        if [ -f "$B/stop-requested" ] || { [ -f "$B/probe.log" ] && grep -Fq 'Companion pilot: stop requested' "$B/probe.log"; }; then
            recover user-stop; trap - EXIT; exit
        fi
        if [ -f "$B/pilot-running" ]; then
            count=$(grep -Fc 'Companion pilot: heartbeat;' "$B/probe.log" || true)
            # /proc/uptime includes CPU suspend, unlike these completed polls.
            # Give the UI time to run after wake instead of expiring immediately.
            if [ "$count" != "$heartbeat_count" ]; then
                heartbeat_count=$count; missed_heartbeats=0
            else missed_heartbeats=$((missed_heartbeats + 1)); fi
            if [ "$missed_heartbeats" -gt 30 ]; then
                recover ui-heartbeat-lost; trap - EXIT; exit
            fi
        fi`);
change('    recover deadline\n','');
change('mark deadline "$(( $(stamp) + 180 ))"','mark session-started "$(stamp)"');
change('--property=Restart=on-failure --property=RestartSec=1 --property=RuntimeMaxSec=420',
    '--property=Restart=on-failure --property=RestartSec=1');
const scripted=source.indexOf('# Start monitoring the ready gate immediately;');
assert(scripted>0);
source=source.slice(0,scripted)+`# Startup receipt only; no navigation, synthetic events or acceptance test.
for n in $(seq 1 30); do
    systemctl is-active --quiet "$WATCH"
    if grep -Fq 'Companion: host ready; ink=true; settings=true' "$B/probe.log"; then break; fi
    sleep 1
done
grep -Fq 'Companion: host ready; ink=true; settings=true' "$B/probe.log"
mark pilot-running "$probe_pid"
while systemctl is-active --quiet xochitl.service && [ "$(pid xochitl.service)" = "$probe_pid" ]; do
    systemctl is-active --quiet "$WATCH" || exit 1
    sleep 2
done
exit 1
`;
change('private "$B"\n[ "$(cat "$B/prepared")" = "$MANIFEST" ]',`private "$B"
[ "$(cat "$B/prepared")" = "$MANIFEST" ]
if [ "$ACTION" = stop ]; then mark stop-requested user; exit 0; fi`);
change('    grep -Fq \'property bool renderProbeOnly: false\' "$S/NativeHost.qml" || return 1',
    `    grep -Fq 'property bool renderProbeOnly: false' "$S/NativeHost.qml" || return 1
    grep -Fq 'function pilotStop()' "$S/NativeHost.qml" || return 1
    ! grep -Eq 'probeCreate|probeWriting|Companion probe:' "$S/NativeHost.qml" "$S/companion-notebook.qmd" || return 1`);
assert(!/ink-events|pen-injection-started|probeCreate|Companion ink: gate open/.test(source.replace("'probeCreate|probeWriting|Companion probe:'",'')), 'No injection/creation in pilot controller');
execFileSync('/bin/bash',['-n'],{input:source});
const bytes={'probe.sh':Buffer.from(source)};
for(const name of ['NativeHost.qml','PairStore.js','SizeRuler.qml','companion-notebook.qmd'])
    bytes[name]=fs.readFileSync('build/pilot-native/'+name);
for(const name of ['libcompanionbootstrap.so','libcompanionadmissionplugin.so','admission-qmldir']) {
    bytes[name]=fs.readFileSync(prior+'/'+name);
    const expected=fs.readFileSync(prior+'/SHA256SUMS','utf8').split('\n').find(x=>x.endsWith('  '+name)).split(' ')[0];
    assert.equal(hash(bytes[name]),expected);
}
bytes['base.sha256']=fs.readFileSync('/Users/mdf/code/.worktrees/smart-remarkable-pro-3290148/ops/pro-3.29-qmd.sha256');
fs.mkdirSync(out,{mode:0o700});
for(const [name,data] of Object.entries(bytes))fs.writeFileSync(out+'/'+name,data,{mode:name==='probe.sh'?0o700:0o600,flag:'wx'});
const manifest=Object.keys(bytes).sort().map(name=>hash(bytes[name])+'  '+name+'\n').join('');
fs.writeFileSync(out+'/SHA256SUMS',manifest,{mode:0o600,flag:'wx'});
console.log(JSON.stringify({id,stage:out,manifestSha256:hash(manifest),controllerSha256:hash(source),userPilot:true,releaseQualified:false}));
