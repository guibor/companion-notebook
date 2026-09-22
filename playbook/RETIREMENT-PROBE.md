# Native handler retirement diagnostic

## Scope

Continue from the successful fixed-layout native ink experiment, not from the
historical rendering/capture profile. Target only the exact Ferrari Paper Pro
3.29.0.148 and its accepted 11-QMD base. Do not touch Move or reinstall the base.

This is not a personal pilot. The ordinary package keeps `inkQualified: false`.
No firmware, root, boot, partitions, kernel modules, shared Qt libraries or native
notebook files are modified. All ink uses stock native controllers in two fresh,
labelled disposable notebooks. Existing contents are not used as test material.

## The boundary being tested

The exact native ScenePenInputHandler destructor synchronizes removal from the
worker before freeing native handler resources. QML's Component destruction
notification happens **before** that destructor, including ordinary dynamic
deletion, and cannot acknowledge that removal. The local negative C++ regression
demonstrates the distinction; a queued attached callback on one path is not a
general GC/teardown/input-queue guarantee.

`Companion.Lifecycle` observes two native `QObject::destroyed` signals from the
surviving host, then emits an epoch-checked queued generation acknowledgement.
It uses public Qt only. It never deletes targets, dereferences a dying target,
calls a worker, emits aboutToBeDestroyed, or patches a binary/native address.
This acknowledgement means **derived native handlers retired**, not durable
saving, universal input-queue drainage, or complete QObject-stack unwinding.

## Experiment sequence

1. Native creation/opening supplies two disposable IDs; record exact views,
   scenes and controllers. Select a normal native writing tool in both.
2. At fixed 1080-pixel reveal, arm both native surfaces simultaneously and send
   one bounded interior stroke per pane without a selection tap.
3. Require both native controller submissions, pen-up and native loading to
   finish. Close future input. Reject active pen gestures/selections.
4. Arm the observer for both handlers; detach the input and viewport consumers,
   explicitly republish native regions, null the published handler properties,
   and request normal destruction of both dynamic QML-created handlers.
5. Only after the native acknowledgement, move the actual sheet through twelve
   intermediate positions to a 1320-pixel reveal while neither handler exists.
   Preserve both documents/controllers and full-size native viewports.
6. Recreate native handlers, refresh transforms, rearm both exact panes, and send
   a different bounded stroke to each. Round-two lines are 200 screen pixels down.
7. Close future input and allow ordinary autosave; this interval is not a save
   acknowledgement. The watchdog restores the accepted base automatically.
8. Read back only the two exact disposable files. Require all four distinguishable
   native shapes, one-to-one, with no missing/duplicate/foreign ink.

No gesture or personal-document transition is made writable by this diagnostic.
Its event-loop motion timing is not a measurement of physical e-ink smoothness.
The injected echo detector cannot prove event provenance or physical exclusivity.

## Local builds

The private firmware cache and the accepted base inventory must remain available.
The following creates only ignored local artifacts:

```sh
cmake -S native-observer -B build/native-observer -DCMAKE_PREFIX_PATH=/opt/homebrew
cmake --build build/native-observer
ctest --test-dir build/native-observer --output-on-failure
node ops/prepare-observer-headers.mjs
node ops/build-observer-cross.mjs
CN_PROBE=retirement node build-native.mjs
node ops/build-retirement-controller.mjs
CN_PROBE=retirement node tests/native-composition.mjs
node --test tests/retirement-profile.test.cjs
uv run --with rmscene==0.8.0 python -m unittest discover -s tests -p test_ink_persistence.py
```

The cross-build uses checksum-pinned official Debian Qt6.8.2 ARM64 **headers**,
host moc6.8.2, the ARM64 compiler, and the tablet's exact existing Qt6.10.3 runtime
libraries. No Debian package or replacement library is installed. The resulting
ELF imports `qt_version_tag@Qt_6.10`; despite older headers/plugin metadata, these
bytes are exact-target-specific, not a promise of Qt6.8 tablet compatibility.

`elf-review.json` records source, compiler, moc, header archive/config, provider
and binary hashes. Architecture, entrypoints, symbol versions, dependencies,
relocations and loader search paths must all pass before any target execution.

## Standalone target import preflight

`ops/stage-observer-smoke.mjs UNIQUE_UTC_ID` prepares a fresh private local stage
containing only `observer-smoke`, the adjacent `qml/Companion/Lifecycle` module,
and their manifest. The executable uses Core/Qml only and two fake local handler
objects; it has no QtQuick, display, evdev, notebook, network or service APIs.
Its module path is restricted to that stage. A default, unblocked SIGALRM bounds
Qt initialization/checks/destruction to five seconds after main begins; an outer
timeout and resource cap should additionally bound the command.

After host-key-first identity verification, copy only this capsule into a fresh
private `/home/root/.codex-staging/companion-observer-UNIQUE_UTC_ID` directory.
Check the complete manifest and file types/ownership, exact runtime library
hashes, and `/lib/ld-linux-aarch64.so.1`. Record base UI/Dates PIDs before and after.
Execute the fixed smoke command under a ten-second external timeout with core
dumps disabled. Require exactly `OBSERVER_SMOKE_PASS` and exit0, with unchanged
UI/Dates PIDs/restart counts. Do not restart xochitl for this step.

A pass verifies module ABI/import using **fake** targets, not real pen behavior.
Do not fabricate a pass from the macOS executable or ELF symbol inspection.

## UI trial and recovery

The generated retirement controller is a separately reviewed derivative of the
successful fixed-ink controller. It retains the 180-second owner deadline,
420-second watchdog, 1GiB UI cap, exact preimages/settings hashes, verified Mac
backup, whole-owner-cgroup termination check, independent pen release, and finite
base/stock restart budgets. The original recovery bodies remain unchanged.

Only its temporary late `/run` drop-in supplies the candidate QML import path.
The entire verified observer subtree is retained with the experimental host on
recovery, leaving no candidate host or module active in the normal setup.
The first round's release marker is renamed **before** the second injection;
interruption cannot misclassify an old release as a successful new one.

Stage only exact independently reviewed bytes, after actual target smoke PASS and
fresh identity/base/backups. Do not reuse historical stages or weaken canonical
runtime path checks. A review or local composition result is not a deployment.
Independent review of the frozen artifacts has passed for one such experiment.
The stager pins all eight payload artifacts and requires
`build/observer-arm64/target-smoke.json` from actual target execution, matching
the module/executable hashes, target identity, successful output/exit and unchanged
UI/Dates PIDs and restart counts. That receipt does not yet exist; do not create
it from local tests. Isolated stager unit tests use synthetic receipts only in
temporary directories and are not hardware evidence.
