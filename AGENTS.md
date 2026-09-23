# Companion Notebook — Agent Instructions

The playbook is the source of truth. Read it before writing code, especially:

- [playbook/README.md](playbook/README.md) — entry point and navigation
- [playbook/PROJECT.md](playbook/PROJECT.md) — project goals, scope, and non-goals
- [playbook/ENGINEERING.md](playbook/ENGINEERING.md) — architecture, stack, and implementation conventions
- [playbook/log/](playbook/log/) — durable decisions, research, and changelog entries

## Rules

- Read `prd.org`, `design.md`, and `playbook/NATIVE-GATES.md` first.
- This repository contains a desktop interaction prototype and an exact-3.29 native rendering candidate. The native candidate has writing disabled and is not a qualified tablet release.
- ReManager handed over the accepted r1 base after restoration. Preserve that exact base and use a separate, bounded controller for Companion; never weaken or replay the base's stock-only 11-QMD guard while it is active.
- Never deploy mock ink, edit native notebooks, or weaken a native qualification gate.
- Explicit later user decision2026-09-23: stop automated qualification and allow
  hands-on feedback. A separate manually activated experimental pilot is now
  installed, with native input, a visible off switch and normal-base fallback.
  This is not a qualified release. Do not resume automated tablet trials or
  interfere with the user's session without a new request. See the pilot receipt.
- Pro and Move remain independent. No Move work in the initial scope.
- Ask current/new branch at session start; preserve other tasks' dirty files.
- Update `prd.org` for requirements and `design.md` for implementation changes.
- Read before writing.
- If code contradicts the playbook, flag it.
- Do not expand scope beyond the request.
- Prefer editing existing files over creating new abstractions.
- Record durable product or engineering decisions in `playbook/log/`.
