// Optional exact-bundle rollback. No device access or private state restoration.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export const webpdfTarget='/home/root/xovi/exthome/appload/remarkable-web-pdf';
export function validateWebpdfRollback(r,files){
    assert.equal(r.target,webpdfTarget);
    assert(/^\/home\/root\/\.codex-backups\/webpdf-update-[0-9]{8}T[0-9]{6}Z\/previous-app$/.test(r.previousApp));
    assert.equal(r.backupArchive,r.previousApp.replace(/previous-app$/,'before.tar.gz'));
    assert(/^[a-f0-9]{64}$/.test(r.backupArchiveSha256));
    for(const tree of [r.oldFiles,r.newFiles]){
        assert(tree&&Object.keys(tree).length>=9);
        for(const [p,h]of Object.entries(tree)){
            assert(/^[A-Za-z0-9_.+-]+(?:\/[A-Za-z0-9_.+-]+)*$/.test(p)&&!p.split('/').some(x=>x==='.'||x==='..'));
            assert(/^[a-f0-9]{64}$/.test(h));
        }
        for(const p of ['manifest.json','resources.rcc','backend/entry','integration/SelectionHost.qml'])assert(tree[p]);
    }
    assert.equal(r.oldFiles['backend/entry'],r.newFiles['backend/entry'],'UI update must preserve backend');
    const required={
        'SelectionHost.qml':'bd0222dc8b275a16bd22c4b7a60ac38eedec75c65e472b08aa65b646515b07a3',
        'TapLink.qml':'79a4a48f2070305f7e65cca6c40bb359b73b5f76c1fe247b45b0402f65bc2036',
        'ReaderButton.qml':'932d893d0aff5221d47565211931ddb20dfb205f5ef7836db7bf129835a57ee4'};
    for(const [p,h]of Object.entries(required))assert.equal(r.newFiles['integration/'+p],h);
    for(const f of files.filter(f=>f.path.startsWith(r.target+'/')))assert.equal(r.newFiles[f.path.slice(r.target.length+1)],f.sha256);
}
export function renderWebpdfRollback(r){
    const accepted=createHash('sha256').update(JSON.stringify(r.newFiles)).digest('hex');
    const q=s=>"'"+s+"'";
    const tree=(kind,files)=>`webpdf_${kind}() {
    local root=$1
    [ -d "$root" ] && [ ! -L "$root" ] && [ "$(readlink -f "$root")" = "$root" ] || return 1
    [ -z "$(find "$root" ! -type f ! -type d -print)" ] || return 1
    [ "$(find "$root" -type f | sed "s|^$root/||" | sort)" = "$(printf '%s\\n' ${Object.keys(files).map(q).join(' ')} | sort)" ] || return 1
${Object.entries(files).map(([p,h])=>`    exact "$root/${p}" ${h} || return 1`).join('\n')}
}
`;
    return `WEBPDF_TARGET=${q(r.target)}
WEBPDF_OLD=${q(r.previousApp)}
WEBPDF_RETAINED="$B/webpdf-new-retained"
WEBPDF_ACCEPTED=${accepted}
${tree('old',r.oldFiles)}${tree('new',r.newFiles)}
webpdf_quiescent() {
    ! pgrep -f '[/]tmp/remarkable-web-pdf.sock' >/dev/null || return 1
    local maps
    for maps in /proc/[0-9]*/maps; do
        [ -r "$maps" ] || continue
        if grep -F "$WEBPDF_TARGET/" "$maps" >/dev/null; then return 1; fi
    done
}
webpdf_recovery_base() {
    { verify_policy base && healthy base; } || { verify_policy stock && healthy stock; }
}
verify_webpdf_pair() {
    exact ${q(r.backupArchive)} ${r.backupArchiveSha256} || return 1
    if absent "$B/webpdf-rollback-intent"; then
        webpdf_new "$WEBPDF_TARGET" && webpdf_old "$WEBPDF_OLD" && absent "$WEBPDF_RETAINED"
        return $?
    fi
    [ "$ACTION" = watchdog ] || [ "$ACTION" = stop ] || return 1
    [ "$(cat "$B/webpdf-rollback-intent")" = paired-v1 ] || return 1
    webpdf_recovery_base && webpdf_quiescent || return 1
    if absent "$WEBPDF_RETAINED"; then
        webpdf_new "$WEBPDF_TARGET" && webpdf_old "$WEBPDF_OLD"
    else
        webpdf_new "$WEBPDF_RETAINED" || return 1
        if absent "$WEBPDF_TARGET"; then webpdf_old "$WEBPDF_OLD"
        else webpdf_old "$WEBPDF_TARGET" && absent "$WEBPDF_OLD"; fi
    fi
}
restore_webpdf_pair() {
    if ! absent "$B/webpdf-accepted"; then
        [ "$(cat "$B/webpdf-accepted")" = "$WEBPDF_ACCEPTED" ] && absent "$B/webpdf-rollback-intent" && verify_webpdf_pair
        return $?
    fi
    webpdf_recovery_base && webpdf_quiescent && verify_webpdf_pair || return 1
    if absent "$B/webpdf-rollback-intent"; then mark webpdf-rollback-intent paired-v1 && sync || return 1; fi
    if absent "$WEBPDF_RETAINED"; then mv "$WEBPDF_TARGET" "$WEBPDF_RETAINED" || return 1; fi
    if absent "$WEBPDF_TARGET"; then mv "$WEBPDF_OLD" "$WEBPDF_TARGET" || return 1; fi
    webpdf_old "$WEBPDF_TARGET" && webpdf_new "$WEBPDF_RETAINED" && absent "$WEBPDF_OLD" || return 1
    mark webpdf-rollback-complete paired-v1 && sync
}
accept_webpdf_pair() {
    absent "$B/webpdf-rollback-intent" && verify_webpdf_pair || return 1
    healthy probe && systemctl is-active --quiet "$WATCH" || return 1
    [ "$(cat "$B/pilot-running")" = "$(pid xochitl.service)" ] || return 1
    grep -Fq 'Companion: host ready; ink=true; settings=true' "$B/probe.log" || return 1
    grep -Fq 'WebPDF: selection host ready' "$B/probe.log" || return 1
    mark webpdf-accepted "$WEBPDF_ACCEPTED" && sync
}
`;
}
