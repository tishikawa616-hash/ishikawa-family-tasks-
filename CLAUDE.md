# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## Project Overview

**Ishikawa Family Tasks** (石川家タスク管理) is a mobile-first, PWA task
management app for a family farming operation in Nishihara Village, Kumamoto,
Japan (西原村). It manages agricultural tasks across fields (圃場), tracks work
logs and harvest data, and surfaces weather forecasts to help plan farm work.

The UI language is **Japanese**. Keep user-facing strings in Japanese and match
the existing tone (e.g. 「予定」「作業中」「確認待ち」「完了」).

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss"`), custom CSS variables
- **Backend**: Supabase (Postgres, Auth, Realtime, Row Level Security)
- **Offline**: PWA with a custom service worker, IndexedDB via Dexie
- **Deploy**: Vercel

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build (this is what Vercel runs — must pass)
npm run start    # Serve the production build
npm run lint     # ESLint (eslint-config-next, core-web-vitals + typescript)
```

There is **no test suite**. Verify changes with `npm run build` and `npm run
lint` before committing — a green production build is the primary quality gate,
and past commits show recurring effort to keep Vercel builds passing.

## Environment Variables

The app reads these from the environment (`.env*` is gitignored). Client-exposed
vars use the `NEXT_PUBLIC_` prefix:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — server-only admin client (API routes/webhooks)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` — Web Push (VAPID)
- `WEBHOOK_SECRET` — shared secret validating Supabase → API webhook calls

Code lazily initializes clients that need these (see `src/app/api/web-push/`)
so that a missing var at build time does not break the Vercel build. Preserve
that pattern.

## Architecture

### Routing (`src/app/`, App Router)

- `page.tsx` — Home. Task list/board + calendar view, field filter, realtime
  subscription, recurrence handling, and the completion work-log flow.
- `login/page.tsx` + `auth/callback/route.ts` — Supabase auth.
- `tasks/new/page.tsx`, `tasks/[id]/page.tsx` — mobile full-page task
  create/edit (desktop uses a modal on the home page instead — see below).
- `fields/page.tsx` — manage 圃場 (fields).
- `reports/page.tsx` — analytics: charts (recharts/chart.js), GitHub-style work
  heatmap, PDF export (jsPDF).
- `logs/page.tsx`, `settings/page.tsx` — work logs and settings.
- `api/web-push/subscribe`, `api/web-push/send`, `api/webhooks/tasks` — push
  notification endpoints and the Supabase webhook receiver.

### Responsive pattern (important)

The home page branches on `window.innerWidth < 768`:
- **Mobile** → navigates to full pages (`/tasks/new`, `/tasks/[id]`).
- **Desktop** → opens `TaskModal` in place.

When changing task create/edit behavior, update **both** paths. `TaskForm`
(`src/components/tasks/TaskForm.tsx`) is the shared form; `TaskModal` wraps it
for desktop.

### Components (`src/components/`)

- `tasks/` — `ListView` (primary family-first list, current default view),
  `TaskForm` (shared create/edit form).
- `board/` — `Board`, `Column`, `TaskCard`, `TaskModal`, `CalendarView`,
  `TaskComments`, `WorkLogModal`, `CompletionWorkLogModal`. Barrel exports via
  `board/index.ts`. Note: an older dnd-kit Kanban board exists here; recent
  commits pivoted the default UI to the family-first `ListView`.
- `layout/BottomNav.tsx` — mobile bottom nav (ボード/予定/圃場/分析/家計簿). The
  家計簿 (accounting) tab links out to a **separate external app**
  (`ishikawa-accounting.vercel.app`) — accounting was intentionally split out.
- `pwa/` — `OfflineSyncManager`, `ClientVersion`.
- `weather/WeatherWidget.tsx`, `reports/WorkHeatmap.tsx`,
  `NotificationSettings.tsx`, `ui/ToastProvider.tsx`.

### Data layer (`src/lib/`)

- `supabase/client.ts` — browser client (`createClient()`, `"use client"`).
- `supabase/server.ts` — server component/route client (cookie-based, async).
- `supabase/middleware.ts` — `updateSession()` used by root `middleware.ts` to
  refresh sessions and gate auth (redirects unauthenticated users to `/login`).
- `db.ts` — Dexie/IndexedDB (`IshikawaTasksDB`) for offline work logs. Created
  lazily via `getDb()` and guarded for SSR (`typeof window`).
- `weather.ts` — Open-Meteo client (no API key; coords default to Nishihara
  Village). Returns Japanese weather labels + `isGoodFarmingDay()` helper.
- `utils.ts` — `cn()` (clsx + tailwind-merge).
- `seed.ts`, `data/mockData.ts` — sample data (home page has a 「サンプルデータを
  投入」 seed button when empty).
- `utils/pdfGenerator.ts` — report PDF export.

### Types (`src/types/`)

`board.ts` (`Task`, `Column`, `Board`, `Profile`), `field.ts` (`Field`,
`WorkLog`, `TaskComment`). TS types use `camelCase`; the DB uses `snake_case`
(see mapping note below).

