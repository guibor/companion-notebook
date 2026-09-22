# User-driven pen handoff: current technical boundary

This is an exact3.29.0.148 static audit, not a device trial or a declaration that
split-screen is universally impossible. The controlled native four-stroke test
passed saved-shape verification; arbitrary user-driven transitions need a
different input-admission contract from that fixed diagnostic.

## What is genuinely supported

- `SceneController.addDrawingLine` copies the Line fields and retains its point
  array before returning. Keeping that controller alive for a geometry-only
  change does not require a generic on-disk-save acknowledgement.
- A public-Qt direct connection to a real native `strokeCompleted` can identify
  its emitter thread through `QThread::currentThread()`. The native worker is a
  QThread object moved to itself and uses the normal Qt event loop. This avoids
  private offsets, binary address calls and unsupported QObject child discovery.
- A queued function on that worker context cannot overtake its currently
  processing normal stroke. Its input loop retains incomplete queue records and
  waits for their ending; initial `strokePending` is posted before pen-up.
  A subsequent UI acknowledgement can therefore be useful for already admitted
  strokes, provided failure/cancel/20-second forced-timeout paths are distinguished.
- The existing retirement observer proves derived native handler retirement,
  as demonstrated on the device. It is not itself a queued-stroke delivery fence.
- A manually emitted empty manager region reaches the producer's same queue
  mutex. The new-stroke region check, append and stroke-pending publication occur
  under that mutex. The setter's return therefore does seal future admission;
  already admitted/current strokes bypass the new-start region test and retain
  their remaining samples and ending. This positive finding does not qualify
  the manager-side freeze/reopen protocol below.

## What does not supply a complete seamless transition

- QML receives worker-thread completion signals through a queued Qt proxy. If
  its handler is destroyed first, the proxy's target QPointer can be null and
  its callback is skipped. Destruction safety alone is not stroke handoff.
- No exposed native start counter or general cancellation notification was found
  on the handler metaobjects. Counting successful submissions is not enough to
  count all admitted native strokes.
- The worker is parentless; it cannot be assumed discoverable under PenInput's
  QObject child tree. Direct completion-based discovery also needs a first real
  completion; no synthetic personal-note stroke is an acceptable initialization.
- Digitizer's input thread runs one blocking-read loop without Qt event dispatch
  between reports. Queuing a function on that thread's event dispatcher cannot
  provide a live producer-turn boundary.
- The exposed filter setter is narrow and atomic, but it does not synchronize
  an already-in-progress report. A report can pass its filter check, then append
  a new stroke after an unrelated worker acknowledgement. Closing the filter
  from a future producer-direct pen-up callback is plausible, but does not solve
  a request made while already up/hovering. Down/up and samples are discarded
  while filtering; surviving proximity notifications would require a deliberate
  lift/re-approach interaction, not seamless resume.
- The manager exposes a read-only region and change signals, not an owned
  producer-admission setter. Manually emitting an empty region disagrees with
  its cached state; ambient
  publications can reopen it, and an unchanged updateRegions need not restore it.
- A proposed whole-manager signal blocker does not prevent updateRegions from
  directly changing handlers' pending clips/transforms. An old queued stroke can
  hit the worker's old candidate cache and begin with a changed/empty handler
  clip. Existing cnInkAllowed/cnLayoutBusy bindings trigger detach/exclusion
  changes, so they cannot serve as the pre-fence freeze. A separate UI-only
  transition intent would have to leave all native inputs unchanged until handoff.
- Even reconciling the empty manager cache does not safely reopen: normal
  updateRegions publishes the producer's nonempty region before fresh worker
  candidates. A new stroke can enter between those publications against stale
  or empty candidates. No active-input getter was found for a separate,
  owner-consistent publication. These are specific gaps in the proposed
  lightweight protocol, not proof that a stronger integration is impossible.

## Exact local audit anchors

Cached xochitl SHA is
`4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4`.
Addresses are documentation, not runtime call targets:

- Controller copy/retain: `0x63aa7c–0x63ab04`.
- Worker construction/self-affinity: `0x822640`, `0x82267c`, `0x82268c`.
- Queue incomplete-record wait: `0x8214e0`, `0x8215a8`, `0x821700–0x821754`;
  input-loop empty return: `0x82b0f8–0x82b108`.
- Producer up notification `0x82ff90`, final ending mark `0x8303a8`, initial
  stroke-pending notification `0x8307cc`.
- Blocking producer read loop: `0x82f8b0`, `0x82f9a0`, `0x82f9d0`.
- Public filter dispatch `0x8202e8–0x820304` to `0x81fd40`.
- Region signal dispatch `0x81d0c8–0x81d0e0`, direct connection
  `0x8227c8–0x822818`, native region update `0x81b290`; cached-region comparison
  `0x82c0c8–0x82c0fc`, before candidate publication `0x82c288`.
- Producer new-start region test `0x82fc30`, current-contact bypass
  `0x82fb68→0x83016c`; existing-record append `0x8308a4–0x8308c0`.
- Manager pending-region mutation `0x82bfd4–0x82bff0`; native begin snapshots
  pending clip into active clip at `0x81e040–0x81e048`.

## Release consequence

Do not enable the ordinary app from the controlled four-stroke result. A complete
transition protocol must preserve already accepted strokes, seal future admission,
wait for native handoff, and reopen only the final coherent geometry. Quiet delays,
unconditional callback counts, or another identical hardware trial do not supply
that missing contract. Any new native hook needs its own concrete design and
review; no opaque pointer/binary manipulation has been implemented here.

The Pro remains on its accepted base. The separate pen-disabled visual-reopen
capsule is local-only and cannot be staged with the current stager. It is not a
workaround for the input boundary and has captured no personal or test pixels.
