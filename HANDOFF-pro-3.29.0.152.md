# Companion / Quick Pad Pro 3.29.0.152 handoff

Status: corrected PDF-readiness package installed by ReManager on 2026-10-10;
startup, readback and current-settings checks passed. Physical lasso editing
remains untested; do not treat this as SelectChange interaction acceptance.
Do not reuse the historical stage/inventory below as a fresh deployment receipt.
**No device operations were performed by this task.** Worktree:
`/Users/mdf/code/.worktrees/companion-pro-3290152`, branch `beta/pro/3.29.0.152`.
Starts at `40cae4a` (latest accepted Quick Pad/corner/sharing/toolbar behavior).
ReManager owns all live actions. No tablet, Move or server access from this task.

## Corrected-UI deployment receipt (current)

ReManager reported transaction `20261010T091802Z-1` installed on Paper Pro .152
from `handoff-f782d6508008`, manifest
`a81f5b9fd47a8f79e6ce5190a7d555a464a147252c688cbd031707de298f7d45`.
The corrected combined QMD is
`07a8d0774c1f0b009f032c296fba8ba1b7bde3075d892086e94968ac41ca8fa5`.

- Fresh recovery backup verified off-device: SHA256
  `b08f357455cf7e0743362a0ed1a8f4193b0b786581a1203e12f4a0fc332e0b30`.
- UI60329, Dates8045, owner58982 and watchdog59933 active, all NRestarts=0.
- WebPDF ready at **12:20:31.360 Israel time** (09:20:31.360 UTC);
  Companion ready at **12:20:37.636 Israel time** (09:20:37.636 UTC), 2026-10-10.
- All eleven **current** settings hashes passed, including the newer pairs.ini;
  do not substitute the earlier pairing-settings hash. Root remained read-only.
- Device readback confirms PDF readiness binds to `restyleTextBridge.textEnabled`.
- Dates absence was explained by the observed PDF context; no Dates code edits.
- Lasso editing was not physically exercised. This receipt establishes deployment,
  startup, corrected binding and settings preservation, not lasso UX acceptance.

Source: ReManager's deployment report and maintenance receipt committed/pushed
as `6046cce` (`playbook/log/2026-10-10-pro-3.29.0.152.md`). This task only records
that evidence; no device, owner/watchdog, server or Move action was performed.

## Follow-up preparation history

Restyle's owner corrected the PDF readiness binding and WebPDF's owner verified
the rebuilt combined artifact. Current packaging uses one reviewed inventory:
`profiles/overlay-pro-3.29.0.152.json`. The composed QMD must match the exact one
staged into the controller. New peer bytes require combined composition and a
fresh ReManager inventory after controlled recovery; the old receipt is historical.
Companion host/native/settings/UI bytes are unchanged. No device operations here.

Dates inspection: `ndiDatesButton` exists in the composed toolbar, but is shown
only for `documentType === "note"`, expanded toolbar and stock capacity >7.
SettingsMenu has the <=7 fallback; AdditionalEditingToolsMenu has another
note-only entry. All exclude PDFs. Companion's extension-capacity subtraction
does not change the stock-capacity guard. This is source evidence, not a claim
that the user's current notebook layout is known. No speculative UI change made.
ReManager subsequently confirmed the visible document is a PDF; no Dates code
change is needed for that observation. Corrected combined overlay now pinned:
`07a8d0774c1f0b009f032c296fba8ba1b7bde3075d892086e94968ac41ca8fa5`
at the Restyle owner's `.cache/pro-3.29.0.152-ui-availability-fix/restyle-with-webpdf.qmd`.
The native module and all seven Companion payloads remain byte-identical. Full
composition completed against the coordinator's new post-recovery inventory;
the sealed stage below was handed over for coordinator-owned installation.

### Corrected-UI stage (installed; receipt above)

- Path: `build/pro-3.29.0.152/handoff-f782d6508008/`.
- SHA256SUMS: `a81f5b9fd47a8f79e6ce5190a7d555a464a147252c688cbd031707de298f7d45`.
- probe.sh: `bfa39428b60ef26ab5309c9c8e64b5eccac405bfd430ba9d3fd1a600c7870e2a`.
- Coordinator input SHA256: `f782d65080083f33046bf78912924af74abebcf9423771cc3e612fb72eff92a3`.
- Fresh post-recovery inventory SHA256:
  `528f612802cd34618618d31ad6207ed06787934ff3907a85a7cb5f2e7e120823`,
  supplied after ReManager confirmed base57416 recovery. It is not the earlier receipt.