## Database (Supabase / Postgres)

Migrations live in `supabase/migrations/` (`YYYYMMDD_*.sql`) plus
`supabase/setup_notifications.sql`. There is no automated migration runner in
this repo — SQL is applied to the Supabase project directly (e.g. via the
Supabase MCP tools or dashboard). Add new schema changes as a new timestamped
migration file, and `list_tables` before assuming a table's shape.

Key tables (task app uses the `task_` prefix; a legacy `acc_` accounting schema
also exists in the consolidate migration but is served by the external app):

- `task_tasks` — tasks. Columns include `status` (values `col-todo`,
  `col-inprogress`, `col-review`, `col-done`), `priority`, `due_date`, `tags`
  (text[]), `field_id`, `recurrence_type`/`recurrence_interval`/
  `recurrence_end_date`, `parent_task_id`, and a **legacy** `assignee_id`.
- `task_assignees` — join table for **multiple assignees** (`task_id`,
  `user_id`). This supersedes `assignee_id`; the single column is kept in sync
  for backward compatibility (`assigneeIds?.[0]`) but new code should read/write
  through `task_assignees`.
- `task_profiles` — user profiles (`name`, `color`, `location`, `hourly_wage`).
  Note: the app also queries `task_profiles` for the field filter in some
  places — verify the intended table when touching field/profile queries.
- `task_fields` — fields/圃場.
- `task_work_logs` — work logs with `harvest_quantity`/`harvest_unit`,
  duration, notes.
- `task_push_subscriptions` — Web Push subscriptions per user.

**RLS is enabled** on tables; policies are defined in the migration files (see
`20260205_fix_all_policies.sql`, `20260205_multiple_assignees.sql`). If a
Supabase write silently fails, suspect a missing/incorrect RLS policy first.

### snake_case ↔ camelCase mapping

Supabase returns `snake_case`; app types are `camelCase`. Mapping is done
**manually** at fetch/write boundaries (see `fetchTasks` and `handleSaveTask` in
`src/app/page.tsx`) — e.g. `due_date` ↔ `dueDate`, `field_id` ↔ `fieldId`. When
adding a column, update both the DB write payload and the read-side mapping.

## Realtime & Recurrence

- The home page subscribes to `postgres_changes` on `task_tasks` and refetches
  on any change. Optimistic UI updates are applied before the DB write.
- Completing a recurring task (moving to `col-done`) inserts the next
  occurrence with an advanced `due_date` (date-fns `addDays/addWeeks/
  addMonths`), respecting `recurrence_end_date`, and copies assignees. Logic
  lives in `handleTaskMoved` in `src/app/page.tsx`.

## PWA / Offline / Push

- `public/manifest.json` + `public/custom-sw.js` (service worker handling
  `push` and `notificationclick`). `@ducanh2912/next-pwa` and `web-push` are
  dependencies.
- Offline work logs are stored in IndexedDB (`src/lib/db.ts`) and synced by
  `OfflineSyncManager`.
- Push flow: browser subscribes → `api/web-push/subscribe` (upsert into
  `task_push_subscriptions`) → a Supabase webhook (or `api/web-push/send`) POSTs
  to the API, which sends via VAPID and prunes expired subscriptions (410/404).

## Conventions

- **Imports**: use the `@/*` alias (maps to `src/*`). `scripts/migrate_imports.ts`
  exists for import rewrites.
- **Client vs server**: interactive components start with `"use client"`.
  Anything using `window`, browser APIs, Dexie, or the browser Supabase client
  must be client-side and SSR-guarded.
- **Styling**: Tailwind v4 utilities plus CSS custom properties defined in
  `src/app/globals.css` (the "Neo-Light" theme), referenced with the
  `bg-(--color-...)` arbitrary-value syntax. Reuse the existing `--color-*`,
  `--shadow-*`, `--radius-*` tokens rather than hardcoding new colors.
- **Fonts**: Inter + Noto Sans JP via `next/font` (`layout.tsx`).
- **Icons**: `lucide-react`.
- **Suspense**: pages reading `useSearchParams` are wrapped in `<Suspense>`
  (Next.js requirement) — keep that when adding search-param usage.
- **Errors**: user-facing failures currently surface via `alert()`/`console`.
  Follow the surrounding style unless refactoring toward `ToastProvider`.

## Repo Hygiene

- Several build/log artifacts are committed at the root (`build_log.txt`,
  `build_log_2.txt`, `full_build.log`, `tsc_log.txt`, `lint_output.txt`,
  `current_schema.sql`). These are noise — do not treat them as source of truth
  and avoid adding more.
- `instructions.md` is a Japanese product/vision brief (persona + roadmap), not
  build instructions. `.agent/workflows/resume_session.md` is a session-resume
  note that may be stale (still references the old Kanban-first UI).

## Git Workflow

- Do **not** commit, push, or open a PR unless explicitly asked.
- When asked to push, use the designated feature branch and
  `git push -u origin <branch>`.
- Keep commit messages descriptive; match the existing history style (many are
  prefixed `feat:` / `refactor:` / `Fix:`).
