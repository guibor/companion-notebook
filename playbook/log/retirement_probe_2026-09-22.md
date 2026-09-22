# Native retirement diagnostic — 2026-09-22

## Standalone target module import

Exact Ferrari fingerprint and firmware3.29.0.148/build20260911125116 matched.
All eleven accepted base QMDs and three service policy hashes matched; root was
read-only. The existing UI60746 and Dates14463 processes were still running.

The three-file private observer capsule was uploaded to
`/home/root/.codex-staging/companion-observer-20260922T051404Z-1`.
Its complete manifest hash was
`d11446a2c3c96958bb545bda4d676f7515fca95a27c5e321444cbfac33f93626`.
Modes, canonical paths, ownership, exact runtime hashes and loader were checked.
BusyBox rejected the initial GNU timeout syntax before starting the helper.
The corrected `timeout -s KILL 10` invocation, with core dumps disabled and a
512MiB address-space cap, returned `OBSERVER_SMOKE_PASS`/exit0. Both service
PIDs and zero restart counts remained unchanged. This proves module import and
the fake-object smoke sequence, not real native pen retirement.

Target `/lib` resolves to `/usr/lib`. Narrow independent review verified that
changing exactly the two libc/libgcc path literals produced controller
`8f14f9253d2a5ea43f23d9e53b87cab3dbe236d45547cf7d5442163587a98dfd`;
reversing those substitutions reproduced the prior reviewed controller hash.
The strict canonical-path/content checks were preserved.

## First UI trial: stopped before scripted input

Transaction: `20260922T171005Z-1`.

- Stage manifest: `4900308439bba6b2d444147eeefc5670b2a0bd11223a0620345f6821f3782015`.
- Verified Mac rollback archive: `f4c77d86ef9ad7c153de863c17d0eac150d0559424f1b432e61b342ca4d2f66a`.
- Temporary candidate UI:70347. Host ready17:12:49; two labelled notes created
  at17:12:53; round-one gate opened17:12:57.
- At17:13:04 the callback failed `native stroke mapping mismatch pane=1`.
- `pen-injection-started`, `pen-release-verified` and `pen-release-round1` were
  absent. The owner journal contains no helper draw invocation; it was still in
  its initial stability observation. No handler retirement or movement ran.
- Independent watchdog restored `base:71641`; Dates remained14463. Both had zero
  restarts. All11QMDs,10settings and3policies matched. Root remained read-only;
  candidate host/data/drop-in/lock were absent and both trial units had no process.

Only the two exact new disposable notebooks were read back:

| Pane | Document | Page |
| --- | --- | --- |
| Reference | `59062f9f-8de6-4980-a641-9f6d7e155b03` | `d1509e97-e373-4429-939a-014b101905a2` |
| Notes | `a397adc9-165f-4cb2-9e7a-dfac1d15154e` | `d09ecad1-e039-42b8-b611-352d07e397c2` |

Both pages were424bytes with identical SHA
`0404ac1a036b27bac5ab6402bbcdfae6ed85e989fe99e66bd0e06dc8ba8fdb1d` and zero
`SceneLineItemBlock` objects. Parser warnings concern newer metadata extensions;
no `UnreadableBlock` was found. The primary-page save log does not establish
misdirected ink. Neither physical-user input nor a native callback defect is
proven. The first trial's one-run clearance is consumed.

## Local follow-up, not a release

Independent source analysis found no concrete factory lexical-ownership bug.
An original two-instance desktop QML fixture exercises controller/tool sentinels,
inner handler IDs, caller decoys, foreign parents and separate recreation. Its
six scenarios plus setup/cleanup pass; this is not exact-firmware qualification.

The revised diagnostic adds pre-controller owner/handler/bounds validation and
numeric receipts, then consumes an immutable scalar snapshot after submission.
Its unchanged25stable-PID/watchdog checks run after all four submissions, with
future input closed. Ready-gate monitoring begins immediately, reducing the
unmonitored writable window without claiming exclusive event provenance.
Recovery/release bodies, helper binaries and deadlines stay unchanged.
A fresh frozen-artifact review and fresh backup are required before another run.

## Revised native sequence and automatic restoration

Transaction `20260922T173005Z-1` used independently reviewed v2 bytes:
manifest `fd48adc1d72a97bffdad3705ef5fcee25638a03c0295f09dafa4857ed2daf4ec`,
controller `2fe7bdbaa4a7e9ad6b80ef417b02c3790d67be45fa9728267f6e60bac83177e4`,
Mac backup `66631b395a941b6b04346fe6bbe6a5209526d46d0f05d63f4bee29b1abd0cc4e`.

