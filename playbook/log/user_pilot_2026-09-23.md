# User-controlled Companion pilot

## Revision233000 — icon-only refinement and public illustrations

User requested replacing the square/minus badge with a baby notebook overlapping
the normal native notebook. Both sizes now resolve qrc:/ark/icons/notebook through
the native renderer; a plain white backing separates the outlines. No input,
picker, pairing, geometry or Move changes. Six local icon/layout checks and full
base/AppLoad composition plus changed-toolbar parsing pass.

README includes clearly labeled schematic UI mockups with fictional content.
Source SVG and rendered PNG are public in docs/images. These are not tablet
screenshots or physical acceptance evidence. Reddit image/caption approval pending.

- Package20260923T233000Z-1 seeded from230000; source commit3b72bdc.
- Manifest955bce6fb0b5650446479a5e10aa7a7d1f5893c359a6fd08d945dd79328b545b.
- Controllerb6beaf8cdde43fe28ed0aa2d8f7f29a7ea305f26ed35d3b8b68489c126c5eb04.
- Base recovered as179994 before prepare; first early prepare refused while
  recovery was still completing, then successful prepare after the base receipt.
- Backup5901463ef2bd897957395d6cf1270ad51f5b7a225d5d2445d28c49cce8294352
  copied to local build/receipts/20260923T233000Z-1/preimages.tgz and verified.
- Activation invocation41c735294dd6405c8a84dcc3b707f8d1; UI182428 reached
  host-ready but the baby icon's arbitrary size20 was rejected by Ark's image
  provider. Native Companion functionality was active; this was an icon warning.
- Follow-up234000 uses supported native size48 and a visual scale transform.
  Manifest697a8464d5bdeb4f321718305e86e62aaf3df288da81cbaf0e72e5d5a863e618;
  controller69f47fdd9a1e29b89153b2bd51ff6afbe1e00952eee9398e32b61318987d4d98.
  Prior session recovered base183578; verified Mac backup
  48f6a4e97384bda285ad3a7bc6fd793e17e9d43ea0313e9100365e475e748fdb.
  Activation invocation429190f8df03466e9118dced356ff26a.
  UI185793 reached host-ready17:06:07.393UTC, ink/settings=true; pilot-running
  receipt exists. No image-provider error matched the startup receipt scan.

## Revision230000 — native icon, favorites, public source

Requested native notebook icon restored through qrc:/ark/icons/notebook, with a
small QML companion-page badge. No stock artwork copied into this repository.
Picker has Recent/Favorites tabs; Favorites queries LibraryNavigator with
Documents|Pinned and ignoreParent, matching the stock document drawer rather
than filtering the recent40 list. Local popup/tab tests and5 layout tests pass;
full plugin composition and changed-QML parsing pass.

User authorized public GitHub publication and approved the Reddit draft with
explicit portrait-only wording. Public history pattern scan found no private
keys or common GitHub/OpenAI/AWS/Google token matches, and no tracked firmware
binary, notebook, archive or credential paths. README now leads with compatibility,
limitations and developer entry points rather than historical diagnostics.

- Package:20260923T230000Z-1; retained pairs from220100.
- Manifest:546c8d82db617a0372b473943a03a5c33df9009e922326ed4d7d6d984334e834.
- Controller:93a62cd8050c814c1fb16dacd80e087b72156bc34e788a26bb31fbe90ee61abb.
- Backup:76bc39eb44fad770173cfc961fc5b0c2148ce60748d926712b19ad23788d9a64.
- Previous session restored base175105 before preparation. No injected input.
- Active UI177343, owner176282, watchdog177031; all active with NRestarts0.
- Invocation:b95f306cd09b4a6b996e2604a6bef21d; host ready16:51:58.676UTC,
  ink=true and settings=true. Startup scan found no matching QML errors.
- Matching backup copied to local build/receipts/20260923T230000Z-1/preimages.tgz.
- Implementation d4b0290 pushed to https://github.com/guibor/companion-notebook;
  repository PUBLIC, default branch beta/pro/3.29.0.148.
- Approved announcement published with Self-Promotion flair and explicit
  portrait-only wording:
  https://www.reddit.com/r/RemarkableTablet/comments/1wobgko/i_built_a_writable_splitscreen_companion_for/
- No native input tests, notebook creation, firmware/boot/root writes or Move
  changes. Hands-on acceptance of this revision remains with the user.

## Revision220100 — accepted-pilot follow-up

User called210500 awesome and requested commit/push; saved that working state
in d37e5c4 before this follow-up. The repository initially had no remote.

Reversed endpoint arrows; full-companion now performs a true role swap and
persists the previous primary as the reverse partner with its stable page.
Subsequent splits stay in the new primary. Replaced the full-screen tiled picker
with a centered recent-document popup above the toolbar, clipped scrolling,
selection mark, close/dismiss and a quiet unpair action. Recent capacity40;
full-library browser deferred. PDFs eligible for reverse source pairing.
Original paired-notebook SVG is embedded in a standard toolbar Image (not Ark's
private icon resolver). No new remote file or firmware/boot change.

