# Architecture and implementation status

## Current product revision: fixed sizes (2026-09-22)

The user superseded live dragging with a tap-only ruler at ⅓, ½ and ⅔. The
filled dot indicates the currently selected size; it is not a slider thumb.
`ui/SizeRuler.qml` is the shared native/desktop control. Its `chosen(ratio)`
signal fires only for a tap within the movement threshold, never while dragging.
`NativeHost.chooseSize()` and `Workspace.chooseSize()` validate the three values,
refuse busy pen/scroll states, retain native document/view identities and save
the selection with the pair. Tuck retains the selected size and reopening uses
it. Legacy continuous ratios are snapped to the nearest mark when read, without
silently rewriting the stored record before a normal checkpoint.

The ordinary native host has no drag or pull handlers. A read-only `dragging:false`
property keeps the existing bridge compatible, while `native/DiagnosticHost.qml`
freezes the historical host with a checksum so consumed trial artifacts remain
reproducible. Only normal builds include the new `SizeRuler.qml` runtime file in
their checksum manifest. Diagnostic manifests and payloads remain unchanged.
The historical load stager now refuses the revised normal host before creating
any stage: its old controller knows only two host files and would omit the new
ruler. This guards against an incomplete accidental upload, not a new installer.
The composition receipt hashes the ruler as well as the host and pairing store.

This UI change does not turn on `inkQualified`. Preset taps still move native
input geometry; pending-stroke handoff, coherent reopening and visual occlusion
remain native qualification work. The historical sections below describe earlier
continuous-drag experiments, not the current user-facing interaction.
The fixed-preset follow-up in `playbook/ADMISSION-HANDOFF.md` records a possible
producer-direct pen-up filter protocol. It is a design finding only: no filter
adapter, cold-start proof, writable pilot or new device stage is implied by the
ruler implementation. Current local regression coverage includes actual ruler
taps, rejected drags and invalid sizes, independent scroll retention, per-pair
size restoration across host recreation, and unchanged historical host hashes.

Latest hardware result (2026-09-22): the v2 retirement diagnostic completed four
correctly attributed native submissions across destruction, actual sheet motion,
and handler recreation. Its final shell observation exceeded the owner deadline;
the watchdog restored the exact base76210/Dates14463 and all protected settings.
There is no overall controller-pass receipt and no installed user-facing release.
The two saved disposable pages each contain two24-point lines. Their centerline
bounds are inset3 units per edge relative to native conservative rectangles.
Exact-binary review established tool15's thickness-dependent padding; the
verifier now reconstructs that padded rectangle for the two qualified thicknesses
(1 and2), retaining the existing5-unit tolerance and rejecting unknown tools or
thicknesses. This is not an exact brush-hull measurement or a new tolerance. The
one-run retirement clearance is consumed in the stager. See the dated trial log.
Staging regressions exercise the old downstream checks only in isolated temporary
copies with synthetic receipts; a separate test proves the real consumed-clearance
guard refuses all new retirement stages. They never replace the actual target receipt.

Implemented locally: a portrait interaction prototype and an exact-firmware
native rendering candidate. The candidate contains native document adapters,
device-local pairing settings and a composable QMD. Native writing remains
disabled. The load-only probe has passed on the Pro
and automatically returned to the accepted base; no Companion remains active.
No qualified installer or release exists yet.
The current user-driven transition blocker is documented in
`playbook/ADMISSION-HANDOFF.md`: public-Qt worker acknowledgement is viable for
prior normal strokes, but producer admission closure remains unresolved. This
distinguishes controller handoff from disk persistence and rejects both queued
producer callbacks on a blocking-read loop and an unsynchronized atomic filter.
No opaque native call or private-object-offset access has been implemented.
The final region audit refines this: an empty-region signal really can seal
new producer starts without dropping admitted records. Whole-manager signal
blocking still allows pending handler geometry to mutate, and normal reopening
publishes the new producer region before worker candidates. The complete
transition protocol remains unresolved, not the narrower ability to close admission.
Final bounded audit also found no public startup route to the parentless worker
before a genuine native completion; a never-annotated PDF cannot be assumed to
have a discoverable worker context. No synthetic setup stroke or private-pointer
fallback was added.
The separately generated two-document diagnostic passed independent local review.
Its first trial timed out at readiness; its second opened both native documents
then failed on a native argument error. The third passed programmed movement/focus
but Qt rejected direct capture of its internally created viewport. All restored base.
Its [trial receipt](playbook/log/render_probe_2026-09-21.md) separates failed native
rendering qualification from successful recovery; no ink has been enabled.
The user confirmed normal scrolling returned and authorized continuation. The
third trial verified faster failure recovery. Capture through the QML-created
current SceneView passed local review but its fourth hardware trial caused a
native SIGSEGV after unsupported-layer warnings. The watchdog restored the base;
render staging is now suspended. A different diagnostic must be reviewed before
another hardware run. The ordinary app never uses grabToImage; this failed in
the diagnostic only, but dual-view rendering itself remains unqualified.
Independent binary review found the custom EPContext returns a non-null EPLayer;
the exact crash instruction is unknown, and a null-layer diagnosis is unsupported.
The proposed replacement diagnostic avoids all offscreen-layer APIs and separates
machine state checks (capture not attempted) from user visual acceptance on
disposable pages. The new structural profile is implemented locally and
cleared only for preparation of one bounded structural trial using exact reviewed
bytes and fresh device/base/backup checks. That one hardware trial has now passed
its structural sequence and automatically restored the normal base; no visual,
scroll or pen acceptance is implied. The user has since requested continuation
unless technically infeasible or very risky; only local work is resumed so far.
Moving capture
to a parent/root or starting whole-screen RMStream is not an accepted workaround.

