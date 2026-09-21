// A mechanically bounded derivative of the independently reviewed load-only
// controller. The generated controller requires its own review before use.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const source=fs.readFileSync('ops/probe-pro329.sh','utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),'e219d071e62a5170f2799ba6b406a086495bc995e4976b7371265f9cf14116fb');
let result=source;
function replace(before,after) {
    assert.equal(result.split(before).length,2,`Expected one controller anchor: ${before}`);
    result=result.replace(before,after);
}
replace('# A bounded load-only trial from the accepted r1 base. Always returns to base;\n# no commit/persistence action, document creation, or native notebook file writes.',
    '# A bounded two-disposable-document rendering trial from accepted r1 base.\n# Native APIs create test notebooks; no ink or direct notebook-file edits. Always reverts.');
replace("    grep -Fq 'property bool inkQualified: false' \"$S/NativeHost.qml\"",
    "    grep -Fq 'property bool inkQualified: false' \"$S/NativeHost.qml\" || return 1\n    grep -Fq 'property bool renderProbeOnly: true' \"$S/NativeHost.qml\"");
replace(' + 90 ))"',' + 180 ))"');
replace('--property=RuntimeMaxSec=300','--property=RuntimeMaxSec=420');
replace('Environment="XOVI_ROOT=%s/"\\nStandardOutput=',
    'Environment="XOVI_ROOT=%s/"\\nMemoryMax=1073741824\\nStandardOutput=');
replace('    verify_base_policy || return 1\n    local paths=',
    '    verify_base_policy || return 1\n    if [ "$1" = probe ]; then [ "$(systemctl show -p MemoryMax --value xochitl.service)" = 1073741824 ] || return 1; fi\n    local paths=');
replace("grep -Fq 'Companion: host ready; ink=false; settings=true' \"$B/probe.log\"",
    `for n in $(seq 1 80); do
    healthy probe
    systemctl is-active --quiet "$WATCH"
    [ "$(pid xochitl.service)" = "$probe_pid" ]
    ! grep -Fq 'Companion probe: FAILED' "$B/probe.log"
    if grep -Fq 'Companion probe: two native views and return completed; ink=false; capture=true' "$B/probe.log"; then break; fi
    sleep 1
done
grep -Fq 'Companion probe: two native views and return completed; ink=false; capture=true' "$B/probe.log"
[ -s "$D/render-primary.png" ]
[ -s "$D/render-secondary.png" ]`);
replace('mark load-only-passed "$probe_pid"','systemctl is-active --quiet "$WATCH"\nmark rendering-machine-passed "$probe_pid"');
fs.mkdirSync('build/render-native',{recursive:true});
fs.writeFileSync('build/render-native/probe.sh',result,{mode:0o700});
console.log('Rendering controller (not approved by load-only review): '+createHash('sha256').update(result).digest('hex'));
