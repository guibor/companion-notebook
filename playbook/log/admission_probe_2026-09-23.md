# Native admission startup trial — 2026-09-23 Israel time

## Outcome

**Failed before Companion startup; accepted Pro setup restored. Not a release.**

The user requested completion on the existing `beta/pro/3.29.0.148` branch.
Fixed sizes remain the accepted interaction: tap ⅓, ½ or ⅔; no dragging or
activation tap. This experiment attempted to qualify the native input handoff
needed for those discrete changes, not install a pen-disabled UI as a product.

## Implemented locally

- `native-admission/`: public Qt self-move observation of the cold native worker,
  real worker/UI roundtrip, producer-region seal and queued worker park, explicit
  detach/cache-empty/final-candidate publication, generation/lifetime checks.
- `native/admission-probe.qml.inc`: separate disposable-only native profile;
  request during the second stroke, preserve state until drained, change ½ to
  ⅔ while parked, require fresh candidates, then attempt two more strokes.
- `ops/build-admission-cross.mjs`: exact-target ELF dependency/symbol validation
  and standalone fake-object smoke; no deployment behavior.
- `ops/build-admission-controller.mjs`: always-reverting controller derived from
  frozen retirement bytes, independent watchdog and bounded restart/recovery.
- `ops/verify-disposable-ink.py`: admission-specific ordered receipts and strict
  saved-shape verification. It cannot qualify this trial's empty startup log.

Ordinary-host `inkQualified` stays false. Contact quarantine, ordinary document
lifecycle integration, visual occlusion and release acceptance are still open.

## Tests before the trial

- 24 Qt admission cases, including 11 isolated fail-closed subprocess scenarios
  and 100 immediate-release races; independent ASan/UBSan run also passed.
- Six initial Node admission-profile regressions; three-order composition across
  30 resources passed. Historical retirement artifacts remained byte-identical.
- 23 synthetic saved-file verifier tests passed using pinned `rmscene==0.8.0`.
- Actual standalone Pro smoke passed with the exact module below: ELF binding,
  one shared preload/QML registry and fake-worker cache-sensitive state machine.
  UI76210/Dates14463 and zero restart counts stayed unchanged. This did not run
  native document input or qualify loading alongside the native application.

## Exact consumed trial

Transaction: `20260922T221000Z-1` (UTC identifier; September23 locally).

| Artifact | SHA-256 |
| --- | --- |
| Stage manifest | `430f4f0192f33ada3342f917267689b53f74ce46ee65cc9b7ce4de66100d5d0a` |
| Controller | `23a46e5b4ccf8e08e73bcc6e986e595f43207bd62fcc3dfb9f568d20bd195007` |
| Host | `cfc2a10e574448c6c8023ba62f90b673bdda046c7ebf0c123b5e27ffe8c41a01` |
| QMD | `85b83993815296ee8776a37681cfd6ec04e65bd93695af9aa06b2ec30764dae3` |
| Admission module | `0c3cdbd017cc62dee4f1d98a2e7049f582da8719b93c6d7b010668b8c3329659` |
| Standalone smoke | `5ad5cccc7a1314b21c0fc3701ba5fe20fa880b60ef094d32ae6979d84433be51` |
| Verified Mac preimages archive | `86259b45f4cf318f198826cf5c2d57d109139b1493b03dbff87f1ee9cae2f520` |

Target was the strict-key Ferrari Pro, firmware3.29.0.148. Fresh exact base,
service policy, settings, runtime-library and backup gates passed. Root remained
read-only. The trial installed only its temporary runtime and `/run` policy;
there were no firmware, boot, partition or Move changes.

Candidate UI79310 processed the QRR patches, then logged framebuffer image
construction and terminated:

```text
terminate called after throwing an instance of 'std::invalid_argument'
  what():  stoi
```

There is no Companion host-ready, cold-worker roundtrip, disposable-ID creation,
admission transaction, scripted input or completion receipt. The diagnostic did
not reach its native-writing sequence. Do not manufacture a persistence result
or infer a notebook identity from earlier trials.

## Verified recovery

The independent watchdog terminated the candidate and restored `base:79742`.
The owner exited1; watchdog recovery completed successfully. A fresh read-only
connection ran `verify_device`, `verify_base_files`, `verify_policy base`,
`healthy base` and the protected-settings hash check, not merely a marker read.
A later repetition again printed:

```text
RESTORED_BASE_VERIFIED ui=79742 dates=14463
base:79742
xochitl.service: active, Result=success, MainPID=79742, NRestarts=0
notebook-date-index.service: active, Result=success, MainPID=14463, NRestarts=0
```

All protected base files/settings/policies matched. Companion host/data/lock and
temporary drop-in were absent, there was no manual-intervention marker, and root
was read-only. Dates was never restarted. A trailing optional filename-listing
command failed because BusyBox lacks `find -printf`; it ran after all verification
checks and did not alter their result or device state.

Local ignored evidence: `build/receipts/20260922T221000Z-1/{probe.log,preimages.tgz}`.
Private retained device evidence is under
`/home/root/.codex-backups/companion-20260922T221000Z-1`.
Do not commit notebook data, credentials, proprietary firmware or backup contents.

## Bounded local investigation and next boundary

The sidecar has no `stoi`, numeric configuration parsing or environment writes;
its exact ELF imports no `strtol`/invalid-argument throw helper. This does not
exonerate a preload/load-order/ABI interaction. Cached extension source similarly
did not establish a throw source. The last framebuffer log precedes a forwarded
constructor, so log proximity alone is not attribution.

The cached native binary contains two inspected invalid-argument uses of the
shared `stoi` text: one in a pincode-policy parser, another in regex-related code.
Neither is a proven crash site without a stack trace. No security configuration
was changed and no recovery hypothesis was deployed. Existing ordinary UI health
after restoration does not replace physical writing/scrolling confirmation.

`ops/stage-admission.mjs` now refuses unconditionally before reading evidence or
creating a stage. A seventh Node regression checks both the consumed identifier
and a fresh-looking identifier in an empty temporary directory. This records the
failure without silently issuing new trial authority.

Final local rerun: 184 Node tests passed, seven historical-clearance tests
intentionally skipped, zero failures; the admission Qt CTest target passed;
23 synthetic saved-file tests passed; `git diff --check` passed. These local
results do not change the failed hardware outcome.

Continue local startup-cause isolation first. A later tablet experiment requires
normal-input recovery confirmation plus fresh review of a bounded changed
payload. Do not replay this stage, enable ordinary writing, or include Companion
in recurring reinstalls. No working Companion installation is being claimed.

## Subsequent diagnosis

A later read-only Memfault retrieval established the numeric-helper stdout parser
as the exact crash path. The combined preload's child dependency leak was then
reproduced safely with a fake non-Qt program, and the new Qt-free bootstrap passed
the isolated target regression without restarting the UI. See
[the separate fix receipt](bootstrap_fix_2026-09-23.md). This does not change the
failed trial's outcome or renew its consumed clearance.