## Layout

Latest interaction decision: pulling out the companion makes it immediately
writable; both exposed panes accept native pen strokes without a focus tap.
Toolbar context is separate from pen ownership. This supersedes the prototype's
select-only first pen tap. The implementation below is still being adapted and
keeps tablet writing disabled until the native routing gates are satisfied.

Main viewport stays full-sized. The companion is a second fixed-size viewport
translated to `height - reveal`, clipped by the workspace. Only its visible
portion appears. A preset tap changes its position once, without animation or
page reflow. No drag path remains in the ordinary UI. The historical diagnostic
host retains its original movement code solely to reproduce earlier trial bytes.

## Modules and principal functions

- `native/visual-open.qml.inc` / `visual-reopen.qml.inc`: local-only,
  pen-disabled diagnostic for the exact two v2 disposable notes. Native library
  lookups require their existing labels, single-page UUIDs, type and orientation;
  no documents are created or written. The driver keeps both native controllers
  alive at1320 then1680 reveal, publishes fresh identity/geometry heartbeats,
  and closes eligibility on pen, sleep/lock, sharing, orientation or identity
  changes. It never returns to a personal document within the diagnostic. The
  proposed external pixel read uses the already-loaded framebuffer-spy's buffer,
  not QML offscreen layers or a network server. No execution clearance/installer
  accompanies this local profile; capture needs its own scoped controller review.
  `ops/capture-visual-frame.sh` requires a fresh exact-document heartbeat before
  and after one bounded `/proc/PID/mem` read of the already-discovered RGB32 buffer.
  It checks process lifetime, candidate environment, private trial paths, absence
  of recovery/failure and unique exact framebuffer shape. Output is a new private
  scratch file only; no tablet memory/input is written and no server is started.
  `build-visual-controller.mjs` preserves the structural controller's recovery
  bodies/deadlines, verifies the two saved page hashes before activation (never
  as a recovery prerequisite), acquires both stages, then always restores base.
  Local tests exercise heartbeat freshness/identity/closed-state rejection,
  finite/exclusive raw acquisition and byte-identical restoration functions.
  These tests are not target pixel evidence; this visual capsule remains local.

- `native/geometry-check.qml.inc`: proposed no-capture/pen-disabled native
  diagnostic. It moves only the two disposable notebooks through exposed-height
  native scroll jumps, checks both paper edges and stable viewport scale/size,
  restores the original focal point, and exercises input-geometry refresh.
  `CN_PROBE=geometry` uses a new output directory and distinct success marker,
  sharing the already-tested recovery functions but has no staging clearance.
  Its executable tests distinguish unreachable-page failure from successful
  transform checks and require restoring the exact focal point on either path.
  Independent review caught nonfinite native values passing comparisons; the
  diagnostic now requires finite positive dimensions/scale, finite centers,
  native bounds and edge coordinates, and successful jump return values.
  Restoration is read back from native center/scale after the setter, not inferred
  merely from calling it; drift or nonfinite results reject diagnostic success.
