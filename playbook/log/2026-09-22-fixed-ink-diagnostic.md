# Direct writing in both panes: isolated experiment

The user explicitly asked to continue and try both panes writable without a tap.
The earlier stop was about stroke ownership/save transitions, not evidence of
irrecoverable tablet damage. We are implementing a bounded fixed-layout native
test on two newly-created labelled notes; ordinary Companion remains unqualified.

No tablet contact succeeded at the start of this continuation. Public key scans
at the known Pro Wi-Fi and USB addresses returned no reply. A no-auth TCP scan
found another SSH endpoint with a different fingerprint; no login was attempted.
ReManager confirmed sole device ownership belongs to this task and will review
the exact new candidate without touching the tablet. Historical geometry review
is consumed and is not ink clearance.

The new test locks both disposable views after native creation/loading/mapping,
allows both pen regions without selection, and emits only two fixed interior
native marker strokes. Its independent recovery releases any interrupted pen-down
before normal UI restoration. No native notebook serialization, root remount,
firmware, boot, partition, kernel-module, Move or server changes are involved.

See `INK-QUALIFICATION.md` for scope and gates. Test/review/hardware results will
be recorded here; local preparation alone is not evidence that writing works.

## Live result: native submissions and saved shapes passed

Trial `20260922T043500Z-1`, one-run v2 review consumed. Frozen artifact hashes:

- QMD `148b9b1b8adfbfbf8bd7e9511bd0692c366af5e74ee16b0c67f399ad9c3c0503`
- Host `97956c1520daadc2e4c0aa085ccdbe67ae0fee2d8ba80239a9de7dff30b37772`
- Pair store `44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19`
- Controller `b9b5fee626014bcdc0e45b421d9e4f50b53cecca0fe5b3fcfa263a94749c68f6`
- Helper `bfe83e745e82cbade565c49aa8b2dd18164aa9900be849739eada557697d2b7e`
- Stage manifest `cd28f4562150de751b4d8becac7996f5b6909c792be4b764d6baf08e1631d569`
- Verified Mac rollback archive `e13c39b85f330cc745fc20c19d1d00b3bee3f68166a9cf43a602b1ea0a55a480`

Marker identity/ranges matched: Elan marker input,11180x15340,pressure4096,
distance65535,pen-up. Native diagnostic UI59044 armed at04:36:01UTC. At04:36:16
and04:36:17 the two31-point strokes reached distinct correct controllers, without
selection. The helper completed/released cleanly. Native submission receipt at
04:36:27; independent recovery restored `base:60746`, Dates14463 unchanged.
Zero restarts, MemoryMax restored toinfinity, all11QMDs/10settings/3policies
matched, root read-only, no Companion host/data/drop/lock left, watchdog inactive.
No stock fallback or manual recovery was used.

Only two newly-created labelled test notes were read back:

- Reference `6f8e51a0-3b8f-4307-981e-a7cd912a0959`, page
  `9d0de79d-978e-49da-8ff6-2317ee2c4f16`, saved file SHA
  `5e0ce024f3e1ddae99f29c7b7f5fc0023ad44e4eaa4d15c7829dbffa00df2a18`.
- Notes `e9da3e93-88a1-4977-bb3a-8c83fad942f5`, page
  `c7c97af5-5ede-47da-a6cb-6e0736bb5603`, saved file SHA
  `0d9035a19e15ca866d2ea7d0f2ad0d4b99a6898340c6d3f03a93ea4a7c9ab9cf`.

Each823-byte file has exactly one fully parsed Line with24 stored points, versus31
in the pre-save callback. Stored bounds match the native callback within4 units;
maximum straight-line deviations0.885/0.887units. The parser reports111 extra
metadata bytes in SceneInfo, not in either line block. This is saved-shape evidence,
not exact point-representation equality or full format understanding. The verifier
was corrected to report both counts and test tighter5-unit saved bounds/shape;
8 synthetic-file regression tests pass. No private notebook content was inspected.

This trial establishes fixed-layout native stroke routing and stored shapes.
It does not establish both notes' native reopen, physical visual clipping,
boundary crossings/eraser/undo, active layout transitions or fluidity. Continue
the bounded native lifecycle work; do not claim a general release or leave a
personal-document writable installation active. Staging refuses another ink run
until new review. The two test notes are retained, not silently deleted.
