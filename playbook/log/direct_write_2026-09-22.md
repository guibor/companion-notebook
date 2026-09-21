# Continue toward direct-write companion

The user superseded the earlier overnight stop decision and requested continuation
until usable unless infeasible or very risky. They then explicitly preferred
writing directly in either visible pane, especially after pulling out the notebook,
with no select-only first pen tap. Existing branch is retained.

## Local implementation

- Normal build gets exposed-height Navigation geometry and its own clamp; actual
  SceneView/viewport dimensions and scale stay fixed. Stock full-viewport paper
  clamping is disabled only while paired. Tests cover both page edges, short/long
  pages, zoom, horizontal limits, jumps, drag deferral and reentrancy.
- Direct writing no longer depends on toolbar selection. Completed-stroke sender
  is remembered; toolbar context changes only after pen/touch activity ends.
- Input geometry refresh is pen-gated and deferred until layout settles. A hidden
  native surface retains its manager, temporarily attaches its existing stroke
  handler, refreshes its transform, then detaches and rebuilds regions before
  unhiding under the still-closed outer pen gate.
- Separate `geometry` diagnostic remains pen-disabled and input-locked. Both
  disposable notebooks scroll to both paper edges; it checks scale/viewport size,
  restores focal points, and exercises input refresh. Its marker is distinct and
  recovery byte-identical to the existing controller. Staging remains refused
  pending independent review. Frozen historical diagnostic bytes are unchanged.

## Exact binary review, coordinated ReManager task

Read-only analysis of pinned 3.29.0.148 xochitl:

- PenInputSurface::setTransform at 0x8285f0 returns without a handler. With manager
  assigned, it reads item-to-screen (0x828680), combines scene-to-view (0x8286b0),
  computes inverse (0x8286c0) and stores under mutex. Without manager translation
  is omitted. Thus both previously considered shortcuts were invalid.
- Collector 0x824960 uses paint order, rejects invisible/disabled subtrees, and
  maps each surface's own width/height into a global rectangle. Parent QML clip
  alone is insufficient. Explicit input-surface dimensions are necessary.
- updateRegions at 0x82b9e0 publishes via direct signal connections under separate
  native mutexes. Empty regions are published, not retained. This is viable for
  ink-closed preparation, but not an active-stroke cancellation/drain mechanism.
- The first sample chooses a native owner which is retained through later samples;
  pending clipping/transform state is snapshotted for the whole stroke.
- Live ink still falls back to global EPFramebuffer even if viewport.framebuffer
  is null. Its separate native region and transform must constrain it. No opaque
  binary hook is required by these findings.
- No public generic stroke-start owner property was established. strokeCompleted
  and inherited stroke notifications occur at completion, suitable for delayed
  toolbar context updates without changing the in-progress tool.

This establishes a plausible native API route, not physical ink/save acceptance.
Output pixel clipping does not establish that out-of-pane samples are absent from
stored strokes. Ownership must never switch documents mid-stroke.

## Verification and pending one-run review

101 Node tests and 39 Qt interaction/boundary-mock tests pass. Final geometry
profile composes in three orders, 30 QML resources each. Destroyed-host callback
warnings found during development were corrected and absent in the later Qt run.

Frozen candidate submitted for independent review:

- QMD `c0ad901c09877e87b110ce8ed34ff99a600e67e18356d0aede21bbd559ea1a4d`
- Host `6ebf4508f52d7381b31e870ef4746aee09a9136273bee6f5977cacace6b914c8`
- Pair store `44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19`
- Controller `47326d9285f4f8cd505e0d9cee454fe762a1110b6a2ec9c6e62d372311e6782a`

Fresh host-key-first strict-key SSH matched Ferrari 3.29.0.148, active UI45382 /
Dates14463, zero UI restarts, root read-only and absent Companion host/data.
No device writes or restarts occurred as of this entry. New trial still requires
independent review and a fresh verified backup; no old clearance is reused.

Independent review held staging for an acceptance bug: nonfinite edge coordinates
and refused native jumps could pass the diagnostic. Explicit numeric validation
and return-value checks were added with regression coverage. This is a test
correctness repair, not a newly discovered firmware/pen safety barrier. Payload
must be rehashed and independently rechecked before one-run clearance.
