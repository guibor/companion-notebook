# Companion Notebook — Project Playbook

Read a source while writing in a notebook pulled over its lower edge.

## Purpose

- Problem: document switching loses reading/writing context.
- User: Paper Pro owner reading PDFs and making notes in separate notebooks.
- Outcome: fewer place-recovery actions without compromising handwriting.

## Scope

- In scope: portrait overlay, direct writing in either pane, independent scroll, paired documents.
- Out of scope: same-document pairs, Move, landscape, server, native file edits.
- Success: user-accepted fluidity on hardware, no lost or wrong-document edits,
  and ten of ten pair resumes recovering both positions.

## Milestones

- Completed locally: tested interaction controller, Qt Quick prototype, native
  host/view adapters, pair settings and exact-firmware QMD composition candidate.
- Next: guarded native rendering probe after independent base-runtime qualification
  and explicit ReManager handover. Native candidate writing is disabled.
- Later: native pen/save and extension tests, then a personal pilot.

## Open questions

- Native compositor and input occlusion are unknown; see NATIVE-GATES.md.
- Measure hardware latency against stock before deciding whether live dragging passes.

Hypothesis: keeping reference and notes visible reduces place-recovery effort.
Compare PDF + notes and two-notebook synthesis tasks with ordinary switching.
Observe recovery actions, wrong-target attempts, and voluntary reuse; do not
substitute desktop frame rate or test counts for e-ink usability evidence.
