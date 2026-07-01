---
paths:
  - "src/components/**"
  - "src/app/**/*.tsx"
  - "src/app/globals.css"
---

# Frontend / UI Rules

Loaded automatically when editing components, pages, or styles. Companion to
`@CLAUDE.md`.

## Japanese-first UI

- All user-facing strings are **Japanese**. Match the existing tone and the
  status vocabulary: 「予定」「作業中」「確認待ち」「完了」 (these map to the
  `col-todo` / `col-inprogress` / `col-review` / `col-done` statuses).

## Responsive dual-path (critical)

The home page (`src/app/page.tsx`) branches on `window.innerWidth < 768`:

- **Mobile** → `router.push('/tasks/new')` / `/tasks/[id]` (full pages).
- **Desktop** → opens `TaskModal` in place.

`TaskForm` (`src/components/tasks/TaskForm.tsx`) is the **shared** form; `TaskModal`
wraps it for desktop. When you change create/edit behavior, update **both paths**
(the mobile pages and the desktop modal handlers in `page.tsx`).

## Styling

- Tailwind v4 utilities + CSS custom properties defined in `src/app/globals.css`
  (the "Neo-Light" theme). Reference tokens with the arbitrary-value syntax:
  `bg-(--color-bg-primary)`, `text-(--color-text-muted)`, etc.
- **Reuse** existing `--color-*`, `--shadow-*`, `--radius-*`, `--transition-*`
  tokens instead of hardcoding hex values or one-off colors.
- Icons: `lucide-react`. Fonts: Inter + Noto Sans JP via `next/font`.

## Client vs server components

- Interactive components start with `"use client"`.
- Anything using `window`, browser APIs, Dexie (`getDb()`), or the browser
  Supabase client must be client-side and **SSR-guarded** (`typeof window`).
- Pages reading `useSearchParams` must be wrapped in `<Suspense>` (Next.js
  requirement) — keep this when adding search-param usage.

## Errors

- User-facing failures currently surface via `alert()` / `console.error`. Follow
  the surrounding style unless deliberately refactoring toward `ToastProvider`.

## Default view

- The current default UI is the family-first `ListView`
  (`src/components/tasks/ListView.tsx`), **not** the older dnd-kit Kanban `Board`
  under `src/components/board/`. Prefer `ListView` for list changes.
