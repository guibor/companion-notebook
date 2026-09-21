# Rendering trials — 2026-09-21

## Trial 1: readiness timeout; automatic base recovery passed

- Source `b7da093`, transaction `20260921T202529Z-1`.
- Frozen reviewed artifacts: [review receipt](render_review_2026-09-21.md).
- Stage manifest `6a2fec745db72c8da62267ed8f865f9cab2f718421fe79bd563256ee08efd3d6`.
- Preimages SHA-256 (device and Mac):
  `06cc88b12b8c2b351b5a5a29ad7078f1e214c59210adbeefd55f93da68520fcb`.
- Private log SHA-256 (device and Mac):
  `6bb973b5ee8b0a7ed2c0f8096df33981800dc30f8d7ab890bb796aa705d17c0b`.
- Private evidence under device `.codex-backups/companion-20260921T202529Z-1`
  and ignored Mac `build/recovery-20260921T202529Z-1/` (0700/0600).

Fresh public key/model/serial/firmware/stock hashes matched Ferrari 3.29.0.148.
Pretrial UI22703 and Dates14463 were active with zero restarts. Trial UI25115
loaded twelve external QMDs and reported host ready, ink=false, settings=true at
20:27:07 UTC. No created-test-ID or capture-success marker appeared. At 20:28:46
the native driver reported its bounded timeout while still waiting for readiness.
The controller had not completed its success sequence; its independent deadline
watchdog terminated the owner and restored the accepted base. No rendering pass.

Postchecks: `recovering=deadline`, `recovered=base:28522`; no stock fallback or
manual-intervention marker. Watchdog exited successfully; owner was terminated
by the watchdog (signal), not a passed owner. UI28522 and Dates14463 active with
zero restarts, Dates PID unchanged. All eleven QMDs and protected private-setting
hashes passed. Exact original three service-policy hashes restored; MemoryMax
back to infinity. Probe drop-in, host/data and lock absent; root read-only.
Only an empty pairing store remained in the trial's archived settings directory.

## Readiness correction prepared locally

Exact stock source shows an empty retained DocumentView can report `isLoading`
because its SceneView is not active. The old predicate blocked that placeholder.
This is a source-confirmed predicate bug, but the first trial did not log which
readiness gate was false, so it is not a confirmed diagnosis of that timeout.

The correction allows a document-less placeholder, retains all other gates and
logs only a readiness reason label when it changes. It tests null/placeholder/
actual-loading primary states, each other guard and native return to library.
53 Node and 29 Qt tests pass; normal and render composition each pass three
orders with 29 resources. ReManager independently approved the narrow delta,
including exhaustive readiness combinations and retained input/capture/recovery
guards. Revised frozen artifacts under `build/render-native/`:

- Controller: `97ef1cdd466f4c7f6778ef726509c4f2b3d0baa9a20fc0761dc709d7673decd8` (unchanged).
- QMD: `be29e8ce0ba1babc6c69c53dbbd983c2f708a14f370a91269810abc883a1ab34`.
- Host: `b955ee4c844b06c0289d327773fbfb389cc7af5fe262d1c4f4b4af7cc093a3a6`.
- Pair store: `44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19` (unchanged).

Use a fresh transaction/backup; the first trial is never modified or reused.

## Trial 2: both native documents opened; interaction failed; base recovered

- Source `cb6d88f`, transaction `20260921T203300Z-1`.
- Stage manifest `f2df4aa94248d08fbe3cf47e952a6f46aeea1c06c4080548ab9025c3d6cc3d08`.
- Preimages SHA-256 (device and Mac):
  `176214ea2906efaaf409dad5178941acd7cc3e68580bd6b7015a21266b7a18e5`.
- Private log SHA-256 (device and Mac):
  `235ec1ae45ac61e346d8c8bf88e484932a19f930405e9611a9cd2f5536a5cffc`.
- Evidence: device `.codex-backups/companion-20260921T203300Z-1` and ignored Mac
  `build/recovery-20260921T203300Z-1/` (0700/0600).