- `native/input-geometry.qml.inc`: normal-build-only deferred pen geometry gate.
  `scheduleInputGeometry()` blocks new pen input immediately, coalesces changes
  by generation, waits for layout/restore/pen-up, then calls stock
  `PenInputSurface.updateTransform()` and the native manager's `updateRegions()`
  on both views before lifting the gate. A failure leaves writing paused.
  Native binary inspection shows that live pen drawing still reaches the global
  framebuffer independently of the viewport's framebuffer property. Its separate
  native input region and transform therefore matter; parent QML clipping alone
  is not sufficient. The exact explicit input-surface bounds are retained.
  `native/pen-refresh.qml.inc` hides the input surface while retaining its native
  manager, rebuilds regions, temporarily attaches the existing stroke handler,
  reapplies the stock transform, then detaches and unhides under the still-closed
  outer pen gate. This sequencing is essential: native setTransform is a no-op
  without a handler and uses an identity screen transform without a manager.
  Independent exact-binary review found synchronous direct signal publication
  under separate native mutexes. This is a viable ink-closed/no-active-stroke
  preparation mechanism, not a way to cancel an already-owned native stroke.
  The controller/staged candidate still requires review before deployment.
  `noteToolbarOwner()` records the native completed-stroke sender and changes
  toolbar context only when pen and touch gestures have ended, never midway
  through native stroke commit. Pen eligibility no longer depends on toolbar
  selection; each pane retains its own native document tools.
- `native/navigation.qml.inc`: local exposed-pane scrolling candidate, included
  only in the normal build, leaving the frozen diagnostics byte-identical.
  `cnConstrainToPane()` clamps the native tile transform against the actual
  exposed rectangle and native scene exterior; `cnJump()` uses 80 percent of the
  visible pane height. Full SceneView size and scale do not change. The stock
  full-viewport paper clamp is disabled only while paired; drag, scrollbar,
  search and autoscroll paths receive the pane-aware clamp. Layout dragging
  suppresses clamping until release. Pure-function tests cover reachability,
  zoom, extended pages, horizontal bounds and reentrancy; native behavior still
  requires qualification. This is not part of any cleared device payload.
- `native/structural-probe.qml.inc`: no-capture diagnostic state machine.
  `probeAssertStructure()` verifies saved DocumentView/current-scene/viewport
  identities and dimensions, disposable IDs/controller separation and pen gates
  on every paired tick. The driver opens two test notes, translates, selects,
  observes for 40 half-second ticks, tucks/reopens and restores the exact prior
  view before a distinctly nonvisual success marker. It aborts on unsafe screen
  state, pen activity, identity/geometry drift, native errors or timeout.
  `CN_PROBE=structural` emits a separate payload, removes the entire capture
  function from the shared bridge at asserted boundaries and exposes only scene
  and viewport references. Generated and decoded composition checks reject
  offscreen capture/layer APIs. This is not a scrolling or pen test.
  The controller uses `structural-machine-passed`, unchanged recovery, and no
  PNG success requirements. Independent review passed; staging accepts only the
  four frozen hashes, rejecting byte drift before writing a stage. Historical
  render staging remains blocked.
  Local verification passed 86 Node / 34 Qt tests plus all three composition
  profiles. Once the Pro became reachable, the one reviewed trial passed native
  structure/return checks and automatic recovery. See the 2026-09-22 structural
  log; the feature remains inactive and is not a writable release.
- `native/NativeHost.qml`: actual native-view container, picker, translated sheet,
  compact companion toolbar and focus state. `openSecondary()` creates a distinct
  native view and waits for readiness; `selectPane()` chooses toolbar context;
  `beginDrag()/moveDrag()/finishDrag()` translate the live sheet;
  `beginPull()/finishPull()` support dragging an already-loaded tucked view.
  Cold views must load before dragging. `checkpoint()/persist()` save only pair
  metadata through QtCore.Settings; `closeSecondary()` invokes native close first.
- `native/main.qml.inc`: exact-3.29 MainView bridge. `canOpen()` excludes the
  primary, archived/password-protected/unavailable/landscape/empty notebooks;
  `refreshDocuments()` lists up to 12 recent eligible companions;
  `createView()/openView()` use a second native DocumentView and native page IDs.
  Each secondary owns its native PageSelection. Only the selected view publishes
  the shared listener/orientation state. Screen sharing blocks a new disclosure.
- `native/document.qml.inc`: per-view focus, input and global-publication gates;
  `cnNativeClose()` retains stock close/save behavior without changing primary
  recovery state. `cnAction()` uses native pen, eraser, undo, next-page and add-page
  methods. `cnIsolateCompanionUi()` suppresses only the secondary Dates panel,
  after children are initialized, independent of QMD order. Dates' add-page wrapper
  is retained. `cnRefresh()` marks the full local viewport rectangle dirty and
  invokes stock `requestRepaintDirty()` after dragging. It avoids the unsupported
  zero-argument `requestRepaint()` call and ignores absent/zero-size viewports.
- `src/PairStore.js`: strict schema/UUID/size validation, immutable pair updates
  and removal. No notebook content or credentials are serialized.
