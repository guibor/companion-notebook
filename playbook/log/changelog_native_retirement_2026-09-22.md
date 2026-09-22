# Native retirement continuation — 2026-09-22

The user asked us to continue instead of stopping at the earlier risk assessment.
The fixed-layout native ink run `20260922T043500Z-1` succeeded first: both panes
accepted native strokes without selection taps; exact saved test files contained
the expected shapes after automatic base restoration. See its separate receipt.

Continued implementation after that success:

- Public-Qt observer module, independently reviewed with35passing C++ cases.
- Negative desktop lifetime regression: Component notification precedes native
  destruction; do not treat that notification as worker retirement.
- ARM64 Linux plugin and standalone5s import test built against actual target
  libraries; static ELF review resolved67plugin/66smoke required symbols.
- A separate disposable-only dynamic handler factory/retirement/movement profile,
  with9local state-machine/controller tests and3×30full-stack QML compositions.
- Two distinct fixed stroke pairs and an11-test saved-file verifier that checks
  all four shapes independently of CRDT serialization order.
- Frozen successful ink QMD/host/controller hashes remain unchanged.
-50Qt UI regression tests pass; the final full Node run has152passing,
  7intentionally skipped consumed-clearance tests, and no failures. This includes
  14isolated staging tests for exact payload pins, manifest/modes and refusal of
  missing, mismatched or process-changing synthetic smoke evidence.

The normal base was last observed at UI60746 / Dates14463, NRestarts0. No new UI
trial or native module has been deployed. During local work the Pro stopped
responding at10.100.102.101; USB10.11.99.1 was also unavailable. An unauthenticated
current-subnet TCP scan found only10.100.102.2, whose public key is not the Pro's.
No credentials were sent to that host. A nonblocking wake request was sent.

Standalone local capsule `build/observer-preflight-20260922T051404Z-1` is prepared,
not uploaded or executed. Its manifest hash is
`d11446a2c3c96958bb545bda4d676f7515fca95a27c5e321444cbfac33f93626`.
Consolidated independent frozen QML/factory/controller/ELF review subsequently
passed for ONE always-reverting disposable diagnostic, conditional on target
module smoke and fresh identity/base/backups. Exact pins are in the stager;
it requires actual target smoke evidence and unchanged UI/Dates PIDs before any
UI stage is created. Actual target import remains next and UI staging is still
blocked by its absence. This is continued work blocked on live target access,
not a finding that writable pull-out notebooks are infeasible.

The user subsequently reported reachability and requested immediate installation.
At05:29UTC the Mac had moved to192.168.86.33/24, gateway192.168.86.1; there was no
active USB network interface. Two unauthenticated local-subnet SSH scans (the
second with a2.5s connection timeout) found no open SSH endpoints, including
separate checks of the former10.100.102.101 and USB10.11.99.1 addresses. A current
neighbor at192.168.86.30 actively refused port22; no authentication was attempted.
Local SSH service discovery provided no alternate endpoint. Requested the Pro's
currently displayed IP rather than guessing another device or claiming deployment.
No tablet writes, import-test execution or UI restarts happened in this retry.

See [retirement scope and update recipe](../RETIREMENT-PROBE.md) for the bounded
sequence and the distinction between native retirement and a general release.
