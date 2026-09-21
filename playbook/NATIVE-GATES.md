# Native integration gates — no installer yet

## Exact target and current observation

2026-09-21 read-only SSH observation: Ferrari, firmware 3.29.0.148,
stock xochitl SHA-256
`4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4`,
active PID 3381, NRestarts 0, root mounted read-only. No XOVI/QRR/AppLoad
mappings matched in that process. This is a point-in-time observation, not a
permission to assume the next connection has identical state.

Separate base-runtime worktree:
`/Users/mdf/code/.worktrees/remarkable-beta-os-pro-3290148`.
At the initial observation it had uncommitted qualification/recovery work owned
by the firmware task. That work was subsequently completed, committed and handed
over; see the current handover section below. Do not modify its accepted controller
or replay its stock-only preparation to make this feature appear ready.

## Source evidence and required adaptation

The exact private resource cache is in the maintenance repository under
`.cache/firmware/3.29.0.148/resources`. Do not redistribute that code.

| Surface | Evidence | Required proof |
| --- | --- | --- |
| MainView.qml 403–449 | Single DocumentView with shared listener/orientation/tool dependencies | Second view with isolated mutable state and single focused global publisher |
| DocumentView.qml 180–183 | Shared opened-document and orientation bindings | Only active owner publishes; no alternating bindings |
| DocumentView.qml 411–440, 578–651 | Close/open alter Settings.lastOpen and shared selection/tools | Companion lifecycle leaves primary recovery and tools intact |
| DocumentView.qml 783–792, 840–845 | Native scroll persistence and per-view lock manager | Correct stable-page restore, locks and save completion for distinct documents |
| DeviceSceneView.qml 455–480 | EPFramebuffer and direct pen/text rendering | Hidden primary cannot paint through foreground; QML clip alone is insufficient |
| DeviceSceneView.qml 655–676 | Mutable view behavior and native stroke handler | No zoom/tool cross-contamination; inactive surface cannot ink |
| DeviceSceneView.qml 868–876 | PenInputSurface uses surfaceManager and scene-to-view transform | Hit-test, z-order, translation and clipping at every margin height |
| DeviceSceneView.qml 1082–1095 | Per-view native gestures | Independent scroll and palm rejection with fixed gesture ownership |

## Ordered gates

1. Base exact-firmware XOVI/QRR runtime independently qualified and recoverable.
2. Offline patch composition against the full accepted extension inventory.
3. Session-independent bounded watchdog, exact preimages, stock fallback; no
   firmware/root/boot writes and no startup persistence for the experiment.
4. Two **disposable distinct** documents, pen disabled: open/close, scroll,
   live translation and occlusion. No personal notebook used as first probe.
   Check that `QtCore.Settings` is actually available on the target, that the
   external host loads, and that only pairing metadata reaches its settings file.
   Desktop Qt availability is not proof of tablet module availability.
5. Native pen enabled only after surface routing proof: corners, boundary
   crossings, eraser, undo/redo, tool changes, page addition, close/reopen,
   sleep/wake and crash recovery; verify actual saved results, not screenshots.
6. Measure e-ink drag/input latency and refresh behavior. User's fluidity
   requirement is hard; no ghost divider or settle-on-release downgrade.
7. BetterTOC/Dates attribution, Gestik, pen-layer memory and screen-sharing
   composition. Dispatch/Smart remain disabled until capture ownership and their
   independent server gates are satisfied.
8. Pilot acceptance before recurring installation list or a Move port.

Stop for misdirected/lost ink, unbounded restarts, uncontained direct refresh,
unresolved save/lock ownership, or need for invasive opaque binary patching.

## Current offline candidate (not deployment authority)

`build-native.mjs` now produces a pen-disabled native QMD and external host.
Its composition test pins the coordinated revision-1 base manifest
`5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d`:
11 external base QMDs, one embedded AppLoad patch, plus Companion. Three load
orders produce 29 syntactically valid resources each. The previous r0 BetterTOC
cohort was rejected by ReManager's live log gate; it is not substituted here.

ReManager accepted the base revision-1 cohort and explicitly handed over after
its final stability check. Fresh host-key-first read-only verification matched
UI14472, Dates14463, zero restarts, all eleven QMDs and read-only root. The native
candidate is not in the recurring reinstall list. A separate load-only probe
controller now exists, with its own scratch runtime and independent always-revert
watchdog; it must never replay the base's stock-only preparation while active.
Its recovery functions pass isolated mock tests, and the live load-only trial
also passed with automatic restoration to base UI22703 / Dates14463. The exact
[receipt](log/load_probe_2026-09-21.md) records hashes and postchecks. This permits
preparing a separately reviewed two-disposable-document trial, not enabling ink.
