# Companion toggle and corner refresh refinement

User requests toolbar open/close parity with Quick Pad, partner selection in
overflow, and fewer flashes/disappearing toolbar buttons in both corner modes.
Keep the accepted geometry, glyphs, native writing and separate settings stores.

The new toolbar signal routes to `toggleCompanion`; the existing chooser signal
is exposed as Companion settings in overflow. Warm corner toggles reuse both the
view and its fitted geometry. Split resize or retirement invalidates fit state.
Already-parked chooser-to-corner completion no longer forces a whole-page refresh.
Capacity publication is restricted to the settled visible primary toolbar and
deduplicated by provider/count, with a second ownership check in queued callbacks.

Tests cover first-use/tuck/reveal, pad-to-companion switching, canceled settings,
warm corner fit/refresh counts, actual composed fit-wrapper safety gates and
toolbar ownership/visibility/transition races. Device installation uses the
existing bounded runtime guard, retaining the installed highlighter unchanged.
Private backup identities and deployment receipts remain outside public docs.
Physical flash reduction and toolbar stability remain hands-on feedback.
