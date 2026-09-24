# Quick Pad

**Offline implementation candidate for Paper Pro3.29.0.148. Not yet deployed or
qualified on hardware.** Part of Companion Notebook, not a separate app or repo.

## Intended interaction

1. Tap the new task-pad icon above Companion on the full document toolbar.
2. First use: choose bottom-right or bottom-left, then tap a notebook from Recent
   or Favorites. The setting applies across source documents on this tablet.
3. The notebook opens on its **current last page**, fitted into a half-width,
   half-height corner pane. Even an extended page is fitted as a whole; this can
   make a very long page small. Native pinch/scroll remains available in the pad.
4. Write in the pad with the existing shared pen controls. The short header says
   **Quick Pad · pen here**; source handwriting is paused while this mode is open.
   The source remains visible and has its normal navigation viewport.
5. Tap the pad button again or **×** to close. If a bottom companion was visible
   before, it returns at its saved size/page. No ordinary pairing is replaced.
6. Use **⋯** in the pad header or **Quick Pad settings** in the document's three-dot
   menu to change the notebook/corner. Choose a corner, then tap a notebook to
   apply. Cancel leaves the prior setting untouched.

Only one secondary native view is used at a time. Quick Pad and the bottom split
do not stack into a three-document workspace. The pad cannot open the source
notebook again. PDFs, locked/unavailable/empty/nonportrait notebooks are excluded
from pad selection; a PDF can still be the source. Opening is refused during
screen sharing. It never creates a notebook or page for the user automatically.

## Why the source pen is paused

The accepted bottom split has two simple nonoverlapping rectangular pen regions.
A corner creates an L-shaped exposed source. This first candidate removes the
source's native pen region rather than guessing how overlapping regions will
route real strokes. Closing the pad restores it. This is not a blanket lock on
all possible native editing commands (keyboard and toolbar remain native).

The new scale transform, native handwriting alignment, e-ink clipping, touch
routing, and save/reopen behavior still require a bounded Pro check. Passing
desktop tests does **not** mean those hardware checks passed.

## Offline build and tests

These developer commands require the existing private exact-firmware cache and
the accepted local base-app inventory. They are not a generic installer.

```sh
CN_USER_PILOT=1 CN_QUICK_PAD=1 node build-native.mjs
node --test tests/quick-pad-logic.test.cjs tests/pilot-layout.test.cjs tests/native-navigation.test.cjs
node tests/quick-pad-composition.mjs
QT_QPA_PLATFORM=offscreen QT_QUICK_BACKEND=software qmltestrunner \
  -import tests/mock-imports -input tests/tst_quickpad.qml
```

The build writes `build/quick-pad-native`, leaving `build/pilot-native` alone.
Without `CN_QUICK_PAD=1`, the current pilot's generated payloads stay unchanged.
The native bootstrap and admission libraries are reused unchanged. No new native
code, notebook-file serialization, firmware/root write, boot persistence, or
automatic deployment is introduced.

The operator packager accepts `CN_QUICK_PAD=1 node ops/build-pilot.mjs NEW_ID PREVIOUS_ID`.
IDs must be fresh; packaging is local only. Its nine-file payload/checksums and
recovery machinery are unchanged. `pairs.ini` retains Quick Pad settings as well
as existing pairing JSON; Pro/Move settings are never copied across devices.

## Handover when the Pro is available

- Recheck host identity, exact firmware and the current accepted base inventory.
  The last installed pilot was234000, but do not assume that remains true later.
- Use the existing handoff, independent recovery guard and verified Mac backup.
  Do not stop a live writing session or replay an old consumed diagnostic.
- First check the new scaled path on a disposable pad: all four corners, crossing
  its boundaries, source taps/scrolling, pen thickness/eraser, close and reopen.
  Confirm saved ink is in the pad only, with no source marks.
- Check current-last-page selection, shared tools, both corners, prior split
  restoration, native sleep/wake and no toolbar occlusion. Ordinary source
  handwriting must return when the pad closes.
- If scaled input is misaligned, clipped incorrectly, or leaks to the source,
  restore the known pilot; do not compensate with guessed coordinate offsets.

No device access was attempted during the2026-09-24 preparation session.
