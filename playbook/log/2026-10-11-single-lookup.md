# Duplicate press lookup correction

ReManager supplied source884a9fd overlaybc703575 and fresh inventoryd3bc05 from
base142999. Only current pairs.ini differs from older63b68: preserve that new
state. Current Gestik/Timer peer manifestb4ac661b is unchanged.

Reviewed overlay delta: reuse resolved hit in stock fallback and fast stock path
when host unavailable. Diagnostics remain; no native/app payload change. Owner's
actual-composed regression fails on prior0008 (2lookups vs1) and passes on both
new full-stack compositions. All34QMLs per order parse. Nine other payloads match
1bae. Handoffb492e0369044 sent to sole-writer ReManager; no tablet calls here.
This is duplicate-work removal only, not proof of physical tap/lag resolution.
