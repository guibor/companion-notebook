# Paired direct-tap update

ReManager supplied post-app-update base inventory c6f9c39f and paired whole-app
rollback inventory114573a0. Work stayed offline on beta/pro/3.29.0.152.
Combined overlay d38f5d58 composes with both full-stack orders; seven Companion
payloads match the preceding installed stage. No native source, DSO, notebook,
settings, Move or server changes.

Optional bundle recovery runs after bounded native recovery. It checks the exact
archive, old/new file inventories, absence of symlinks/special files and app
quiescence. Durable intent permits recovery across either interrupted rename.
Acceptance is an explicit machine-gated action, preserving the new app through
later intentional stops. This avoids a silent downgrade during Gestik maintenance.

Existing22focused tests and7isolated paired-rollback tests pass. Initial test
failures were caused by macOS temporary-directory symlinks; tests now canonicalize
their scratch root, preserving the production no-symlink guard.
See versioned handoff for full pins. ReManager owns activation and final receipt.

After sealing, a Quick Timer task reported concurrent device changes and plans to
restore the old overlay. Immediately marked the candidate HOLD and informed
ReManager; no device action here. Fresh base/peer reconciliation is mandatory
before activation. Local source readiness is not live deployment readiness.

ReManager regained sole ownership and supplied inventory97abcf71 with13settings
and39file pins plus peer manifest444e0095 containing timer r1. Explicit peer-file
input was added to the assembler. Replacement stage9546870fd5ce passes both full
composition orders and29tests and was handed to ReManager. Earlier stage remains
superseded. No tablet operations from this task.