- `build-native.mjs`: verifies exact stock ELF, symbol table and QMLDiff hashes,
  injects native adapters, hashes the QMD and emits a three-file candidate manifest.
  Native pen surfaces and gestures are clipped to exposed pane heights. Direct
  framebuffer and minimal text update paths are disabled while paired so Qt can
  composite the overlay; this behavior is not yet hardware-qualified.
  An explicit `CN_PROBE=render` build emits a separate `build/render-native`
  diagnostic, never changing the normal host. It inlines `probe-bridge.qml.inc`
  and `render-probe.qml.inc`: claims a singleton probe, creates two clearly labeled
  native test notebooks, opens distinct native controllers, checks fixed geometry
  while dragging, captures only those disposable views, tucks/reopens, and returns
  to the exact original document and page. The render profile compiles pen input,
  MainView interaction, gestures and shortcuts off even before the host loads;
  the picker is locked. `probeCapture()` grabs only each disposable document's
  current SceneView, instantiated by the stock QML component (therefore associated
  with the QML engine), containing its native viewport. The internally C++-created
  DeviceSceneViewport cannot directly grab because it has no QML engine. This is
  not the entire DocumentView, shared scene cache container, or MainView. Each
  delayed callback revalidates generation, safe state, document IDs, document-view,
  native-viewport and current-SceneView objects. Both DocumentView and captured SceneView document IDs must match
  their disposable IDs, including during callbacks, protecting loading/teardown
  transitions even when only the underlying native document changes. `probeInvalidate()` cancels
  outstanding callbacks before failure/restore; no whole-MainView capture occurs.
  `probeReadiness()` permits the library's empty DocumentView placeholder even
  when its inactive SceneView reports loading, but still blocks a real loading
  document and all locked/asleep/landscape/sharing/library-busy states. Diagnostic
  logging emits only readiness reason labels when they change, never document data.
  Failure messages include the numeric diagnostic phase to localize native errors.
  Exceptions stop the diagnostic; no custom notebook serialization or deletion.
  A render-profile-only bottom notice explains that writing/scrolling are paused
  and the normal setup restores automatically; it is absent from the normal app.
- `ops/build-render-controller.mjs`: generates a narrowly transformed derivative
  of the hash-pinned reviewed load controller. It requires its own review and
  receipt: 180-second owner window, 1-GiB temporary UI memory cap and a distinct
  two-view/return/capture marker. Completion polling checks watchdog liveness on
  each iteration and before marking success. The original load-only controller
  is unchanged. The independent watchdog now checks the native failure marker
  every polling cycle, recovering even while the owner is busy in health checks;
  the owner also checks before each warmup pass. Recovery functions and restart
  budgets remain byte-identical to their reviewed versions.
  Owner native-failure and strict-QML-error gates use explicit exit paths and
  accept only grep's no-match status; they do not rely on bare shell negation
  under `set -e`, which does not abort on a matched error. Log-read failures fail
  closed. Executable tests cover these actual generated gate statements.
- `tests/native-composition.mjs`: verifies the coordinated base candidate hash set,
  applies all extensions in three orders, parses every generated QML resource,
  checks critical hooks and rejects a wrong firmware. It does not activate anything.
- `tests/tst_nativehost.qml`: Qt boundary mocks for lifecycle, persisted pairing,
  failure handling, focus/gesture locks and real pointer dragging. These mocks
  cannot qualify native rendering or pen correctness.
- `tests/tst_renderprobe.qml`: exercises the diagnostic driver against mock native
  bridges, including original-view restoration, unavailable-state no-op and pen
  interruption. Build both profiles before running the Qt suite.
- `tests/render-profile.test.cjs`: verifies the rendering derivative retains the
  exact reviewed recovery functions, and executes the actual bridge JS to test
  single-claim native creation, unavailable-state no-op, delayed capture rejection
  after navigation/cancellation/restore or replaced/destroyed objects, and exact
  original-page restoration rather than document-ID-only acceptance.
- `tests/native-isolation.test.cjs`: executes the injected secondary-panel
  isolation function against mock children, including primary/no-panel cases.
- `ops/probe-pro329.sh`: load-only, always-reverting trial from the accepted r1
  runtime. `prepare` verifies identity/base and creates a private scratch XOVI
  tree plus preimages; `run` requires a verified Mac backup, arms a separate
  systemd watchdog, and changes only its own late `/run` drop-in. `recover()`
  removes that drop-in, restores the accepted base, and attempts stock once only
  if the base fails. Start-attempt markers are persisted before actions so a
  cleanup retry cannot repeat either restart. Watchdog accounting precedes fallible
  payload validation; explicit systemd start limits also bound failures before
  state can be read. Per-PID policy temporaries never overwrite stale files.
  `verify_prepared()` checks scratch QMD/table, both host files and deterministic
  policy bytes immediately before use. It preserves Dates' PID/configuration and archives
  its own new host/settings files. No commit or persistent activation action.
