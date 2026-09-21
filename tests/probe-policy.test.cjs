const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const source = fs.readFileSync('ops/probe-pro329.sh','utf8');
const recovery = source.slice(source.indexOf('cleanup_host() {'), source.indexOf('\n# Watchdog retry accounting'));

test('probe controller parses, rejects bad arguments and has no promotion action', () => {
    assert.equal(spawnSync('/bin/bash',['-n','ops/probe-pro329.sh']).status,0);
    assert.equal(spawnSync('/bin/bash',['ops/probe-pro329.sh','commit']).status,2);
    assert.equal(spawnSync('/bin/bash',['ops/probe-pro329.sh','run','../../bad','x']).status,2);
    assert.doesNotMatch(source,/mount\s+-o\s+remount|\/etc\/systemd|\/boot\/|\/dev\/mmc|\.local\/share\/remarkable\/xochitl/);
    assert(source.indexOf('systemctl is-active --quiet "$WATCH"') < source.indexOf('publish_policy probe\nsystemctl restart'));
    assert.match(source,/mark deadline "\$\(\( \$\(stamp\) \+ 90 \)\)"/);
    assert(source.indexOf('mark watch-attempts') < source.indexOf('\nverify_stage\nverify_device'));
    assert.match(source,/StartLimitIntervalSec=3600 --property=StartLimitBurst=2/);
    assert.match(source,/mark base-start-attempted before-stop-start/);
    assert.match(source,/mark stock-start-attempted before-stop-start/);
    assert.match(source,/apk\.vellum/);
});

function runRecovery({initial='probe', failBase=false, foreign=false, repeatAfterCleanupFailure=false}) {
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-recovery-'));
    try {
        fs.mkdirSync(path.join(dir,'state')); fs.mkdirSync(path.join(dir,'lock'));
        fs.writeFileSync(path.join(dir,'state','dates-pid'),'19\n');
        fs.writeFileSync(path.join(dir,'state','settings.sha256'),'');
        if (initial==='probe' || foreign) fs.writeFileSync(path.join(dir,'drop'),foreign?'foreign':'probe');
        const script=`set -Eeuo pipefail
B=${JSON.stringify(dir+'/state')}; DROP=${JSON.stringify(dir+'/drop')}; H=${JSON.stringify(dir+'/host')}; D=${JSON.stringify(dir+'/data')}; LOCK=${JSON.stringify(dir+'/lock')}
OWNER=owner; MODE=${initial}; FAIL_BASE=${failBase ? 1 : 0}; STARTS=0
hash() { case "$1" in */policy-probe.conf) printf probe;; */policy-stock.conf) printf stock;; *) cat "$1";; esac; }
exact() { [ -f "$1" ] && [ "$(cat "$1")" = "$2" ]; }
absent() { [ ! -e "$1" ]; }
mark() { printf '%s\\n' "$2" >"$B/$1"; }
pid() { case "$1" in owner) printf 0;; notebook-date-index.service) printf 19;; *) printf 22;; esac; }
verify_device() { return 0; }
verify_base_files() { return 0; }
verify_base_policy() { return 0; }
verify_policy_sources() { return 0; }
verify_policy() { if [ "$1" = base ]; then absent "$DROP"; fi; }
healthy() { [ "$MODE" = "$1" ]; }
publish_policy() { printf '%s' "$1" >"$DROP"; }
sha256sum() { return 0; }
sleep() { :; }
sync() { :; }
systemctl() {
    if [ "$1" = start ]; then
        STARTS=$((STARTS+1))
        if [ -f "$DROP" ] && [ "$(cat "$DROP")" = stock ]; then MODE=stock
        elif [ "$FAIL_BASE" = 0 ]; then MODE=base
        else MODE=failed; fi
    fi
}
${recovery}
${repeatAfterCleanupFailure ? `CLEANUPS=0
cleanup_host() { CLEANUPS=$((CLEANUPS+1)); [ "$CLEANUPS" -gt 1 ]; }
if recover first; then printf 'UNEXPECTED_FIRST_SUCCESS\\n'; else printf 'FIRST_REFUSED,STARTS=%s\\n' "$STARTS"; fi` : ''}
if recover test; then printf 'RESULT=%s,STARTS=%s\\n' "$MODE" "$STARTS"; else printf 'REFUSED,STARTS=%s\\n' "$STARTS"; fi
`;
        const result=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
        assert.equal(result.status,0,result.stderr);
        return {out:result.stdout, recovered:fs.existsSync(path.join(dir,'state','recovered')), drop:fs.existsSync(path.join(dir,'drop'))?fs.readFileSync(path.join(dir,'drop'),'utf8'):null};
    } finally { fs.rmSync(dir,{recursive:true,force:true}); }
}

