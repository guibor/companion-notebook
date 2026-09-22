# Fixed-size ruler revision

User direction: stay on `beta/pro/3.29.0.148`, remove dragging, offer fixed
fractions, optionally on a ruler. This supersedes live-drag fluidity, not direct
writing in either pane, independent scroll, per-document pairing or ink safety.

Implemented locally:

- Shared tap-only ruler at ⅓, ½ and ⅔, with a filled current-size mark.
- No drag/pull mutation in the ordinary native host or desktop interaction model.
- Saved size per pair; retained views/scroll positions; tuck/reopen preserves size.
- Legacy continuous ratios map to the nearest mark. Invalid and busy requests
  are refused without queuing a surprise later resize.
- Consumed diagnostic host frozen separately and checksum-verified by builder.
- New runtime ruler is in normal build/composition manifests. Old load staging
  refuses this changed file inventory before creating a package.

Verification:

- Node: 177 passed, 7 historical staging skips, 0 failed.
- Qt: 62 passed, 0 failed, including actual ruler taps, rejected drags, pen-mode
  chrome routing and native-host pairing/settings recreation (boundary mocks).
- Exact-firmware composition: 30 resources in each of three plugin load orders.
- Desktop rendering inspected; this is not native e-ink visual acceptance.
- Rebuilt retirement host SHA remains
  `309bac33376a0990063d2c327d63e99a4e40f3756d0572d87558d678f04a3a80`;
  QMD remains `456f01db54f8d702ef39981e8a47acbec6fe56c6bb2971c6f5b702bbd0dc3679`.

Coordinated local-only input review found a possible warm discrete transition
using a direct producer pen-up filter seal and a known-worker fence. It did not
clear the cold pen-on-chrome case. Details and limitations are recorded in
`playbook/ADMISSION-HANDOFF.md`; no adapter or native qualification is claimed.

Connectivity: Mac remained on `10.100.102.107/24`. The Pro's last endpoint
`10.100.102.101` did not return a public SSH key. A credential-free port scan of
the subnet found only `.2`, whose public key did not match the Pro. No credential
was sent, no SSH login occurred, and no device was changed or restarted.

Next work is concrete native input integration and a new bounded qualification
when reachable, not installing the pen-disabled local candidate as a completed
writing app. Move and ordinary tablet settings remain untouched.