Trial UI30615 reported readiness=ready at 20:34:28 UTC and created exactly two
labelled test notebooks through native APIs. The secondary reported native
rendering ready at 20:34:31.990. At 20:34:33.427 the diagnostic failed with
`Error: Insufficient arguments` during the scripted interaction. There was no
capture or completion marker. This proves native opening progressed, not visual
correctness, native ink, scroll usability or a passed rendering trial.

Independent watchdog restored `base:34683` after its deadline. UI34683 and
Dates14463 active with zero restarts; Dates unchanged. All eleven QMDs, protected
private settings and exact original three policy hashes verified unchanged.
MemoryMax returned to infinity; trial drop-in, host/data directories and lock
absent; root read-only. No relevant QML errors in the restored base's recent log.
Owner was killed by watchdog (signal); watchdog inactive/success. No stock
fallback or manual-intervention marker. No capture files were retained.

The user reported inability to scroll while the diagnostic's intentional input
lock was active. On requesting safe abort, the watchdog had already completed
recovery, so the conditional abort action made no change. User was asked to test
scrolling after recovery; physical input acceptance is not yet confirmed.

No more hardware trials in this turn. The remaining work is local only.
Before another trial, improve immediate failure-to-recovery responsiveness: the
native failure occurred before the expensive controller warmup checks completed,
and the independent deadline restored the base before the owner exited itself.
Do not weaken identity/inventory/recovery checks or broaden restart budgets.

## Local-only refresh correction

`cnRefresh()` used zero-argument `viewport.requestRepaint()`. Exact firmware's
stock QML instead demonstrates `markDirty(rect)` and `requestRepaintDirty()`.
The correction follows those calls, guards absent/zero-size viewports and adds
actual-helper argument tests. It is the likely failing call, but the prior
diagnostic omitted its phase/stack, so the attribution remains provisional.
Future failure messages include the numeric phase. 55 Node / 29 Qt tests pass;
both composition profiles pass three orders, 29 resources each. Not deployed.
ReManager independently passed the narrow local source review, explicitly without
hardware-trial clearance this turn. Frozen local QMD
`18c47150553835d04982a3f6548ad094d68991564bfff895fafd91cf57a4714b` and host
`0c3d3aa120ccd0f86a5ff18597d39c42775b45e10e2e6b9ec038d09865561919`;
controller/pair store unchanged. Physical scrolling acceptance remains pending.

## Trial 3: geometry/focus progressed; capture API rejected; fast recovery passed

User confirmed ordinary scrolling after trial 2 and authorized continuation.

- Source `05b994f`, transaction `20260921T205233Z-1`.
- Stage manifest `8782dc35d185a89a7a39070e3359898bb73d9d69b71c6fac466273a930d78afe`.
- Preimages SHA-256 (device and Mac):
  `0aed8550f0683b3aad2bd88284f1bea2aa43a080e2acb28e0ef9e11dccd7d1b2`.
- Private log SHA-256 (device and Mac):
  `106d4ac87244d4aaeef29379b83a34a12c498859b3d5b98036566fed7e6c8e92`.

UI36911 reached readiness and created two native test notebooks at20:54:03 UTC,
then native-secondary ready at20:54:06.976. The driver progressed through fixed
geometry translation and focus/pen-gate assertions. At20:54:09.169 Qt explicitly
reported `DeviceSceneViewport: grabToImage: item has no QML engine`; phase5 failed
with `Native viewport capture rejected`. No capture/completion pass was issued.

The new independent watcher detected the failure promptly: `recovering=native-failure`,
then `recovered=base:37973`. UI37973 and Dates14463 active with NRestarts0; Dates
unchanged. Full eleven-QMD/private-settings/original-three-policy checks passed;
MemoryMax infinity; root read-only; no host/data/lock/drop-in remained. Restored
base's recent log had no relevant QML errors. Watchdog inactive/success. Evidence
retained privately on device and Mac under this transaction, no captures.

