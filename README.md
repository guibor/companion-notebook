# Companion Notebook

A portrait writing margin for reMarkable: keep a source open and place
a separate notebook over its lower edge at **⅓, ½ or ⅔** of the screen. Write directly in either visible pane;
scroll either document independently. Pairings are specific to a notebook/PDF.

**Status: native two-pane writing demonstrated; not yet a tablet release.**
The initial hardware target is Paper Pro **3.29.0.148**. Move and landscape remain
out of scope. The normal Pro setup was restored after each bounded experiment;
no Companion is left active and ordinary-document ink remains gated off.

The tap-only size ruler is implemented locally; the filled mark shows the selected
size. There is no drag interaction. The remaining release blocker is **safe
pen handoff during size and document changes**, not creating the second native view. The firmware's worker can finish
earlier input, but the inspected public controls do not yet provide a complete
way to stop new input and resume it with coherent geometry. See the bounded
[handoff audit](playbook/ADMISSION-HANDOFF.md). This project is not ready for daily
use or inclusion in the recurring installation list.

Latest fix (2026-09-23): the admission prototype's startup loader was leaking Qt
dependencies into unrelated child programs. A separate process-scoped, Qt-free
bootstrap now passes isolated tests on the Pro, including a negative control
with the old loader and the fake-worker/QML transaction. The normal interface was
not restarted, and no Companion feature is installed. The exact startup crash
path was identified; a fresh native-UI trial is still required before calling
that crash resolved. See [the diagnosis and fix receipt](playbook/log/bootstrap_fix_2026-09-23.md).

| Capability | Evidence |
| --- | --- |
| Two distinct native views, independent controllers | Passed bounded on-device structural test |
| Reach page edges in both exposed panes at unchanged scale | Passed on-device geometry test |
| Write in either pane without selecting it first | Passed on-device fixed-layout test |
| Native saving of those two strokes | Both exact disposable files contained their expected shapes after UI restart |
| Move the sheet, then continue writing | Native four-stroke write–retire–move–recreate–write sequence completed; final controller observation timed out and restored base |
| Native saving before and after movement | All four saved shapes matched their pane/round and reconstructed native bounds exactly |
| Fixed ⅓ / ½ / ⅔ ruler, per-pair selection, no accidental drag | Local pointer/state tests pass; not deployed |
| Visual clipping and user-triggered size transitions | Not yet qualified |

The historical Qt capture diagnostic crashed the native e-ink rendering path and
remains blocked. No capture/layer workaround is part of the new experiment. See
[ink scope](playbook/INK-QUALIFICATION.md) and the
[retirement diagnostic](playbook/RETIREMENT-PROBE.md) before any further device use.

## Run locally

With Node and Qt Quick/Qt Test installed:

```sh
node build-native.mjs
CN_PROBE=render node build-native.mjs # local diagnostic-driver tests only
CN_PROBE=structural node build-native.mjs
CN_PROBE=geometry node build-native.mjs # offline only; its one-run review is consumed
CN_PROBE=ink node build-native.mjs # builds disposable diagnostic only, does not deploy
aarch64-linux-gnu-gcc -std=c11 -Wall -Wextra -Werror -O2 -static -o build/ink-native/ink-events ops/ink-events.c
CN_PROBE=ink node ops/build-render-controller.mjs
CN_PROBE=visual node build-native.mjs # local-only saved-note reopen candidate
node ops/build-visual-controller.mjs # requires the frozen structural controller
npm test
QT_QPA_PLATFORM=offscreen QT_QUICK_BACKEND=software qmltestrunner -input tests
QT_QUICK_CONTROLS_STYLE=Basic qml ui/Main.qml
```

On this Mac the executables are in `/opt/homebrew/bin`. Restricted sandboxes
may prevent Qt CPU-feature detection; use a normal local terminal if it reports
missing NEON. Desktop tests currently use Qt 6.8.2, not the tablet's 6.10.3.

Tap a ruler mark to choose ⅓, ½ or ⅔; the underlying page never shrinks. Write directly
in either pane; use a trackpad/wheel or flick to scroll. Tuck/Reveal preserves
positions. “Simulate pen” tests ownership with the mouse, not real handwriting:
the first press immediately writes in the touched pane. Demo marks are ephemeral.
The prototype uses synthetic documents, makes no network calls, and reads no
notebooks. Demo pairings live only for the process lifetime. Native boundary tests
exercise the separate host through mocked document controllers and temporary
local settings files; they are not native-device acceptance tests.

