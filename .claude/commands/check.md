---
description: Run the project quality gate (lint + production build)
---

Run the project's quality gate exactly as Vercel would, and report the result.

There is no test suite in this repo, so a clean `npm run build` plus `npm run
lint` is the primary quality gate — the same one CI/Vercel enforces.

Steps:

1. Ensure dependencies are installed (`[ -d node_modules ] || npm install`).
2. Run `npm run lint`.
3. Run `npm run build`.
4. If either fails, summarize the errors, fix them (respecting the conventions in
   `@CLAUDE.md` and the path-scoped rules under `.claude/rules/`), and re-run
   until both pass. Do not "fix" by suppressing errors or loosening TypeScript
   strictness unless that is genuinely the right call — explain if you do.
5. Report a concise pass/fail summary. Do not commit or push unless I ask.