- Both full-stack composition orders parse34resources; generated PDF handler has
  `restyleTextHighlightReady: restyleTextBridge.textEnabled`, not constantfalse.
- All seven Companion payloads verified identical to the prior working stage.
  Restyle module remainsf770c556; changed combined QMD is07a8d077.
- Same twelve-file stage/backup/run protocol and independent recovery. No Dates
  code change, settings migration, native-module rebuild or device operation here.

The corrected binding addresses PDF Highlight/Remove visibility. The Restyle
owner added lasso-refusal diagnostics; the live missing SelectChange cause is not
proven resolved by this package. Startup and physical controls remain separate.

## Earlier coordinator-reported installation receipt (superseded)

Retry `20261009T224634Z-34932` reached ready state on 2026-10-09 at 22:48 UTC
(2026-10-10 Israel time). Evidence was read from ReManager's command results:

- UI19222, Dates8045, owner17906 and independent watchdog18840 all active,
  with zero automatic restarts; UI remained19222 at the 22:48:27 follow-up.
- `WebPDF: selection host ready` at 22:48:13.858.
- `Companion: host ready; ink=true; settings=true` at 22:48:15.528.
- All eleven recorded settings files matched, including pairs.ini, both Gestik
  files, Dates settings/token/sync, Dispatch and Smart settings/SSH files.
- Thirteen external QMD loads passed the exact count check; relevant QML-error
  scan passed; root remained `ro,relatime`.
- The controller's mandatory readiness gate includes both Companion native
  mappings and the reviewed Restyle mapping. Physical writing/selection behavior
  remains user feedback, not something inferred from this startup receipt.

Move and shared servers were not changed. No manual-test pause or synthetic
tablet input was part of this installation.

## Sealed combined stage

**Historical installed cold-start stage; superseded by the corrected-UI stage above:**

- Directory: `build/pro-3.29.0.152/handoff-48f70087f9ac/`.
- SHA256SUMS: `75d510790197f39960bb4c4cf3ac9eae6496f51ffeacfd7466124327f096b46f`.
- probe.sh: `86e8e3878cd8ffc60c5d8d2e10e0636eba795c7250d8b3c12ee78d85d0254a70`.
- Coordinator SHA256: `48f70087f9ac659c7850043b14857815e7531b6278bb82faa4c4b249ab8f8137`.
- First activation `20261009T224151Z-31578` exited at the startup gate before
  native-host readiness; its log showed resource processing but no QML load
  errors. ReManager confirmed completed recovery to base16337 with zero restarts
  and every settings hash unchanged. Fresh inventory remained byte-identical.
- Retry changes **only probe.sh**. It waits at most 60 completed one-second polls
  for the same active PID, zero restarts, live watchdog, all expected module maps,
  Companion ink/settings-ready and WebPDF selection-host-ready. No map gate is
  waived. Timeout, PID change or watchdog loss still triggers existing recovery.
- Backups use `tar -cf - | gzip -1` under pipefail, with identical explicit file
  coverage and archive/hash/off-device verification requirements.
- `ops/reseal-pro152.mjs` reused the pinned prior composition only after proving
  identical target/runtime/peer/live inventories and all eleven unchanged payload
  files. Four targeted startup cases pass (cold readiness, timeout, PID change,
  watchdog loss), in addition to the prior twelve controller cases.

First sealed stage (historical failed startup attempt; **do not replay**):

- Directory: `build/pro-3.29.0.152/handoff-09731879751e/`.
- SHA256SUMS SHA256: `a93979fe948e4e7c54a2a62ac92caff1feabf8f7e1af762da8067e3ee51e0aa0`.
- probe.sh SHA256: `78ce40eb91492a134fa74fae582322df5fa7cdb47c41a5491eadcb3fd36bfb0d`.
- Coordinator input: `build/pro-3.29.0.152/coordinator-09731879751e.json`,
  SHA256 `09731879751e40b04220fba92e79bdae7dba5da370de954598e8f855b06a31da`.
- Fresh inventory supplied by ReManager: SHA256
  `4927c31142a701771d4af1b7f0e6c3b24c8463087489079086164d68cd38ccaa`.
  Includes 34 immutable files, current host and private-settings hashes, effective
  runtime-only failure shadows, exact base environment and native mappings.
- ReManager reported base commit at 22:40:31 UTC, UI8060 / Dates8045, zero automatic
  restarts, read-only root, no activation lock. Both Gestik hashes now reflect the
  live settings after ReManager preserved the two prior preimages.
