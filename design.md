# Architecture and implementation status

## Native icon and favorites

The toolbar now uses reMarkable's own qrc:/ark/icons/notebook through its native
icon renderer, with a smaller instance of that same native icon overlapping its
bottom-right corner. A white backing separates the two notebook outlines; there
is no border or minus mark on the backing. The baby icon resolves at native size48 and is visually
scaled down; the provider rejected an arbitrary size20 on the first attempt.
No copied stock icon or replacement notebook SVG is bundled. The picker has Recent/Favorites
tabs; cnRecent queries recent documents, while cnFavorites uses the stock
LibraryNavigator Documents|Pinned filter, independent of the recent40 limit.
describeDocuments applies the same local/portrait/unlocked eligibility rules to
both lists. The selected tab is remembered for the current UI session.

Public illustrations in docs/images are schematic UI mockups with fictional
content, not device screenshots or handwriting evidence. They do not bundle
native firmware artwork and are separate from the runtime icon resources.

## Popup picker and symmetric document roles

The right endpoint now opens the companion as the new native primary and stores
the old primary as its partner, including stable page positions. No fullReturn
session override remains: subsequent split presets reveal the previous primary
below the new one. Explicit swaps update the reverse pair; merely choosing a
partner still creates only a missing reverse default. Native open/close and
owned-park handling are unchanged. The endpoint arrows are inverted.

NativeHost's picker is a centered card above a light scrim, with a clipped,
scrollable recent list, selected-partner mark, close control and understated
unpair action. The host loader rises above the toolbar only while modalOpen;
native input is already parked before choosing becomes visible. The list uses
up to40 recent eligible portrait documents, not an unbounded library browser.
PDFs are eligible as well so a PDF source can become the lower pane after swap.
The earlier custom assets/companion.svg was replaced in230000 by the native
notebook icon and QML badge described above; no additional icon file is deployed.

## Layout and pairing refinement

The pilot toolbar now has Companion above Dates; the settings menu holds an
ordered five-icon source/quarter/three-eighths/half/companion strip in three dots.
Three-eighths is the new unpaired default; old larger splits normalize to half.
The end icons show up/down document arrows, not X or an off switch. Menu layout
uses ordinary declarative insertion. Qt's C++ stackBefore is not QML-invokable
on this tablet; the rejected210000 ordering helper is removed in210500. The live
alphabetical QMD order places Companion before Dates. Size controls remain in
three dots; exact placement relative to Dispatch is not enforced at runtime.
The menu sends an integer index before closing its delegate. layoutChoice stores
the numeric request and source identity; an idle-only timer calls applyLayoutChoice
after any current native transition. chooseSize captures a scalar ratio and
explicitly mutates host geometry only inside the existing owned-park callback.
Unpaired choices open the picker with that ratio, including a deferred full-view
request after pairing. rememberReversePair creates only missing reverse defaults;
existing explicit pairings are preserved. Full-return navigation remains native.
There is no visible Turn off Companion action; independent operator/crash fallback
remains. Local orchestration tests do not establish tablet handwriting acceptance.

## Hairline/shared-toolbar revision

RMHacks' local upstream split_doc/toolbar.qmd separates toolbar chrome from split
canvases, while layers_menu.qmd holds split controls. This revision follows that
separation rather than importing its older firmware patches. In the pilot build,
the Companion loader is a visual child of the primary DocumentView, beneath its
raised native uiContainer. The full-size primary toolbar stays visible regardless
of which pane last received ink, so left/right rails and foldouts remain above
the lower canvas. The sheet begins with a two-pixel separator; its title/actions,
fraction ruler and floating reopen banner are removed from the visible UI.

`shared-tools.qml.inc::cnToolState()` snapshots only pen/style/eraser settings.
`cnApplyToolState()` copies them to the companion exclusively under the existing
owned native park before input publication. Secondary normalization no longer
reasserts its hidden toolbar selection. Undo/Redo route to the last active pane;
their enabled state uses that pane's controller, never both documents at once.

`layout-menu.qml.inc` places four pictograms and close in the stock settings menu.
`layoutChoice()` implements quarter/half/three-quarter, tuck, and companion-only
through the existing transactions. Full view uses normal native document opening,
not a zero-height input surface, and retains a session-local source/page return.
`openPrimary()` uses the native main-document opening path. Returning from full
view waits for the original primary to be ready before reopening its companion.
`build-pilot.mjs` can seed the next session from the prior retained pairs.ini;
neither notebook contents nor independent app settings are overwritten.
Revision230000 is now installed: native UI177343 reported host-ready with ink and
settings enabled; owner176282/fallback177031 active, zero automatic restarts.
Pair metadata was carried forward from220100. Only local package composition/QML
parsing and the installation-startup receipt were read; no tablet interaction
tests were run. Hands-on behavior remains for the user's feedback.