- Package:20260923T220100Z-1, seed210500.
- Manifest:bc2a471af0d0425a3be920aa25c6d23fe24c1d2e45ccf9c549d72056c5bbcd96.
- Controller:3a3b40b91541800ad83f2bf5971d19e24af32c5877f2c8d4a0842afab583aedf.
- Mac-verified backup:3c50863a69cb720fce987e4b78102886585cd33e70694d7776f64caaec8c125f.
- Invocation:e98773a702f94dd7aa83c97cc183fab6. Prior session restored base169340.
- Startup16:37:27UTC: host ready ink/settings true, UI171584,
  owner170517/watch171280 active/NRestarts0. No matching QML/image errors in
  startup scan. User UX acceptance is separate from this startup receipt.
- Local:5 orchestration tests,3 popup/icon Qt checks; full base/AppLoad QMD
  composition and changed-QML parsing passed. No tablet pen tests.
-220000 was built locally but never uploaded/activated; icon handling was
  corrected before deployment after reading Ark's private image resolver.

## Correction210500

210000 reached host-ready onUI162794 but reported TypeError for stackBefore in
both menu ordering callbacks. This C++ function is not QML-invokable on the target.
Removed both callbacks; no notebook/input changes. Native alphabetical QMD order
inserts Companion before Dates; size strip remains in three dots, with exact
position relative to Dispatch deferred. Local click tests pass again.

- Session:20260923T210500Z-1; seed from210000 retained pairing settings.
- Manifest:c43c2eb0de73741a537f2e4e3a1110d1db5629f99eb680a8fd83f4d082e8397f.
- Controller:35f866cda3df812c2067e793ff75970e6b54ea549ee01ed797e6f38b7bbb48b5.
- Mac-verified backup:3f53d9697924f44545b0b28dfdf061588c9434ad81dacaff87155e770eaf96d6.
- Invocation:6ec25d0a7f0b41cd9a151f11173f09f6.
- Startup16:25:52UTC: host-ready ink/settings true, UI166334, owner165260,
  watch166027 active/NRestarts0; no matching QML errors in startup scan.
  This is startup evidence, not user acceptance of the revised on-device UX.

## Revision210000 — toolbar pairing and finer presets

User reported all size changes stayed at half; live200000 logs likewise show
1080 for every completed visible layout. Menu delivery now sends a captured
integer index before foldout disposal; source-scoped pending requests wait for
idle. Size application captures the numeric ratio and uses explicit host geometry
inside the owned native park. Three split choices are25%,37.5%(default),50%.
No75% choice. The source-only and full-companion ends use corresponding arrows.

Picker is on the full toolbar above Dates, size strip in three dots above Dispatch.
Size-first unpaired navigation opens the picker; new reverse defaults preserve
existing explicit pairs. Removed visible Turn off Companion, not operator recovery.
Local JS orchestration4/4 and Qt menu click3/3 passed; full11-QMD+AppLoad composition
and changed-QML syntax passed. No tablet input automation. Same Pro branch.

- Session:20260923T210000Z-1; pairs seed from200000 retained settings.
- Manifest:942e3fc1d0c252e0aa8650df4fccfe3edb0b896dd09c6584368ca76357ce0eca.
- Controller:e721a4b7c0a6cf1e2ecfb9e25e6a25ed102297ac59a56a468ef00e58fdac78e5.
- Backup:a9f60d096af4735e1760577af6819a7803411f1bae8cdb4185ad8dfc0f88b7cd.
- Prior200000 stopped normally and restored base160567 before preparation.

## Revision200000 — suspend-aware watchdog

190000 automatically restored baseUI153378 with reason `ui-heartbeat-lost`.
The native log shows wake events at15:54:43 and15:55:56, each followed by
resumed heartbeats. The old uptime deadline counted suspended time and could
race the UI on wake. No Companion exception was observed in that log.

The replacement counts completed missed polls, not elapsed uptime. After31
consecutive one-second watchdog polls without a heartbeat it still recovers;
native-failure/process-exit/manual-stop safeguards are unchanged. No pen or
power injection, notebook creation or firmware/boot writes.

- Session:20260923T200000Z-1; seed from190000 retained pairing settings.
- Manifest:afae633c50c8c066863d3bdd9b15ad106490faef00e9ebc2ce47ff9eafbee331.
- Controller:5f6c3b1f8838fbc8a9c39946664c1953aeb588fbe26839e46a868c81769c62d2.
- Mac-verified backup:1243af4e2dc3ebc867d4e1ab9875d730a9c3f8599f94ad214f3c1259a78f2a40.
- Invocation:42c46aa4f3084f72a3d812d4f879cc8f.
- Startup receipt16:02:40UTC: host ready with ink/settings true, UI155746,
  owner154630/watch155390 active, NRestarts0. No automated device interaction.

