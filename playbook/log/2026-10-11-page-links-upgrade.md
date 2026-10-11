# Exact page-links protocol transition preparation

ReManager reports controlled Linux reader probe passed without changing the PDF,
metadata or UI. Confirmed old0.4.2/protocol2 bundle and reviewed new0.5.0/protocol3
dist members are pinned in a dedicated profile. All21new build member hashes
verified locally. The explicit transition discriminator permits only these exact
trees; UI-only behavior remains strict and unchanged.

31focused tests pass, including whole-bundle backend replacement/recovery,
interrupted renames, accepted preservation, foreign files and backend mappings.
No runtime rollback lifecycle changes, no private-state writes, no tablet calls.
Await fresh base/app metadata before composing a deployable stage. The read-only
reader probe does not establish notebook-menu or import acceptance.
