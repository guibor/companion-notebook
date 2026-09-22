# Native retirement observer — local candidate only

This small public-Qt plugin observes **two** existing native pen handlers. It
never deletes or changes a target, calls a worker API, or touches notebook data.
It is not a tablet-qualified binary or an installer.

`import Companion.Lifecycle 1.0` provides `RetirementObserver`:

- `arm(first, second, generation)` returns true only for two distinct non-null
  objects whose metaobject inherits `ScenePenInputHandler`, both on the application
  UI thread. `generation` must be a positive integer. QML-generated subclasses
  are allowed. The observer cannot be owned, directly or indirectly, by a target.
- `retired(generation)` is emitted once, through a queued call, after **both**
  matching native `QObject::destroyed` signals have been observed. No dying
  target or QML wrapper is inspected; callbacks carry immutable slot/epoch values.
- `cancel()` invalidates connections and pending acknowledgements. A new `arm()`
  also invalidates the preceding epoch, even if the caller reuses a generation.
  Invalid UI-thread arm requests fail closed by cancelling the preceding request.
- `isArmed()` and `lastError()` are explicit query methods, not reactive properties.
  There are no synchronous status signals that can reenter `arm()` midway through
  registration. State is cleared before the external `retired` signal is emitted.

All public calls belong on the application UI thread. Off-thread calls are refused
without accessing mutable observer state; they do **not** synchronously cancel a
valid UI-thread request. Moving the observer revokes its active epoch. Targets must
stay on the UI thread; a destruction callback arriving on another thread is ignored,
so it cannot authorize a transition.

## Meaning of the acknowledgement

The exact target firmware's native ScenePenInputHandler derived destructor
synchronously removes its worker registration before QObject emits `destroyed`.
The observer acknowledges that **derived handler retirement**. It does not prove
durable saving, submission of a pending stroke, drainage of all input events, or
unwinding of every QObject destructor stack. Nested event processing can deliver
queued calls while QObject base teardown is still running. Tests cover that limit.

The adapter must separately retain document/controllers, finish native stroke
submission, close pen gates, detach both native consumers, settle gesture state,
and validate its own host/generation before changing geometry. It must arm before
requesting normal destruction of either dynamic handler, and wait for both before
recreating them. A timeout is a failure, never substitute success.

## Local build and test

```sh
cmake -S native-observer -B build/native-observer \
  -DCMAKE_PREFIX_PATH=/opt/homebrew/opt/qt -DBUILD_TESTING=ON
cmake --build build/native-observer
ctest --test-dir build/native-observer --output-on-failure
```

The desktop plugin is produced in `build/native-observer/qml/Companion/Lifecycle`.
It must **never** be copied to a tablet: desktop macOS output is not ARM64 Linux
output. The target permits Qt6.8 plugin metadata, but a real Linux Qt SDK, compatible
runtime imports, exact ELF inspection, and a separately reviewed device-load test
are still required. No replacement Qt libraries should be bundled or installed.
