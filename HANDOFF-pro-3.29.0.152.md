# Companion / Quick Pad Pro 3.29.0.152 handoff

Status: final-table combined payload prepared; fresh-policy controller renderer
implemented and locally tested. **No activation performed by this task.** Worktree:
`/Users/mdf/code/.worktrees/companion-pro-3290152`, branch `beta/pro/3.29.0.152`.
Starts at `40cae4a` (latest accepted Quick Pad/corner/sharing/toolbar behavior).
ReManager owns all live actions. No tablet, Move or server access from this task.

## Inputs needed from ReManager

The real table and native-provider fingerprints have now arrived and passed.
The remaining controller input is the freshly installed, healthy combined base's
service/file/settings inventory (schema below). Do not pass the old controller's
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

The source port will keep installation fail-closed when these inputs are absent.

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
