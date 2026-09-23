# Ordinary controls qualification

## First actual-control attempt: ruler load refused, normal base restored

Trial `20260923T001500Z-1` was separately reviewed and prepared with an exact Mac
recovery backup. A transient Codex approval-service error rejected the first
activation command before execution. The same approval path later worked;
read-only checks proved there was no owner, backup marker or lock, and the single
prepared attempt was then started normally. No approval bypass or repeated UI
activation occurred.

Native startup reached UI93130, but external host creation failed:

```
NativeHost.qml:231:13: Type SizeRuler unavailable
SizeRuler.qml:27:17: Non-existent attached object
Companion: host load failed
```

Line27 is `Accessible.role` in the shared desktop ruler. The tablet QtQuick build
does not expose that attached type. No host-ready, disposable notebook creation
or native ink submission receipt exists for this attempt. This is not a native
transaction/control failure, nor a successful control test.

The operator set the existing watchdog's abort marker. Automatic recovery and
an independent fresh read-only check verified normal UI95131/Dates14463, no
restarts, exact base/settings/service policies, read-only root, absent Companion
host/data/lock and absent owner/watch cgroups. Move was untouched.

| Artifact | SHA256 |
| --- | --- |
| Manifest | `01c30568ef97a7f46090233b3d1155619186f4be640f5b8ff35ac740dd8ee7d5` |
| Controller | `e42dfa987da9ddf89219c2817de85646d3efc042f267f3dc1b9c2142ca715a70` |
| Host | `5fc3a2c6b419c6e8b7b77ea35e5beed53523835b42d3007d076271ee0ecbfa30` |
| QMD | `7179f1bd432288c5f7e7b3e3d19743ebf9942930ae6fff026a6b8f8ebed7197f` |
| Ruler | `c0787f1fa6932bb21e83ae7f66b619e080fd2e1631a9c6827c7dd74a96f0cb1b` |
| Mac recovery archive | `7b24f8ccc999226185f53e0174780d2556f86733c15dd079ffa9576a4bad8bcc` |

Raw evidence is private under `build/receipts/20260923T001500Z-1/`; the original
staged bytes remain under `build/probe-20260923T001500Z-1/`. Its one-run clearance
is consumed. Normal Companion writing is still off.

## Narrow correction

The builder now strips exactly four `Accessible.*` metadata bindings from its
tablet ruler copy, preserving the desktop source and all ruler layout/interaction
code. Composition explicitly refuses any remaining attached accessibility type.
The controller's five fail-fast scans also recognize host-load, unavailable-type
and missing-attached-object errors so a similar failure does not wait for the
overall deadline. Recovery/release/identity logic and input helpers are unchanged.

## Corrected actual-control attempt: machine pass, saved readback pending

Trial `20260923T052500Z-1` reused the same native core, Qt-free bootstrap, pen
helpers, ordinary host and QMD. Only the native ruler and the controller's five
early failure scans changed. Reversing those scan changes reconstructs the prior
controller byte-for-byte; recovery, release and identity functions are unchanged.
The cohort passed a separate narrow review and used a fresh Mac-verified backup.

Native UI97653 created exactly these labelled disposable notebooks:

- Reference: `1135ea52-acd9-4e60-8ab9-afc063703424`
- Notes: `fd2915c4-019c-4bc7-a9d9-5e17383b0d79`

Its log recorded the following successful sequence:

1. Cold native worker ready, pair at720 pixels.
2. Resize to1080; two correctly targeted31-point native submissions.
3. Resize to1440; two further correctly targeted31-point submissions.
4. Tuck to0, reveal to1440, open chooser and cancel.
5. Final owned park through autosave, completion marker and controller stability
   checks: `ordinary-submission-machine-passed=97653`.
6. Watchdog reported `recovered=base:99661`; owner/watch became inactive with
   MainPID0. A subsequent status read still showed active normal UI99661.

The Pro stopped responding over SSH during the **independent** full recovery
postcheck and saved-file copy. Those commands timed out. A fresh local-network
TCP22 scan found only a different host-key identity, to which no authentication
was attempted. The only local file currently copied for this trial is its
verified preimage archive. Therefore the new trial's on-disk strokes and full
post-recovery hash/policy checks are **not yet verified**. Earlier admission ink
and saved native reopen evidence remain valid, but do not substitute for this
new readback. No claim of personal-notebook release or a persistent install.

| Artifact | SHA256 |
| --- | --- |
| Manifest | `c58b901e0a63760d5c012f0f0e09f22471bbd9813080f63679e03a64c94422d1` |
| Controller | `3d9168cb4c9bf6d07a2eefe94c769b08ed0956cf124f929580dfab72b10f69dc` |
| Host | `5fc3a2c6b419c6e8b7b77ea35e5beed53523835b42d3007d076271ee0ecbfa30` |
| QMD | `7179f1bd432288c5f7e7b3e3d19743ebf9942930ae6fff026a6b8f8ebed7197f` |
| Ruler | `7351a5bf60c0d72ab90053af4e2629257f2f616307c7ed8ef44734dde24bea52` |
| Mac recovery archive | `50b1e8b766b1175d2828311fa69908321a85f25c047bb90211947814154d1fca` |

The frozen stage is `build/probe-20260923T052500Z-1/`, and the verified backup is
`build/receipts/20260923T052500Z-1/preimages.tgz`. The stager clearance is consumed.
After reconnecting, first read back this trial and run `verify-disposable-ink.py`;
do not activate or replay its capsule.

## Newer local safeguards, not yet native-qualified

The normal builder now protects whole native page/tool operations, async page
addition, secondary close, tool selection and history. Review caught that native
WritingTool/EraserMenu callbacks keep executing after `requestPenSelect`: guarding
only that signal could change selectedPen before the park and lose active-tool
updates. Whole pressed groups, erase-all and selection-mode callbacks are now
wrapped, with tests covering the actual multi-signal ordering. Selected-pen
normalization runs as one parked group before input publication, preserving the
native delayed color/thickness checks. See `design.md` for modules/functions.

These are new source bytes, not covered by the passing diagnostic. Native
page/tool/boundary/eraser, close/reopen, sleep and extension-attribution gates
remain before everyday deployment. Move and firmware remain untouched.

Local regression result for the newer source:359 Node tests passed,7 historical
cases skipped,0 failed;67 offscreen Qt cases passed;26 saved-file verifier fixture
cases passed. Exact-firmware composition produced33 valid resources in each of
three accepted-base load orders. These counts do not qualify native page/tool or
saved-file behavior. The frozen successful ordinary capsule remains at30 resources
per load order, with its original manifest unchanged.
The current-source disposable driver prepares both native pens in one owned
transaction before requesting a size; four source-driver tests check ordering and
refusal. The Qt ordinary diagnostic test continues to exercise the frozen passing
cohort rather than silently replacing it with these newer unqualified bytes.
