# Companion / Quick Pad Pro 3.29.0.152 handoff

Status: source port and preliminary composition complete; final binding pending. Worktree:
`/Users/mdf/code/.worktrees/companion-pro-3290152`, branch `beta/pro/3.29.0.152`.
Starts at `40cae4a` (latest accepted Quick Pad/corner/sharing/toolbar behavior).
ReManager owns all live actions. No tablet, Move or server access from this task.

## Inputs needed from ReManager

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
- Core and Qml libraries supplied by ReManager were independently hashed and
  match .148. Other direct providers still need the coordinator's runtime manifest.
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

`node ops/prepare-pro152.mjs /absolute/coordinator.json <SHA256-of-that-file>`
is an offline-only builder. It requires the real final inputs, checks byte hashes,
binds the .152 QMD, composes the complete supplied stack in two orders, and emits
seven Companion payload files plus SHA256SUMS and controller-inputs.json under
`build/pro-3.29.0.152/handoff-<input-hash-prefix>/`.

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
  Restyle/WebPDF QML import roots and native modules. The full combined inventory,
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
