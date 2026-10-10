# Follow-up: loaded versus visibly usable features

ReManager relayed user reports that Dates, PDF Highlight and SelectChange are
missing despite the healthy native pilot. The Restyle owner identified a disabled
PDF-readiness expression; the WebPDF owner will provide a rebuilt combined QMD.
No device operations are permitted from this task. New deployment must use fresh
base/settings observations after coordinator-owned recovery, not the earlier pins.

Consolidated reviewed overlay artifacts into one profile, shared by input
assembly, full composition, stage copying and controller generation. Added a
composition-to-staged-artifact identity guard. Companion app/runtime UI unchanged.

Inspected the actual final composed toolbar: Dates sidebar and both menu entries
are note-only; sidebar additionally needs expanded toolbar and stock capacity >7,
SettingsMenu has complementary <=7 fallback. Companion subtracts its extension
slots from showableToolsCount, not stockShowableToolsCount. Hidden secondary
toolbars still cannot publish capacity. No specific Companion regression is
established; no speculative Dates/toolbar edit was made.

ReManager confirmed PDF context through its read-only screen inspection. The
corrected combined overlay07a8d077 was supplied and independently hashed here;
Restyle native module and every Companion app byte remain unchanged. The reuse
resealer refuses this changed overlay: it requires a full composition run. Final
sealing remains blocked on ReManager's fresh post-recovery live inventory.

ReManager then supplied fresh inventory528f6128 after controlled recovery to
base57416. Full sealing produced `handoff-f782d6508008`, manifest
a81f5b9fd47a8f79e6ce5190a7d555a464a147252c688cbd031707de298f7d45,
controllerbfa39428b60ef26ab5309c9c8e64b5eccac405bfd430ba9d3fd1a600c7870e2a.
Both full-stack orders parse34resources, corrected PDF textEnabled binding is
present, and all seven Companion artifacts match the working prior stage exactly.
Sent exact stage/hash to ReManager; no device operations. The lasso SelectChange
visibility cause is not established as fixed by the PDF readiness correction.

## Corrected package deployed — coordinator receipt

ReManager reported successful deployment in transaction `20261010T091802Z-1`
using stage `handoff-f782d6508008`, manifest
`a81f5b9fd47a8f79e6ce5190a7d555a464a147252c688cbd031707de298f7d45`
and corrected combined QMD07a8d077. Fresh recovery archive SHA256
`b08f357455cf7e0743362a0ed1a8f4193b0b786581a1203e12f4a0fc332e0b30`
was verified off-device. UI60329, Dates8045, owner58982 and watchdog59933 were
active with zero automatic restarts; root remained read-only. All eleven current
settings matched, including the newer pairs.ini, rather than an older snapshot.

WebPDF was ready at12:20:31.360 and Companion at12:20:37.636 Israel time
(09:20:31.360/09:20:37.636 UTC), 2026-10-10. Readback confirmed the PDF readiness
binding uses `restyleTextBridge.textEnabled`. Dates absence was explained by PDF
context, with no Dates edits. Lasso editing was not physically exercised.

Evidence source: ReManager report and maintenance commit6046cce, read locally.
Only documentation was updated in this task; no device action or watchdog change.
Deployment/readiness does not establish physical lasso or SelectChange acceptance.
