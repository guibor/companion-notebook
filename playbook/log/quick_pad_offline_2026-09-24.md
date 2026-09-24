# Quick Pad offline preparation

User requested a second Companion mode for quick to-do capture in a configured
notebook, opening its last full page zoomed out in a corner. The user explicitly
said the tablet is unavailable; no network discovery, SSH, notebook access or
device mutation was attempted. Work stayed on beta/pro/3.29.0.148.

Implemented in the same repository under an opt-in build flag. Normal pilot
output remains byte-identical (NativeHost, QMD, PairStore, SizeRuler) to the local
copy of installed234000. The new code is not automatically added to installations.

## Product and safety boundaries

- Dedicated task-pad icon and active-state shading; first tap configures, later
  taps toggle. Settings also reachable from overflow or the pad header.
- Notebook-only Recent/Favorites picker, bottom-left/right, default right.
- Half-size native secondary sheet, toolbar clearance on both sides, current last
  page and validated whole-page fit. Header settings and close are actual controls.
- Shared pen settings; ordinary bottom pairing retained independently. Closing
  restores a previously visible bottom split. No third active document slot.
- Opening, closing, changing notebook/corner and initial fit all use the existing
  native park/publication lifecycle. No C++ changes or coordinate-offset guesses.
- Source handwriting is paused while this corner mode is open; source navigation
  remains full-size. This is an explicit conservative candidate boundary, not
  L-shaped native input qualification or a blanket document-edit lock.
- Native scaled ink, gesture routing, e-ink occlusion and save/reopen remain
  untested on hardware. The ordinary bottom-split behavior is not changed.

## Local checks

-18 focused Node tests: icon/layout/navigation, settings corruption/non-overwrite,
  whole-page fit math and guards, and bridge last-page calls.
-12 Qt checks (including init/cleanup): actual generated-host lifecycle with a
  desktop mock native bridge/admission gate; persistent settings; settings and
  close-button taps; corner bounds; no geometry changes while pen down; failed
  fit remains parked; sharing/self/unavailable refusal; native availability loss;
  normal pairing and previous split restoration.
- Existing pilot menu and picker tests:3 checks each, pass.
- Full accepted11-QMD base plus embedded AppLoad and candidate:33 generated QML
  files parse per order across3 dependency-respecting orders. The existing
  toolbar insertion needs BetterTOC's tocButton, so arbitrary ordering is not
  claimed. A first test with Companion before BetterTOC correctly failed.
- Default pilot's four generated payloads compared byte-for-byte with234000.
- Local package shell syntax and fixed native-library hash checks pass.

## Frozen local candidate

- Final package: build/pilot-20260924T120500Z-1 (not uploaded).
- Manifest:49c41d1398bf377d03534309fe409460f11405bb00501e1fcc793d67726b033c.
- Controller:008b1ce81d4eafa1f74b02ccd6da1b3048fffa4e47c6d415a01a53ad36a2096b.
- Pair-settings seed points to234000's retained settings. This is the last known
  predecessor, not permission to assume current device state on reconnection.
- Earlier120000 local package is superseded; do not deploy it.
- No boot persistence, firmware/root writes, new native binaries or Move changes.

See docs/quick-pad.md for usage, build commands and the remaining device handover.
No Reddit or other public announcement was made for this untested feature.