## Native candidate

`build-native.mjs` requires the private exact-firmware cache and pinned QMLDiff
tool (override their locations with `RM_FIRMWARE` and `QMLDIFF_BIN`). It emits
`build/native/companion-notebook.qmd`, `NativeHost.qml`, `PairStore.js`, `SizeRuler.qml` and a hash
manifest. It never connects to a device. Firmware resources stay outside this
repository and are not redistributed.

`npm run test:composition` applies the candidate to the locally coordinated
base-plugin inventory in three orders. Paths and hashes are deliberately pinned
to this qualification session, not a generic installation promise. A future
firmware requires a new review, not merely changing a version string.

`CN_PROBE=render` builds the blocked historical diagnostic profile under
`build/render-native`, not the normal host. It creates two labeled test notebooks
through native APIs, never draws ink, and attempts to restore the prior view. It
must not be deployed again; it is retained only for local regression tests.
`CN_PROBE=structural` emits `build/structural-native`, with capture removed and a
distinct structural-only completion result. It requires its own reviewed bounded
controller, never ordinary app installation. The normal build has no automatic
notebook-creation code. Neither diagnostic proves visual or pen correctness.
The `geometry` profile additionally tests exposed-pane navigation and input mapping
after native loading settles. Its successful on-device receipt is in the
[direct-write log](playbook/log/direct_write_2026-09-22.md). Staging refuses any
repeat until a separately reviewed need exists; rebuilding is not deployment clearance.

The `ink` profile is a separate fixed-layout diagnostic, not an installation
option. It admits only two exact freshly-created native notebooks, without a
select-only pen tap. A bounded native marker helper and independent always-revert
controller protect recovery. Native submission and saved-file verification are
separate receipts; neither proves fluidity or qualifies a personal release.

The `retirement` profile adds a small public-Qt observer and a factory around the
existing native handler. It submits two different fixed strokes per disposable
note, with a real native destruction acknowledgement and live sheet movement
between them. The normal host and historical reviewed ink bytes are unchanged.
The module has a standalone import test that needs no UI restart or input access;
actual target loading must pass before the UI diagnostic. These are qualification
tools, not an installer. Build/review details are in the retirement playbook.
The actual standalone import and native retirement sequence have now run. All
four saved shapes passed verification against the native tool/thickness-padded
rectangle semantics, but the whole-trial pass marker was not reached before
automatic restoration. Its one-run staging
clearance is consumed; do not rerun an old capsule.

The newer admission sidecar builds with `node ops/build-admission-cross.mjs`.
`node ops/stage-bootstrap-smoke.mjs YYYYMMDD-N` only prepares a fresh **local**
fake-process capsule; it does not connect or authorize deployment. Its operator
must use the separate bounded process group described in the fix receipt.
`node ops/build-admission-controller.mjs` emits a distinct
`build/admission-bootstrap-native` candidate without overwriting the consumed
combined-preload controller. The existing admission stager stays blocked.

The native host keeps primary-document scale unchanged, uses a distinct native
DocumentView for a recent local companion, and persists only pairing metadata
through Qt settings. Notebook writes remain exclusively native. Read
[the ordered native gates](playbook/NATIVE-GATES.md) before any device trial.

Historical diagnostics use the checksum-pinned `native/DiagnosticHost.qml`.
Their payloads remain reproducible independently of the ordinary ruler UI.
The old load-probe packaging is blocked for the revised normal payload: its
controller does not yet install the added ruler file. A new reviewed capsule
must account for the complete file inventory; rebuilding is not deployment.

## Why a separate project?

This app should have its own UI, state model and firmware-specific integration,
not be bundled into the inert Beta OS marker or the full rm-hacks collection.
No upstream code is copied into this prototype. No license grant is declared yet.

- [Requirements and next steps](prd.org)
- [Architecture and main functions](design.md)
- [Native qualification gates](playbook/NATIVE-GATES.md)
- [Implementation record](playbook/log/changelog_prototype_2026-09-21.md)

**Do not install the desktop canvas on a tablet.** The eventual app must route
through native document/pen controllers; it must not write notebook files itself.