The source is public at https://github.com/guibor/companion-notebook, with
beta/pro/3.29.0.148 as the default branch. The approved portrait-only announcement
and publication link are recorded in docs/reddit-announcement.md. Public source
visibility does not change the firmware qualification or licensing boundaries.

## First hands-on UX feedback: design delta, not yet implemented

The full-width, high-z Companion host currently overlays the primary DocumentView
including its native toolbar. `build-native.mjs` also suppresses the secondary
toolbar and hides the primary toolbar when the secondary is selected. Tool
operations are routed to an individual DocumentView by `editOperation`, not a
shared writing-tool model. These source facts explain the reported toolbar and
tool-selection problems; native writing itself is not proof of correct toolbar UX.

Next design: preserve the native toolbar's display and hit-test region on either
configured side, including its foldouts. Share pen/style/eraser selection across
both native controllers under one parked transaction; keep undo/page actions
document-local, proposed target the last explicitly interacted-with pane. Replace
the middle title/action row with four layout pictograms (small/balanced/large/full)
and X (close to source, retain pairing). Full mode preserves a route back to the
split; closed mode has a small reopen affordance. No fractions or duplicate pens.
This is a proposal recorded after user feedback, not a deployed change or a
claim that full-mode ownership and native toolbar reparenting already work.

## Explicit user-driven pilot (2026-09-23)

The user stopped automated qualification and requested direct use/feedback.
`CN_USER_PILOT=1` is a separate, deliberately experimental build: it enables
native input without adding a diagnostic driver, injected strokes or test-note
creation. Default builds and historical capsules remain unchanged/pen-disabled.
`native/pilot.qml.inc::pilotStop()` parks input, closes the companion natively,
allows five seconds of autosave settling, then requests normal-runtime recovery.
The document menu exposes Turn off Companion. A five-second UI heartbeat lets
the session supervisor restore the normal runtime after31 executed missed polls;
CPU-suspended time is excluded rather than mistaken for a UI stall.
`ops/build-pilot.mjs` retains the existing exact-device/base/preimage/fallback
machinery, removes input helpers and scripted tests, and replaces the180second
trial with a user-controlled session. Recovery keeps legitimate user settings
changes and retains pair metadata; it never restores notebook contents. All
activation policy is in `/run`, with no boot/firmware changes or automatic
Companion activation after reboot. This is not a full-release qualification.
Pilot20260923T170000Z-1 is installed: UI132308 reported host ready with ink/settings
true; owner131303 and fallback132006 are active, all with zero automatic restarts.
No further interaction tests were run after the user's stop-verifying request.
The installation receipt is `playbook/log/user_pilot_2026-09-23.md`.

## Current result: native lifecycle and display sleep pass; base recovered (2026-09-23)

Corrected single-use trial152000 passed native display sleep/wake on UI126884,
restored the original paired pages, and preserved all four complete saved stroke
shapes. The request-to-owned-park interval was2537ms; one balanced wake-key batch
returned to Normal and fresh native input. Independent recovery verified normal
UI129176/Dates14463, zero restarts, exact settings/base/policies and read-only root.
Both152000 and the earlier110500 capsules are consumed, never replayed. This
qualifies already-parked display sleep only, not an unfinished stroke, CPU suspend
or an everyday release. See the dated receipt below.

Read-only SSH verification after connectivity returned established trial110500's
actual outcome: its sleeping receipt followed the request by2074ms, beyond the
helper's1900ms freshness window. No wake batch was attempted, QML's5s deadline
failed, and the independent controller restored normal base UI112106/Dates14463.
All base/settings/policy hashes and read-only root were independently verified;
the experimental host/drop/lock and both owner cgroups are absent. The capsule
is consumed and is not a wake pass. See [the receipt](playbook/log/display_sleep_2026-09-23.md).

Corrected trial `20260923T052500Z-1` passed the actual ordinary host controls on
native UI97653: two new disposable notes, four correctly attributed submissions,
half/two-thirds sizing, tuck/reveal and chooser cancellation. The independent
controller reported its machine-pass marker and automatic recovery to normal
base UI99661/Dates14463. After a temporary connectivity gap, independent saved-file
readback and full recovery checks both passed. All four shapes are persisted in
the correct disposable notes; this is not an everyday-release qualification.
The frozen trial bytes remain unchanged. See the exact hashes and remaining
checks in [the controls receipt](playbook/log/ordinary_controls_2026-09-23.md).