- `ops/stage-probe.mjs`: emits a new private, hash-manifested five-file stage
  after composition and controller syntax checks. It never connects to a device.
  It rejects every historical render-profile staging request before artifact
  reads or writes, following the native capture crash. There is no command-line
  bypass. Structural staging requires the four independently reviewed hashes;
  future candidates need new review. Offline diagnostic compilation remains
  available, and existing load-only behavior is unchanged.
  `playbook/LOAD-PROBE.md` documents the strict-key, backup-acknowledged operator
  sequence and separates automatic recovery from feature acceptance.
- `tests/probe-policy.test.cjs`: executes the actual recovery function in a
  temporary filesystem with mocked services; tests base recovery, pre-restart
  failure, durable retry budgets and refusal to remove foreign policy. Actual
  publication code is separately exercised under conditional callers with copy,
  hash and reload failures and foreign-temp/policy refusal.
- `src/Workspace.js`: `create()` owns device-local in-memory state;
  `openPrimary()` restores a document-specific pair tucked; `attach()` rejects
  self-pairing; `reveal()/tuck()/detach()` distinguish visibility from attachment.
  `beginDrag()/drag()/endDrag()` provide continuous bounded translation and
  cancellation. `beginStroke()/strokePoint()/endStroke()` freeze destination and
  origin, reject chrome/covered regions, and block layout/focus changes.
  `beginScroll()/endScroll()` lock gesture ownership without changing editing
  focus. `saveScroll()/scroll()` retain independent synthetic offsets per pair.
  `resize()` rejects mid-operation changes and tucks in unsupported landscape.
- `ui/CompanionWorkspace.qml`: renders the main viewport, overlay viewport,
  handle and active-pane indicator. Tap handlers explicitly hit-test ownership:
  Qt passive handlers otherwise allow the covered primary to take focus too.
  `openPrimary()` loads saved offsets, `updateSize()` applies idle geometry;
  wrappers trigger QML bindings through a revision counter.
- `ui/DemoPage.qml`: original synthetic reference/ruled pages. Not stock QML.
- `ui/Main.qml`: desktop harness; simulated mouse pen mode is explicitly marked.
  Its canvas is ephemeral test visualization, cleared on state changes. It does
  not save, export, or represent native ink, and must not ship on a tablet.
- `tests/workspace.test.cjs`: controller invariants and boundary cases.
- `tests/tst_workspace.qml`: real pointer drag, focus, wheel scroll, tuck and
  synthetic pen-lock checks, each in a fresh component instance.

## Persistence and native integration boundary

Desktop-demo metadata is memory-only. The native candidate uses QtCore.Settings
at `/home/root/.local/share/companion-notebook/pairs.ini`, category `companion`,
with versioned JSON containing primary/companion UUIDs, a reveal ratio and stable
companion page UUID. Settings are synced only on changes; invalid existing data
blocks pairing changes and is never silently repaired. Actual device permissions
and disk durability still require qualification (Qt's QML API does not expose a
write-status result). Native controllers alone own notebook contents and scroll
position. Pairs always resume tucked, never expanded after a restart.

The native adapter gates DocumentViewListener, orientation, toolbar, modal and
screen-mode publication; companion open/close does not reset primary
Settings.lastOpen. It retains native locks and saving. See NATIVE-GATES.md.
No adapter is faked with screenshots or custom serialized handwriting.

## Unqualified native boundaries

The native candidate's `inkQualified` is false: paired views cannot accept ink or
editing actions. Native PenInputBlocker regions cover disabled input; the new
direct-write model relies on native first-sample region ownership. Native stroke signals lock layout/focus,
and unsupported orientation tucks after pen-up, but the underlying orientation
geometry still needs live testing. No second Dates panel is allowed; other shared
plugin/native globals require actual composition tests. Native viewport pixels,
scrolling, save durability, occlusion and fluidity remain unmeasured on hardware.
In particular, a fixed full-height viewport clipped into a shorter pane does not
by itself establish usable independent scrolling. Exact stock SceneView sets
`limitScrollingToPaper: true`, while Navigation uses full viewport dimensions
for bounds and page jumps. Qualification must prove bottom-of-page reachability
in both exposed panes without shrinking/reflowing them during drag. Do not treat
gesture routing alone as proof, or silently replace the user's full-scale layout.
Rendering probes use disposable documents and a bounded independent watchdog.
ReManager explicitly handed over its accepted r1 base after final verification.
The last verified recovery returned UI45382 / Dates14463 with zero restarts and
read-only root; user scrolling acceptance was confirmed after the earlier trial,
not requested again during this overnight structural run.
Consult the dated receipts
and revalidate live identity/base state before each new trial, not these old PIDs.