test('watchdog restores accepted base with exactly one restart', () => {
    const r=runRecovery({}); assert.match(r.out,/RESULT=base,STARTS=1/); assert(r.recovered); assert.equal(r.drop,null);
});
test('pre-restart failure leaves a healthy base process alone', () => {
    const r=runRecovery({initial:'base'}); assert.match(r.out,/RESULT=base,STARTS=0/); assert(r.recovered);
});
test('failed base restoration attempts stock once, not a restart loop', () => {
    const r=runRecovery({failBase:true}); assert.match(r.out,/RESULT=stock,STARTS=2/); assert(r.recovered); assert.equal(r.drop,'stock');
});
test('watchdog refuses a foreign policy without removing it or restarting', () => {
    const r=runRecovery({foreign:true}); assert.match(r.out,/REFUSED,STARTS=0/); assert(!r.recovered); assert.equal(r.drop,'foreign');
});
test('retry after failed stock cleanup does not retry either process start', () => {
    const r=runRecovery({failBase:true, repeatAfterCleanupFailure:true});
    assert.match(r.out,/FIRST_REFUSED,STARTS=2/);
    assert.match(r.out,/RESULT=stock,STARTS=2/);
    assert.equal(r.drop,'stock'); assert(r.recovered);
});
test('retry after failed base cleanup does not restart healthy base', () => {
    const r=runRecovery({repeatAfterCleanupFailure:true});
    assert.match(r.out,/FIRST_REFUSED,STARTS=1/);
    assert.match(r.out,/RESULT=base,STARTS=1/); assert(r.recovered);
});

const publication = source.slice(source.indexOf('publish_policy() {'),source.indexOf('cleanup_host() {'));
for (const failure of ['copy','hash','reload','foreign-temp','foreign-policy','none']) {
    test(`actual policy publication under a conditional caller: ${failure}`, () => {
        const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-publish-'));
        try {
            fs.writeFileSync(path.join(dir,'policy-stock.conf'),'stock');
            fs.writeFileSync(path.join(dir,'policy-probe.conf'),'probe');
            if (failure==='foreign-policy') fs.writeFileSync(path.join(dir,'drop'),'foreign');
            const script=`set -Eeuo pipefail
B=${JSON.stringify(dir)}; DROP="$B/drop"; FAILURE=${failure}; RELOADED=0
absent() { [ ! -e "$1" ]; }
hash() { cat "$1"; }
exact() {
    if [ "$FAILURE" = hash ] && [ "$1" = "$DROP.ready.$$" ]; then return 1; fi
    [ -f "$1" ] && [ "$(cat "$1")" = "$2" ]
}

cp() { [ "$FAILURE" != copy ] || return 1; command cp "$@"; }
systemctl() { RELOADED=1; [ "$FAILURE" != reload ]; }
verify_policy() { [ "$RELOADED" = 1 ] && [ "$(cat "$DROP")" = stock ]; }
if [ "$FAILURE" = foreign-temp ]; then printf foreign >"$DROP.ready.$$"; fi
${publication}
if publish_policy stock; then printf PASS; else printf REFUSED; fi
`;
            const r=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
            assert.equal(r.status,0,r.stderr);
            assert.equal(r.stdout,failure==='none'?'PASS':'REFUSED');
            if (failure==='foreign-policy') assert.equal(fs.readFileSync(path.join(dir,'drop'),'utf8'),'foreign');
            if (['copy','hash','foreign-temp'].includes(failure)) assert(!fs.existsSync(path.join(dir,'drop')));
        } finally { fs.rmSync(dir,{recursive:true,force:true}); }
    });
}

test('watchdog counts repeated stage-validation failures before retrying', () => {
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'companion-watch-entry-'));
    const entry=source.slice(source.indexOf('if [ "$ACTION" = watchdog ]; then'),source.indexOf('if [ "$ACTION" = prepare ]; then'));
    try {
        const script=`set -Eeuo pipefail
ACTION=watchdog; B=${JSON.stringify(dir)}; WATCH=watch
pid() { printf '%s' "$$"; }
private() { return 0; }
mark() { printf '%s\\n' "$2" >"$B/$1"; }
verify_stage() { return 1; }
verify_device() { return 0; }
verify_base_files() { return 0; }
${entry}
`;
        for (let n=1;n<=2;n++) {
            const r=spawnSync('/bin/bash',['-c',script],{encoding:'utf8'});
            assert.equal(r.status,1,r.stderr);
            assert.equal(fs.readFileSync(path.join(dir,'watch-attempts'),'utf8').trim(),String(n));
        }
        assert.equal(spawnSync('/bin/bash',['-c',script]).status,0);
        assert.equal(fs.readFileSync(path.join(dir,'watch-attempts'),'utf8').trim(),'2');
        assert.equal(fs.readFileSync(path.join(dir,'manual-intervention-required'),'utf8').trim(),'watchdog-retry-limit');
    } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
