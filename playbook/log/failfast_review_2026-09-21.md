# Faster diagnostic recovery and input-lock notice

User confirmed ordinary scrolling after second-trial recovery and authorized
continued implementation. Exact Pro read-only checks again matched UI34683 /
Dates14463, zero restarts, firmware 3.29.0.148, original service policy/QMDs,
absent Companion host/settings/lock and read-only root.

Local changes before any further trial:

- Independent watchdog watches the native failure marker each cycle and calls
  the unchanged `recover(native-failure)` immediately rather than waiting for
  owner warmup checks or the deadline.
- Owner checks failure before each warmup pass. Native and strict QML error
  gates explicitly exit on matches and reject grep errors; only no-match status
  is accepted. Bare `! grep` under `set -e` did not have this property, explaining
  why the former owner could continue after a reported failure.
- The render-only profile displays a bottom notice explaining temporary paused
  writing/scrolling and automatic restoration. No notice in the normal app.
- Previously local-reviewed stock dirty-repaint correction is included. It still
  has not been qualified on hardware; attribution of the old argument exception
  is provisional.

66 Node tests pass, including execution of actual generated owner gates and
watch loop; 29 Qt tests pass; normal/render composition each pass three orders,
29 resources. Tests verify recovery code is byte-identical to the pinned
load-controller version. Identity, inventory, backup checks and durable restart
budgets are not loosened.

Frozen artifacts independently reviewed and approved for this bounded diagnostic:

- Controller `034d4553a5c03a93426527eb3633f92bc0cb1992f63c9b92b8c1065965b4d03f`.
- QMD `a595d2df02f95b10d08bc7dde7ac79468d72e6aa5a7677bf27b2c288ebc1bed5`.
- Host `0c3d3aa120ccd0f86a5ff18597d39c42775b45e10e2e6b9ec038d09865561919`.
- Pair store `44d0b0a96107d61bffc3564b737ade6d92acd0e848bc68b3bb857297ccf05b19`.

ReManager independently reproduced all three owner gates (only no-match status
passes), the watch-loop scenarios, unchanged recovery/bootstrap/budgets, and
notice isolation. 66 Node tests passed in review; unchanged payload Qt/composition
checks also passed. Clearance remains pen-disabled and disposable-documents-only.
Fresh guarded preparation and verified Mac backup are required before staging
activation. Detection is now earlier; actual restoration time is not promised
instantaneous and still must be measured on hardware.