The preceding attempt `20260923T001500Z-1` stopped before host creation because
tablet QtQuick lacks the ruler's `Accessible` attached type. Its watchdog restored
the exact normal base, independently verified as UI95131/Dates14463. The native
builder strips only four accessibility metadata bindings from the tablet ruler,
preserving them in the desktop source. All five fail-fast scans now recognize
host/type-load failures. The subsequent corrected trial is the pass above; the
earlier transient approval-service error is resolved, not a current blocker.

The subsequent lifecycle capsule103000 passed on the actual Pro with manifest
`1d0bd6381c25f8c2d8787f8cc13b0556fa31ebd155b31e7ee03a8c6c7a0b53b9`.
History, tools, page creation/return and close/reopen passed, with all four saved
shapes preserved and two new pages blank. Automatic recovery restored normal
UI106973/Dates14463 and all protected settings/policies; root stayed read-only.
This capsule is consumed. Later visibility/sleep changes are a separate candidate.

Current source also guards page/add-page operations, secondary close and grouped
tool/history changes. These paths passed in the lifecycle test above. Normal
Companion remains pen-disabled and is not installed for personal notebooks.
Native boundary/sleep and remaining extension checks precede ordinary deployment.
The current local source passes398 Node cases (7 historical skips),69 Qt cases,
33 saved-file fixtures and three-order composition with33 resources per order.
The frozen passing ordinary diagnostic had30; its files/manifest were not changed.

Trial `20260922T233500Z-1` now completes the real native cold-start, during-stroke
producer seal/worker park,1080-to1440resize, fresh-candidate publication and four
correctly attributed native submissions. Strict readback verifies all four saved
shapes. The watchdog restored base UI86380/Dates14463 and all protected hashes.
The ordinary host is still pen-disabled and not installed. See
[the successful receipt](playbook/log/admission_bootstrap_pass_2026-09-23.md).

The subsequent pen-disabled visual trial also passed. Native reopen shows both
saved notebooks correctly, with unchanged primary scale/rows and the intended
settled occlusion at1080/1440reveal. The normal base was independently verified
restored as UI89759/Dates14463. This is framebuffer evidence, not physical-panel
or dynamic-boundary acceptance. See [the visual receipt](playbook/log/visual_reopen_2026-09-23.md).

`native/transactions.qml.inc` is the ordinary host's new local lifecycle adapter.
`requestTransition()` records a generation-tagged UI-only intent and preserves
the old native inputs while `AdmissionGate.pause()` drains them.
`transitionPark()` checks old document/controller identities before detaching.
`applyTransition()` is the only scope allowed to open, close, tuck or resize a
view; a picker remains parked until a choice/cancel. `transitionAdvance()` waits
for ready native controllers, constrains the pane while parked, waits again for
tiles, refreshes detached transforms, and publishes before releasing the worker.
`transitionComplete()` commits pairing metadata only after the queued resumed
notification. A persistent mouse shield retains its own press grab through
release/cancel, never using pen-up alone to remove that grab. The old free-running
geometry timers are not included in the ordinary build.
`applyTransition()` preserves a failure reported by a synchronous native callback;
returning from that callback must never overwrite `failed` with `loading` and
resume a partially completed operation.

New local-only availability handling retains the owned worker park in
`suspended` when the primary is hidden or absent. It stops the readiness timer
and never attempts empty-candidate publication. `resumeAvailableInput()` resumes
the same validated refresh/publication path once stock input is actually visible,
including landscape. Only a stock primary document-open operation may continue
the suspended park; its nested initial page selection gets a narrow parked-only
allowance. The pointer shield releases for library interaction, except for its
own outstanding pressed grab. No power state, sleep policy or native core is
changed. Actual sleep ordering and native wake qualification remain open; this
change is NOT part of the frozen reviewed lifecycle trial103000.
Input visibility loss is itself a trigger, even when portrait/availability has
not changed. Every path into `suspended` first closes the retained secondary
under the owned park. Waking to a visible landscape primary resumes stock input
without reopening Companion. Separate idle/loading/settling regressions cover
the visibility-only case rather than always toggling both availability signals.

