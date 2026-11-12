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
  `/admin/sigs`,
  `/admin/sigs/[sigId]?tab=info|staff|members|requests|events|analytics`,
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

- Tabs 最新 / 熱門 / 我的 SIG on desktop and mobile (`app/(home)/useHomeFeed.ts`,
  remembered per browser tab in sessionStorage). 我的 SIG needs a login
  (`useMySigPost`, `GET /post/list/mysig`); with no SIG it shows an empty
  state that leads to the SIGs.
- Pinned posts (`/post/list/pinned`) open the 最新 and 熱門 feeds with 「置頂」
- 熱門貼文 (desktop card, 熱門 tab): most liked of the last 30 days;
  fewer than 3 liked posts widens to 180 days, then all time (`useTopPost`,
  `useHotPostList`)

## Notifications, web push and PWA

Contract: `design/api-contract-v4.md` §2.

- Bell next to the user menu (`components/Notifications/NotificationBell.tsx`):
  unread count from `GET /notification/unread-count`, every 60 s while the
  tab is visible, when it becomes visible and on window focus
  (`utils/useNotifications`). Desktop opens a dropdown with the newest 8;
  phones go to `/notifications`.
- `/notifications`: 全部 / 未讀, opening one marks it read, 全部標為已讀,
  and 「通知設定」. Sentences are built from type, actor and target in
  `modules/notifications/describe.ts`; only same-site `link`s are followed.
- Settings (`NotificationSettings.tsx`): a 「通知設定」 row on your own
  profile opens a dialog (also `#notification-settings` on the profile and
  `/notifications?settings=1`). Push per type, the comment email
  (`notificationSettings.email.comment`, the old `notifyComments`) and the
  weekly digest, which is off unless turned on. Each switch saves at once
  through `POST /user`.
- Web push (`modules/push`): `public/sw.js` only shows pushes and opens
  their link; it has no fetch handler and caches nothing. It is registered
  in production builds only, scope `/`. Subscribing always starts from the
  「開啟手機通知」 (desktop: 「開啟瀏覽器通知」) button. iPhone / iPad
  outside the home-screen app get install steps instead. Logging out
  removes this browser's subscription.
- PWA: `app/manifest.ts`, icons in `public/icons/pwa-*.png` (made from
  `public/images/logo.svg` and `logo_mobile_v2.svg`). The install prompt
  (`beforeinstallprompt`, `modules/push/install.ts`) is kept, never shown
  by itself, and offered in the settings and once on `/notifications`.

## Profile and SIG pages

- Your own profile: 「通知設定」 (see above), a 「按讚過的貼文」 tab, and on
  mobile 「關於我」 editing
- SIG pages: 「編輯 SIG」 (description and avatar) for that SIG's leaders,
  指導老師 and admins; 「退出 SIG」 for members
- Image fields may be a URL, `/image/<id>` or a bare image id; render them
  through `imageUrl()` (`modules/imageUrl`)

## Portfolio, teacher feedback, SIG events, showcase, analytics, Discord

Contract: `design/api-contract-v4.md` §3.1–§3.6. Everything that lives on
the SIG page or the post page is a self-contained component with plain
props, so the user-side redesign can move it without rewriting it.

- 學習歷程 `/portfolio` (`app/portfolio/`): your own posts, SIGs and teacher
  feedback (`GET /user/me/portfolio`). Every post is in by default; the
  checkboxes and 「包含老師回饋」 pick what goes in. 「下載 PDF」 calls
  `window.print()`; `app/portfolio/print.css` prints only the document on
  A4 (no header or dock, page break before the posts, posts not split).
  The document is `components/Portfolio/PortfolioDocument.tsx`; your own
  profile links to it (`PortfolioEntry`).
- 老師回饋 (`components/TeacherFeedback/TeacherFeedback.tsx`, anchor
  `#feedback`): shown to the post's author (only once there is feedback),
  the SIG's 指導老師 and admins; SIG leaders do not see it. 指導老師 and
  admins get the editor; only a feedback's author edits it, its author or
  an admin deletes it. Desktop: right column above the comments; mobile:
  above the comments.
- SIG events (`components/SigEvents/`): `SigEventList` (upcoming, then
  past on request), `SigEventCard` (RSVP with capacity, 「加到 Google
  日曆」, 「下載 .ics」, manager 編輯 / 刪除) and `SigEventEditor` (create /
  edit dialog). An event is past only after `endAt`, so one that is on
  now can still be joined. Calls and rules are in `modules/sigEvents`,
  cached lists in `utils/useSigEvents`. The SIG page shows them under the
  「活動」 tab (`?tab=events`, the link in event notifications).
- 精選成果: `components/SigShowcase/SigShowcase.tsx` renders the resolved
  `featuredPosts` of `GET /sig/:id` / `/sig/@:customId` (`/sig/list` and
  `POST /sig/:id` carry ids only; `featuredPostsOf()` ignores those).
- Admin SIG detail (`app/admin/(admin)/sig/`): 基本資料 adds the 精選成果
  picker (`ShowcasePicker`, up to 6, ordered) and 「Discord 通知」
  (`DiscordSetting`: the URL is never shown again after saving; 測試 and
  清除). New tabs 「活動」 (`EventsTab`: events, RSVP list in the drawer,
  Excel export that pages through `GET /event/:id/rsvps` 100 at a time)
  and 「數據」 (`AnalyticsTab`: chart.js bar charts, `?months=6|12|24`).
- `POST /sig/:id` answers HTTP 400 for every refusal, so status 4001 there
  means forbidden.

## Data & Info Pages

- `app/data/` — SIG lookup by id (`@mdcsl`), desktop and mobile
  (`useSigLookup.ts`)
- `app/info/` — platform information and status links

## Validation Module

- Located at `modules/validation/index.ts`
- Helpers: `isValidObjectId`, `isValidCustomId`, `sanitizeUrlParam`
