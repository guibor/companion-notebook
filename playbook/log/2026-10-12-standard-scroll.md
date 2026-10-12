# Standard lower-pane scroll boundary

User reports standard split notebook reaches an artificial lower scroll limit.
Source inspection identifies cnConstrainToPane applying the finite scene exterior
to note pages; stock Navigation leaves note bottomViewportEdge open. Two new
regressions reproduce the limit before correction, including y12000 clamped1460.

Standard note pages now retain only the top vertical bound. PDF/horizontal bounds
are unchanged; quickPadQmd preserves the existing corner blank-tail limit.
No native library, input/pen gate, notebook content or settings changes.

Payload-only build against cached accepted page-links/Gestik/Timer composition
passes both34QML load orders.47focused tests pass; all16generated Quick Pad/toolbar
checks also pass in the alternate order. Tests now consume fresh .152 output.
The generated QMD differs only in the note-specific vertical clamp/comments.
No tablet calls or installation occurred. A future update requires current
ownership, exact live identity and fresh base/settings/controller evidence.

## Installation preparation (2026-10-13 Israel)

The owner requested installation and retained the current `.152` branch.
ReManager explicitly handed sole tablet-write ownership to this chat. Fresh
host-key-first Wi-Fi verification identified Ferrari at10.100.102.101, exact
3.29.0.152/stock7aa5d67d and the same nine native providers. Root stayed read-only.
The accepted045454 controller completed its own controlled recovery to base412394;
WebPDF0.5.0/protocol3 remained accepted and its entire bundle verified afterward.
Three settings differed from the historical receipt and were preserved, not reset.
An inventory attempt overlapping recovery was rejected when the PID changed;
only the subsequent stable-base capture was used for assembly.

- Fresh base capture:7410c20240dc28bdc577a75964d86f6822363af1ee697680a372919f652f3428.
- Coordinator:477c39edfe897d76e2dffb95fc3f9f92e054f8fe7867a1877201f0abc0fc3eae.
- Stage:build/pro-3.29.0.152/handoff-477c39edfe89.
- Transaction:20261012T220934Z-1 (UTC identifier; October13 Israel).
- Manifest:1fea36f65505d30f866b2c0a19893635382edf41d6fb10b1a16f9e57f2025493.
- Controller:3f22723165b0f8e2ccd07c2d7eacc78aff5b4f603c91f4ee212491cd15c8f8ce.
- Companion QMD:9becd04f2460d8509709a598a95c733d32d59fa06e2e1c5610bae9c6d30b2126.
- Off-device backup:7d57e6f5b4832079417d5b156a702ba272d714fd8a11207bf3c7fe79bdcd4f5a.

The private61-member preimage archive passed SHA/gzip/tar verification on the Mac
before the verification marker and supervised activation. Current39base files,
13settings and11QMDs were captured afresh. Both34QML composition orders,47focused
checks and16alternate-order generated checks passed. Of the12stage members only
the Companion QMD and fresh controller differ from the previous stage; all ten
others are byte-identical. No old-app rollback metadata is included: current
WebPDF is an accepted base dependency, not a pending protocol upgrade.
Move, servers, notebook contents and pen/native module sources are untouched.

## Installed and startup verified

At22:12:44.278UTC WebPDF reported selection-host-ready; at22:12:50.761UTC
Companion reported host-ready with ink/settings true (October13 01:12 Israel).
UI415570/Dates8045, owner414197/watch415167 are active, all NRestarts zero.
All13freshsettings hashes match,13external QMD loads and all three expected
native mappings are present. Active Companion QMD9becd04f matches the stage.
Root remains read-only, no abort/recovery or relevant QML error matches exist.
Actual Timer files /home/root/quicksettings-timer-clock.json and
/home/root/alarms.json remain absent. No automated input was performed.

Use this new transaction's own probe.sh stop action for later controlled recovery,
with manifest1fea36f6 above; do not replay045454 or its protocol-upgrade rollback.
Retain this transaction's backup/runtime directories because they contain live
loaded modules. The guarded startup is complete; physical scroll feedback remains
with the user. ReManager receives this receipt for future maintenance routing.
