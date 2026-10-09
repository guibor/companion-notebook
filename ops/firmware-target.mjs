import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const targets = Object.freeze({
    '3.29.0.148': {stock:'xochitl', stockSha256:'4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4', tableSha256:'1f2a0f7177dac3cdfc030ff32b4643170dd2ef6e2f6c6369b4c4168513ce01f0'},
    '3.29.0.152': {stock:'xochitl.stock', stockSha256:'7aa5d67da6850d7021ade5a2232edeb5f34550236eca6f7a102f37f962dd4bd2', buildId:'3829d2eddadae1a94d7f099809b15770ed38a4e5', build:'20261009073202'},
});
export function firmwareTarget(env=process.env) {
    const version=env.CN_FIRMWARE_VERSION || '3.29.0.148';
    assert(Object.hasOwn(targets,version), 'Unsupported exact firmware');
    const target=targets[version];
    const root=env.RM_FIRMWARE || '/Users/mdf/code/remarkable-beta-os/.cache/firmware/'+version;
    const sourceOnly=env.CN_SOURCE_ONLY === '1';
    assert(!sourceOnly || version==='3.29.0.152', 'Source-only is the isolated .152 port, not a historical bypass');
    if(version==='3.29.0.152') {
        assert(env.CN_USER_PILOT==='1' && !env.CN_PROBE && !env.CN_ORDINARY_PROBE,
            'The .152 port does not re-authorize historical diagnostic profiles');
    }
    const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    assert.equal(sha(path.join(root,target.stock)),target.stockSha256,'Exact stock firmware mismatch');
    let tableSha256=target.tableSha256;
    if(!sourceOnly) {
        if(version==='3.29.0.152') {
            tableSha256=env.CN_HASHTAB_SHA256;
            assert(/^[a-f0-9]{64}$/.test(tableSha256||''), 'Supply the coordinator-verified .152 hashtab SHA256');
            assert.notEqual(tableSha256,targets['3.29.0.148'].tableSha256,'Old .148 table is not a .152 capture');
        }
        assert.equal(sha(path.join(root,'hashtab')),tableSha256,'Exact resource table mismatch');
    }
    return {version,root,sourceOnly,tableSha256,...target};
}
