# Display-sleep trials:110500 FAILED, corrected152000 PASSED; base recovered

## Corrected single-use152000 result (15:09-15:10 UTC)

The separately reviewed capsule20260923T152000Z-1 passed on native UI126884.
Actual sleep requested15:09:10.037, owned-park/detached/DeepSleep15:09:12.574
(2537ms), Normal/fresh primary15:09:13.166, original paired pages restored
15:09:14.407, tuck/reveal/cancel15:09:15.936, final native completion15:09:25.836.
The helper attempted exactly one balanced power-key batch and verified UP.
Independent normal recovery verified baseUI129176/Dates14463, zero restarts,
exact base/settings/policies, root-ro, no experimental host/data/drop/lock or
owner/watch cgroups. Current read-only reconfirmation also matches129176/14463.

Strict saved-file verification passed all four correctly attributed stroke shapes
(31 native samples simplified to24 saved per shape). Each file's111-byte unparsed
SceneInfo extension is reported. No CPU suspend or in-flight sleep is inferred.
`releaseQualified=false`. Receipt files are local-only under
`build/receipts/20260923T152000Z-1/`. This clearance is consumed; never replay.

- Manifest:80e1191513e4d10df3066f4c13fdcaa5b25514476f23b1c4177f1952163bb754
- Controller:d9303e24d70a99e592b07edb2043d352ecb824594d322cc55271bf5e62ba3acf
- Wake helper:0d90c6b4d6f8ef024ac8d42c9cae369c5b34a2771f7f922d325fe34b5365681c
- Host:3edad6748bcedbbc27efc520055252f11eb83967caf839971c301eaca16f43f3
- QMD:4d99c25b02bc419907974aa34676be18790efcea7f370e376c8ab31d7aa7b223
- Reference44dc6f22-834b-4420-9031-03709114e18f,
  page7214fd21-c35e-4eaa-8d2c-8e5b619b5abe,
  RM53b159e7885d54de600519e5dd5d8cc033cc92d3c693122c6c0552721359f342
- Notes18d0ae0d-52d0-4444-bfdd-9deb703cb204,
  page1f24af9c-b290-4f69-b07e-b599dcc75393,
  RM4ec4156e42b98dcb31a15edbe34213fa72a4c05db84954ffbe158fa6775c0114

The next diagnostic is separate: actual sleep must be requested during the fourth
fixed synthetic stroke, before its writer emits UP. Ordinary availability handling
must retain old ownership through submission, then park/detach before the same
bounded wake. No broad identity/readiness bypass, manual unpark or deadline extension.

## Verified outcome after connectivity returned (14:58-15:01 UTC)

Strict-key Wi-Fi SSH to10.100.102.101 returned. Exact controller-prefix read-only
checks verified Ferrari/3.29.0.148/binaries/root-ro, all11 base QMDs and extensions,
launch policy, runtime UI112106, unchanged Dates14463, every protected settings
hash, no competing owner, no Companion host/data/drop/lock or owner/watch cgroups.
`recovered=base:112106`, `recovering=owner-ended`; owner failed/PID0, watchdog
inactive/success/PID0. No manual-intervention marker. No recovery command,
restart or injected key was needed in this reconnection session.

The test's four native submissions occurred, then requested sleep at
11:08:20.347. Actual DeepSleep/owned-park/detachment receipt followed at
11:08:22.421 (2074ms). The helper log contains only readiness: no
`wake-batch-attempted`. Its1900ms monotonic freshness bound had already expired.
At11:08:25.444 QML reported `display wake deadline missed`; no success marker.
The diagnostic log and recovery receipts are copied into the private local
`build/receipts/20260923T110500Z-1/` directory. Do not relabel this failure as a pass.

The local proposed correction allows2900ms monotonic/3000ms wall freshness,
still from the original pre-request marker. Independent3s-monotonic/4s-wall
recovery and the5s QML deadline stay unchanged, as does the stock12s sleep timer.
Delayed-receipt and too-late/no-write tests are required before fresh independent
review of another one-use capsule. Frozen110500 remains untouched.

Watchdog chronology is independently evidenced by marker mtimes: first request
observation11:08:21.063810742; owner abort11:08:22.987786143; recovering/owner-ended
11:08:23.323781847; base-start-attempted11:08:26.915735922; recovered11:08:30.787686418.
Recovery therefore began2.977s after the request, before the short watchdog
deadline. The later QML failure occurred while recovery was checking hashes,
before the normal UI restart at11:08:27. No claim that the short deadline fired.
Review additionally requires a final pre-write clock reread, so time spent in
log/process/key checks or marker flushing cannot permit a late power-key write.

## Historical connectivity boundary (resolved by the verification above)

