# Two-native-document diagnostic (not a qualified release)

The accepted load-only trial established host startup and automatic return to
base, not dual rendering. This is a separately generated and reviewed profile.
Its first hardware attempt timed out at readiness and recovered the accepted base;
see the [trial receipt](log/render_probe_2026-09-21.md). The independently reviewed
readiness correction is approved only for a fresh bounded diagnostic, not ink.

Build the ordinary profile for the desktop/mock suite, then use
`CN_PROBE=render node build-native.mjs` and
`CN_PROBE=render node tests/native-composition.mjs`. Outputs are confined to
`build/render-native`; the normal host contains no automatic creation driver.
`node ops/build-render-controller.mjs` derives a separately reviewable controller
from the exact accepted load-controller hash, with assertions on every changed
anchor. `node ops/stage-probe.mjs ID render` requires matching profile/hash
receipts. Do not reuse a stage ID, the old load-only artifact or its review.

## Native sequence and boundaries

- Wait for an unlocked, awake, portrait, library-ready interface and no sharing.
  A retained DocumentView with no document is a library placeholder, not a loading
  notebook; real loading documents still block. Reason-only logging identifies
  the actual waiting gate without exposing document content or personal metadata.
- This profile compiles MainView interaction, document shortcuts, native gestures
  and pen input off independently of external-host loading; its picker is locked.
- Claim a process-wide singleton flag before any creation. Never retry creation
  in that process, even if a later step fails.
- Remember the current document/page in memory. Create exactly two new notebooks
  using native `LibraryController.createDocument`, with names beginning
  **Companion test Reference** and **Companion test Notes**, under the native
  explorer's root folder. Apply existing stock grid/lines templates through
  `DocumentController.setTemplateForPage`. These are ordinary test notebooks and
  may follow normal cloud sync; they contain no personal source material.
- Open the first through stock MainView and the second through the Companion
  native adapter. Require distinct document IDs and SceneControllers.
- Programmatically translate the margin in ten steps, require unchanged native
  viewport dimensions, change focus, verify both pen gates remain false, and
  capture only the two native viewport subtrees, never the whole MainView. Both
  asynchronous callbacks recheck generation, safe state, document IDs, view and
  viewport identity before saving. Failure/restore cancels pending callbacks.
  The two images stay in the transaction's private data directory; no screen
  broadcast or server upload.
- Tuck/reopen without recreating the native view, then close the companion and
  return to the exact prior native document/page (or library if none was open).
- Only report the machine sequence complete after the return is ready and the
  capture saved. Errors stop the diagnostic and attempt the same native return.

The compiled pen gate is false even before the host exists. No drawing, erasing, text
insertion, native-file serialization or deletion is performed. Test notebooks
are retained for inspection, not silently removed. If xochitl crashes before the
in-memory restoration, recovery can return to a test notebook rather than the
prior view; that is a failed diagnostic, never original-view acceptance.

## Controller differences

The original base and load-only controller are unchanged. The rendering derivative
retains exact prepared-tree checks, independent watchdog, durable restart budget,
foreign-policy refusal and private preimages. Its owner window is 180 seconds,
watchdog per-invocation ceiling 420 seconds, and two-start systemd budget unchanged.
A temporary 1-GiB xochitl cgroup limit is applied and verified before restarting;
the accepted base's unlimited policy returns when the diagnostic drop-in is removed.
Observed pretrial memory: ~439 MiB base RSS, ~1.3 GiB available on a 2-GiB device.
The completion wait rechecks independent-watchdog liveness on every iteration
and again immediately before its success receipt.

Follow the [load probe's](LOAD-PROBE.md) strict-key staging, independently verified
Mac backup and watched operator sequence, using this derivative's frozen review
and profile. Require its distinct `rendering-machine-passed` and automatic
`recovered=base:<PID>` receipts. Inspect the private capture before claiming native
pixels are correct. A marker alone cannot prove the image is meaningful.

Neither programmed drag nor a capture measures touch-to-e-ink latency or validates
real pen routing/save durability. Those remain separate gates before writing can
be enabled or the app can join normal reinstalls.
