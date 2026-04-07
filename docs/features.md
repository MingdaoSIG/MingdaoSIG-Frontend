# Features

## Announcement System

- Announcement SIG ID: `652d60b842cdf6a660c2b778`
- Announcements stay pinned for 7 days
- Visual style: white background, no cover image

## Infinite Scroll

Implemented in `components/Threads/desktop/ThreadsList.tsx`.

Triggers load when scroll position is within **600px of the bottom**:

```typescript
const isNearBottom = scrollTop + clientHeight >= scrollHeight - 600;
```

## Markdown Editor

- Package: `md-editor-rt`
- Preview theme: `github`
- Must be loaded with `dynamic(..., { ssr: false })` (client-only)
- Editor auto-saves content to `localStorage` keys: `editorContent`, `postData`

## Session Management

- Use `useUserAccount` hook to read login state
- `useFetch` hook for data fetching with built-in caching via TanStack Query
- `useAlert` hook wraps SweetAlert2 for consistent dialogs

## Changelog Page

- Route: `app/changelog/`
- Displays version history from a static JSON config (`config/changelog.json`)
- Desktop and mobile layouts

## Dashboard

- Route: `app/dashboard/`
- Shows SIG statistics with colour-coded cards (colours from `config/sigDefaultColors.ts`)
- Desktop and mobile layouts with chart visualisations

## Admin Panel

- Route: `app/admin/`
- Sub-pages for managing SIG leaders (`sig-leader/`), advisors (`sig-advisor/`), members (`sig-members/`), posts (`post/`), and post queries (`post-query/`)
- Requires elevated permissions

## Data & Info Pages

- `app/data/` — aggregated platform statistics (static JSON config)
- `app/info/` — platform information and status links

## Validation Module

- Located at `modules/validation/index.ts`
- Helpers: `isValidObjectId`, `isValidCustomId`, `isValidSigId`, `isValidUUID`, `sanitizeUrlParam`, `isMingdaoEmail`