The ordinary QMD additionally contains a local-only DeepSleep visibility latch.
The QMD wraps (rather than replaces) the stock visibility expression, retaining
it verbatim and checking the full result in all three extension load orders.
`inputVisibilityHeld` is armed before paired native input publication, independently
of the requested BatteryManager sleep state. It is cleared only after the owned
park detaches the old inputs and refreshes the empty cache. The exact stock
`rootItem.visible` DeepSleep binding uses that hold; requested sleep still triggers
the availability transaction. No save worker, lock screen, screensaver or power
policy is replaced. This contains that one QML visibility boundary only, not a
hidden parent/window or unknown native power ordering. It needs independent
native sleep/privacy qualification and is not a released or deployed fix.

Lifecycle trial103000 has now run successfully on native UI104747. Strict saved
readback verifies all four original shapes, two original pages and two new blank
pages after native history/tools/page/close operations. Independent automatic
recovery restored normal UI106973/Dates14463 with unchanged settings/base/policies
and read-only root. No sleep or personal-notebook release is inferred from it.

The separate, not-yet-qualified `CN_PROBE=sleep` candidate reuses the ordinary
four-stroke diagnostic and adds `native/sleep-probe.qml.inc`. `probeSleepBegin`
first obtains the existing native park and detaches inputs, then calls the stock
`BatteryManager.requestSleep`. `probeSleepTick` requires actual DeepSleep followed
by Normal, fresh primary publication, and restored paired page IDs. It does not
qualify CPU suspend/resume or sleep during an unfinished stroke.
`ops/wake-key.c` pre-opens and checks the exact Pro power-key device, waits for a
fresh local owned-park receipt, and sends one balanced down/up batch within three
seconds of the original request (2900ms monotonic from first observation). The
local diagnostic-only correction accommodates the observed2074ms native close;
it still requires separate exact-capsule review and a native pass. No network
round trip, RTC alarm, power policy mutation or fake wake
reason is used. Partial write is failure with up-only cleanup, not success.
`ops/build-sleep-controller.mjs` derives an always-reverting controller from the
frozen passing ordinary controller; the helper must be ready before ink can
reach the sleep step. A missed wake fails in five seconds, before the cached
12-second sleep timer. An independent watchdog additionally starts a four-second
wake deadline from a logged marker BEFORE the native sleep call, even if the GUI
stalls before its sleeping receipt. Key-injection freshness uses that same request
time. Owner-cgroup death precedes any UP-only key recovery, which writes nothing
when the key is already up. All files require fresh independent review before use.
The helper resamples both clocks immediately before the actual batch write,
after log parsing, process/key checks and marker flushing; delayed work cannot
reuse an earlier eligible timestamp. A production-C harness exercises that race.

`NativeHost.qml` routes its controls through that adapter. `nativeOperation()`
also protects the stock open/close path while a companion is retained. The builder
inserts the guard at the first statement of `_open_helper` rather than renaming
that method, preserving BetterTOC's anchors in all three plugin load orders.
Focus changes do not refresh geometry; document readiness and identities are
separate from toolbar focus. This local integration is not a release or native
lifecycle qualification. Consumed diagnostic profiles remain byte-identical.
The ordinary stock `close()` wrapper now routes secondary closes through
`closeSecondary(false)`, clearing the retained slot and destroying its view only
inside the owned park. The internal `cnNativeClose()` still bypasses this wrapper
to call the stock close body exactly once. This avoids a blank paired pane after
the native close shortcut; the frozen current diagnostic does not exercise close.

`native/page-operations.qml.inc` extends the ordinary host, not historical probes.
`pageOperation()` captures the original view, document object/ID, page ID,
controller, handler and generation before requesting a park. The builder guards
both `DocumentView.openPage/addPage` and low-level `DeviceSceneView.goToPageId`,
covering page-map notifications as well as buttons. Stock unpaired/cold paths
remain unchanged, and nested calls inside an owned park do not start a new park.
`pageAddBegin()` captures the source page UUID map immediately before native add;
`pageAddComplete()` admits one callback only, verifies the same owner and exactly
one newly added target page, and opens it before any input publication. A retained
guard boolean prevents a deleted host from falling through to the stock callback.
`pageOperationsReady()` holds loading under the existing bounded timeout until
that callback succeeds. Add-page's function name and native call prefix stay
intact for Dates' wrapper. These new paths are local and still need native tests.

