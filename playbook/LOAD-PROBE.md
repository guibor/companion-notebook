# Pro 3.29 load-only probe

This is not an installation recipe. It verifies native host loading and the
new controller's return to the accepted base. It never enables writing, opens a
second notebook, creates a notebook or promotes Companion into regular installs.

## Preconditions

- Explicit ReManager ownership handover, already received for corrected r1.
- Ferrari public Ed25519 fingerprint
  `SHA256:dByHweKZkjDlZRBHdBisT5VD2kV85lClgtJExnDaTeE`, verified before auth.
- Strict key-only SSH using `~/.ssh/id_ed25519_remarkable_new`.
- Exact firmware/build/stock/runtime/base-policy fingerprints in the controller.
- Accepted eleven-QMD manifest SHA
  `5fe7e2ec3291efa692c90df769ea521d9e399d3da6e7448f9a9071caca71652d`.
- Base UI and Dates stable; no app takeover or competing installation.
- No existing Companion host/settings directories. This probe cannot overwrite
  an existing install; a future installed-state transition needs a separate recipe.
- Syntax, actual-helper recovery/publication tests, Qt tests and full-stack
  composition pass. The controller must receive independent review before restart.

## Operator sequence

1. Build with `node build-native.mjs`, run `npm test`, Qt tests and
   `node tests/native-composition.mjs`. Use the local Qt workaround described in
   README when the sandbox misdetects CPU features.
2. Choose a new transaction ID; `node ops/stage-probe.mjs ID` creates a private
   five-file payload plus hash manifest. It refuses a reused stage directory.
   Freeze the controller and stage hashes after review; do not edit a live stage.
3. Recheck the public host key and accepted process/inventory/policy state.
   Create only the new `/home/root/.codex-staging/companion-ID` directory, mode
   0700; copy the six staged files with strict SSH/SCP options. Revalidate the
   exact manifest hash, every file and shell syntax remotely before execution.
4. Run the staged `probe.sh prepare ID MANIFEST_SHA`. This only writes new
   protected recovery/scratch files under `/home/root/.codex-backups/companion-ID`.
   It does not stop, start, restart or alter the active UI/policy.
5. Copy `preimages.tgz` back into a mode-0700 ignored local directory, verify its
   SHA against the device, inspect archive paths, and retain it mode0600. Only
   then supply `mac-backup-verified` containing `mac-backup:<verified SHA>`.
6. Launch `probe.sh run ID MANIFEST_SHA` in its required systemd unit
   `companion-probe-ID`, Type=exec and KillMode=control-group. The controller
   itself starts `companion-watch-ID` and verifies it is ready before publishing
   its two-file host, empty pairing directory and own late `/run` policy.
7. Observe the unique recovery directory and units. The owner requires a stable
   probe PID, twelve QMD load records, no relevant QML errors, and the exact marker
   `Companion: host ready; ink=false; settings=true` after 25 seconds. It then exits
   without commit. The independent watchdog restores the accepted base.
8. Require a `recovered` receipt with `base:<PID>`, unchanged Dates PID, zero
   restarts, exact base files/policy, private setting hashes, absent Companion
   host/settings paths, absent probe lock, inactive guard units and read-only root.
   Recheck the new base's logs separately. A `stock:<PID>` fallback is recovery,
   not a passed trial; diagnose it before any further action.

## Boundaries and recovery

The original eleven QMDs and accepted controller are never overwritten. Scratch
state copies QMD/table bytes, shares the exact accepted extension binaries and
AppLoad home, and adds Companion only in the scratch tree. A later drop-in selects
that XOVI_ROOT and private log. The original full service shadow, vendor shadow
and base drop-in stay byte-identical.

The watchdog has a monotonic 90-second owner window, two explicitly limited
systemd starts and a per-invocation 300-second ceiling. Its own durable retry
accounting precedes fallible payload checks. Recovery records each base/stock
start attempt before acting, so a cleanup retry cannot create another restart
cycle. A foreign policy or identity mismatch is a refusal, never a reason to
overwrite unrelated state. Failed watchdog state remains inspectable.

Normally recovery removes only the probe drop-in, restarts the accepted base
once if needed, and archives the probe's host and settings under its recovery
directory. If base start fails, it attempts stock once under the already accepted
failure-target-free shadow, leaving all base files intact. Do not manually disarm
the watchdog, broaden guards, remount root or replay stock-only preparation against
an active base. Preserve evidence and diagnose the exact failed gate instead.

Even a passed load-only probe does not qualify second-view rendering, actual pen,
save durability, e-ink fluidity, or physical interaction with other plugins.
