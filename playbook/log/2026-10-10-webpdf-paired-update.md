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
