# Two-document diagnostic review — 2026-09-21

Status: independently reviewed locally, **not yet run on the tablet**.
ReManager retains no concurrent tablet operation; Companion owns any subsequent
bounded trial after fresh strict-key identity/base checks and verified Mac backup.

## Frozen reviewed artifacts

| Artifact under `build/render-native/` | SHA-256 |
| --- | --- |
| `probe.sh` | `97ef1cdd466f4c7f6778ef726509c4f2b3d0baa9a20fc0761dc709d7673decd8` |
| `companion-notebook.qmd` | `71057173ef08d234bec9a01b6710a1acbc19fb3215c8eb34973a43b80a98ad67` |
| `NativeHost.qml` | `1db2b48b9e3323bc52473ac3112f1a90976f41f792b37da7be9571ca0005315b` |
| `PairStore.js` | `44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19` |

The load-only controller remains `e219d071e62a5170f2799ba6b406a086495bc995e4976b7371265f9cf14116fb`.
Both tasks independently ran 45 Node tests, 29 Qt tests and normal/render
composition (three load orders, 29 resources per order). All passed.

Review fixes include host-independent compiled input locks; locked picker;
viewport-only grabs with callback-time generation, safe-state, ID and object
checks; cancellation on failure/restore; exact original-page restoration; and
watchdog liveness throughout completion polling and before the success marker.

Clearance covers only the bounded, pen-disabled, two-disposable-document
diagnostic. It does not qualify native handwriting, permanent installation,
Move, server changes, compositor occlusion, or physical drag latency.

## Connectivity and next step

At 20:21 UTC the known Pro address `10.100.102.101` stopped answering public
SSH-key scans and TCP port 22. The Mac remains on `10.100.102.107/en0`; the ARP
cache retained the Pro MAC. The standard USB address did not answer either.
No authenticated access or second-trial staging/restart occurred during these
checks. User was asked to wake/unlock the Pro. The last verified base state is
the [first-trial receipt](load_probe_2026-09-21.md), not a new live observation.

Once reachable, follow [RENDER-PROBE.md](../RENDER-PROBE.md), use a new transaction
ID, commit source before staging, verify the Mac backup, and require separate
machine-success and base-recovery receipts. Confirm temporary MemoryMax and
drop-in removal, unchanged eleven QMDs/settings/Dates, and read-only root.
Inspect both private viewport captures; their presence alone is not a visual pass.

Before a writing pilot, also resolve whether fixed full-height native viewports
allow scrolling all content through their shorter exposed pane: stock SceneView
uses `limitScrollingToPaper: true`, and Navigation uses full viewport height.
This is a source-derived qualification concern, not a diagnosed hardware failure.