The geometry diagnostic now has independent one-run review at source `8543258`.
`ops/stage-probe.mjs` admits only its four exact reviewed artifact hashes, plus
matching full-stack composition and accepted base manifest. It still refuses the
crashing render profile, byte drift and reused transaction IDs. This clearance is
pen-disabled and always-reverting, not an ink or release qualification.

That one run restored base UI49237 after a refused geometry check, following a
successful upper-pane scroll test. A synchronous scroll can leave native tiles
loading, so input refresh is now separate: `cnInputGeometryReadiness()` exposes
specific refusal reasons; `tryInputGeometry()` keeps the pen gate shut and retries
only transient loading (100 ms, 120 attempts maximum). Pen/drag/restore activity
pauses attempts until its completion schedules a fresh refresh. The diagnostic
checks both panes' scroll/focal restoration first, then waits on a later timer tick
for native loading to settle before verifying both pen transforms. The original
run does not clear this changed payload; fresh review is required.

`playbook/INK-QUALIFICATION.md` records the remaining direct-write lifetime and
tuck-transition issues and a possible disposable-only automated native-pen test.
It is a design constraint document, not an enabled profile or test clearance.

The readiness delta at `3a7bf6d` has independent one-run geometry clearance.
Staging pins its replacement QMD/host and unchanged pair store/controller; the
prior clearance is consumed. Local suite: 41 Qt tests, full three-order normal
and geometry composition. Native writing lifetime holds remain separate.

Normal tuck handling now holds the primary's pen gate closed while a retained
companion exists and geometry is pending, even when `paired` just became false.
Only the primary is refreshed while tucked; the companion waits for reveal.
The Qt fixture now models that gate and catches the former premature reopen.
These source changes are not substituted into an already frozen tablet stage.

The frozen readiness geometry trial `20260921T224844Z-1` passed both exposed-pane
edge/scale/viewport/focal checks and deferred native input refreshes, then restored
the prior document and accepted base automatically (`base:53104`, Dates14463).
All11QMDs/10settings/3policies matched, root stayed read-only, and no Companion
host/data/drop/lock remained. The one-run clearance is consumed; staging now
rejects geometry before any write until a new independently reviewed need exists.

The bounded exact-binary audit found synchronized native handler destruction,
but not a reusable per-stroke queue-drain/save acknowledgement in the inspected
exposed paths. Stock `_open_helper` can bypass an early-returning close wrapper;
live visibility/size bindings are another transition boundary. See
`playbook/INK-QUALIFICATION.md` for the evidence and risk stop. Native writing
remains disabled and Companion uninstalled; no timer is treated as a save barrier.
Final local checks:108 Node,42 Qt,normal and geometry three-order composition.

## Fixed-layout direct-writing diagnostic

The user's renewed try-it authorization is implemented as a separate `CN_PROBE=ink`
profile, not by enabling `inkQualified` in the ordinary host. `ink-probe.qml.inc`
creates two native disposable notebooks, waits for ready input mapping, captures
their exact native object identities, and opens both pen regions simultaneously.
`probeAllows(view)` admits only these two unchanged objects; `probeStable()` checks
the fixed portrait geometry and document pairing. `probeSubmitted(view, stroke)`
runs after native controller dispatch and checks attribution/count/mapped bounds.
`probeFail()` closes future eligibility without moving, closing, destroying or
rebinding the views. Native destruction synchronization remains intact.

The builder adds pre-mutation open/close/page guards, blocks mouse/touch navigation,
and freezes pane actions and input-transform updates once armed. It does not
return to a personal document during the test; automatic base restoration ends
the experiment. The stock native controller owns all strokes and saving.

`ops/ink-events.c` is a fixed-purpose two-stroke marker helper. `open_marker()`
validates the event device and ranges; `permitted()` checks the native gate, exact
xochitl process lifetime and short deadline; `draw()` emits bounded native input
with balanced release. There is no configurable target coordinate or generic
injection API. The generated ink controller records injection intent before the
first write; `release_injected_pen()` runs independently after owner termination
and before base/stock restart. Stage verification also pins the helper binary.
Submission receipts explicitly leave durable saving and visual correctness
unverified. This work adds no release installer or persistent boot changes.

The ink recovery now records the exact owner cgroup and uses cgroup-v2
`populated` (including descendants), plus inactive/failed unit state, to establish
that no writer can emit more events before independent release. Owner MainPID zero
alone is deliberately insufficient. A failed/unknown emptiness check prevents
release/restart. Focused shell tests cover surviving children and missing evidence.

