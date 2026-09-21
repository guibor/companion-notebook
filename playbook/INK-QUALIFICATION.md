# Direct-write qualification work — not an enabled profile

The requested interaction is pull out and write. The pen's first sample chooses
one of the two native documents; toolbar selection is not a prerequisite. No
profile currently enables ink, and the geometry review does not permit doing so.

## Remaining implementation issues identified locally

- Tuck-transition gate fixed locally: a retained `secondary` keeps the primary
  gated until geometry refresh completes even when `cnPaired` becomes false.
  Only the primary refreshes while tucked; the hidden companion refreshes on
  reveal. A Qt mock implements the actual eligibility expression and verifies
  primary writing reopens without a tap. Not yet a native writing qualification.
- Global pen-up alone is not proof that the native worker has completed the
  stroke. Native `onStrokeCompleted` in DeviceSceneView dispatches the finished
  stroke to the document controller; its `completedStroke` signal is emitted
  before `addDrawingLine`. Any future movement/close gate must wait for worker
  completion and controller settlement, not merely a delayed toolbar update.
- The native collector uses each surface's own bounds; QML parent clipping does
  not constrain its native region. Preserve explicit exposed-height bounds and
  the hidden-surface refresh sequence. Refresh publication is not cancellation.

## Candidate automated test, not execution clearance

Existing Smart Remarkable sends short native marker events through Ferrari's
`/dev/input/event2`. This provides a potential native-path test without asking
the sleeping user to draw. It must be an independently reviewed, bounded profile
restricted to two newly created, explicitly labelled disposable notebooks.

Required constraints before implementation or execution:

1. Keep ordinary documents' ink eligibility false for the entire diagnostic.
   The writable gate must require both exact disposable IDs, current test phase,
   unchanged native objects, ready geometry, and the expected xochitl process.
2. Refuse physical pen activity or any unexpected touch/navigation state. Never
   grab input devices away from xochitl, load kernel modules, or access power or
   Hall input devices. Validate the marker device's name and absolute ranges.
3. Each injected stroke has a short finite sequence, balanced pen-up, a strict
   deadline, and no retargeting. Failure closes future eligibility while keeping
   the active handler alive until completion; the existing watchdog still bounds
   the entire process and restores the exact accepted base.
4. Verify stroke completion and document attribution natively, then close/reopen
   the disposable documents and verify saved results. A marker in a log or a
   screenshot alone does not prove save durability or absence of foreign ink.
5. Corner and divider-crossing samples must establish rendering and stored-point
   behavior. Native pixel clipping alone does not establish stored-point clipping.
6. Do not use the crashing Qt capture path, launch a LAN screen-sharing server,
   or capture a personal document to get visual evidence. A different diagnostic
   method needs its own review and strict disposable-view scoping.

This is a feasibility path, not permission to skip any current native gate. If
native lifetime/routing cannot be bounded using the existing APIs, stop before
ink and retain the normal tablet setup.
