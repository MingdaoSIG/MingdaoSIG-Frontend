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
- TanStack Query hooks (`usePost`, `useAllPost`, etc.) for data fetching with built-in caching
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

- Route: `app/admin/` (design: `design/admin-redesign-2026.html`, API:
  `design/api-contract-v3.md` §2–§3). One responsive UI: a left sidebar on
  desktop, a section switcher above the page on phones; no dock inside
  `/admin`, the header shows 「回到網站」 instead.
- Access (`utils/useAdminAccess`): admins (`permission === 2`) see every
  section; SIG managers (leader or 指導老師 of a SIG in `GET /sig/list`)
  see 總覽, SIG and 入社申請 for their SIGs; everyone else gets the 404
  page. Nothing is fetched before the role is known. The header shows
  「管理平台」 to admins and managers.
- Sections: `/admin` 總覽, `/admin/posts`, `/admin/comments`,
  `/admin/sigs`, `/admin/sigs/[sigId]?tab=info|staff|members|requests`,
  `/admin/join-requests`, `/admin/users`, `/admin/exports`, `/admin/audit`.
  The old pages (`post`, `post-query`, `sig-leader`, `sig-advisor`,
  `sig-members`) redirect to these (`next.config.js`).
- Shared code lives in `app/admin/(admin)/`: `api.ts` (react-query reads,
  writes through `apiRequest`), `components/` (DataTable: table on
  desktop, cards on phones; Drawer: side panel / full-screen sheet; Modal
  and `useConfirm` on `<dialog>`), `useQueryState.ts` (filters, sort and
  page in the URL query).
- Excel exports (`xlsx`, loaded on demand): member lists per SIG and the
  date-range post export (`GET /post/list/range`).

## Data & Info Pages

- `app/data/` — aggregated platform statistics (static JSON config)
- `app/info/` — platform information and status links

## Validation Module

- Located at `modules/validation/index.ts`
- Helpers: `isValidObjectId`, `isValidCustomId`, `sanitizeUrlParam`
