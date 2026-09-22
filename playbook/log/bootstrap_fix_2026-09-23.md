# Process-scoped admission loading — 2026-09-23 Israel time

## Outcome and boundary

The combined preload's child-process Qt dependency leak is fixed and reproduced
by a passing positive/negative target regression. This is **not** a working
Companion release or proof that the entire native startup now succeeds.

This session did not restart the normal Pro interface, open notebooks, access
input/display devices, run a native security helper, or change firmware, boot,
partitions, normal service policies or settings. Move was untouched. The only
device writes were private `/tmp` test capsules/results and a short-lived,
bounded test unit. There is no permanent installation.

## Recovered exact failure path

The existing Memfault report from the consumed trial was retrieved read-only:
`/home/root/.memfault/mar/117dc985-1ca1-4c47-bb67-53139b6a1ebc/stacktrace.json.gz`.
Report time: `2026-09-22T22:13:02.695998601Z`. Native build ID
`46e5f0239bfe584a8d4eeed4c23f0ad4a8d48aa5` matches the exact cached executable.
The retained archive hash is
`7d7433ff4d5fe45d17286e673a8bae4482a4b4059f9286c3b155925fb7102490`.
It contains stacks/addresses/build IDs, not a captured helper stdout stream.

`SIGABRT` reaches `stoi` at native offset `0x4ae1cf` with caller `0x6e0803`.
Disassembly identifies the pincode-setup coroutine parsing a QProcess helper's
stdout for `query current`. The numeric conversion at `0x6e0800` invokes the
helper beginning `0x4ae120`; its invalid-argument branch is at `0x4ae1ac`.
The QProcess completion reader is `0x6e91f0`.

The old admission DSO has Qt dependencies and was inherited through LD_PRELOAD.
Cached XOVI/message-broker source uses Qt symbol availability to admit GUI
extensions. Its pipe setup both recreates shared FIFOs and emits stdout messages.
Thus extra Qt in a non-Qt helper can activate inappropriate extensions and pollute
its protocol. The fake-child negative control **proves Qt inheritance**, while
the exact bad native helper stdout and contribution of each extension remain
unobserved. Do not upgrade this distinction into a fully proven causal chain.
No real XOVI extensions were run in the fake regression: doing so could disturb
the active UI's shared broker FIFOs.

## Implemented fix

- Qt-free bootstrap, linked with the C driver and only libc/libdl dependencies.
- Canonical target allowlist: `/usr/bin/xochitl`, or the adjacent hash-pinned
  standalone `admission-smoke` which is never shipped in the UI runtime.
- Foreign constructors silently return without Qt resolution or core loading.
- Exact public Qt empty-tag ABI; lazy original forwarding covers earlier loader
  constructors, and release/acquire publication protects extension threads.
- Canonical, resident LOCAL/NOW/NODELETE core, with a versioned observation bridge.
  The core no longer exports the interposer; QML shares the same loaded registry.
- PID check prevents a forked child from entering the parent's observation state.
- Direct native ExecStart and kernel executable identity remain unchanged.

Independent ReManager review covered these sources, exact ELF dependencies and
the standalone runner. It did not grant another UI-trial clearance.

## Exact successful standalone target audit

Capsule `20260923-4`, isolated from XOVI. Target: strict-key Ferrari Pro,
firmware `3.29.0.148`, native binary SHA
`4f433281c71a29d07921665b4724420735f3c88aceb431067f3a432b3f89f6a4`.

| Artifact | SHA-256 |
| --- | --- |
| Capsule manifest | `8eb03ec46357e112e0616950cbb515de46c0634c06f97a78f4a4aefc3c8f277c` |
| Bootstrap | `113f6b72899225ff062d21cf3db28e2e8ec5b716a79d49f0987ae914d2d55a39` |
| Resident core | `e4b3d8550654409dc06703b95fc5c59ed2c98c09aa37207275c35c29bb6dd89f` |
| Fake-worker smoke | `63dbe2b6882974a8a5a1af75ea4f531f16a02ec806ef633c41a49737205965a5` |
| Non-Qt child | `37a4d50d013f0368457ac4ae87d034b8eebe09874769dfc02a690dbddb0f0794` |
| Separate candidate controller | `8c4bf787d371661d5a772bdaa23416ab547c49f52b27075604928a8a4cfae29c` |

The dedicated transient unit had Type=exec, KillMode=control-group, Restart=no,
RuntimeMaxSec=45, TimeoutStopSec=2, SendSIGKILL=yes, FinalKillSignal=SIGKILL and
MemoryMax=256MiB. Each fake process also had an external eight-second timeout
with a two-second kill fallback. This bounds pre-main loading and descendants,
not just the alarm installed by test `main()`.

All four checks passed:

1. Non-Qt helper inherited the exact bootstrap mapping/environment, no Qt/core,
   stdout exactly `6\n`, stderr empty.
2. Same helper remained unaffected beside a directory with no core to load.
3. Old combined preload was rejected for the exact semantic failure "inherited
   Qt or admission module", not merely a nonzero return code.
4. Full fake-worker smoke preserved native executable identity, bound the exact
   public hook, shared the resident QML registry, and completed cold discovery,
   queued worker roundtrip, FIFO park and fresh-candidate release.

The job exited0/success in1.992s, peak memory10MiB. Independent postcheck showed
the test cgroup absent, unit inactive/not-found/MainPID0, UI79742/Dates14463 active
with NRestarts0, no Companion mappings in the normal UI, all protected settings
hashes unchanged and root `ro,relatime`.

The first executed capsule `-3` passed the same four semantic checks, but its
overall result was failure because an env-i locale-C warning violated the strict
empty-stderr requirement. The final runner explicitly uses the native UI's
verified `LANG=en_US.UTF-8`; no warning filter or assertion relaxation was added.
That earlier process group also exited fully with the normal services unchanged.
Capsules `-1`/`-2` were local preparations only; initial copy commands were rejected
before uploading payloads because the target lacks `install` and rejects scp `.`.

## Local verification and remaining work

189 Node tests passed; seven historical-clearance tests remain intentionally
skipped. The Qt admission CTest suite passed. Cross-ELF dependency/import/export
checks and `git diff --check` passed. Five new Node cases verify unchanged recovery
bodies, real service-policy rendering, complete two-module inventories/mappings,
actual Qt-free ELF dependencies and standalone bounds.

The new controller writes `build/admission-bootstrap-native`, separately from
the consumed historical controller. Its bootstrap/core/qmldir are independently
pinned; preparation, health and cleanup cover both modules. Base and stock health
reject both modules. No native ExecStart or finite restart budget is relaxed.
No stager accepts the new candidate yet, and `ops/stage-admission.mjs` still
refuses the consumed trial before any stage writes.

ReManager's independent final local-integration review also passed for controller
`8c4bf787d371661d5a772bdaa23416ab547c49f52b27075604928a8a4cfae29c`:
ten-entry payload inventory, unchanged host/QMD/composition, complete cleanup,
exact final-path mapping checks, and unchanged recovery/release/cgroup/base-policy
bodies. This review did not authorize another UI run.

Next: obtain physical normal-input recovery confirmation, independently review a
fresh bounded native-UI capsule, then qualify real producer/worker admission and
visual occlusion on disposable notes. Ordinary-host lifecycle/gesture integration,
personal-notebook release and persistent installation remain open. Do not replay
the failed capsule or put this feature in recurring reinstalls.