- Twelve manifested payloads; stage these and SHA256SUMS only. The JSON receipt
  is local documentation, not a tablet payload. Full instructions below.
- Final composition: 34 QML resources parse in each of two orders; 18 focused
  controller/port tests pass. No synthetic tablet input or physical-test claim.

## Inputs needed from ReManager

The real table and native-provider fingerprints have now arrived and passed.
The fresh base service/file/settings inventory has now arrived and is bound into
the sealed stage above. The schema below is retained for future updates. Do not pass the old controller's
inventory or call an app-only payload a complete activation package.

- Exact .152 QML hashtab (actual capture, not the old .148 table).
- Exact .152 runtime libraries or a device-generated SHA256 manifest confirming
  whether these unchanged .148 native-module dependencies are byte-identical:
  `/usr/lib/libQt6Core.so.6.10.3`, `/usr/lib/libQt6Gui.so.6.10.3`,
  `/usr/lib/libQt6Qml.so.6.10.3`, `/usr/lib/libstdc++.so.6.0.36`,
  `/usr/lib/libgcc_s.so.1`, `/usr/lib/libc.so.6`, `/usr/lib/libm.so.6`,
  `/usr/lib/libdl.so.2`, `/usr/lib/libpthread.so.0`.
- Final base QMD inventory/order and app resources, including Restyle and WebPDF.
  Do not freeze or guess peer hashes while their ports are still changing.
- Fresh base service/drop-in, library, extension and settings inventory before
  rendering a runnable controller; old .148 service pins are not valid defaults.

The source port keeps installation fail-closed when these inputs are absent.

## Prepared results

- `CN_FIRMWARE_VERSION=3.29.0.152 CN_SOURCE_ONLY=1 CN_USER_PILOT=1
  CN_QUICK_PAD=1 node build-native.mjs` emits
  `build/pro-3.29.0.152-unbound/quick-pad-native/`. **Not installable** until bound
  to the actual table; no SHA256SUMS is emitted for this unbound profile.
- `node ops/audit-pro152.mjs`: the Qt6 metadata/string tables for
  PenInputThread, PenInputSurfaceManager, PenInputSurface and PenInputHandler
  are byte-identical to .148, and .152 retains the exact public QObject
  moveToThread import. No native C++/ink/metadata implementation was changed.
  This is a static ABI check, not proof of worker semantics or on-device startup.
- All eight direct native providers match the accepted module receipt. The
  current manifest is `profiles/runtime-pro-3.29.0.152.json`; Core and Qml were
  also independently hashed from the actual local captures. No C++ rebuild needed.
- Preliminary source composition: 34 QML resources parse in each of two
  dependency-respecting orders. Preserves .152's added
  `onExteriorBoundaryChanged: updateViewportEdges()`. These tests retarget only
  scratch copies of the old peer QMDs; they are NOT final .152 peer approval.
- 6 new exact-target/old-controller refusal tests and 29 focused settings,
  toolbar, corner, navigation and layout regressions pass.
- 26 Qt Quick Pad interaction checks and 24 native-admission test cases pass.
  Receipts: `build/pro-3.29.0.152-audit/{quickpad-tests,admission-tests}.txt`.
  Desktop C++ tests used installed MacOSX13.0.sdk because the default27 SDK
  lacks the AGL framework expected by the local Qt6.8 build. No Qt/SDK system
  files or native tablet module sources were modified for that workaround.
- .148 builder remains the default, and historical pilot packager explicitly
  refuses .152. No historical diagnostic clearance is reused.

## Final integration entry point

### Ready app-only payload (actual final peers, not fixtures)

`build/pro-3.29.0.152/payload-b77735d4650b/` has the seven Companion payloads and
`SHA256SUMS`. It was composed against the actual selected table
`5d5e9e6fe21a9dfbed27306aa57b137e3efdf59f5ba904df4440e222cdd2fe86`, the
11 final base QMDs, embedded AppLoad .6 and combined Restyle/WebPDF
`8da621f11a4e0c1e29e33d1c27e3bc69c2fdfed15ee8c2ac4a760e56570973ec`.
Both orders parse and preserve the new stock viewport callback. No controller is
included in this app-only directory. See its controller-inputs.json for receipt.

