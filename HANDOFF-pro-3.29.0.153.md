# Pro .153 offline preparation

Branch beta/pro/3.29.0.153 is isolated from the working .152 checkout and includes
the standard-notebook open-bottom scrolling correction8268ba2. ReManager remains
sole tablet writer. SelectChange owns the combined Restyle/WebPDF overlay.

## Current evidence

- Exact supplied stock SHA and ELF build ID verified locally.
- Four pen-related Qt metadata/string tables match the audited native baseline.
- Public QObject moveToThread interposition import still exists.
- Fresh ReManager observations confirm all eight direct native provider hashes
  and vendor-policy hashes. Supplied QtCore/QtQml files match locally. The full
  native-source/binary reuse audit passes with the new runtime profile.
- Source-only Quick Pad build succeeds and retains the scrolling fix.
- .153 guards/scroll regression tests pass; .152 guard regressions also pass.
- Source-only output is deliberately unbound and NOT installable.

## Inputs still required before sealing

1. Provider/vendor-policy observation is now recorded in
   profiles/runtime-pro-3.29.0.153.json and audited; retain these exact pins.
2. Actual captured table receipt in profiles/table-pro-3.29.0.153.json, containing
   firmware, stockSha256, hashtabSha256, canonicalTableSha256 and
   hashtabCaptureStatus=two-canonical-captures-equal.
3. SelectChange's qualified combined QMD/native module/qmldir, each path/hash
   pinned in profiles/overlay-pro-3.29.0.153.json.
4. Current twelve-peer composition manifest (eleven external plus AppLoad),
   additional resource tree, and fresh post-base controller/settings inventory.

The assembler accepts the same argument positions as .152, but rollback arguments
4/5 must be empty: WebPDFprotocol3 is already accepted, not a pending app upgrade.
The .153 renderer additionally refuses any webpdfRollback field. Render and test
the controller only after real profiles arrive; missing files fail closed.

Run ops/audit-pro153.mjs with the actual runtime profile, then
ops/assemble-pro153-inputs.mjs and ops/prepare-pro153.mjs with their hash-pinned
inputs. Full preparation validates both composition orders, exact peer bytes,
native provider/source reuse and the fresh device-relative guards. Stage output
is immutable. Never use a source-only build or an old activation transaction.

All activation, off-device backup verification and startup checking remain with
ReManager. Keep device-specific settings out of the public repository and do not
publish inherited private operational receipt history. No .153 installation has
been performed or claimed from this task.
