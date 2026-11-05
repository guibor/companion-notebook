# Standard split seam correction

The owner reports the two horizontal lines between Companion pages remain after
the 3.30 refresh mitigation. The photo shows an upper line at the content edge
and the known full-width Companion rule beneath it. Source/stock review found
only one custom horizontal rule; it did not establish the upper line's source.

The correction removes only the standard split's custom rule by setting its
color transparent. Its two-pixel geometry, native-container offset, input
heights, parked transactions and all content rendering are unchanged. Corner
Companion/To-do retain their top and side rules. This intentionally supersedes
the old requirement for a visible hairline in every full-width split; blank
pages now meet at a whitespace seam. No stock overlay or notebook pixels are
masked to hide the unexplained upper edge.

Exact 3.30 composition passes 37 resources in both orders. The 46 controller,
native-navigation and ordinary-transaction tests pass. An exploratory run of
the legacy quick-pad-logic suite has eight missing-3.29-fixture failures; it is
not the current 3.30 composition test and its old fixture paths were not spoofed.
The exact generated NativeHost differs from the installed stage by one color
binding only; the Companion QMD is byte-identical.

Generated-host pixel tests pass all eleven data rows (nine split preset/width
combinations and both corner sides), verifying unchanged offsets and retained
corner rules. A temporary old-color mutation fails all nine split rows while
both corners still pass, proving this regression catches the removed rule.
Device screenshots were not taken.
Guarded installation and physical e-ink appearance are separate acceptance gates.

The full `QuickPadOffline` suite passed 37/37 (including lifecycle). Run with
`QT_QPA_PLATFORM=offscreen QT_QUICK_BACKEND=software QT_SCALE_FACTOR=1`,
`/opt/homebrew/bin/qmltestrunner -import "$PWD/tests/mock-imports" -input
"$HARNESS/tests/tst_quickpad.qml"`. The temporary harness copies the exact
`build/pro-3.30.0.108/quick-pad-native` directory into `host/`, copies the two
test files into `tests/`, creates `build/test-settings/`, and rewrites only the
test import URLs to that copied host. The focused test names are
`QuickPadOffline::test_synthetic_split_uses_unruled_seam` and
`QuickPadOffline::test_synthetic_corner_keeps_boundary_local`. The negative
control changes only the copied host's conditional grip color back to `#555`.
Desktop Qt required execution outside the sandbox's restricted CPU probing.

Installed on Ferrari 3.30.0.108 under owner/watchdog
`20261105T214518Z-11402`, manifest
`9d7d860bf4834432625a30645d453bfd7563ec42d569219c11a4950d8774508c`.
The previous owner recovered to base UI52524 before fresh inventory and encrypted
rollback. New UI55965 passes the full gate: thirteen QMDs, four ready hosts,
seventeen unchanged settings, Dates responding, Smart rearmed, read-only root
and zero automatic restarts. Live host SHA256 is
`5a47483843d93d22849820f2b9a577cf9f05800b159b539620c957f4ebf755b0`.
No pen events, notebook content changes, Move changes or page capture occurred.
Physical appearance after this correction has not yet been observed.
