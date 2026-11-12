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
- Logged out, the editor auto-saves to `localStorage` (`editorContent`,
  `postData`); signed in, it saves cloud drafts instead (see below)

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
  `/admin/sigs/[sigId]?tab=info|staff|members|requests|recruiting`,
  `/admin/join-requests`, `/admin/users`, `/admin/rollover`,
  `/admin/badges`, `/admin/exports`, `/admin/audit`, `/admin/reports`
  (檢舉, admins only).
  The old pages (`post`, `post-query`, `sig-leader`, `sig-advisor`,
  `sig-members`) redirect to these (`next.config.js`).
- Shared code lives in `app/admin/(admin)/`: `api.ts` (react-query reads,
  writes through `apiRequest`), `components/` (DataTable: table on
  desktop, cards on phones; Drawer: side panel / full-screen sheet; Modal
  and `useConfirm` on `<dialog>`), `useQueryState.ts` (filters, sort and
  page in the URL query).
- Excel exports (`xlsx`, loaded on demand): member lists per SIG and the
  date-range post export (`GET /post/list/range`).

## SIG administration

Contract: `design/api-contract-v4.md` §3.7, §5.6–§5.9.

- SIG colours and default covers are data. `modules/sigTheme` resolves a
  colour from the SIG object, then the shared `/sig/list` cache
  (`useSigColor`), then the old table in
  `components/Threads/configs/sigDefaultColors.ts` (the dashboard looks
  SIGs up by name). The editors' `postAPI` use `sigDefaultCover()`:
  `defaultCover` from `/sig/list` (`/sig/:id` for 公告), else
  `modules/sigTheme/fallbackCovers.ts`.
- `/@<old id>` of a SIG or a user answers `redirectTo`; `UserPage`
  replaces the URL (keeping `?tab=` and `#…`).
- Admin SIG detail 基本資料 adds 網址與外觀 (customId with the URL warning,
  colour, default cover; `sig/SigAdminSettings.tsx`) and 封存與合併
  (`sig/SigLifecycle.tsx`, `sig/MergeSigDialog.tsx`; 公告 cannot be
  archived or merged). The SIG list has 新增 SIG
  (`sig/CreateSigDialog.tsx`) and a 已封存 filter (`?archived=1`).
- Recruiting: `components/Sig/RecruitingStatus.tsx` (招生中／暫停招生,
  message, closing time; `inline` or `card`) and
  `components/Sig/JoinSigDialog.tsx` (the SIG's own questions, 必填／選填,
  `{ answers }`, 4040 = not recruiting) are self-contained for the SIG
  page redesign; `useJoinSig` returns the dialog's props. Managers edit
  both in the 招生設定 tab (`sig/RecruitingTab.tsx`, with a preview made
  of the same components). Join request lists show labelled `answers`
  (q1..q3 with the default labels for old requests).
- 學年交接 (`/admin/rollover`): alumni preview → apply (dry run, then
  confirm), next year's leaders in one batch (dry run first; SIGs changed
  meanwhile are reported), and links to merge and move. 貼文 has
  「搬移到其他 SIG」 for the selection or a whole SIG
  (`posts/MovePostsDialog.tsx`).
- The user drawer has 編輯資料 (account id, display name, 關於我;
  name, class and code come from the school system) and a badge editor
  listing `/admin/badges`. 徽章 (`/admin/badges`) creates, edits and
  retires badges; profiles render `GET /badge/list` with the old
  `config/badge.ts` as the fallback (`components/Badges/ProfileBadges.tsx`).

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

- Your own profile: 「通知設定」 (see above), the tabs 貼文 / 按讚過的貼文 /
  收藏 / 系列 / 我的數據 (`?tab=` opens one), and on mobile 「關於我」
  editing. Someone else's profile shows 貼文 / 系列 when they have a series
- SIG pages: 「編輯 SIG」 (description and avatar) for that SIG's leaders,
  指導老師 and admins; 「退出 SIG」 for members
- Image fields may be a URL, `/image/<id>` or a bare image id; render them
  through `imageUrl()` (`modules/imageUrl`)

## Reading and creation (contract v4 §4)

- **Views**: cards, the post page and the series page show `views`
  (`modules/views` formats 1.2 萬). `GET /post/:id` waits for the login and
  sends the JWT, so a signed-in reader counts once per person.
- **Bookmarks** (`utils/useBookmarks`): one `GET /user/me/bookmarks/ids`
  fills every `BookmarkButton` (cards, post page); toggling updates that
  cache at once and rolls back on failure. Own profile tab 收藏 lists
  `GET /user/me/bookmarks`.
- **Author stats**: own profile tab 我的數據 (`StatsTab.tsx`, loaded on
  demand): totals, a chart.js line of daily views (近 7 / 30 / 90 天) and a
  sortable per-post table (cards on phones).
- **Series** (`modules/series`): the post page shows a box per series
  (`components/Series/SeriesNav.tsx`: position, 上一篇 / 下一篇, the full
  list on demand); `/series/[id]` lists the posts in order; own profile tab
  系列 creates, renames, deletes, adds / removes and reorders posts; the
  editor's 「加入系列」 appends the post after publishing or updating.
- **Cloud drafts** (`components/PostEditor/shared/useCloudDraft.ts`,
  `DraftBar.tsx`, `modules/drafts`): signed in, `/new` and the edit page
  save to `POST /draft` 3 s after the last change, on window blur / hidden
  tab, and with a keepalive request on leaving; a failed save says so and
  retries (10 s, 20 s, 40 s, 60 s); 4026 means the 20 drafts are used up.
  The draft being written is remembered per user (`mdsig-cloud-draft:<id>`)
  so a reload resumes it; 「草稿」 lists, resumes and deletes drafts. A draft
  kept on this device (logged-out writing) is offered once for upload
  (`mdsig-local-draft-offered:<id>`). Publishing or updating deletes the
  draft; the edit page offers 「載入草稿」 for an earlier draft of the post.
- **Reports**: 「檢舉」 in the post menu (desktop 「⋯」, mobile sheet) and
  on comments by others opens `components/Report/ReportDialog.tsx` (reason
  + note ≤ 300). 4029 → already reported, 4001 → your own content. Admins
  handle them in `/admin/reports` (table + drawer, 移除內容 / 不處理 with an
  optional note to the reporter); the sidebar shows the open count and the
  overview a 待處理檢舉 card.

## Data & Info Pages

- `app/data/` — SIG lookup by id (`@mdcsl`), desktop and mobile
  (`useSigLookup.ts`)
- `app/info/` — platform information and status links

## Validation Module

- Located at `modules/validation/index.ts`
- Helpers: `isValidObjectId`, `isValidCustomId`, `sanitizeUrlParam`
