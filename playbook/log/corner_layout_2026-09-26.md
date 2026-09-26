# Corner layout and native zoom chrome

User requested hiding the persistent Quick Pad zoom multiplier and exposing the
same size as a regular Companion layout. Stay on the current Pro branch while
awaiting any contrary branch preference.

The opt-in builder adds a sixth layout pictogram and shares the existing corner
viewport geometry, configured size/position, fit function and native input gate.
Ordinary Companion keeps its selected document/page and per-pair layout metadata;
Quick Pad still uses its device-wide notebook's current last page. Existing pair
records round-trip unchanged. Picker cancellation clears pending layout intent.
The zoom label's original visibility expression remains intact behind a guard
that hides it only in a secondary corner view. Zoom gestures are not removed.

Offline checks: 28 Node tests; 21 Qt lifecycle checks; three Qt menu checks;
33 QML resources in each of three dependency-respecting composition orders.
These are not physical pen or screen acceptance evidence.

The user subsequently authorized installation and the combined-runtime handoff.
Installed with the existing highlighter payload and native libraries unchanged,
using the existing guard, a verified private Mac backup and retained settings.
Both combined composition orders passed. Startup reached host-ready with zero
restarts; settings matched before/after and the system partition stayed read-only.
Physical behavior awaits user feedback. Device-specific receipts and operational
handoff details are retained privately rather than included in this public log.

## User-reported failure and withdrawal

Switching a working lower split to corner failed with `Quick Pad page fit refused`.
The DocumentView fit wrapper still required `quickPadActive` rather than the
shared `cornerPaneActive` state. The guard recovered to the base runtime; the
new feature was withdrawn and a restoration of the previous combined build was
initiated with latest retained settings, not the older pre-update snapshot.

The corrected source keeps every native park/detached-input/secondary gate. A
new regression executes the actual composed wrapper: it fails on the deployed
bad artifact and passes after the correction (29 focused Node tests and three
composition orders pass). The earlier Qt fixture bypassed this wrapper, so its
passing result was insufficient. No corrected deployment until user-confirmed
recovery; do not present startup success as interaction acceptance.

## Corrected installation after confirmed recovery

The user confirmed restored normal operation and authorized reinstalling the
corrected feature. The combined package retains the highlighter/native libraries
unchanged and seeds the latest working settings. The only feature-code delta
from the failed build is the fitting-wrapper guard correction. Both combined
composition orders pass; guarded startup reached host-ready, all services stayed
active with zero restarts, and settings matched before/after. No automated tablet
interaction tests were run. Corner interaction acceptance remains user feedback.
