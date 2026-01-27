---
description: Resume session and load critical context
---

# Resume Ishikawa Family Tasks Session

## Quick Status

- **Project**: 作業タスクボード (Trello-like Kanban)
- **Stack**: Next.js 16, dnd-kit, Tailwind CSS
- **Last Updated**: 2026-01-27

## Start Development Server

// turbo

```bash
npm run dev
```

## Current Features (All Working)

- ✅ Kanban board with drag & drop
- ✅ Calendar view
- ✅ Add task modal (+button)
- ✅ Neo-Light theme (bright UI)
- ✅ Column background tints

## Key Files to Review

- `src/app/page.tsx` - Main page with state management
- `src/components/board/` - All board components
- `src/data/mockData.ts` - Sample data

## Next Steps (User to decide)

1. Supabase integration (data persistence)
2. Task edit functionality
3. Vercel deployment

## Notes

- Data resets on refresh (mock mode)
- All lint errors resolved
- SSR hydration issues fixed with useSyncExternalStore
