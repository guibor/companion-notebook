# Pro .153 installation handoff

## Installed status (2026-10-16)

ReManager, the sole tablet writer, confirms successful guarded activation on
Paper Pro firmware 3.29.0.153. Both Companion and WebPDF hosts are ready; all
thirteen external QMDs loaded and all three expected native modules are mapped.
The interface reports zero automatic restarts. All sixteen settings checks
passed, the existing Dispatch icon link is unchanged, and Dates stayed running.
The root filesystem remains read-only and independent recovery supervision is
active. The recovery archive was verified off-device before activation.

The installed payload includes the standard-notebook open-bottom scrolling fix.
This is startup/settings evidence reported by the coordinator, not physical
scrolling acceptance. No synthetic input or notebook edits were performed.
No further restart is needed for this handoff; await normal-use feedback.

The historical private operational receipts below are retained locally. This
branch also inherits private receipts; do not push its history to the public
repository without preparing a separately reviewed sanitized source history.

## Corrected inventory stage (supersedes090c82f09ecc)

Initial preparation refused BEFORE backup-directory creation or native mutation:
Dispatch's existing icon.png is a symlink, but optional inventory capture had
treated it as a regular file. The strict exact() guard correctly refused it.
ReManager corrected capture to pin the approved canonical target inside Dispatch;
the existing symlink and all content/settings bytes remain unchanged. ReManager
separately verifies the symlink text/resolved target before and after activation.

- Frozen stage: build/pro-3.29.0.153/handoff-b6dd01c18a0e.
- Manifest:45c3d2e3a974585030a10f69e9b114138b2ed845c549ef8987d6c11012f53125.
- Controller:2b647c8cfea0d8a3e5696b4e226235d1f4de646d881bc7f728b8755928505260.
- Fresh inventory:bdfff274f3277ff4d247d898459c9c4840ee60b200ac8d180d4331dc52348063.
- Coordinator:b6dd01c18a0e4099ab09ad5776dbadd328835b4a439f7c0b94266629eedc7640.
- Coordinator's selected new transaction:20261016T094539Z-2.

Input comparison proves only canonical icon path and settings ordering changed.
All eleven noncontroller stage files are byte-identical to090c; both34QMLorders
were rerun, all12member hashes and Bash syntax passed. No code/safety guard was
relaxed, no icon was converted, and the old frozen stage remains untouched.
The new stage was subsequently activated by ReManager as recorded above.
No tablet operations occurred in this chat.

## Final stage sealed (2026-10-16, local/private receipt)

ReManager supplied the committed active-base capture; final stage is frozen:

- Path: build/pro-3.29.0.153/handoff-090c82f09ecc.
- Manifest:93c55d5afb7cbae48ce00342d9a4a9ad1c53b58a36e7a88844eb86f200a61cd1.
- Controller:b9e219f897e82d87a5ad6855281b1323b4007493287bafb4036ef6baccab0c3c.
- Fresh base inventory:831cfd5053cd6c2e42fc40d7ceb11888ce7a25d136f4143e9b4b2f93c33fec02.
- Coordinator:090c82f09ecccf3990574f30bc0e8f398a44fe641a6c6d9646a3dfa3f573fdde.

The fresh capture has39basefiles/16settings/11externalQMDs. Both34QML full-stack
orders were rerun;46focused/generated checks and16alternate-order checks pass.
All twelve stage member hashes and Bash syntax pass. All seven Companion payloads
match the previously qualified app-only payload byte-for-byte. The profile retains
the accepted WebPDF app with no rollback metadata or accept action. ReManager
separately reported the isolated Restyle native smoke passed on the device.

Copy only the12manifested files plus SHA256SUMS, not controller-inputs.json.
Use a fresh transaction and the established prepare/off-device-backup verification/
independent supervised run procedure. Preserve current settings and the watchdog;
require both hosts ready,13QMDs,three native maps and16settings checks. No tablet
or server action occurred from this chat. Await coordinator startup receipt;
offline sealing is not deployment or physical acceptance. Keep operational
receipts local/private, not in a public push.

Earlier preparation history follows; its pending-input statements are superseded
by the sealed-stage receipt above.

Branch beta/pro/3.29.0.153 is isolated from the working .152 checkout and includes
the standard-notebook open-bottom scrolling correction8268ba2. ReManager remains
sole tablet writer. SelectChange owns the combined Restyle/WebPDF overlay.

## Current evidence

- Exact supplied stock SHA and ELF build ID verified locally.
- Four pen-related Qt metadata/string tables match the audited native baseline.
- Public QObject moveToThread interposition import still exists.
- Fresh ReManager observations confirm all eight direct native provider hashes
  and vendor-policy hashes. Supplied QtCore/QtQml files match locally. The full
  native-source/binary reuse audit passes with the new runtime profile.
- Source-only Quick Pad build succeeds and retains the scrolling fix.
- .153 guards/scroll regression tests pass; .152 guard regressions also pass.
- Source-only output is deliberately unbound and NOT installable.
- The real .153 table is now pinned; both raw captures and their identical
  canonical dumps were verified locally. The table-bound Companion QMD builds
  with no compatibility errors. This is not yet a full-stack installation stage.
- Thirty local tests pass, including substituted-table rejection in both
  full-controller and payload-only preparation modes.

## Inputs still required before sealing

1. Provider/vendor-policy observation is now recorded in
   profiles/runtime-pro-3.29.0.153.json and audited; retain these exact pins.
2. Captured table receipt is now in profiles/table-pro-3.29.0.153.json, containing
   firmware, stockSha256, hashtabSha256, canonicalTableSha256 and
   hashtabCaptureStatus=two-canonical-captures-equal; all preparation modes
   require these exact receipt values, not an arbitrary caller-supplied table.
3. SelectChange's combined QMD/native module/qmldir are now hash-pinned in
   profiles/overlay-pro-3.29.0.153.json; peer static audit received, runtime
   qualification remains with ReManager. Twenty-nine source/recovery tests pass.
4. Current twelve-peer composition manifest (eleven external plus AppLoad),
   additional resource tree, and fresh post-base controller/settings inventory.

The twelve-peer manifest is now supplied and independently verified:
feaa3e971c9a9dd4152f7f9ff35fdd2f037cb04d4f014d529a301134e49a1b79.
Both complete load orders parse34QMLresources.46focused/generated checks and
16alternate-order generated checks pass. Actual composed WebPDF single-lookup
gesture checks and four Restyle Qt capability checks pass in each order.
App-only output: build/pro-3.29.0.153/payload-6023c58fb9e4, seven payload files
and manifest, NO controller. Only the fresh restored-base inventory remains
before final controller sealing; do not activate the app-only output alone.

The assembler accepts the same argument positions as .152, but rollback arguments
4/5 must be empty: WebPDFprotocol3 is already accepted, not a pending app upgrade.
The .153 renderer additionally refuses any webpdfRollback field. Render and test
the controller only after real profiles arrive; missing files fail closed.

Run ops/audit-pro153.mjs with the actual runtime profile, then
ops/assemble-pro153-inputs.mjs and ops/prepare-pro153.mjs with their hash-pinned
inputs. Full preparation validates both composition orders, exact peer bytes,
native provider/source reuse and the fresh device-relative guards. Stage output
is immutable. Never use a source-only build or an old activation transaction.

All activation, off-device backup verification and startup checking remain with
ReManager. Keep device-specific settings out of the public repository and do not
publish inherited private operational receipt history. No .153 installation has
been performed or claimed from this task.
