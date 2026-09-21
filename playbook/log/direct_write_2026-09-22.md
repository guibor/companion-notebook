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
The same review requires restored native focal center/scale readback; the new
diagnostic rejects setter-only success or nonfinite/drifted restored values.

Narrow independent delta review passed at `8543258`. One pen-disabled, no-capture,
always-reverting geometry run is cleared subject to fresh identity/base/settings,
verified backup and unchanged watchdog. Final QMD is
`6285d93870683052bf0a7066edd43ba3147feb05ba4af863740eff81ec0a8b29`;
the other three hashes above are unchanged. Staging now pins this exact set.
104 Node tests and the final three-order, 30-resource composition passed before
adding the staging regressions. No ink, visual, durability or release clearance.

## Geometry run 20260921T223851Z-1

Verified backup SHA `a254100e830ac9110513293d232ef2b79f987e6220da5772fb1c54d2e8df4153`.
Manifest `71f0c92231ac9759ed7fda775fe989e913a023a386077c59563fd771877aec38`.
At 22:40:11 UTC, primary exposed-pane scrolling passed (height1080, scale1), then
phase5 failed its combined geometry condition. That generic marker does not tell
whether primary refresh or secondary preconditions refused. No ink or capture.
Automatic recovery `base:49237`, unchanged Dates14463, zero restarts, MemoryMax
infinity, all11QMDs/10settings/3policies exact, rootro, host/data/drop/lock absent.
Clearance consumed. Two empty labelled test notebooks retained (no deletion):
`e0b81795-bebb-4ab6-9a40-9256be17e168`, `080b54f1-676d-4f73-b586-a5b46d504381`.

Code inspection identified a timing bug: immediate pen-refresh after synchronous
scroll/restoration may encounter pending tiles (`isLoading`). Refresh now waits
in a separate bounded phase; the normal host also retries only that transient
state. Exact refusal reasons remain fail-closed. This is an inferred explanation,
not proof of which boolean stopped the first run. Changed payload needs review.

Independent review passed the readiness delta at `3a7bf6d` for one new pen-disabled
run. Receipt is retained locally at `build/review-3a7bf6d.txt`; no reviewer tablet
access occurred. QMD `8b101631f8a5a55d1e93c874a4a8e6d2fe670f97e62341f2b8810334de20a081`,
host `9a78b1c45130bbbf8b2be34d2ed6ce99d60ce357075930950514fd99508e9974`;
pair store and controller unchanged. Staging pins replaced only after review.
Future ink holds include stock open-helper bypassing the close wrapper, live
visibility/size changes during strokes, and no established native worker-drain
or durable-save barrier. These do not block the pen-disabled geometry run.
