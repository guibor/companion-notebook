# Native admission sidecar — exact 3.29.0.148 development candidate

This is **not an installer** and must not be preloaded into an ordinary tablet
session yet. Native writing in the ordinary Companion host remains disabled.

The standalone target smoke passed, but the first native UI trial
`20260922T221000Z-1` aborted at startup with `std::invalid_argument` / `stoi`,
before the host or native worker readiness receipt. Its watchdog restored the
accepted Pro setup, verified separately. The cause is unresolved and the review
is consumed; staging is blocked. See `playbook/log/admission_probe_2026-09-23.md`
from the repository root. Do not preload this candidate again as a workaround.

The Linux build is one resident shared object: both an early public Qt symbol
observer and the `Companion.Admission` QML plugin. Load it at the same canonical
path in both roles, before `xovi.so`. It observes the exact successful self-move
of `PenInputThread`, calls the original Qt function exactly once, and verifies
the real worker event loop later. No executable patch, private native pointer
offset, controller/file rewrite, or setup handwriting is used.

## Host contract

1. `initialize()` must yield `ready` before opening admission transactions.
2. `pause(manager, generation)` records a strictly increasing transaction. Leave
   all native surfaces, gates, clips, transforms, controllers and pages unchanged
   until `parked(generation)` arrives. UI-only intent is permitted.
3. While parked and manager signals blocked, detach **all** old input handlers,
   update the manager cache empty, and establish final geometry/transforms.
   An empty global region is not evidence that the active-handler list is empty.
4. `permitPublication()` checks the empty global region and lifts the signal
   block. Attach only final-geometry handlers; never expose intermediate geometry.
5. `finish()` requires a fresh direct native active-input publication and a
   synchronous final region update before releasing the worker. An unchanged
   cached list with a suppressed notification is refused.
6. Quarantine contacts that began in Qt/chrome while native admission was closed.
   Such contacts must finish before controls can respond normally again. Do not
   rely on a visually paused band to enforce this.
7. Retain documents/controllers through earlier synchronous stroke submission.
   No nested event pumping or deferred submission can bypass FIFO handoff.

No failed transaction, destruction, or elapsed timer automatically resumes the
worker. A separate bounded recovery controller must stop that candidate process.
The sidecar must not be unloaded. Owner/manager affinity changes, captured-worker
movement, duplicate capture, finish/destruction and shutdown invalidate it.

## Local checks

`cmake -S native-admission -B build/admission-desktop` builds real Qt thread tests.
On the current Mac use `-DCMAKE_OSX_SYSROOT=/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk`;
the newer SDK removed AGL required by the installed Qt build. Run `cmake --build`
and `ctest --test-dir build/admission-desktop --output-on-failure` outside the
CPU-detection-restricted sandbox. Isolated child tests exercise destructive
fail-closed paths without any production reset or emergency-unpark API.

`node ops/build-admission-cross.mjs` builds ARM64 against cached public Linux Qt
headers and verifies every required versioned symbol against the exact device
libraries. `admission-smoke` accepts no arguments and has a hard five-second
deadline. It uses fake QObjects only, verifies actual ELF binding and one shared
registry, and never accesses the display, input devices, notebooks or services.
Standalone success does not establish native ink, geometry or save correctness.