Input JSON: `build/pro-3.29.0.152/coordinator-b77735d4650b.json`, SHA256
`b77735d4650b03be94fc55c7242da60f2fb5cf8b65cbf5f861dfb66bb3e161f6`.
`ops/assemble-pro152-inputs.mjs` assembles these supplied local inputs. With
`fresh-controller.json SHA256` arguments it incorporates the controller inventory.

### Complete controller package

`node ops/prepare-pro152.mjs /absolute/coordinator.json <SHA256-of-that-file>`
is an offline-only builder. It requires the real final inputs, checks byte hashes,
binds the .152 QMD, composes the complete supplied stack in two orders, and emits
twelve files (seven app files, three reviewed Restyle/WebPDF files, `probe.sh`, `base.sha256`) plus SHA256SUMS and a
local-only controller-inputs.json receipt under
`build/pro-3.29.0.152/handoff-<input-hash-prefix>/`.
Stage only the twelve manifested files and SHA256SUMS; the JSON receipt stays on
the Mac. The stage's strict inventory intentionally refuses extra files.
`--payload-only` explicitly omits the controller and does not waive activation.

Coordinator JSON fields (no placeholder manifest is accepted):

- `firmware`, `build`, `buildId`, `stockSha256`: exact .152 identity above.
- `hashtabSha256`: verified hash of the actual table at the shared .152 cache.
- `qmds`: ordered `{path, sha256}` array of final peer QMDs including embedded
  AppLoad, BetterTOC, Restyle and WebPDF. Do not include Companion itself.
- `additionalResources`: local extra QML resource directories, such as AppLoad.
- `runtime`: `{firmware, stockSha256, libraries}` from device observation.
  `libraries` maps SONAME (e.g. `libQt6Core.so.6`) to
  `{devicePath, sha256, localPath?}`. Every direct native provider must match
  the accepted prior ELF receipt; a changed provider blocks reuse/requires audit.
- `hashtabCaptureStatus`: `two-canonical-captures-equal`.
- `controller`: fresh inventory as described below; required unless explicitly
  preparing the app-only payload.

### Fresh controller inventory schema

`ops/controller-pro152.mjs::validateController` is the executable schema. Required:

- `source: "ReManager fresh device observation"`, `observedFirmware`, `serialSha256`.
- `files`: complete relevant immutable base files as `{path, sha256}`, including
  current XOVI/extensions, all base QMDs/table, AppLoad/Dispatch assets and WebPDF
  integration/SelectionHost.qml, SelectionLinks.qml,
  Links.js. WebPDF has **no native DSO**; don't invent one.
- `directories`: `{path, names}` immediate exact inventories for at least
  extensions.d and qt-resource-rebuilder. Every named entry needs a file pin.
- `qmds`: `{name, sha256}` for all eleven external QMDs in the freshly restored
  base directory, excluding embedded AppLoad, Restyle and Companion. The combined
  controller puts the reviewed Restyle/WebPDF QMD and native module in its own
  private runtime alongside Companion; it never edits the base's QMD directory.
- `hostFiles`: complete current Companion module-tree `{path, sha256}` inventory.
  Existing host is backed up and moved aside only after the watchdog is ready.
- `settings`: fresh `{path, sha256}` inventory, including live pairs.ini, **both**
  Gestik copies, Dates settings/token/sync, Dispatch settings and surviving Smart
  settings/keys. Hashes only; no private contents in JSON. The live Gestik copy
  wins operationally; neither live nor older protected copy is overwritten here.
- `policy`: `files` pins, `fragmentPath`, ordered `dropInPaths`, `onFailure: ""`,
  `restart: "no"`, and `vendorShadows` entries `unit` and `sameBasenameOverride`,
  each `{vendorPath, shadowPath}`. The coordinator must first create/verify its
  safe runtime-only same-basename shadows. This controller preserves those exact
  bytes and verifies they remain effective; it never reinstalls historical ones.
- `baseEnvironment`: exact relevant environment (LD_PRELOAD, XOVI_ROOT,
  QML_IMPORT_PATH, QML_DISABLE_DISK_CACHE, QML_XHR_ALLOW_FILE_WRITE/READ,
  MALLOC_ARENA_MAX). No table-capture flag.
- `qmlImportRoots`: the actual base native import roots (normally `[]` for the
  eleven-QMD base); Companion adds its own and the new private Restyle root.
  `baseMaps`: freshly observed required native maps, not Companion/Restyle yet.
- `absentLocks`: coordinator locks required absent, including
  `/run/pro329-apps-activation.lock`.

