---
paths:
  - "supabase/**"
  - "src/lib/supabase/**"
  - "src/lib/db.ts"
  - "src/app/api/**"
  - "src/app/page.tsx"
  - "src/app/tasks/**"
---

# Supabase / Database Rules

Loaded automatically when working with SQL, migrations, the data layer, or API
routes. Companion to `@CLAUDE.md`.

## Migrations

- SQL lives in `supabase/migrations/` named `YYYYMMDD_<description>.sql`, plus
  `supabase/setup_notifications.sql`.
- There is **no automated migration runner** in the repo. Migrations are applied
  to the Supabase project directly (Supabase MCP tools or the dashboard).
- Add schema changes as a **new timestamped file** — never edit an already-applied
  migration. Use `CREATE TABLE IF NOT EXISTS` / `ON CONFLICT DO NOTHING` so files
  stay idempotent, matching the existing style.
- Run `list_tables` (Supabase MCP) before assuming a table's shape rather than
  trusting `current_schema.sql` (a stale/garbled artifact — ignore it).

## Tables (task app uses the `task_` prefix)

- `task_tasks` — `status` ∈ {`col-todo`, `col-inprogress`, `col-review`,
  `col-done`}; `priority`, `due_date`, `tags text[]`, `field_id`,
  `recurrence_type` / `recurrence_interval` / `recurrence_end_date`,
  `parent_task_id`, and a **legacy** `assignee_id`.
- `task_assignees` (`task_id`, `user_id`) — join table for **multiple
  assignees**; supersedes `assignee_id`. New code reads/writes assignees here.
  The single `assignee_id` column is kept in sync (`assigneeIds?.[0]`) only for
  backward compatibility.
- `task_profiles` — user profiles (`name`, `color`, `location`, `hourly_wage`).
- `task_fields` — 圃場 (fields).
- `task_work_logs` — `harvest_quantity` / `harvest_unit`, `duration`, `notes`.
- `task_push_subscriptions` — Web Push subscriptions per user.
- A legacy `acc_*` accounting schema exists in `20260202_consolidate_schema.sql`
  but is served by the **external** accounting app — do not build against it here.

## Row Level Security (RLS)

- RLS is **enabled** on tables; policies live in the migrations (see
  `20260205_fix_all_policies.sql`, `20260205_multiple_assignees.sql`).
- If a Supabase write silently fails or returns no rows, **suspect a missing or
  incorrect RLS policy first** — the anon client is subject to policies.

## snake_case ↔ camelCase mapping

Supabase returns `snake_case`; app types (`src/types/`) are `camelCase`. The
mapping is done **by hand** at each fetch/write boundary — there is no ORM.

- Read side: `fetchTasks` in `src/app/page.tsx` (e.g. `due_date`→`dueDate`,
  `field_id`→`fieldId`, joins `task_assignees`).
- Write side: `handleSaveTask` / recurrence insert in the same file.
- When adding a column, update **both** the DB write payload and the read-side
  mapping, or the field silently disappears.

## Supabase clients — pick the right one

- `src/lib/supabase/client.ts` — browser (`"use client"`), anon key, RLS applies.
- `src/lib/supabase/server.ts` — server components / route handlers, cookie-based.
- `src/lib/supabase/middleware.ts` — session refresh + auth gating.
- API routes needing admin access build a service-role client from
  `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS — server only, never ship to client).

## API routes / webhooks

- Lazily initialize `web-push` / service-role clients **inside the handler** so a
  missing env var never breaks the Vercel build. Preserve this pattern.
- `api/webhooks/tasks` and `api/web-push/send` validate `WEBHOOK_SECRET` /
  require the service role. Prune dead push subscriptions on 404/410.