`ops/verify-disposable-ink.py` reads only locally copied files whose two IDs match
both the native creation and arming receipts. It uses pinned `rmscene` 0.8.0 to
account for blocks, require exactly one line in one page per labelled test note,
and compare saved point counts/bounds/straightness to native submissions. It never
writes native notebook files; persistence is separate from native reopen, visual
clipping, interference provenance and general release qualification.

The input helper has independent hard SIGALRM limits (8 seconds for draw,
2 seconds for inspect/release), installed before device access, plus nonblocking
IO and bounded retries. Cleanup attempts each release component even after errors
or cooperative interruption. `drain_marker()` conservatively checks observed
events against the ordered injected frame, allowing filtering of unchanged values;
unexpected/extra events fail closed, including during inter-stroke pauses. This
does not prove event provenance or physical exclusivity. Identical interleaving
remains a test-validity limitation, contained to the two disposable notebooks.
The actual C implementation is included in an isolated syscall-mocking harness;
it covers failed/short/EINTR IO, unexpected frames, cleanup and a real child
SIGALRM timeout without accessing any input device. Saved-file verifier tests use
local synthetic `.rm` fixtures that are never deployed.

Controller-generation replacements use a callback, preserving shell `$$` and
other dollar sequences literally. An exact generated-owner assertion guards the
PID/start-time record; replacement-string escaping must not silently turn it into
a literal dollar and cause immediate watchdog recovery.

The first live ink diagnostic produced31 native callback points but24 serialized
points per stroke, with matching endpoints/bounds and near-straight trajectories.
The readback verifier therefore reports both counts and tests geometry rather
than assuming byte-identical sampling; persisted bounds must match within5 units.
It explicitly does not establish exact sample preservation or native reopen.
Any unparsed metadata extensions are reported, not hidden as complete format
understanding. A successful stored-shape check is still not product acceptance.

A local Qt lifetime experiment confirms that QML `destroy()` is deferred and
`QObject::destroyed` is not exposed to ordinary QML Connections on this desktop
Qt version. `Component.onDestruction` is not a post-native-destructor barrier.
Do not use either to declare native worker quiescence; a handler-factory approach
would need a real external post-retirement acknowledgement, plus null-safe native
consumers and completed-stroke handoff. No such factory is deployed.

`tests/native-retirement/` is an actual desktop C++/QML ordering experiment (never
a tablet payload). It instruments a native derived destructor, the attached
Component callback, and a queued function owned by a surviving parent. It tests
ordinary dynamic deletion separately from whole-engine teardown. The attached
callback precedes the native destructor even during ordinary deletion. A queued
callback happens later on that tested path, but this does not establish a general
barrier across GC, delayed deletion, invalidation or nested event processing.
Whole-engine teardown announces attached destruction without immediately deleting
the native child and suppresses the queued callback. This negative regression
explains why the adapter needs an external native retirement observer; it is not
by itself firmware/worker qualification.

`ops/prepare-observer-headers.mjs` downloads two official, checksum-pinned Debian
Qt6.8.2 ARM64 development archives into the ignored build tree and extracts only
their headers. It never installs a package, executes a package script or contacts
the tablet. This avoids mixing macOS-generated Qt configuration with Linux ABI
headers; any eventual plugin still needs exact target symbol/dependency checks
and a separately bounded native load test.

`ops/build-observer-cross.mjs` uses host Qt6.8.2 moc with Linux ARM64 headers and
the aarch64 GCC toolchain, linking only existing target Qt libraries. Its ELF
gate rejects other architectures, host rpaths, text relocations, unknown direct
dependencies and required symbols/version tags missing from the read-back target
libraries. The receipt pins sources, binary and providers. It has no deployment
path, and passing it does not establish native module loading or factory safety.

The separate `CN_PROBE=retirement` profile wraps the unchanged stock handler body
in a dynamic QML Component. `handler-factory.qml.inc` holds the current typed
handler, rejects active gestures/selections, detaches both input and viewport
consumers, then requests normal destruction. `retirement-probe.qml.inc` observes
both old handlers from the surviving host before moving the sheet and recreating
fresh handlers. It keeps the same two disposable native documents/controllers,
submits a controlled stroke in each before and after movement, and never opens a
personal document. Its event-loop movement receipt is not visual fluidity proof.
The ordinary and frozen historical profiles do not use this factory or module.

