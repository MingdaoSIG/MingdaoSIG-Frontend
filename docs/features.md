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

- Route: `app/admin/`
- Sub-pages for managing SIG leaders (`sig-leader/`), advisors (`sig-advisor/`), members (`sig-members/`), posts (`post/`), and post queries (`post-query/`)
- Requires elevated permissions (`permission === 2`); pages fetch nothing
  until that is known
- `post/` pages through `GET /post/list/admin` (50 per page, newest first,
  title search) and `post-query/` calls `GET /post/list/range`; both send
  the admin JWT

## Comments

- Shared by desktop (`desktop/ThreadInfo.tsx`) and mobile (`mobile/Thread.tsx`)
  through `components/useComments.ts` (list, reply target, expanded threads,
  edit and delete) and `components/CommentView.tsx` (one comment UI with a
  `desktop` / `mobile` variant)
- Edit: your own comments (`POST /comment/:id`). Delete: your own, or any
  comment on a SIG you manage (leader or 指導老師), or as an admin
  (`DELETE /comment/:id`). Rules live in `useCommentPermissions.ts`
- Replies are one level deep: 「回覆」 on a reply attaches to its parent.
  Threads with more than two replies start collapsed
- Edited comments show 「（已編輯）」 (`edited` from the backend)

## Share previews, sitemap, robots

- `/post/[postID]/page.tsx` is a Server Component with `generateMetadata`
  (`metadata.ts`: title + ` | MDSIG`, ~120 character excerpt, cover as
  `og:image`); the post itself still renders in the client `PostPage.tsx`.
  Any failure falls back to the layout's metadata
- `app/sitemap.ts` (per request, from `GET /post/sitemap`, static pages only
  when that fails) and `app/robots.ts`

## Hashtags and search

- Hashtags on cards and post pages link to `/tag/<tag>` (`modules/hashtag`
  strips a stored leading `#`)
- `/search?q=` searches titles, hashtags and content; the header has a
  search box (desktop) or icon (mobile). With no query, and with no
  results, it shows the top hashtags (`components/Tags/TopTags.tsx`)

## Home

- Pinned posts (`/post/list/pinned`) open the feed with 「置頂」
- 熱門貼文 (desktop card, mobile 熱門 tab): most liked of the last 30 days;
  fewer than 3 liked posts widens to 180 days, then all time (`useTopPost`,
  `useHotPostList`)

## Profile and SIG pages

- Your own profile: 「有人留言時寄信通知我」 (`notifyComments`), a
  「按讚過的貼文」 tab, and on mobile 「關於我」 editing
- SIG pages: 「編輯 SIG」 (description and avatar) for that SIG's leaders,
  指導老師 and admins; 「退出 SIG」 for members
- Image fields may be a URL, `/image/<id>` or a bare image id; render them
  through `imageUrl()` (`modules/imageUrl`)

## Data & Info Pages

- `app/data/` — SIG lookup by id (`@mdcsl`), desktop and mobile
  (`useSigLookup.ts`)
- `app/info/` — platform information and status links

## Validation Module

- Located at `modules/validation/index.ts`
- Helpers: `isValidObjectId`, `isValidCustomId`, `sanitizeUrlParam`