`native/edit-operations.qml.inc::editOperation()` adds stricter pane-local edits
on top of the page transaction. It captures document/page/controller/handler and
owner generations at action entry and requires them unchanged before and after
the entire tool-setting or undo/redo group. It never splits a tool selection into
independently queued property setters. A native failure remains latched even if
a signal dispatcher catches the JavaScript exception. This helper is tested
locally; its UI call-site coverage and actual native qualification are separate.
The companion bar now runs Pen/Erase/Undo/Redo through `editOperation()` and
Next/Add through `pageOperation()`. Its native action adapter admits those calls
only from an applying, owned park; there is no ordinary synchronous fallback.
Redo has a matching bar control, with widths adjusted to keep the ruler separate.
The ordinary builder additionally intercepts native Toolbar `requestPenSelect`
before `_select` and the selected-pen assignment. Its DocumentView tool/color/
thickness/eraser/history signal handlers reenter the unchanged whole handler only
inside the accepted edit transaction. The quick-switch setter group follows the
same rule. Keyboard and two-/three-finger undo/redo are pane-scoped; gestures also
capture the original controller and refuse a different target. Stock unpaired
behavior and already-parked document initialization bypass reentry as intended.
Virtual-keyboard/history and delayed HWC callbacks are not yet covered by these
hooks; do not describe partial call-site coverage as a full native release.

The request-signal guard is not sufficient by itself: native WritingTool and
EraserMenu taps continue to change selection or emit another tool signal after
`requestPenSelect()`. The builder therefore intercepts each entire outer pressed
group, including SelectionButton, before its first mutation and reemits it once
inside the same owned park. Erase-all and selection-mode changes similarly guard
their entire native handler, not only one nested signal. Regression tests retain
the real caller ordering and require exactly one transaction with no early
selection, tool or content change.

`editOperationsReady()` normalizes the currently selected native pen in every
ready view before input publication. This handles native `ensureSelection()`
callbacks queued by `Qt.callLater` while a transaction is loading: they cannot
mutate mid-transition or silently leave an invalid color/thickness. Normalization
is one identity-checked parked group, not three queued setter operations. Inactive
pens defer normalization until selected, avoiding writes through another pen's
shared toolbar signals. Unpaired stock behavior is unchanged. These new call-site
guards are local work and still require the next bounded native qualification.
An availability transition that has already removed the companion skips tool
normalization on the now-hidden primary; it returns to stock without new edits.

The visual-reopen profile now pins the two successful admission notebooks and
the same1080/1440heights. It permits no pen events or notebook-file edits. Its
separate stager requires exact hashes and a fresh review. `read-visual-frame.c`
opens the already-identified process memory readonly and preads only the6480
visible bytes of each6528-byte row. `copy_visible_rows()` skips padding at the
syscall level and handles bounded interrupted/partial reads and stdout writes.
The packed output is13,996,800bytes; no non-visible memory reaches the file.
`build-visual-reader.mjs` produces only a static ARM64 helper and rejects the
desktop-fixture entry point. The helper is a seventh hash-pinned capsule file,
not part of the installed host. The wrapper retains exact process, active-view,
heartbeat, file-ownership, exclusive-output and pre/post-read guards.

The ordinary boundary tests use an explicit desktop-only Admission module under
`tests/mock-imports`, never included by any device packager. The native C++ module
and completed device proof remain separate. QML pointer tests now wait for the
asynchronous park/publication protocol and verify ruler taps, settings restore,
pair cancellation, failures, tuck/reveal and availability changes. Native phase
checks read the C++ getter at the call boundary: its notification is queued and
must not be mistaken for the immediate parked acknowledgement.

### Actual-control disposable qualification

The separate `lifecycle` profile adds `native/lifecycle-probe.qml.inc` to the
current ordinary host. `probeLifecycleTick()` performs undo/redo in both panes,
switches the companion eraser/pen, adds and returns from a new page in each note,
then closes and reopens the actual secondary view. It preserves the original
four-stroke receipts and checks exact document/page ownership through controller
replacement. No extra ink, personal documents, file mutations or power controls
are added. This new profile needs its own reviewed bounded trial; it is not an
installer and does not replace the frozen passing ordinary profile.
`build-lifecycle-controller.mjs` derives from the exact successful controller;
only completion receipts and the post-ink completion poll allowance differ.
Its overall watchdog, release helpers, hashes and restore logic stay unchanged.
The saved-file verifier requires ordered history/tool/page/reopen receipts, both
original page IDs and exactly one new page per note, with all four original
shapes retained and no ink on either new page. This is still not a release claim.
Review found two defects before device activation: the bar Redo insertion missed
its source anchor, and the diagnostic refused a sole primary after closing the
secondary. The builder now asserts the exact Undo anchor before adding Redo;
the lifecycle test uses the actual bar Redo. `probeSolePrimary()` admits only the
created primary view/document/scene/controller during the close/reopen interval,
allowing normal fresh-candidate publication without relaxing the native fence.