The controller retains the accepted watchdog/cgroup/recovery bodies byte-for-byte:
independent systemd owner/watch units, cgroup-v2 descendant emptiness before
recovery, two watchdog attempts, one base and one stock start, and completed-poll
heartbeat counting. Fresh full-unit/same-basename shadows must already remove
OnFailure targets; empty dependency assignments are not used as a substitute.
Runtime drop-ins explicitly set Restart=no and StartLimitAction=none.
It preserves live data directories in place and backs up both Gestik preimages.
It requires off-device preimage verification before activation. Eight new local
controller tests plus four host-handoff interruption cases cover pins, unchanged
watchdog, foreign policies, surviving owner children, one-shot base/stock budgets,
latest-settings preservation and absence of historical settings seeds.

### Stock-to-base controller handoff (separate owner repository)

At ReManager's request, prepared
`/Users/mdf/code/.worktrees/smart-remarkable-pro-3290152/ops/activate-pro-3.29.0.152-fullstack.sh`,
SHA256 `81e958d6695e3c5359b0b27ceaa0ea6113636fc5846afa013b0b388a25531f0d`.
Exactly seven target/manifest/Dispatch pins change from the historical .148
controller; rollback, watchdog, policy-shadow and settings logic is unchanged.
The existing policy/race harness passes, including 32 atomic commit/rollback
races. ReManager stages/activates/commits that eleven-QMD base first, then supplies
its live policy inventory for the combined controller. No device access here.

The exact existing native binary references are in
`/Users/mdf/code/companion-notebook/build/admission-arm64/elf-review.json`.
The packager verifies each copied binary against that receipt. It does not
overwrite peers, invent peer hashes, connect anywhere, or activate a controller.

## Controller / rollback contract for ReManager

Do **not** run the old `ops/build-pilot.mjs` controller on .152. Its historical
runtime drop-in, base manifest, extension/service pins and Dispatch binary are
specific to an earlier .148 base. Use the freshly inventoried combined base.

- Install NativeHost.qml, PairStore.js, SizeRuler.qml under the existing module
  root `/home/root/.local/lib/companion-notebook`.
- Place bootstrap at that root, and admission plugin + renamed `qmldir` under
  `qml/Companion/Admission`. Preload bootstrap before XOVI; preserve all required
  Restyle QML import roots/native module and WebPDF absolute-path QML assets. The full combined inventory,
  not the historical nine-file standalone package, defines rollback coverage.
- Preserve the **current live** `pairs.ini` byte-for-byte (original `companion`
  section and separate `quickPad` section). No old retained-pilot seed, blank
  Settings object, automatic migration, or per-device settings synchronization.
- Fresh backup/off-device verification and independently supervised bounded
  activation precede any restart. Recovery returns to the freshly verified .152
  base (and bounded stock fallback), never the old .148 drop-in.
- Recovery must preserve latest user settings, clear this attempt's own drop-in,
  stop its whole owner cgroup and leave other apps/services intact. Native-load,
  native transaction failure, crash or lost heartbeat triggers recovery.
- Existing pilot heartbeat markers remain; count completed missed watchdog polls,
  not elapsed `/proc/uptime`, so device suspend alone cannot cause a false reset.
- Confirm exact loaded hashes and `Companion: host ready; ink=true; settings=true`
  separately from physical writing/scrolling acceptance. No automated pen trials.

This task has not accessed the tablet, Move, servers or personal documents.

## Coordinator invocation (after the base commit and final seal)

Choose a new transaction `ID` matching `YYYYMMDDTHHMMSSZ-N`; never reuse one.
`MANIFEST` is the SHA256 of the final handoff's SHA256SUMS. Stage exactly its
twelve listed files plus SHA256SUMS as root in a new mode-0700 directory:
`S=/home/root/.codex-staging/companion-$ID`. Do not stage controller-inputs.json.
The following are **device-side commands for ReManager**, not commands run here:

```sh
bash "$S/probe.sh" prepare "$ID" "$MANIFEST"
```

This does not restart the tablet. It verifies the committed base, pins/settings,
no overlapping owner/lock and current host; it creates a new private backup at
`B=/home/root/.codex-backups/companion-$ID`, prepares the isolated runtime and
prints the archive path/hash. Copy `B/preimages.tgz` off-device, verify its hash
and archive readability, then write the exact matching off-device verification
marker to `B/mac-backup-verified`: `mac-backup:<archive-SHA256>` plus newline.
Only after that verification:

```sh
systemd-run --unit="companion-pilot-$ID" \
  --property=Type=exec --property=KillMode=control-group --property=Restart=no \
  /bin/bash "$S/probe.sh" run "$ID" "$MANIFEST"
```

Do not use `--collect`: recovery needs the owner unit/cgroup identity after exit.
The run action creates its own independent `companion-pilot-watch-$ID.service`
before changing the host or policy. Do not launch a second watchdog or replay a
base controller during this session. `B/pilot-running` contains the checked UI
PID after writing/settings readiness; inspect both owner/watch service state,
the startup log and settings preservation. Also require the WebPDF selection-host
startup message and absence of relevant Restyle/Companion load errors.

There is **no commit action** in the Companion pilot: unlike the bounded base
activation, this experimental feature retains its independent runtime watchdog
while used. Once `pilot-running` is present, hand control back without scripted
tablet input or a manual-test pause. Runtime-only activation does not persist
across a reboot. For an intentional rollback:

```sh
bash "$S/probe.sh" stop "$ID" "$MANIFEST"
```

Wait for `B/recovered` and the normal base (or bounded stock fallback). Do not
kill the watchdog before it finishes. Recovery never overwrites current settings.
# Page-links paired protocol upgrade prepared (2026-10-11)

Stage `build/pro-3.29.0.152/handoff-720d1f794eb4`, for sole-writer ReManager:

- SHA256SUMS: `523db13ca1816f7282c9eb2cfed903a02e3706117484374ed72438eb27d0a0b4`
- probe.sh: `3bc09631cc319950ce4f59724b451e5df21ab56bbe7b7dc4fcd8dedae1e5d920`
- Coordinator: `720d1f794eb4db008a6267207b8073382f7ac3e9a97509fbd1bba510aecd2d0c`
- Fresh base: `22a6e18cff931b601d091d2dbc14ba86b755464b08c81c8ccf9fffcea7bda985`
- Rollback input: `00db60e82cc3a21481d00f3d588cb8a1e29b0d07bc4a9f7f0ec773bd98f3b8da`
- Combined QMD: `0531dd583d84a989e35450082a8a968409e308c3947d96c9dbf34dcb63d7c1c6`

Base249152 has39file pins/13settings/11QMDs, current b4ac661b Gestik/Timer peers.
Actual rollback inventory contains11old/22new files and the exact reviewed
page-links-protocol-2-to-3 transition. Both complete composition orders parse;
single-lookup/cancel/fallback regression passes in both. Nine other app/module
payloads match b492. Standard12files+manifest prepare/off-device-backup/run.
Call `accept-webpdf` after startup checks. Before acceptance, recovery restores
the full old bundle after native fallback; after acceptance it retains protocol3.
Private config/state remains untouched. No deployment or UI/import acceptance
claim from this offline preparation.

ReManager subsequently DEPLOYED AND ACCEPTED `20261011T045454Z-1` over Wi-Fi.
Use this transaction for future controlled stops, not225423 or older IDs.
UI252740/Dates8045, owner251140/watch252208 active with zero restarts;
13QMDs/three native maps, both hosts ready, all13settings preserved, root read-only
and no startup error matches. Verified off-device native preimages:
`7930271527e12045f8305c1abee06f7cdf4619c19558e3e3bc612d699d64728a`.
`accept-webpdf` succeeded with marker:
`84ad754b3c861226b1f79fa286fdd0516aa0a8e2a1784f78cd14586a60ba7e6e`.
Protocol3 is retained and watchdog supervision remains active. No physical
menu/download or external-tap acceptance claim. This task recorded receipt only.

# Single-lookup correction prepared (2026-10-11)

Stage `build/pro-3.29.0.152/handoff-b492e0369044` is ready for ReManager activation.

- SHA256SUMS: `f340f865bd78ce18cfe2b98e463f2716702d738c4fdae80ad5b0501da33169d9`
- probe.sh: `bf5bda2a3ac389d77f8edcf333d30772fee2e12fa5f9897875350e63a6683834`
- Coordinator: `b492e0369044284109fffd4d533afe0870989b5e1875497f324a9228b0a79f7b`
- Overlay: `bc7035750d98c76017aa44cdddecc16c621950a386500fedd578311241c108eb`
- Fresh inventory: `d3bc05b3e3c32b755d8d9ecabb6ae13249ceef838bb21d071c63a2d0eb199ca3`

