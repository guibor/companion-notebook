# Companion Notebook — Engineering Playbook

Desktop interaction prototype plus an undeployed exact-3.29 native rendering
candidate. There is no qualified installer yet, and native writing is disabled.

## Architecture

- Main components: native-view bridge and host, pairing store, QMD builder;
  separate pure JS interaction controller, Qt Quick prototype and synthetic pages.
- Runtime: Node tests and local Qt 6.8.2; tablet target reports Qt 6.10.3.
- External dependencies: Qt Quick/Qt Test; no npm dependencies.

## Repository map

- `src/Workspace.js`: geometry, pairing, focus and input ownership.
- `src/PairStore.js`: validated, content-free native pairing metadata.
- `native/`: real host plus exact-firmware bridge/view injection snippets.
- `build-native.mjs`: pinned, local-only native candidate builder.
- `ui/`: actual overlay, synthetic pages and desktop window.
- `tests/`: Node state/schema, Qt pointer/native-boundary-mock and exact-QMD composition tests.
- `artifacts/`: ignored visual test output, never evidence of native acceptance.

## Conventions

- JavaScript shared by Qt and Node; Qt Quick for interaction.
- Real pointer tests complement state invariants, including taps behind overlay.
- No release deployment until NATIVE-GATES.md passes; a pen-disabled probe needs
  the preceding gates and explicit ReManager ownership handover. Mocks never
  qualify native ink, save durability or e-ink fluidity.
- Keep docs current; never copy proprietary firmware resources into this repo.

## Open technical questions

- Native direct framebuffer occlusion, scoped mutable globals, and pen-surface clipping.
