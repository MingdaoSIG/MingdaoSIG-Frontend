# Features

## Announcement System

- Announcement SIG ID: `652d60b842cdf6a660c2b778`
- Announcements stay pinned for 7 days
- Visual style: white background, no cover image

## Navigation shell (2026 user-side redesign)

Design: `design/user-redesign-decisions.md` (decisions 1B, 2, 4B, 7B).

- **Phones** (`app/(Layout)/mobile/ToolBar`): a tab bar 首頁 / 探索 /
  ＋發文 / 通知 / 我的. 通知 shows the unread count (and sets the app icon
  badge); tapping the current tab scrolls back to the top
  (`mobile:scroll-to-top`). The header keeps the logo, the search icon,
  登入 (logged out) and 管理平台 / 回到網站.
- **Desktop**: no floating dock. A 58px side rail
  (`app/(Layout)/desktop/SideRail`, first column of the `.wrap[data-rail]`
  grid) with 首頁 / 探索 / 通知 / 我的, then the user's SIGs as colour
  squares (managed, member, followed: `utils/useMySigs`), 「＋ 探索 SIG」
  when there are none, and ＋發文 at the bottom. Squares have a tooltip
  with the SIG name and a dot when the SIG's `latestPostAt` is newer than
  the last visit (`modules/sigSeen`, localStorage
  `mdsig-sig-seen:<userId>`; a SIG seen for the first time starts as
  seen; `useTrackSigVisits` in `app/device.tsx` records visits to
  `/@<sig>`). The header has the logo, the search box and the avatar menu
  (the 我的 hub, `UserMenu.tsx`); 管理平台 stays for admins and managers.
  The admin panel has no rail.
- Which entry is current: `navSection()` in `app/(Layout)/nav.ts`. The 我的
  hub entries (`hubGroups()`) are shared by the avatar menu and `/me`.
- `/me` (我的): profile link, 我的 SIG, 收藏 / 按讚 / 系列 (own profile
  `?tab=`), 學習歷程, 數據, 通知設定, 平台資訊, 管理平台, 登出. Logged out it
  offers 登入 and 平台資訊.
- `/explore` (探索): search, 熱門標籤 and every SIG.
- The site banner and the suspension notice (`SiteNotices`) sit under the
  header on both shells.

## Post cards and infinite lists

- `components/PostCard/PostCard.tsx` (decision 4B): text first (title,
  two-line excerpt, SIG colour dot + SIG name, author, time, likes /
  comments / views, up to four tags, bookmark) with a small thumbnail on
  the right when the post has a cover. `variant="featured"` puts the cover
  on top as a big image (pinned posts); announcements keep the 公告 chip
  and the warm edge. The older lists in `components/Threads/*/ThreadsList`
  render it too.
- `components/PostCard/InfiniteThreadList.tsx`: give it `fetchPage(skip,
  limit, signal)` + `queryKey` (`postListFetcher(path, query)` builds one
  for any backend post list) or an existing infinite `query`
  (`useAllPost`, `useSigPost`, `useThreadPages`…). An IntersectionObserver
  sentinel loads the next page 600px ahead inside the nearest scrolling
  ancestor; pages are never requested twice (`cancelRefetch: false` and a
  guard), posts are deduplicated by `_id`, and it has loading, empty,
  error / retry and end-of-list states, plus an optional `header` slot.
- `/tag/[tag]` uses it, with the post count (`total`) and 相關標籤 (tags
  that appear on the loaded posts with this one).

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
  section; content moderators (`permission === 3`, 內容管理員) see 總覽
  (post, comment and open-report numbers), 貼文, 留言, 檢舉 and 使用者
  (read and mute only); SIG managers (leader or 指導老師 of a SIG in
  `GET /sig/list`) see 總覽, SIG, 入社申請 and 廣播通知 for their SIGs. A
  content moderator who also manages a SIG sees both (`viewerRoles`);
  everyone else gets the 404 page. Nothing is fetched before the role is
  known, and no role fetches what its routes refuse. The header shows
  「管理平台」 to all three.
- Sections: `/admin` 總覽, `/admin/posts`, `/admin/comments`,
  `/admin/sigs`,
  `/admin/sigs/[sigId]?tab=info|staff|members|requests|recruiting|events|analytics`,
  `/admin/join-requests`, `/admin/users`, `/admin/rollover`,
  `/admin/badges`, `/admin/exports`, `/admin/audit`, `/admin/reports`
  (檢舉), `/admin/keyword-filter`, `/admin/banners`, `/admin/broadcast`,
  `/admin/logins` (see below).
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

## Moderation and communication (contract v4 §5.1–§5.5, §5.10, §5.11)

- **Mutes and bans** (`modules/suspension`): `/user/me` / `/login` carry
  `suspension` while one is in force, and every 403/4041 carries
  `{ type, until, reason }`. `modules/api/client` turns a 4041 into the
  failure kind `suspended` with a message that says what is refused and
  until when (Asia/Taipei), so every caller that shows `message` explains
  it; it also reports the suspension to a small store. A ban signs the
  site out (the Google session is kept, so `/login` is retried, and
  refused, on the next visit); a mute goes into the profile.
- **Site notices** (`components/SiteBanner/SiteNotices`): under the header
  on every page except `/admin`, the suspension notice (hidden for the
  tab only) and the site banner (`GET /site/banner`, re-checked against
  its window every 30 s, closed per banner id in localStorage
  `mdsig-dismissed-banners`). Desktop: in the header's grid row. Phones:
  fixed under the fixed header; the page area starts below it
  (`--site-notices-h`). Self-contained so the redesign can move it.
- **Users**: filters 內容管理員 (`role=moderator`) and 停權中
  (`suspended=1`); the drawer has 角色 (select, admins), 停權／禁言
  (admins: mute and ban; content moderators: mute and lift mutes; nobody
  on themself or an admin; moderators not on each other; history from the
  audit log, admins only) and 登入紀錄 (admins). `/admin/logins` lists all
  logins, or one user's with `?user=`.
- **公告橫幅** `/admin/banners`: create, edit, schedule and delete; each
  banner shows 顯示中 / 排程中 / 已結束 / 被較新的橫幅蓋過.
- **廣播通知** `/admin/broadcast` and 「通知成員」 on the SIG detail
  (`broadcast/BroadcastComposer`): audience, title, message, site link,
  push; a `dryRun` count is confirmed before sending; 4290 says the
  5-per-hour limit. `system` notifications render `meta.title` and
  `meta.message` in the bell and on `/notifications`, and their push can
  be turned off (`notificationSettings.push.system`).
- **網站流量** on the admin overview (`overview/TrafficCard`, admins):
  Umami totals, a daily line chart (views and visitors, the second
  dashed) and the top pages and referrers; not shown at all on 503.
- **關鍵字過濾** `/admin/keyword-filter`: the word list (1–30 characters,
  at most 200, repeats ignoring case dropped); reports it files show
  「系統（關鍵字）」 as the reporter.

## Data & Info Pages

- `app/data/` — SIG lookup by id (`@mdcsl`), desktop and mobile
  (`useSigLookup.ts`)
- `app/info/` — platform information and status links

## Validation Module

- Located at `modules/validation/index.ts`
- Helpers: `isValidObjectId`, `isValidCustomId`, `sanitizeUrlParam`
