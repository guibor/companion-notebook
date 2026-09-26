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

No tablet files changed. The current tablet runtime also includes the separate
highlighter extension. Installation needs a coordinated handoff to preserve it;
do not replace it with an older Companion-only bundle. Device-specific receipts
and operational handoff details are not included in this public log.