Base142999/current pairs.ini,39files/13settings, same b4ac661b Gestik/Timer peers.
Both full composition orders parse34QMLs and pass the actual composed gesture
call-count regression. Previous0008 failed with2lookups on a noncapture; this
candidate uses1. Nine other payloads are unchanged. Diagnostics retained; no app
rollback or accept-webpdf action. Standard12files+manifest guarded protocol.
Installed by ReManager as `20261010T225423Z-1` (October11 Israel). Future
controlled stops must use this transaction and its manifest, NOT172330.
UI145992/Dates8045, owner144609/watch145586 active, zero restarts,13QMDs/three
native mappings. Activebc703575 verified; all13freshsettings preserved including
newer pairs.ini, two Timer-file absences, root read-only and no QML errors,
abort or recovery. Off-device verified backup:
`4325366506aa07fada0f07372e28083b0f98bde9416f28962285c5b020603dcc`.
WebPDF ready22:55:54.088UTC, Companion22:55:55.956UTC onOctober10
(01:55 October11 Israel). Available=true/helper loaded; diagnostics remain.
Maintenance receipt `9c0a753`. No physical tap/input test or lag measurement;
this is not evidence that the unexplained PDF-tap failure is fixed.

# Temporary tap diagnostic prepared (2026-10-10)

Stage `build/pro-3.29.0.152/handoff-1bae5bb43707` is logging only, not a fix.
ReManager owns activation; no device calls from this task.

- SHA256SUMS: `d4988de35ac58595e9bb7d512236278687d8bbd9172f2b6bcd5d157cd3f2349f`
- probe.sh: `722683b870641ddefe66b36f965ad8066ae002aab2c77aed6a03cb2321df0cbb`
- Coordinator: `1bae5bb437071d8926ec4a9ab86a5bfacdd9f35e28da55c9bb5a362601447fe6`
- Diagnostic QMD: `0008e770a8a0e7f742b010c539e831f64aeffaa90065f45cb553e1d44e427242`

Uses newly captured base111528 inventory63b68fec and current peer manifestb4ac661b.
Both full composition orders and22focused tests pass. Nine other app/module
files match e507; no old-WebPDF rollback. Standard twelve-file guarded activation
protocol applies. TouchArea flags are budgeted48/view; two MainView boolean logs
are not budgeted. No URLs/text/page IDs/coordinates are logged. Await receipt and
real interaction evidence; never interpret installation as a fix.

Installed by ReManager as `20261010T172330Z-1`: UI114526/Dates8045,
owner113141/watch114116, zero restarts,13QMDs/three native maps. All13settings
checks and two Timer-file absences passed; root read-only, no errors/abort/recovery.
Verified Mac backup: `5cb86ea7ce7ef3de07d9c6d825804587eddf97ac8fafa174dd7b929ea39f5809`.
Maintenance receipt `b85a531`. Logs on2026-10-10: available=true17:26:16.871UTC,
WebPDF ready17:26:16.875UTC, Companion ready17:26:21.155UTC,
filter enabled=false17:26:21.481UTC, helper loaded/available17:26:22.005UTC
(20:26 Israel). No physical tap evidence yet. Preserve the current watchdog;
do not bypass the stock filter or claim a fix from these startup flags.

# Post-Gestik r1 stage prepared (2026-10-10)

`build/pro-3.29.0.152/handoff-e507e276e674` is prepared for the coordinated Gestik
sole device writer; this task performed no tablet operations.

- SHA256SUMS: `7221e654cc17ff553d6d190cd8ae6b6b0a89e59f5d01f21c455703a25b837f92`
- probe.sh: `2de57ee28afcc552fd325dc2965b0f2f19048b22158d9f12e446a321efd39edb`
- Coordinator: `e507e276e67433ae9567b5f3b9f1934b5cda9e197eb16cf83eae12a290f9589c`
- Fresh inventory: `63b68fec85acac1a151196c4af2607e3a1deb9647219a7bdd7f5520f7134e773`
- Peer manifest: `b4ac661b9e3daa1a5598a102060dc31185b713103dcaa7811ef7eb2f2353b92c`

