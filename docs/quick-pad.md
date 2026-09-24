# Quick Pad

**Experimental personal pilot installed on Paper Pro 3.29.0.148. Startup and
pairing migration verified; corner handwriting, width-fit layout, scrolling and
toolbar stability accepted in user feedback. The final extra-flash adjustment
still awaits visual feedback.**
Part of Companion Notebook, not a separate app or repo.

## Intended interaction

1. Tap the new task-pad icon above Companion on the full document toolbar.
2. First use: choose bottom-right or bottom-left, then tap a notebook from Recent
   or Favorites. The setting applies across source documents on this tablet.
3. The notebook opens on its **current last page**, fitted to the pad's width,
   preserving its saved vertical position where possible. The default **Wide**
   pad is two-thirds width and one-third height. Long pages keep readable zoom.
   Native pinch/scroll remains available, including blank writing room below the
   existing page boundary; writing there extends the note through native saving.
4. Write in either exposed document using Companion's shared pen controls.
   The pad is flush to the bottom corner with only a thin inner boundary.
5. Tap the pad button again to close. If a bottom companion was visible
   before, it returns at its saved size/page. No ordinary pairing is replaced.
   Otherwise the pad stays loaded but hidden, making repeated toggles lighter.
   Native autosave continues; leaving the document or sleeping retires it normally.
6. Use **Quick Pad settings** in the document's three-dot
   menu to change the notebook, corner or size. **Compact** is narrower; **Roomy**
   is taller. Tap **Apply to current pad** to keep the notebook, or select another
   from Recent/Favorites. Cancel leaves prior settings untouched.

Only one secondary native view is used at a time. Quick Pad and the bottom split
do not stack into a three-document workspace. The pad cannot open the source
notebook again. PDFs, locked/unavailable/empty/nonportrait notebooks are excluded
from pad selection; a PDF can still be the source. Opening is refused during
screen sharing. It never creates a notebook or page for the user automatically.

## Native input and refresh

The revised pad uses a real corner-sized viewport and native page zoom, not a
scaled full-screen QML view. Both pen surfaces use Companion's guarded publication
path. Native manager occlusion handles the foreground region. The header/loading
label and forced full-page pad-transition refreshes are removed. After first pad
use, the source stays in composed display mode until leaving that document to
avoid switching display paths on every toggle. Native damage repaint remains;
no global flash/ghosting preference is changed.

Native handwriting alignment, e-ink clipping, touch
routing, and save/reopen behavior still require a bounded Pro check. Passing
desktop tests does **not** mean those hardware checks passed.

## Offline build and tests

These developer commands require the existing private exact-firmware cache and
the accepted local base-app inventory. They are not a generic installer.

```sh
CN_USER_PILOT=1 CN_QUICK_PAD=1 node build-native.mjs
node tests/quick-pad-composition.mjs
node --test tests/quick-pad-logic.test.cjs tests/pilot-layout.test.cjs tests/native-navigation.test.cjs
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
  Consult the installation receipt for the latest active pilot; do not assume it remains active later.
- Use the existing handoff, independent recovery guard and verified Mac backup.
  Do not stop a live writing session or replay an old consumed diagnostic.
- Check the native corner path on a disposable pad: all four corners, crossing
  its boundaries, source taps/scrolling, pen thickness/eraser, close and reopen.
  Confirm each stroke is saved in its intended document, without duplicate marks.
- Check current-last-page selection, shared tools, both corners, prior split
  restoration, native sleep/wake and no toolbar occlusion. Ordinary source
  handwriting should work in the exposed source while the pad is open too.
- If input is misaligned, clipped incorrectly, or leaks to the source,
  restore the known pilot; do not compensate with guessed coordinate offsets.

No device access was attempted during offline preparation. Later that day the
user requested installation over home Wi-Fi. Device-specific installation and
recovery receipts are retained locally rather than included in this publication.