Candidate UI74106 accepted two31-point strokes, retired both native handlers,
moved the actual sheet through12 positions from1080 to1320 reveal, recreated
handlers and accepted two further31-point strokes. All four pre-controller
receipts identified the correct view, controller and handler. Movement's523ms
event-loop measurement does not establish physical e-ink smoothness.
Both helper rounds recorded balanced pen release. The QML sequence completed
at17:33:08UTC without a diagnostic failure.

The overall owner **did not** publish `retirement-submission-machine-passed`.
The independent watchdog reached its deadline during the final stability loop,
terminated the owner cgroup and restored `base:76210`. Do not turn a successful
QML sequence into a successful whole-controller receipt. Dates remained14463;
both services reported zero restarts. All11QMDs,10settings and3policies matched,
root remained read-only, all active Companion paths/lock were absent, and both
trial units had no process. The review clearance is consumed; staging is blocked.

Readback is restricted to these two newly created notes:

| Pane | Document | Page |
| --- | --- | --- |
| Reference | `9baaab38-b382-4f8c-9871-2932c2afe4ca` | `eefe9ee2-0396-4688-b7f7-8328e186007d` |
| Notes | `3ded6fc6-4f79-401e-99ec-dae6a934ae4a` | `59506a8a-b6fe-4d3c-8d91-acc427d5fac4` |

Each saved1222-byte page contains two24-point lines. The initial verifier rejected
its pre-controller-versus-saved bounding-box comparison: every stored centerline
is inset by exactly3 units on each edge relative to the native pre-controller
rectangle. No tolerance was widened. The precise native bounding-box semantics
must be established before a persistence-pass claim. These are not personal
documents and native reopen/visual clipping remain unverified.

### Saved-shape verification: passed after the semantic correction

Independent exact-binary review traced the native Line boundingRect getter:
metaproperty6 at0xd03264 reaches0xd039c0, which scans14-byte point records and
expands their point AABB. Tool15 selects factor2 at0xd03b00; the padding is
`(float(thickness) * 2 + 2) / 2`. It is a conservative padded rectangle, not an
exact brush hull. Thickness2 gives exactly3 units on every edge. The earlier
fixed-layout test used thickness1, giving2 units; pre/post-dispatch timing did
not cause that difference. The earlier and v2 round-one centerline coordinates
match exactly in both panes.

The verifier now reconstructs this native rectangle only for qualified tool15
and thickness1/2. It retains its existing5-unit tolerance and rejects other
tools/thicknesses. All four reconstructed rectangles match the native receipts
exactly; every stored line has24points, maximum straight-line deviation below
1.04 units, and a one-to-one match to its own pane/round. No missing, duplicate
or foreign line is present in these two files.

- Reference `.rm` SHA: `53b159e7885d54de600519e5dd5d8cc033cc92d3c693122c6c0552721359f342`.
- Notes `.rm` SHA: `2c5fbc3ef4b77aa594fe00f8e2d9d7d355ee196ca0b2c92b3fdb6e0d9a989c44`.
- Parser reports111 extra SceneInfo metadata bytes per page, but no unreadable
  blocks. That metadata remains explicitly unparsed.
- Fourteen synthetic-file regressions and both real fixed-layout/retirement
  saved-shape verifications pass. The missing overall controller-pass marker,
  native reopen, visual clipping and release qualification remain separate.

## Final current state and further work boundary

A subsequent strict-key read-only connection again found baseUI76210/Dates14463,
zero restarts, all11QMDs/10settings/3policies matching, read-only root and no active
Companion host/data/lock or trial process. Move was untouched.

The additional public-Qt/native admission audit is recorded in
`../ADMISSION-HANDOFF.md`. It finds a useful worker acknowledgement but no complete
seamless producer-closure protocol in the inspected public paths. This is not a
universal impossibility claim. No unsupported input hook was installed.

A separate pen-disabled reopen/pixel-read capsule was implemented locally, with
exact disposable UUID/page/label checks and pre/post fresh-heartbeat guards around
one read-only spy-buffer copy. It has16 local regressions and3x29 resource
composition passes, but no staging clearance and no target execution or pixels.
Current full suites:173 Node passes,7 skipped;58 Qt passes;14 saved-file passes.
The exact v2 QMD/host hashes remain unchanged when rebuilt after adding that
    separate profile. Ordinary user ink remains disabled; this is not an installer.