The next separate `CN_ORDINARY_PROBE=1` profile runs the actual ordinary host
and ruler/transaction code on two new labelled disposable notebooks. Its driver
uses choose/pick,½and⅔presets, tuck/reveal and picker cancellation, with two
native submissions before and two after resizing. The QMD restricts eligibility
to those exact created IDs and checks view/controller/handler plus stroke bounds
before native submission. Final input stays parked through autosave/recovery.
This does not turn on ordinary or personal notebook writing in the normal build.
The current driver's tool preparation now has its own owned park and waits for
publication before selecting a size. This matches the new asynchronous tool
guards; it must not issue two tool requests and a size request in the same idle
callback. Source-level driver tests cover this new ordering. The stored passing
hardware cohort and its Qt regression still retain the earlier exact driver.

`ops/build-ordinary-controller.mjs` derives from the successful frozen bootstrap
controller. `SizeRuler.qml` is its11thcapsule payload, checked in prepared and
retained host inventories. It recognizes ordinary lifecycle receipts and both
probe and transaction failures while preserving release/cgroup/recovery actions
and finite watchdog budgets. No device clearance is implied by this local build.

`ops/stage-ordinary.mjs` packages the separately reviewed cohort into one private,
exclusive-created trial directory. It reads regular files once, hashes and writes
those same cached bytes, pins all eleven payloads including the ruler, verifies
the actual target bootstrap-isolation receipt and all three composition orders,
and refuses reused IDs. Its one-run clearance is consumed before activation.
The controller still requires a fresh live identity/base/settings check and a
verified Mac copy of the device recovery archive before any UI restart.

`verify-disposable-ink.py::verify()` recognizes the ordinary profile separately
from the admission/retirement diagnostics. It requires exactly one ordered
startup/create/two-round/lifecycle/seal/completion sequence and one-to-one matching
saved shapes. Missing, duplicated or reordered receipts, transaction failures,
mixed profile completions and altered preset/lifecycle flags are rejected. This
read-only verifier still does not claim release, visual or native reopen acceptance.

### Historical startup failure and correction

Trial `20260922T221000Z-1` failed before any Companion host-ready, cold-worker,
disposable-document or scripted-ink marker. The native UI aborted with
`std::invalid_argument` / `stoi`. Subsequent read-only recovery of the Memfault
stacktrace identifies the exact numeric parser and its native helper-output
caller (details below). The old combined preload introduces a real child-process
dependency leak; its precise contribution to the helper's bad stdout remains a
hypothesis until measured. Log proximity alone is not attribution. Do not treat
local/standalone passes as a working tablet feature.

The independent watchdog restored the accepted base. A fresh read-only check
again verified UI79742/Dates14463 active with zero restarts, all protected
settings/base files/service policies matching, root read-only, and no active
Companion host/data/drop-in/lock. Move was untouched. The one-run clearance is
consumed: `ops/stage-admission.mjs` refuses immediately, and a regression proves
that refusal happens before any evidence read or stage creation. No ordinary
installation or native writing is enabled. See
[the full receipt](playbook/log/admission_probe_2026-09-23.md).

The Qt-free bootstrap now passes the complete isolated target audit, including
the old combined preload as a negative control. UI79742/Dates14463 stayed active
with zero restarts; the test cgroup is gone, protected settings still match and
root remains read-only. No UI restart, notebook/input access or permanent install
occurred in this fix session. See [the fix receipt](playbook/log/bootstrap_fix_2026-09-23.md).

Next: normal-input recovery confirmation and a freshly reviewed bounded UI
payload, then actual native admission/visual qualification. Do not replay the
failed stage, claim the full feature works, or add it to update routines.

## Native admission integration (2026-09-23, in development)

### Process-scoped loading and startup diagnosis

The retained crash's native build ID matches the exact cached executable.
Frames at `0x4ae1cf` and `0x6e0803` locate the `stoi` helper and its pincode-setup
caller. The latter parses stdout from a QProcess helper invoked with `query` and
`current`. No security helper was invoked or security setting changed during this
investigation. The old Qt-linked preload was inherited by every exec child. That
made non-Qt helpers acquire Qt; XOVI's GUI-extension predicates inspect Qt symbol
availability. The cached message-broker source both writes startup messages to
stdout and recreates shared FIFOs. This supports a concrete pollution hypothesis,
but no failed helper stdout was retained, so exact causal attribution is open.

