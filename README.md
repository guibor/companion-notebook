# Companion Notebook

A portrait writing margin for reMarkable: keep a source open and place
a separate notebook over its lower edge at **⅓, ½ or ⅔** of the screen. Write directly in either visible pane;
scroll either document independently. Pairings are specific to a notebook/PDF.

**Status: user-driven experimental pilot installed on Paper Pro3.29.0.148.**
On2026-09-23 the user explicitly stopped further automated trials and requested
hands-on use. The separate `CN_USER_PILOT=1` build is active, with native writing
enabled and no scripted document creation or synthetic input. This is not a
fully qualified release. Move and landscape remain out of scope.

## Use the installed pilot

1. Open a notebook or PDF in portrait.
2. Tap **Companion notebook** on the full toolbar, above Dates.
3. Choose a different local portrait notebook from the recent-notebook list.
4. Write directly in either pane. Only a hairline separates the pages. The native
   toolbar stays above both canvases, with shared writing-tool settings.
5. In the three-dot menu, layout pictures select source-only,
   small, medium (default), half, or companion-only. Source-only hides the
   companion without forgetting the pair. A split picture returns from full
   companion view to the original source and companion. No controls or labels
   sit between the pages. Split sizes are25%,37.5%,50%; no fractions in the UI.
6. You can also start with a size picture: if unpaired, the picker opens directly.
   The companion gets a default pairing back to the original notebook, without
   replacing an existing explicit pair. There is no separate menu off switch;
   the independent recovery controller remains available to the operator.

Start with a disposable notebook: mid-stroke sleep, boundary/eraser edge cases
and full extension interactions remain unqualified. A background runtime guard
restores normal apps on a reported Companion failure or a30second UI stall.
It is a fallback, not a guarantee against losing an in-progress stroke.
Activation is runtime-only; reboot does not automatically reactivate Companion.
Your existing app payloads, notebook files, firmware and boot configuration are
not replaced. See [the installation record](playbook/log/user_pilot_2026-09-23.md).
Current revision:210500, with suspend-aware supervision.
Pair settings carried forward through210000. This adopts RMHacks' separation of split controls from the writing area;
it does not install RMHacks' older firmware patches.

## Qualification history (before the hands-on pilot)

The tap-only size ruler is implemented; the filled mark shows the selected
size. There is no drag interaction. A real native **during-stroke handoff and
resize now passes**, including all four correctly saved strokes. The regular
pair/resize/tuck/reveal controls also passed a bounded native submission test;
saved-file readback subsequently passed. Native page/tool/close and already-parked
display sleep also passed; broader edge cases remain outstanding. See the bounded
[handoff audit](playbook/ADMISSION-HANDOFF.md). This project is not ready for daily
use as a fully qualified release or inclusion in the recurring installation list.

Latest result (2026-09-23): corrected ordinary-control trial20260923T052500Z-1
passed native pair/resize/tuck/reveal/cancel and four stroke submissions. Its
watchdog reported restoration of the accepted Pro setup; connectivity was lost
before the separate full postcheck and saved-file copy. Those remain pending, not
passed. Newer local page/tool safeguards pass regression tests but are not yet
native-qualified or installed. See [the controls receipt](playbook/log/ordinary_controls_2026-09-23.md)
and the earlier [verified native saved-ink pass](playbook/log/admission_bootstrap_pass_2026-09-23.md).

| Capability | Evidence |
| --- | --- |
| Two distinct native views, independent controllers | Passed bounded on-device structural test |
| Reach page edges in both exposed panes at unchanged scale | Passed on-device geometry test |
| Write in either pane without selecting it first | Passed on-device fixed-layout test |
| Native saving of those two strokes | Both exact disposable files contained their expected shapes after UI restart |
| Move the sheet, then continue writing | Native four-stroke write–retire–move–recreate–write sequence completed; final controller observation timed out and restored base |
| Native saving before and after movement | All four saved shapes matched their pane/round and reconstructed native bounds exactly |
| Cold startup and during-stroke sealed resize | Full native admission trial and saved-shape readback passed; normal base restored |
| Fixed ⅓ / ½ / ⅔ ruler, per-pair selection, no accidental drag | Local pointer/state tests pass; native actual-control trial started at⅓ and wrote at½/⅔; saved readback pending |
| Pair, resize, tuck/reveal and chooser cancellation | Actual native host/control trial passed; normal setup restoration reported |
| Native reopen and settled visual occlusion at ½ and ⅔ | Saved pages render correctly in guarded native-buffer captures; normal setup restored |
| Dynamic pen-boundary clipping and user-triggered lifecycle | Not yet qualified |

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
QT_QPA_PLATFORM=offscreen QT_QUICK_BACKEND=software qmltestrunner -import tests/mock-imports -input tests
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
