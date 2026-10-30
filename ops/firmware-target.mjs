import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const targets = Object.freeze({
    '3.29.1.0': {stock:'xochitl', stockSha256:'35e940d8acb3de0dfaf61f1a421d450e61dbaa915f885c818a2a3cc5c94c8ecd', buildId:'7f2e34d38baf3ace1117a5ac3a9c18313d660a13', build:'20261028104944', firmwareRoot:'/Users/mdf/code/.worktrees/remarkable-beta-os-pro-32910/.cache/firmware/3.29.1.0'},
    '3.29.0.148': {stock:'xochitl', stockSha256:'4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4', tableSha256:'1f2a0f7177dac3cdfc030ff32b4643170dd2ef6e2f6c6369b4c4168513ce01f0'},
    '3.29.0.152': {stock:'xochitl.stock', stockSha256:'7aa5d67da6850d7021ade5a2232edeb5f34550236eca6f7a102f37f962dd4bd2', buildId:'3829d2eddadae1a94d7f099809b15770ed38a4e5', build:'20261009073202'},
    '3.29.0.153': {stock:'xochitl', stockSha256:'9d6d844d793b6242345c7c25667451620c48b2cc28986a21049fa8d534042dd4', buildId:'c2d96853e6e720be00f0fd71143d221439e7beba', build:'20261009073202', firmwareRoot:'/Users/mdf/code/.worktrees/remarkable-beta-os-pro-3290153/.cache/firmware/3.29.0.153'},
});
export function firmwareTarget(env=process.env) {
    const version=env.CN_FIRMWARE_VERSION || '3.29.0.148';
    assert(Object.hasOwn(targets,version), 'Unsupported exact firmware');
    const target=targets[version];
    const root=env.RM_FIRMWARE || target.firmwareRoot || '/Users/mdf/code/remarkable-beta-os/.cache/firmware/'+version;
    const sourceOnly=env.CN_SOURCE_ONLY === '1';
    const exactPort=version==='3.29.0.152'||version==='3.29.0.153'||version==='3.29.1.0';
    assert(!sourceOnly || exactPort, 'Source-only requires an isolated exact-firmware port, not a historical bypass');
    if(exactPort) {
        assert(env.CN_USER_PILOT==='1' && !env.CN_PROBE && !env.CN_ORDINARY_PROBE,
            'The exact-firmware port does not re-authorize historical diagnostic profiles');
    }
    const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    assert.equal(sha(path.join(root,target.stock)),target.stockSha256,'Exact stock firmware mismatch');
    let tableSha256=target.tableSha256;
    if(!sourceOnly) {
        if(exactPort) {
            tableSha256=env.CN_HASHTAB_SHA256;
            assert(/^[a-f0-9]{64}$/.test(tableSha256||''), 'Supply the coordinator-verified exact-firmware hashtab SHA256');
            assert.notEqual(tableSha256,targets['3.29.0.148'].tableSha256,'Old .148 table is not an exact-firmware capture');
        }
        assert.equal(sha(path.join(root,'hashtab')),tableSha256,'Exact resource table mismatch');
    }
    return {version,root,sourceOnly,tableSha256,...target};
}