`native-admission/preload.cpp::initializeBootstrap()` now belongs to a separate
Qt-free bootstrap DSO. It admits only canonical `/usr/bin/xochitl` or its exact
adjacent standalone `admission-smoke` executable. Foreign executables return
silently without resolving Qt or loading the core. Public Qt headers supply the
exact empty-tag call ABI, with version tagging disabled. The bootstrap links with
the C driver and has only libc/libdl dependencies. `companionMove()` transparently
calls the original once, including when invoked before the constructor. It uses
acquire/release publication and a process-ID check so forked children cannot call
the parent's registry. No target decision uses argv, a basename or an environment
opt-in.

For an admitted process the constructor first resolves the original symbol, then
loads the canonical adjacent QML module with LOCAL/NOW/NODELETE and publishes its
versioned `companion_admission_observe_v1` bridge only after loading completes.
The core no longer exports the interposer. QML imports the same file, preserving
the single resident registry. Native ExecStart, argv, kernel executable identity,
and the base XOVI environment are unchanged; direct invocation of `ld.so` was
rejected because it changes executable identity.

`ops/build-admission-cross.mjs` checks all four ELF products against exact target
library exports, pins source/runtime hashes, and rejects Qt/C++ dependencies in
the bootstrap and fake C child. `preload-child.c` requires both the exact inherited
preload environment and its actual mapping; any Qt/core mapping is failure. It
prints only a numeric result. `smoke.cpp` checks native executable identity,
QProcess inheritance, exact hook binding and a shared preload/QML registry before
its existing fake-worker transaction.

`ops/stage-bootstrap-smoke.mjs` only prepares a fresh local hash-pinned capsule.
`ops/test-admission-bootstrap.sh` checks exact target identity/libraries, executes
bounded fake processes with no XOVI, compares UI/Dates PIDs and restart counts,
and writes only its private temporary results. Its minimal child environment
explicitly retains the native `en_US.UTF-8` locale, so the audit can require
zero stderr without hiding Qt's locale warning. Its launch uses a separate
45-second transient cgroup with forced group cleanup after at most two additional
seconds to bound pre-main loading and every exec descendant;
normal services and their policies are not changed. Positive tests include a foreign
helper beside no core; the retained old combined DSO is a negative control. It
does not invoke native security helpers, access input/display/notebooks, mutate
existing services, authorize a UI retry or replace the consumed historical receipt.

`ops/build-admission-controller.mjs` now emits a separate
`build/admission-bootstrap-native` candidate, preserving the consumed combined
controller. Its payload includes bootstrap/core/qmldir independently pinned;
prepared-runtime and cleanup inventories include the bootstrap. Probe health
requires exact mappings of both, while base/stock reject both. Only the Qt-free
bootstrap is added ahead of the unchanged base XOVI preload. All restart budgets,
recovery actions and native executable-identity checks are retained. No stager
accepts this new candidate yet. `tests/admission-bootstrap.test.cjs` exercises
policy rendering and build preservation, compares recovery functions, checks
payload/health accounting and inspects actual bootstrap/child ELF dependencies.
The independently reviewed controller preserves the original recovery and release
actions; that local review does not authorize another native UI trial.

`ops/stage-admission-bootstrap.mjs` prepares only the new exact bootstrap-based
trial, separately from the consumed combined-preload stager. It pins both shared
objects, the unchanged disposable host/QMD/helpers, the successful isolated-target
receipt (including negative control and complete cgroup cleanup), base inventory
and all three composition orders. It refuses until a new exact-capsule review,
rejects reused IDs and emits ten payload files plus their manifest. It never
connects to a tablet; live identity, base/settings, fresh backup and automatic
restoration gates remain in the controller.
Two independent reviewers cleared the exact bootstrap cohort for one disposable
attempt `20260922T233500Z-1`; this is technical test clearance, not physical
recovery attestation or a release. The operator will consume it on any attempt
or failure, retain pen/identity/startup gates, and independently recheck restored
base state. No extra startup-only restart is needed: cold native worker readiness
and healthy startup are already prerequisites for any injected event.

### Worker admission transaction

`native-admission` is a separate resident Qt/QML sidecar, leaving historical
retirement artifacts unchanged. On Linux its Qt-free wrapper calls the exact
public bool `QObject::moveToThread(QThread*, Qt::Disambiguated_t)` once and
records only the successful self-move of the exact `PenInputThread` class.
No private offsets, executable patching, or first-handwriting calibration is used.
`AdmissionGate.initialize()` performs a worker-to-UI roundtrip after construction;
startup observation by itself is not readiness. Resident relay QObjects avoid
posting through a potentially destroyed native object; epochs fail closed on
duplicate discovery, worker finish, destruction, or application shutdown.

