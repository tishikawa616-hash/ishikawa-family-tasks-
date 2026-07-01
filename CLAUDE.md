# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## Golden rules

- **Verify with `npm run lint` && `npm run build` before committing** — there is
  no test suite, so a green production build is the primary quality gate (run
  `/check`).
- **UI is Japanese.** Keep user-facing strings in Japanese; match the existing
  tone (statuses: 「予定」「作業中」「確認待ち」「完了」).
- **Don't commit, push, or open a PR unless explicitly asked.** When asked, use
  the designated feature branch and `git push -u origin <branch>`.
- **Preserve lazy client init** (Supabase service-role / web-push clients are
  created inside handlers) so a missing env var never breaks the Vercel build.
- **Ignore committed log/schema artifacts** as source of truth (see Repo Hygiene).

## Project Overview

**Ishikawa Family Tasks** (石川家タスク管理) is a mobile-first PWA task management
app for a family farming operation in Nishihara Village, Kumamoto, Japan (西原村).
It manages agricultural tasks across fields (圃場), tracks work logs and harvest
data, and surfaces weather forecasts to help plan farm work.

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"`) + CSS custom properties
- **Backend**: Supabase (Postgres, Auth, Realtime, Row Level Security)
- **Offline**: PWA with a custom service worker, IndexedDB via Dexie
- **Deploy**: Vercel

## Commands

```bash
npm run dev      # Dev server (http://localhost:3000)
npm run build    # Production build — this is what Vercel runs, must pass
npm run start    # Serve the production build
npm run lint     # ESLint (eslint-config-next: core-web-vitals + typescript)
```

## Environment Variables

Read from the environment (`.env*` is gitignored). Client-exposed vars use the
`NEXT_PUBLIC_` prefix:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-only admin client (API routes/webhooks)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — Web Push (VAPID)
- `WEBHOOK_SECRET` — shared secret validating Supabase → API webhook calls

## Architecture

### Routing (`src/app/`, App Router)

- `page.tsx` — Home. List/board + calendar view, field filter, realtime
  subscription, recurrence handling, completion work-log flow.
- `login/page.tsx` + `auth/callback/route.ts` — Supabase auth.
- `tasks/new/page.tsx`, `tasks/[id]/page.tsx` — mobile full-page task
  create/edit (desktop uses a modal on the home page instead — see below).
- `fields/page.tsx` — manage 圃場. `reports/page.tsx` — analytics (charts, work
  heatmap, PDF export). `logs/page.tsx`, `settings/page.tsx`.
- `api/web-push/{subscribe,send}`, `api/webhooks/tasks` — push endpoints and the
  Supabase webhook receiver.

### Responsive dual-path (important)

The home page branches on `window.innerWidth < 768`: **mobile** navigates to full
pages (`/tasks/new`, `/tasks/[id]`), **desktop** opens `TaskModal` in place.
`TaskForm` (`src/components/tasks/TaskForm.tsx`) is the shared form. **Change both
paths** when editing create/edit behavior. (More in `.claude/rules/frontend.md`.)

### Components (`src/components/`)

- `tasks/` — `ListView` (primary family-first list, **current default view**),
  `TaskForm` (shared create/edit form).
- `board/` — older dnd-kit Kanban (`Board`, `Column`, `TaskCard`) **plus** the
  still-used `TaskModal`, `CalendarView`, `TaskComments`, `WorkLogModal`,
  `CompletionWorkLogModal`. Barrel: `board/index.ts`.
- `layout/BottomNav.tsx` — mobile nav (ボード/予定/圃場/分析/家計簿). The 家計簿
  tab links out to a **separate external app** (`ishikawa-accounting.vercel.app`).
- `pwa/`, `weather/WeatherWidget.tsx`, `reports/WorkHeatmap.tsx`,
  `NotificationSettings.tsx`, `ui/ToastProvider.tsx`.

### Data layer (`src/lib/`)

- `supabase/{client,server,middleware}.ts` — browser / server / session clients.
- `db.ts` — Dexie/IndexedDB (`IshikawaTasksDB`) for offline work logs, created
  lazily via `getDb()` and SSR-guarded.
- `weather.ts` — Open-Meteo client (no key; Nishihara coords) + `isGoodFarmingDay()`.
- `utils.ts` — `cn()`. `seed.ts` / `data/mockData.ts` — sample data. `utils/pdfGenerator.ts`.

### Types (`src/types/`)

`board.ts` (`Task`, `Column`, `Board`, `Profile`), `field.ts` (`Field`,
`WorkLog`, `TaskComment`). TS is `camelCase`; the DB is `snake_case` — mapped by
hand at fetch/write boundaries (see `.claude/rules/database.md`).

## Database, Realtime & Push (summary)

- Supabase Postgres with the `task_` table prefix and **RLS enabled**. Full
  schema, RLS, migration, and snake_case↔camelCase details live in
  **`.claude/rules/database.md`** (auto-loads when you touch SQL / the data layer).
- Home page subscribes to `postgres_changes` on `task_tasks` and refetches on any
  change; optimistic UI updates precede DB writes. Completing a recurring task
  inserts the next occurrence (date-fns) and copies assignees — see
  `handleTaskMoved` in `src/app/page.tsx`.
- PWA: `public/manifest.json` + `public/custom-sw.js`. Offline work logs sync via
  `OfflineSyncManager`. Push: subscribe → `api/web-push/subscribe` → Supabase
  webhook / `api/web-push/send` → VAPID send, pruning dead subscriptions (410/404).

## Conventions

- **Imports**: `@/*` alias → `src/*`.
- **Client vs server**: interactive components start with `"use client"`; anything
  using `window`/browser APIs/Dexie/browser Supabase must be SSR-guarded.
- **Styling**: Tailwind v4 + `--color-*` / `--shadow-*` / `--radius-*` tokens in
  `src/app/globals.css` via `bg-(--color-...)` syntax — reuse tokens, don't
  hardcode colors. Icons: `lucide-react`. Fonts: Inter + Noto Sans JP.
- **Suspense**: wrap pages using `useSearchParams` in `<Suspense>`.
- **Errors**: currently `alert()` / `console`; follow the surrounding style.
- More UI detail in `.claude/rules/frontend.md` (auto-loads for components/pages).

## Repo Hygiene

- Root build/log artifacts (`build_log*.txt`, `full_build.log`, `tsc_log.txt`,
  `lint_output.txt`, `current_schema.sql`) are noise — not source of truth; don't
  add more.
- `instructions.md` is a Japanese product/vision brief, not build instructions.
  `.agent/workflows/resume_session.md` is stale (references the old Kanban UI).

## Claude Code setup in this repo

- `.claude/rules/` — path-scoped rules loaded on demand: `database.md` (SQL / data
  layer / API routes), `frontend.md` (components / pages / styles).
- `.claude/commands/` — `/check` (lint + build quality gate),
  `/new-migration <desc>` (scaffold a Supabase migration by convention).
- `.claude/settings.json` — permission allowlist for safe build/git commands and a
  `SessionStart` hook that runs `npm install` when `node_modules` is missing
  (useful for fresh Claude Code on the web sessions).
- Auto memory is on by default; durable facts you'd otherwise re-explain belong in
  this file or a rule, not just chat.

## Git Workflow

- Don't commit/push/PR unless asked. On request, push to the designated feature
  branch with `git push -u origin <branch>`.
- Match existing commit style (`feat:` / `refactor:` / `Fix:` prefixes).