All ten app/overlay payloads are identical to the accepted timer/tap stage below.
Fresh base inventory contains39files/13settings/11QMDs. Both composition orders
pass. Standard twelve-file stage, prepare/off-device-backup/run protocol applies.
NO `accept-webpdf` action is needed or supported in this stage: WebPDF is already
accepted and pinned in the base; there is no old-app rollback metadata or helper.
Native fallback preserves it. Installed as `20261010T153315Z-1`, per the device
owner's receipt: UI107401/Dates8045/owner106021/watch106991, zero restarts,
13QMDs/three native mappings, all13settings hashes and two timer-file absences
preserved, root read-only, no QML errors/abort/recovery. WebPDF ready15:35:45.622UTC
and Companion15:35:51.067UTC (18:35 Israel). Off-device verified backup:
`5cb86ea7ce7ef3de07d9c6d825804587eddf97ac8fafa174dd7b929ea39f5809`.
Maintenance receipt `ecb42d8`; Gestik receipt `8df87e7`. Physical gesture test not
performed. Device owner released exclusive access; this task did not use it.

# Reconciled direct-tap and timer stage (2026-10-10)

ReManager confirmed sole device ownership and supplied base97016 with39file pins,
13current settings and the accepted timer r1 peer. Fresh stage:
`build/pro-3.29.0.152/handoff-9546870fd5ce`.

- SHA256SUMS: `1f876f8a2ddaec75bd2f7ec1079aa4ccfb9dabcb8d75408c9709f1e845e5e3cc`
- probe.sh: `9499410299c438ed330e80962c9e11c9de5ef136f5d9910a958eb2da711c2a1d`
- Coordinator: `9546870fd5ce1920ca66c39f14a40a518c0a5ddff1c13a4c03c3583c1b4909d6`
- Fresh inventory: `97abcf716a224b42594356ac561ed9f78ae3fd44be80b281a405e090efc6ca2b`
- Peer manifest: `444e0095cf6e21864bfad985bd7bf4e142d9949ebdfc1c6c0ef6c69ac52bdf8e`

Same reviewed rollback metadata and acceptance protocol as below; full composition
and29tests pass. ReManager owns activation and must verify absent timer config
and alarm state before/after. No seeding or Move work.

Installed by ReManager as `20261010T152355Z-1`, UI100381/Dates8045,
owner98843/watch99892. `accept-webpdf` passed; all13settings hashes passed and
timer config/alarm files remained absent. Verified off-device preimages digest:
`fdcbd892cc109f8a32fb7ecf227ce2dbe77b22d947d7713ba6cf97e47b2330f4`.
WebPDF ready15:25:33.953UTC, Companion15:25:37.091UTC (18:25 Israel).
Keep native watchdog active. Physical link-tap/save acceptance remains separate.

# Superseded direct-tap stage — DO NOT USE (2026-10-10)

DO NOT ACTIVATE this stage until ReManager reconciles the concurrent Quick Timer
report (base PID97016, new timer QMD097928fd). That report arrived after sealing;
it may invalidate the fresh95495 inventory and peer inputs. ReManager was notified
immediately. Obtain a new actual inventory and complete peer composition if the
base changed. No tablet operation was performed by this task.

ReManager remains the sole device operator. New stage (not yet confirmed installed):
`build/pro-3.29.0.152/handoff-b6c206a481e2`.

- Coordinator: `b6c206a481e27c98ae97bc21cdf506529551d55e4bdf3ad5c0ed2fdc05f7dbbc`
- Stage SHA256SUMS: `7391cdbf7b1bffca8bb06af52a6cf18f4333c5874b1f41d3ca165cadaee29f09`
- probe.sh: `e001b63d893101f027a17300941127dab5a19961778fb9f4e1d9e455e119edf0`
- Fresh base inventory: `c6f9c39f348c3536c2d57ed2406bc751ea78a2e395990c2bf81a3cf2b7c90338`
- Paired rollback inventory: `114573a0078696c6cbbeff48e29d0bb14f83aa07bf341d209f39deebf0b8572d`
- Combined overlay: `d38f5d589970de4539546771e261259e04bd0338ec79c5cfc4b60fbd2f95c4e4`

Stage only the twelve manifested files and SHA256SUMS; follow the existing
prepare/off-device-backup verification/systemd-owned run protocol below with a
fresh transaction ID. Before startup acceptance, recovery also restores the old
WebPDF bundle from its verified updater backup, after healthy native fallback.
After successful startup, invoke `bash "$S/probe.sh" accept-webpdf "$ID" "$MANIFEST"`.
This validates current runtime/app/readiness before retaining the new app on
future maintenance stops. Do not manually create its acceptance marker. The
native watchdog remains active; no settings or documents are rolled back.

All seven Companion payloads are unchanged; native DSOs and Gestik are unchanged.
Both full composition orders and29focused tests pass locally. Physical workflow
acceptance remains separate. Do not replay this fresh inventory for a later update.