The owner launch succeeded, but the first observation SSH session subsequently
timed out. A fresh SSH connection and ping also timed out. A read-only TCP22 scan
of the current10.100.102.0/24 subnet found only the previously known non-Pro host
at.2; no authentication was attempted there. The Pro MAC24:fd:fa:0b:dd:41 remains
cached at.101. Mac is.107 on en0 and has no USB IPv4 route. These observations do
not prove whether sleep was entered, the key helper ran, or recovery completed.

Do not claim a pass, normal runtime, current PID, or everyday installation.
Do not replay, send more keys, reboot, or activate another candidate. On restored
connectivity, first read this trial's markers/log and independently verify base,
settings, policies, absence of Companion/owner cgroups, and native saved files.
If the tablet's normal interaction was disturbed, obtain user-confirmed recovery
before continuing with another experiment.

## Exact single-use attempt

- Trial `20260923T110500Z-1`; local frozen stage `build/probe-20260923T110500Z-1`.
- Manifest `15226549450f1f7dbd9171390642b7fa13f4e4ef62e3abb5e55815b027320770`.
- Controller `1a6f70ea41abb6d4ff0b6e7c335e968c4b75eaf4b8344b973885759827779a66`.
- Wake helper `6403628e6e3edaddd0de8ab9e5a14dee21c6bf3c9769796398846c08a7cca56e`.
- NativeHost `3edad6748bcedbbc27efc520055252f11eb83967caf839971c301eaca16f43f3`.
- QMD `4d99c25b02bc419907974aa34676be18790efcea7f370e376c8ab31d7aa7b223`.
- Mac-verified backup `3c79385aaa2d737bcd1a6d148ff2758cb34f280c51cd7148ea88c30ecfe0616a`,
  private `build/receipts/20260923T110500Z-1/preimages.tgz`; all19 expected paths.
- Owner `companion-probe-20260923T110500Z-1.service`, invocation
  `1d516c0e0bad4f58b70fa575b3e20e91`.
- Watcher `companion-watch-20260923T110500Z-1.service`.
- Tablet evidence root `/home/root/.codex-backups/companion-20260923T110500Z-1`.
- Last confirmed normal state BEFORE activation: UI106973/Dates14463, zero
  restarts, exact base/settings/policies, root read-only. This is historical now.

ReManager independently reviewed the exact four new artifact hashes and shared
baseline files and cleared one bounded always-restoring DISPLAY-sleep attempt,
conditional on fresh live and backup checks. Stager clearance was consumed.
Initial preparation refused the Mac UID/GID preserved by tar. Only this new
private stage's ownership was corrected to0:0 after exact hashes/no-links checks;
then all prepare gates passed. Future uploads should use `tar --no-same-owner`.
No payload bytes changed. The Mac backup verification preceded the owner launch.

## Scope and safeguards

The diagnostic creates only two native labelled disposable notes, uses the same
four known input strokes and ordinary fixed-size controls, then requests actual
display sleep only under an already-owned native park with detached inputs.
It must observe DeepSleep, Normal, visible fresh primary publication and restored
paired page IDs. No CPU suspend, mid-stroke sleep or physical acceptance is claimed.

The power-key helper is pre-opened and identity-checked before any injected ink,
with at least3 seconds awake settling. It sends at most one balanced key batch,
not a userspace-held press. Partial/error is failure with UP-only cleanup. The
watchdog can perform UP-only cleanup only after the owner cgroup is dead, and it
writes nothing if the key is already up. No RTC, fake wake reason, power policy,
firmware, boot, root-partition, Move, or personal-notebook file changes.

A request marker is emitted BEFORE the native sleep call. The key helper requires
that original epoch within2 seconds and a1.9-second monotonic first-observation
bound; it does not retry or inject late. The independent watchdog begins recovery
at wall-age4 seconds or3 seconds from its first monotonic observation even if the
GUI stalls before the sleeping receipt. The additional QML wake deadline is5 seconds.
These are tested bounded software paths, not guaranteed hard-real-time recovery.

## Local verification

-398 Node tests pass;7 historical skips.
-69 Qt tests pass for the current normal host/visibility handling.
-33 saved-file verifier fixtures pass, including display-sleep receipt ordering.
-Normal and sleep profiles compose33 resources in each of3 extension orders.
-Production C helper exercised with intercepted device/process/time calls:
  balanced/partial/error writes, stale/NaN/error receipts, changed PID, no sleeping
  receipt, backward wall clock, wrong device/down key, and UP-only recovery.
-Independent shell deadline test includes a stalled GUI with no sleeping receipt
  and backward-clock fallback. No device is accessed by these tests.

## Historical next check (completed above)

Connect strictly with the known Pro SSH key/fingerprint. Read `recovered`,
`recovering`, `manual-intervention-required`, `sleep-submission-machine-passed`,
`wake.log` and the filtered `probe.log`; check owner/watch/UI/Dates service state.
Do not infer a native pass from a helper's balanced-batch marker. If recovery is
verified, copy only the exact newly created disposable IDs for saved-file review.
There is no authorization here to repeat this consumed capsule.