This qualifies faster failure detection/recovery and progress through the native
driver, not visual rendering or physical dragging/ink. Next local correction:
capture only the stock QML-created current SceneView, which owns the C++ viewport,
not the shared sceneViewsRoot/cache container or whole DocumentView/MainView.
Both outer DocumentView and captured SceneView must reference disposable IDs,
with generation/safe-state/viewport/view/capture-item identity checked at callbacks.

ReManager independently reviewed this narrower capture delta, reran 69 Node /
29 Qt tests and both three-order composition profiles, and cleared only another
bounded pen-disabled diagnostic. Frozen QMD
`a645a3ea280c3057ace4392a94e07ba1f4bf260f7e51a8a511277dff92b1a7cc`;
controller `034d4553a5c03a93426527eb3633f92bc0cb1992f63c9b92b8c1065965b4d03f`,
host `0c3d3aa120ccd0f86a5ff18597d39c42775b45e10e2e6b9ec038d09865561919`,
pair store `44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19`.
No scene cache siblings are captured. Real image usefulness remains unqualified.

## Trial 4: native capture SIGSEGV; base recovered; hardware trials suspended

- Source `beb7f5c`, transaction `20260921T205838Z-1`.
- Stage manifest `5dae3a98309088c6bf0f93ff909b4cd473faf6d7370d9d1e652ba7de28b56d2d`.
- Preimages SHA-256 (device and Mac):
  `23761d7baf8cd0cf9ead6d1bd9ff8e7973e74e3b5b795aac34784a442fcef126`.
- Private log SHA-256 (device and Mac):
  `0e1246747333f59b867b51efe3c74c19d184fff8fe0351d57ce03b2efa396b87`.

At 21:01:13 UTC the driver created the two disposable notebooks. Native secondary
readiness passed at 21:01:17.052. At 21:01:19.176 the log emitted two warnings:
`Layers are not supported and don't make sense`. systemd reported xochitl
`code=dumped, status=11/SEGV` at 21:01:19. No PNG or completion marker exists.
The owner exited status 1, and the independent watchdog restored the accepted
base: `recovering=owner-ended`, `recovered=base:41100`.

All 11 QMDs and 10 protected settings files verified unchanged. The first manual
QMD check was accidentally run from the home directory and reported missing
relative paths; rerunning from the actual qt-resource-rebuilder directory passed
all eleven. Exact original three runtime policy hashes matched. UI41100 and
Dates14463 active with zero restarts; Dates PID unchanged. MemoryMax infinity,
root read-only, no active host/data/probe drop-in/lock. No stock fallback or
manual-intervention marker. Watchdog exited successfully. A later stability
check retained the same UI PID, zero restarts, and no relevant recent base QML
errors. Private evidence retained in the transaction's device/Mac directories.

No further tablet experiments this session. Render staging is blocked in code,
including an executable regression test proving refusal precedes file creation.
Previously staged render artifacts must not be reused. Normal source builds and
offline tests remain possible; no native ink or pilot acceptance has been granted.

Upstream Qt 6.10.3 `QQuickItemGrabResult::setup()` calls createLayer and immediately
dereferences the result without a null check. The stock xochitl binary contains
its own EPContext/EPRenderContext, so ordinary desktop Qt capture support is not
evidence of compatibility. The warning/crash timing strongly implicates capture,
but without a native backtrace the precise failing instruction is unconfirmed.
Source: https://raw.githubusercontent.com/qt/qtdeclarative/v6.10.3/src/quick/items/qquickitemgrabresult.cpp

Local disassembly of the exact cached tablet libQt6Quick corroborates the missing
null guard: setup's createLayer virtual call at 0x239b9c is followed by storing the
returned pointer and dereferencing it at 0x239ba4. This is static evidence only,
not a captured fault PC. All 70 Node tests pass after staging suspension.

ReManager was informed of restored base and asked for local-only analysis of a
non-layer diagnostic; no device changes or new run approval requested.

After the fourth recovery the user explicitly confirmed: normal document
scrolling works. This closes the physical input recovery check, not Companion's
rendering or writing acceptance gates.
