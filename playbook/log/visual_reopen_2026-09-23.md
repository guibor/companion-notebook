# Native saved-page reopen and settled visual check

Trial `20260922T235000Z-1` completed with
`visual-buffer-machine-passed=88826`. Independent watchdog recovery restored
accepted base UI89759; Dates14463 did not restart. Fresh independent checks
confirmed all protected settings, base files, service policies, readonly root,
and absent experimental host/data/lock/owner/watch cgroups.

The candidate reopened only the two labelled disposable notebooks from the
[successful admission trial](admission_bootstrap_pass_2026-09-23.md). Native ink
was disabled throughout. No document creation, direct notebook-file edits,
Qt image grabs, layers, or screen-sharing server were used.

## Actual visual result

Both packed RGB32 frames were decoded locally as BGRX and inspected:

- At1080pixels reveal, the grid source is above the ruled companion. The source's
  two saved strokes and the companion's first saved stroke appear correctly.
- At1440pixels reveal, the source remains unscaled and the larger companion area
  exposes both of its saved strokes. The source's first720pixel rows are exactly
  byte-identical in both captures. The grip begins at1080 and720 respectively.
- The distinct grid and ruled templates are correctly occluded at the boundary.
  No underlying grid or source ink shows through the settled companion area.

This establishes native saved-page reopen and **settled buffer composition**
at these two heights. It is not physical e-ink panel acceptance, dynamic
pen-boundary clipping, ordinary user-driven lifecycle, or a production release.
The old diagnostic host's drag grip/text chrome was used; the new ruler UI was
not the subject of this capture.

## Restricted pixel reader

The first reviewed capture draft was revoked before any activation because it
would have included48non-visible padding bytes per row. The final static ARM64
helper reads exactly6480visible bytes at6528-byte strides. No padding is read,
not merely discarded after collection. Its packed output is13,996,800bytes.
Exact process/start identity, disposable IDs, stage/height, pen-disabled fresh
heartbeat, private files and exclusive output are checked before and after.

## Hashes

| Item | SHA256 |
| --- | --- |
| Seven-file manifest | `d4095a52db7b08f80a92d5ab8174a8ae3274e77c7c0db0a8612301bbafe20276` |
| Controller | `bc54affc03e615947c4d5e20fff99412070dd208959ffea4a86dad1b77d51333` |
| Mac-verified recovery archive | `c84b8e901d538fc831d27be6dd810ad8670b2c550ffe079915572f883b2dc984` |
| Packed frame1 | `5d41a9759ef1281bfe7dd76867fb5225d9817b1eaf25dc46b963cd52f1585545` |
| Packed frame2 | `06e2d366703084c081e6bd5daad60e3fee1e24db1773e41361519f03cb751699` |

Local private evidence: `build/receipts/20260922T235000Z-1/`. Remote evidence is
the matching `.codex-backups/companion-20260922T235000Z-1` directory. The stage's
one-run clearance is consumed. No Companion remains installed; Move is unchanged.
