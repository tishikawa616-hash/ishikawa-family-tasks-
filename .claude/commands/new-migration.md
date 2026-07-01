---
description: Scaffold a new Supabase migration following repo conventions
argument-hint: <short-description>
---

Create a new Supabase migration for: **$ARGUMENTS**

Follow the conventions in `.claude/rules/database.md`:

1. Determine today's date and create `supabase/migrations/YYYYMMDD_<slug>.sql`,
   where `<slug>` is a short snake_case description of `$ARGUMENTS`. If a file for
   today already exists, pick a distinct, descriptive slug — do not overwrite.
2. Write idempotent SQL: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
   `ON CONFLICT DO NOTHING`, `DROP POLICY IF EXISTS` before `CREATE POLICY`, etc.,
   matching the style of the existing migration files.
3. Task-app tables use the `task_` prefix. If you add a table, **enable RLS** and
   add policies consistent with `20260205_fix_all_policies.sql`.
4. Never edit an already-applied migration — new changes are always a new file.
5. If the change adds/renames a column the app reads or writes, remind me to
   update **both** the write payload and the read-side snake_case↔camelCase
   mapping (see `fetchTasks` / `handleSaveTask` in `src/app/page.tsx`) and the
   relevant type in `src/types/`.
6. Do **not** apply the migration to the live Supabase project unless I explicitly
   ask — just scaffold the file and show it to me.