`native-observer/` implements the observer-only `Companion.Lifecycle` QML module.
`arm()` accepts exactly two distinct UI-thread native handler objects and an
immutable generation; `cancel()` and rearm invalidate a private epoch. Direct
native destruction callbacks capture slots without dereferencing the dying
objects. `acknowledge()` emits a queued signal only after both derived handlers
retire, with cancellation/reentry/thread guards. It never deletes a handler or
calls any private Qt/worker API. Thirty-five local C++ tests include actual module
loading and nested destructor event processing, explicitly distinguishing native
derived retirement from whole QObject-stack unwinding.

`native-observer/smoke.cpp` is a separate five-second process-bounded import/ABI
check using fake local QObject handlers. It uses Core/Qml only, resolves modules
only from its own adjacent `qml` directory and cannot access a display, input
device or native notebook. The cross-builder verifies this executable separately.
Running it successfully would qualify module loading, not pen or factory behavior.

`ops/build-retirement-controller.mjs` derives a separate bounded experiment from
the frozen successful ink controller. It preserves independent cgroup termination,
release/recovery and settings checks, adds an exact module subtree and temporary
QML import path, verifies target runtime-library hashes, and allows exactly two
fixed two-stroke helper invocations. Before round two it requires native retirement
and movement receipts and invalidates the old release marker, so watchdog recovery
cannot mistake the first round's release for a second round's release. The whole
module subtree is retained with the experimental host during restoration; no
shared library, base plugin or boot configuration is installed or replaced.
The second helper is generated from the hash-pinned, previously tested C helper
with exactly one coordinate-expression change: both lines move 200 screen pixels
down. Bounds are still fixed, no generic injection API is added, and all deadline,
echo/interference and release code is byte-for-byte source-identical. Distinct
first/second-round shapes let saved-file readback detect duplicate first-round
ink being mistaken for successful post-movement input.
The local readback verifier recognizes the separate retirement receipt and
requires the same two created IDs for both rounds, one native retirement and
movement acknowledgement, exactly two distinct native shapes and saved lines per
note, and a one-to-one geometric match independent of CRDT serialization order.
Synthetic test pages exercise missing, duplicate, unlabelled and misdirected ink;
they are never deployed to a tablet.
`ops/stage-observer-smoke.mjs` packages only the independently built smoke
executable and its adjacent verified QML module into a fresh private local stage.
It pins all source and binary hashes, rejects reuse and symlinks, and performs no
remote actions. UI-trial staging pins the independently reviewed profile and
separately requires a real target module-import receipt with exact identities and
unchanged UI/Dates processes. Synthetic stager receipts are confined to temporary
unit-test copies; they never populate the real workspace's missing target receipt.
The complete local Node suite now passes152tests with7historical-clearance skips;
14staging tests specifically enforce those pins and the target-evidence boundary.
Network discovery is read-only and host-key-first. An offline target or changed
LAN does not create a receipt, activate a package, or consume a trial clearance;
the next action remains the actual standalone target import preflight.
Fresh target inspection established `/lib` is an alias of `/usr/lib` on this
exact firmware. Runtime checks use the actual canonical `/usr/lib/libc.so.6` and
`/usr/lib/libgcc_s.so.1` paths with unchanged verified hashes. The strict `exact()`
check is not relaxed to accept aliases; recovery and all other payloads are
unchanged. This two-path controller correction passed narrow independent review.
The first live retirement trial received a mismatching callback before its owner
ever started the scripted marker helper. It restored base71641/Dates14463 with
all app/settings/policy hashes intact. Neither copied test page contains a saved
line; the primary-page write log does not prove misdirected ink. Input provenance
and the mismatch cause remain unknown. The next local diagnostic snapshots scalar
bounds/count and verifies the exact callback view, controller and native handler
**before** `addDrawingLine`; unexpected input is refused before notebook mutation.
The post-submit receipt consumes that snapshot without re-reading a possibly
consumed native Stroke object. This tighter diagnostic is not yet cleared or
deployed and does not change the ordinary package or historical ink payload.
The diagnostic controller now monitors the ready-to-inject gate immediately
after initial process health checks. Its unchanged25stable-PID/watchdog checks
are moved after all four submissions, when future pen input is closed, rather
than leaving the writable test panes unmonitored during that interval. Helper
identity/pen-up/event checks, deadlines and the complete recovery/release bodies
remain unchanged. This reduces the pre-helper window; it does not establish
physical event provenance or exclude every possible concurrent user event.
The strict QML-error scan is repeated after the relocated stability interval,
before the machine-pass marker, so late errors cannot escape final qualification.
`tests/tst_handlerfactory.qml` models two real QML creation contexts with separate
controller/tool sentinels and per-instance dynamic Components. It checks reactive
ownership, inner-ID versus published-property resolution, independent recreation,
foreign QObject parenting and pre/post callback snapshots. These six desktop
scenarios isolate lexical semantics only, not the proprietary native handler.