Operator stop uses200000's controller, ID and manifest above. Never replay run.

## Superseded revision190000 — hairline/shared toolbar

Installed at15:52UTC following explicit user request and screenshot guidance.
Reference: RMHacks' Split Document wiki plus the local upstream
`rmHacks/split_doc/toolbar.qmd`, `focus_switching.qmd`, and `layers_menu.qmd`.
https://github.com/mb1986/rm-hacks/wiki/Split-Document-0.0.10
No old-firmware RMHacks patch or proprietary resource was copied into this repo.

Changes: two-pixel separator without controls/title; native primary toolbar above
both canvases; shared native writing-tool state copied under the owned park;
Undo/Redo follow the last active pane; pictorial small/balanced/large/full/close
controls in the native document menu. Full view uses native document opening and
retains a source-page return, rather than creating a zero-height primary surface.

Prior pilot stopped through its recovery switch. Pair metadata copied from its
retained settings; normal app settings and notebook contents not overwritten.

- New session:20260923T190000Z-1.
- Manifest:5a47767cd00ebe1a006efe5358c1efaef64b7920b922abab0ed2af688197281b.
- Controller:928e00726ae89dab587c9ac72bc0eac682bab4cf955b1ccc23b8722f50b64d9c.
- Backup:f150cb05f6f4e3ce28930d871b92cdd0fe18a869b31200e9832de9d22c286c84.
- UI152120, owner151105, fallback151817; all active with NRestarts0.
- Host ready15:52:29.938UTC, `ink=true; settings=true`.
- Local composed-package syntax parsed. No synthetic input, test-note creation
  or automated device interaction. Startup receipt only; user feedback next.

Current operator stop command, if needed:

```sh
/bin/bash /home/root/.codex-staging/companion-20260923T190000Z-1/probe.sh stop \
  20260923T190000Z-1 5a47767cd00ebe1a006efe5358c1efaef64b7920b922abab0ed2af688197281b
```

The sections below describe the superseded170000 installation.

## Authority and limits

User explicitly requested: "stop verifying. Let me use. I'll provide feedback".
Stopped further automated trials. Built a separate hands-on pilot, not a relabelled
diagnostic or full release. No new test notebooks, synthetic pen/power events,
firmware/root/boot writes, Move changes or recurring-install additions.

## Installation

- Device: Paper Pro/Ferrari,3.29.0.148, known pinned SSH key, Wi-Fi10.100.102.101.
- Session/package:20260923T170000Z-1. No earlier diagnostic capsule replayed.
- Manifest:fe6dce5b26acf16686711aa8b9bb9ca2adf49db3ccdbb7f4f9198c38c13324e3.
- Controller:c28285d4a13e72085c0d652d6101ffe06989e9f907edcb98e24cc4b69ed47ce8.
- Backup:b365d350e770512bc40386147c8a80602937a5405d927bf93534a74585651335,
  saved on tablet and Mac; contains prior runtime/app settings, no notebook contents.
- One UI restart. Native host ready15:22:32UTC, `ink=true; settings=true`.
- UI132308, pilot owner131303, fallback132006, active/NRestarts0.
- Startup receipt and subsequent heartbeat read once; no additional interaction
  or acceptance trial. The user owns the next hands-on interaction.

Source branch remains`beta/pro/3.29.0.148`. Private package lives under
`build/pilot-20260923T170000Z-1/`; backup under
`build/receipts/20260923T170000Z-1/preimages.tgz`.
Remote staging/backup roots retain the existing`companion-` prefix.

## Runtime and off switch

Document toolbar menu: Companion notebook → choose another local portrait note.
Both panes accept native writing; ruler selects⅓/½/⅔. Down arrow tucks, bottom
Open companion restores. Same menu: Turn off Companion. It parks input, closes
the companion using native APIs, gives autosave five seconds, then requests
normal-base restoration. Reported native failure or30seconds without UI heartbeat
also triggers fallback. Recovery has the existing bounded base/stock restart
budget and retains pairing metadata instead of overwriting notebook contents.
User settings changed during the session are preserved, not rolled back.

No boot persistence: reboot clears the Companion runtime override. The guard is
a fallback, not proof against losing unsaved strokes. Mid-stroke sleep, actual
eraser/boundary edge cases and full plugin attribution remain unqualified.

If the UI off switch is unavailable, explicit operator recovery request:

```sh
/bin/bash /home/root/.codex-staging/companion-20260923T170000Z-1/probe.sh stop \
  20260923T170000Z-1 fe6dce5b26acf16686711aa8b9bb9ca2adf49db3ccdbb7f4f9198c38c13324e3
```

This writes a stop request for the existing independent guard. Do not run`prepare`
or`run`again for this session; it is not a repeatable installation entry yet.
