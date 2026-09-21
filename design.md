# Architecture and implementation status

Implemented locally: a portrait interaction prototype and an exact-firmware
native rendering candidate. The candidate contains native document adapters,
device-local pairing settings and a composable QMD. Native writing remains
disabled. The load-only probe has passed on the Pro
and automatically returned to the accepted base; no Companion remains active.
No qualified installer or release exists yet.
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

## Layout

Main viewport stays full-sized. The companion is a second fixed-size viewport
translated to `height - reveal`, clipped by the workspace. Only its visible
portion appears. Dragging updates translation directly, with no animation,
debounce, page reflow or release-only commit. This is an optimization hypothesis
for native integration, not proof that the e-ink compositor supports it.

## Modules and principal functions

- `native/NativeHost.qml`: actual native-view container, picker, translated sheet,
  compact companion toolbar and focus state. `openSecondary()` creates a distinct
  native view and waits for readiness; `selectPane()` owns writing focus;
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
  It now rejects every render-profile staging request before artifact reads or
  writes, following the native capture crash. There is no command-line bypass;
  lifting this suspension requires a reviewed source change. Offline diagnostic
  compilation remains available, and the existing load-only behavior is unchanged.
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
editing actions. Native PenInputBlocker regions cover disabled input; inactive
pen-to-QML tap delivery is not proven. Native stroke signals lock layout/focus,
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
The last verified recovery returned UI41100 / Dates14463 with zero restarts and
read-only root; user scrolling acceptance was confirmed after the earlier trial.
Consult the dated receipts
and revalidate live identity/base state before each new trial, not these old PIDs.
