# Load-only probe accepted; original base restored

Scope: native host loading and independent automatic recovery only. No companion
notebook was opened or created; native pen, second-view rendering and fluidity
remain unqualified. This is not a persistent Companion installation.

- Source commit: `5734f18`, branch `beta/pro/3.29.0.148`.
- Transaction: `20260921T195332Z-1`.
- Reviewed controller: `e219d071e62a5170f2799ba6b406a086495bc995e4976b7371265f9cf14116fb`.
- Stage manifest: `6637d6608ebc085793a664e5fa12bb152b4a0dc39f66aad4411b431321c972c2`.
- Preimages archive, verified on both device and Mac:
  `0985970885e87f6ed3c48968005e0fba307a3f901f335238e787019b6964e5f8`.
- Private probe log, verified on both device and Mac:
  `46585e7b5e3b2f9d9991183a32011690728f26ae9bb27581c69c687e94badd02`.
- Device recovery directory:
  `/home/root/.codex-backups/companion-20260921T195332Z-1`.
- Private Mac copies: ignored `build/recovery-20260921T195332Z-1/`, directory
  mode0700, archive/log mode0600. No raw device log or backup is committed.

The accepted pretrial base was UI14472 / Dates14463. Probe UI21416 loaded all
twelve QMDs and emitted `Companion: host ready; ink=false; settings=true` at
19:57:56 UTC. The strict relevant-error scan passed. At 19:58:14 the owner exited
successfully without commit; the independent watchdog restored the base and
exited successfully at 19:58:20. Receipt: `recovered=base:22703`.

Independent postchecks proved:

- UI22703 and Dates14463 active, both zero restarts; Dates never restarted.
- All original eleven QMDs still match manifest
  `5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d`.
- Both Pro Gestik copies, Dates config/token/sync, Dispatch settings and Smart
  environment/config/bridge key/known-hosts hashes unchanged.
- Original full service shadow and two original drop-ins restored, empty
  OnFailure, Restart=no, canonical XOVI_ROOT and accepted QRR environment.
- Probe drop-in, lock and active Companion host/settings directories absent;
  probe host/settings retained privately in its recovery directory.
- Both owner/watchdog units inactive with success, no stock fallback needed.
- Root remains read-only; restored base log has no relevant QML errors.

ReManager acknowledged this receipt and retained no pending device writes.
UI22703 is the new observed base PID, not a firmware-wide constant. Future trials
must freshly qualify state and capture new preimages, never substitute this load
acceptance for two-document rendering, pen routing, save durability or physical UX.
