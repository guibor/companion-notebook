# No-capture structural diagnostic — not a release

This new `CN_PROBE=structural` profile replaces neither the blocked rendering
profile nor any visual/ink acceptance gate. Independent local review passed for
the four frozen hashes in the dated structural log, supporting preparation of one
bounded always-revert trial. The render profile stays blocked. Fresh device,
base-state and backup checks remain prerequisites, and there is no release clearance.

**The one reviewed trial has now completed:** structural-machine-passed and
automatic base recovery both passed in `20260921T221147Z-1`. Normal setup is
restored. No further hardware runs are cleared by this review. See the
[receipt and stop decision](log/structural_probe_2026-09-22.md).

## Scope

Retain the prior diagnostic's pen/gesture/shortcut/MainView input locks, visible
temporary-lock notice, native creation of exactly two labelled test notebooks,
disposable outer/inner document-ID checks, distinct scene controllers, prior-page
return, 1-GiB memory limit and independent always-revert recovery. No firmware,
boot, Move, server, personal notebook serialization or deletions.

The generated MainView bridge has no capture function; its getters expose only
current scene/viewport identity and dimensions. The builder checks that its new
payload contains no grabToImage, grabWindow, saveToFile, ShaderEffect or layer
access. Composition checks inspect decoded MainView/DocumentView in all three
plugin orders. Do not replace this with parent/root capture or RMStream.

`structural-probe.qml.inc` performs bounded opening, ten translation steps, focus
selection, a 40-tick (20-second nominal) observation window, tuck/reopen of the
same native view and exact prior-view restoration. Every active paired tick
revalidates the native objects/dimensions, disposable identity, and disabled ink.
Unsafe screen state, pen activity, geometry drift, missing objects or timeout
fails closed. This diagnostic deliberately does not permit user scrolling or
writing. Observation is not touch-latency or scroll acceptance.

The final marker explicitly says:

`Companion probe: structural sequence and return completed; ink=false; capture=not-attempted; visual=unverified`

The separate controller receipt is `structural-machine-passed`. Neither marker
can satisfy visual, full-page scroll reachability, occlusion, ink/save or fluidity
gates. A separate user observation/photo must be confined to disposable pages.
Never infer that observation from state-machine success.

## Local build and review

1. Build normal, historical render (offline only) and structural profiles using
   `node build-native.mjs` with the corresponding `CN_PROBE` environment.
2. `CN_PROBE=structural node ops/build-render-controller.mjs` derives the controller
   from the same pinned load source. Its recovery functions are byte-identical;
   it rejects capture identifiers and requires the nonvisual completion marker.
3. Run Node and Qt tests, then all three composition profiles sequentially (they
   share ignored output directories). Freeze all payload/controller hashes.
4. Independent review of this profile, including its different success semantics,
   has passed. `node ops/stage-probe.mjs ID structural` now requires the four exact
   reviewed payload/controller hashes in addition to composition receipts. Byte
   drift is a refusal before stage creation, not implicit approval of a rebuild.
5. Only after review and user authorization, perform fresh strict-key/device/base
   inventory and independently verified Mac backup as in LOAD-PROBE.md. A fresh
   transaction is mandatory; never modify or rerun an older stage.
6. Any permitted hardware run must require both its structural receipt and
   automatic `recovered=base:<PID>`, then full settings/QMD/policy/root checks.
   Leave the tablet in normal accepted base. User requested no further checks
   tonight; physical scrolling/visual acceptance is explicitly unverified.
