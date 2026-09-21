# Exact-3.29 native rendering candidate, local only

User confirmed the existing `beta/pro/3.29.0.148` branch and authorized direct
coordination with the ReManager task. ReManager retains device ownership during
base restoration; there have been no tablet connections, file copies, activations
or restarts from this implementation work.

Implemented a native DocumentView bridge, per-pane global ownership, native
close/save delegation, settings-backed pair metadata, local-notebook picker,
translated fixed-size sheet, compact companion controls and continuous dragging
from an already loaded/tucked state. Primary recovery state is not rewritten by
secondary lifecycle. Pen and gesture activity lock focus/layout changes.

The exact-firmware QMD disables direct framebuffer paths while paired, clips
native input and gestures to exposed pane heights, and adds native pen-blocker
regions for disabled input. Writing remains explicitly disabled. These are
implementation hypotheses until real hardware proves clipping and routing.

Composition identified a duplicate global Dates panel: each DocumentView would
instantiate one. The secondary now deactivates only the known Dates panel loader
after child initialization. The native Dates add-page wrapper remains intact.
This does not modify Dates or the other task's source/worktree. Isolation tests
execute the exact injected JavaScript function.

ReManager coordinated its corrected BetterTOC revision-1 manifest after its
initial cohort failed a live style-token log gate and rolled back automatically.
Companion's offline composition pins that corrected candidate manifest, explicitly
without claiming its live acceptance. Three plugin load orders parse cleanly
(29 generated resources each); a wrong-firmware application emits no resources.

Local verification: 17 Node tests; Qt 6.8.2 reports 24 passes (including four
suite lifecycle passes), covering both prototype interactions and native-host
boundary mocks. Qt uses the offscreen/software backend. No physical-device,
native save, actual pen or e-ink latency acceptance is implied.

Next: accepted base and explicit ownership handover; bounded disposable-document
rendering probe; native pen/save and fluidity qualification. Actual QtCore.Settings
availability and write durability must be checked on-device. There is no qualified
installer or recurring-install inclusion yet. Move and shared servers are untouched.

## Base handover and first probe preparation

ReManager subsequently accepted corrected r1 trial `20260921T193500Z-3` and
explicitly handed over. Strict host-key/key-only SSH revalidated Ferrari,
3.29.0.148/build20260911125116, exact stock/serial hashes, UI14472, Dates14463,
zero restarts, the exact eleven-QMD inventory and read-only root. The base's
three transient policy files have pinned hashes; its controller is unchanged.

Added a separate load-only, always-reverting probe controller. It copies the base
QMDs/table into private scratch XOVI state, adds Companion there, and overrides
only XOVI_ROOT/logging through its own later temporary drop-in. A separate systemd
watchdog restores the accepted base on owner exit/deadline; one stock-only fallback
exists if the base cannot start. There is no commit action. It must receive an
actual off-device verified backup acknowledgment before any restart.

Five additional tests validate parsing/argument guards and execute actual recovery
code with mocked services. They cover healthy-base/no-restart, one-restart base
recovery, one stock fallback and refusal to remove a foreign drop-in. Total Node
tests now 22. Independent local review has been requested from ReManager before
any live restart; no load-only trial result is claimed by this preparation entry.

## Independent controller review

ReManager's local-only review found conditional-errexit publication and retry
budget problems before any device mutation. Fixed both: explicit publication
returns, unique per-process temporary files, durable base/stock start-attempt
markers, bounded watchdog entry before fallible preflights, explicit systemd
start limits, and prepared-copy verification. Also rejects apk.vellum and the
ReManager correction owner. The original base controller remains unchanged.

ReManager reviewed and cleared frozen controller SHA-256
`e219d071e62a5170f2799ba6b406a086495bc995e4976b7371265f9cf14116fb`
for the bounded load-only always-reverting trial, not rendering, ink or release.
The repository now retains 31 passing Node tests, including actual publication
under conditional callers, repeated recovery after cleanup failure and repeated
watchdog-entry stage failures. Qt still reports 24 passes. The native full-stack
composition remains three orders / 29 resources. Live recovery remains unproven
for this controller until its own trial completes.
