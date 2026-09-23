// Local-only derivative of the frozen successful ordinary-control controller.
// No device access or activation authority. All recovery/helper bytes stay fixed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const prior='build/probe-20260923T052500Z-1', out='build/lifecycle-native';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
let source=fs.readFileSync(prior+'/probe.sh','utf8');
assert.equal(sha(source),'3d9168cb4c9bf6d07a2eefe94c769b08ed0956cf124f929580dfab72b10f69dc');
function replace(before,after,count=1) {
    assert.equal(source.split(before).length-1,count,before);
    source=source.replaceAll(before,()=>after);
}
replace('ordinary ink submissions completed; panes=2; strokes=4; durable=unverified',
    'lifecycle ink submissions completed; panes=2; strokes=4; durable=unverified',3);
replace('mark ordinary-submission-machine-passed "$probe_pid"',
    'mark lifecycle-submission-machine-passed "$probe_pid"');
// More operations share the existing fixed overall watchdog deadline. Only the
// completion-poll allowance changes; the final stability window stays25seconds.
replace('for n in $(seq 1 25); do\n    healthy probe',
    'for n in $(seq 1 60); do\n    healthy probe');
const anchor='[ "$(grep -Fc \'Companion ordinary: lifecycle completed; tuck=true; reveal=true; cancel=true\' "$B/probe.log")" = 1 ]';
replace(anchor,anchor+'\n'+[
    'Companion lifecycle: history passed; panes=2; undo=true; redo=true',
    'Companion lifecycle: tools passed; eraser=true; pen=true',
    'Companion lifecycle: pages passed; original=',
    'Companion lifecycle: native close/reopen passed; pairing=true; original-page=true'
].map(marker=>'[ "$(grep -Fc \''+marker+'\' "$B/probe.log")" = 1 ]').join('\n'));
execFileSync('/bin/bash',['-n'],{input:source});
for(const name of ['PairStore.js','libcompanionbootstrap.so','libcompanionadmissionplugin.so',
        'admission-qmldir','ink-events','ink-events-second']) {
    const manifest=fs.readFileSync(prior+'/SHA256SUMS','utf8');
    const expected=manifest.split('\n').find(line=>line.endsWith('  '+name))?.split(' ')[0];
    const stat=fs.lstatSync(prior+'/'+name);assert(stat.isFile()&&!stat.isSymbolicLink());
    const bytes=fs.readFileSync(prior+'/'+name);assert.equal(sha(bytes),expected);
    fs.writeFileSync(out+'/'+name,bytes,{mode:name.startsWith('ink-events')?0o700:0o600});
}
fs.writeFileSync(out+'/probe.sh',source,{mode:0o700});
console.log('Lifecycle controller built locally; not staged: '+sha(source));
