# Standard lower-pane scroll boundary

User reports standard split notebook reaches an artificial lower scroll limit.
Source inspection identifies cnConstrainToPane applying the finite scene exterior
to note pages; stock Navigation leaves note bottomViewportEdge open. Two new
regressions reproduce the limit before correction, including y12000 clamped1460.

Standard note pages now retain only the top vertical bound. PDF/horizontal bounds
are unchanged; quickPadQmd preserves the existing corner blank-tail limit.
No native library, input/pen gate, notebook content or settings changes.

Payload-only build against cached accepted page-links/Gestik/Timer composition
passes both34QML load orders.47focused tests pass; all16generated Quick Pad/toolbar
checks also pass in the alternate order. Tests now consume fresh .152 output.
The generated QMD differs only in the note-specific vertical clamp/comments.
No tablet calls or installation occurred. A future update requires current
ownership, exact live identity and fresh base/settings/controller evidence.