`pause(manager, generation)` emits an empty producer region, blocks ambient
manager signals, and queues a real worker event-loop callback. That callback
parks on our condition variable (not a native mutex), after normal earlier stroke
delivery. The UI must leave native geometry/controllers unchanged until `parked`.
It then detaches every old input, updates the cache empty and prepares final
geometry. `permitPublication()` refuses a nonempty old cache, lifts the signal
blocker, and permits only final-geometry attachment. `finish()` synchronously
refreshes final native regions/candidates before releasing the worker. Wrong
generations cannot release it. Destruction or timeout never automatically resumes
partially changed geometry; a separately bounded recovery process is required.

This module is not wired into the ordinary host and does not enable
`inkQualified`. The one UI trial preloaded it but failed during startup; no real
native admission transaction was reached.

The first standalone Pro smoke passed with actual ELF interposition and a shared
preload/QML registry, leaving the normal UI PID unchanged. Follow-up review added
resident failed-transaction ownership, destruction-safe call guards, affinity
invalidation and a sticky nested-publication detector. Signal suppression is
manual and UI-owned: no signal-blocker destructor can unblock during teardown.
`finish()` requires a fresh direct `activeInputsChanged` notification after
publication is permitted. Calling `updateRegions()` alone is insufficient: its
cache may contain a change whose notification was suppressed. Fakes now model
that cache/signal distinction; destructive tests run in isolated processes.

`CN_PROBE=admission` is a separate disposable diagnostic preserving all
historical profile bytes. `native/admission-probe.qml.inc` requests a transition
while the second stroke is down, checks both submissions before moving from ½
to ⅔, then requires fresh candidates before two more controlled strokes. Final
input stays sealed/parked through autosave grace and external recovery; it never
reopens personal documents. `ops/build-admission-controller.mjs` derives a new
always-reverting controller from frozen retirement bytes, adding the resident
preload, exact dependencies and new markers. Its final 25-second observation
uses light PID/restart checks bracketed by full runtime checks to avoid the prior
deadline overrun. Its single reviewed trial is now consumed and further staging
is blocked, regardless of a build or standalone-smoke pass.
The locked admission diagnostic suppresses Navigation's deferred pane clamps;
it explicitly constrains each pane while parked and input-detached, immediately
before refreshing its native transform on a later ready tick (clamping can load
new tiles). This prevents the busy-to-ready callback
from moving the tile manager after worker release. This is diagnostic isolation,
not qualification of ordinary user navigation or an ordinary-host change.
Independent exact-artifact review cleared only trial `20260922T221000Z-1` with
fresh identity/base/settings/backup gates. `ops/stage-admission.mjs` pins that
single trial, all eight payload hashes, the accepted base manifest, composition
and target-smoke evidence. It refuses another ID or an existing stage. This is
not ordinary-host or persistent-install clearance. That trial failed and is
consumed; the historical pins remain solely for reproducibility.

`ops/verify-disposable-ink.py` recognizes admission as a distinct saved-shape
profile. It requires one cold-worker receipt before document creation, an exact
two-round pane order, transition request during round one, worker-drain and fresh
candidate receipts in order, and final closure before completion. Missing,
duplicate, reordered or mixed-profile receipts fail. Twenty-three synthetic
saved-file tests pass; the failed startup log has no qualifying receipts and
cannot provide an admission persistence result.

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

Earlier hardware result (2026-09-22): the v2 retirement diagnostic completed four
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
The earlier user-driven transition investigation is documented in
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
fallback was added. The newer public-symbol sidecar above addresses this with a
cold-start observation design, but its failed UI startup leaves the complete
native path unqualified. These older audit limits are historical, not evidence
that the new implementation has passed or is impossible.
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
# Suspend-aware pilot supervision (2026-09-23)

Pilot190000 recovered to the accepted base because its heartbeat deadline used
`/proc/uptime`, which includes system suspend. Logs show native wake events and
resumed UI heartbeats, not a Companion exception. `ops/build-pilot.mjs` now
counts consecutive completed watchdog polls without a new heartbeat instead of
elapsed uptime. Its one-second loop still recovers after 31 missed polls while
executing, but suspended time alone cannot expire the deadline. Startup identity,
native-failure, process-exit, manual-stop and backup/recovery checks are unchanged.
No input tests or notebook-content writes are part of this correction.
