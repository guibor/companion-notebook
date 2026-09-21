# Rendering trials — 2026-09-21

## Trial 1: readiness timeout; automatic base recovery passed

- Source `b7da093`, transaction `20260921T202529Z-1`.
- Frozen reviewed artifacts: [review receipt](render_review_2026-09-21.md).
- Stage manifest `6a2fec745db72c8da62267ed8f865f9cab2f718421fe79bd563256ee08efd3d6`.
- Preimages SHA-256 (device and Mac):
  `06cc88b12b8c2b351b5a5a29ad7078f1e214c59210adbeefd55f93da68520fcb`.
- Private log SHA-256 (device and Mac):
  `6bb973b5ee8b0a7ed2c0f8096df33981800dc30f8d7ab890bb796aa705d17c0b`.
- Private evidence under device `.codex-backups/companion-20260921T202529Z-1`
  and ignored Mac `build/recovery-20260921T202529Z-1/` (0700/0600).

Fresh public key/model/serial/firmware/stock hashes matched Ferrari 3.29.0.148.
Pretrial UI22703 and Dates14463 were active with zero restarts. Trial UI25115
loaded twelve external QMDs and reported host ready, ink=false, settings=true at
20:27:07 UTC. No created-test-ID or capture-success marker appeared. At 20:28:46
the native driver reported its bounded timeout while still waiting for readiness.
The controller had not completed its success sequence; its independent deadline
watchdog terminated the owner and restored the accepted base. No rendering pass.

Postchecks: `recovering=deadline`, `recovered=base:28522`; no stock fallback or
manual-intervention marker. Watchdog exited successfully; owner was terminated
by the watchdog (signal), not a passed owner. UI28522 and Dates14463 active with
zero restarts, Dates PID unchanged. All eleven QMDs and protected private-setting
hashes passed. Exact original three service-policy hashes restored; MemoryMax
back to infinity. Probe drop-in, host/data and lock absent; root read-only.
Only an empty pairing store remained in the trial's archived settings directory.

## Readiness correction prepared locally

Exact stock source shows an empty retained DocumentView can report `isLoading`
because its SceneView is not active. The old predicate blocked that placeholder.
This is a source-confirmed predicate bug, but the first trial did not log which
readiness gate was false, so it is not a confirmed diagnosis of that timeout.

The correction allows a document-less placeholder, retains all other gates and
logs only a readiness reason label when it changes. It tests null/placeholder/
actual-loading primary states, each other guard and native return to library.
53 Node and 29 Qt tests pass; normal and render composition each pass three
orders with 29 resources. ReManager independently approved the narrow delta,
including exhaustive readiness combinations and retained input/capture/recovery
guards. Revised frozen artifacts under `build/render-native/`:

- Controller: `97ef1cdd466f4c7f6778ef726509c4f2b3d0baa9a20fc0761dc709d7673decd8` (unchanged).
- QMD: `be29e8ce0ba1babc6c69c53dbbd983c2f708a14f370a91269810abc883a1ab34`.
- Host: `b955ee4c844b06c0289d327773fbfb389cc7af5fe262d1c4f4b4af7cc093a3a6`.
- Pair store: `44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19` (unchanged).

Use a fresh transaction/backup; the first trial is never modified or reused.
