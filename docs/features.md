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
  `/@<sig>`). The SIG squares show the SIG avatar (the coloured initial
  when there is none or it fails), a pill in the SIG colour on the left
  edge for the current SIG and on hover, and the user's own order
  (`RailSigs.tsx`): drag with the mouse, or Space / ↑ ↓ / Space (Esc
  cancels) with an aria-live announcement. The order is saved with
  `POST /user { sigOrder }` 500 ms after a drop and mirrored in
  localStorage `mdsig:sigOrder:<userId>` (`useSaveSigOrder`,
  `savedSigOrder`: the server's order first); SIGs not in it go last. The
  個人專區 list uses the same order. The header has the logo, the search
  box and the avatar button (name and email from 1100px) that opens the
  個人專區 menu (`UserMenu.tsx`); 管理平台 is only the header button.
  The admin panel has no rail.
- Which entry is current: `navSection()` in `app/(Layout)/nav.ts`. The 我的
  hub entries (`hubGroups()`) are shared by the avatar menu and `/me`.
- `/me` (個人專區, decision 7B; the tab bar says 我的): profile link, 我的 SIG (managed / member /
  followed), 活動報名 (`/events?scope=rsvped`, with the count), 草稿
  (`/me/drafts`, with the count; the editor's draft list), 收藏 / 按讚 / 系列
  (own profile `?tab=`), 學習歷程, 數據, 通知設定, 平台資訊 (`/about`), 管理平台,
  登出. Logged out it offers 登入 and 平台資訊.
- The site banner and the suspension notice (`SiteNotices`) sit under the
  header on both shells.

## Desktop widths (owner pick 1B, 2026-11-13)

- The frame is full width; reading columns keep a measure (52rem) and
  extra width becomes side columns: `app/(Layout)/pageColumns.tsx`
  (`wideLeft` / `wideRight` from 1600px, `oneSide` at 1280–1600px, main
  only below; `utils/useMinWidth`). Side columns are sticky at
  `--shell-top` and render only where they show. Tailwind has `3xl`
  (1600px) for this.
- Home (2A): left 近期活動 + 熱門標籤, right 熱門貼文 + 正在招生; one right
  column (近期活動, 熱門貼文, 正在招生, 熱門標籤) at 1280–1600.
- 活動 (5B): from 1280px the list (grouped by day) and the month
  (`EventCalendar variant="side"`, days tinted in SIG colours) sit side by
  side; choosing a day scrolls the list there and highlights it.
- 探索 grids and search results use `repeat(auto-fill, minmax(…))`; search
  puts SIG and tag matches in a right column from 1600px (全部 tab).
- 關於 MDSIG: sticky table of contents, text sections at 52rem, 平台數據 and
  運行狀態 across the width.

## Post cards and infinite lists

- Every compact card has the same height (owner 2026-11-13): title 1 line
  on desktop (full title in `title`) and 2 reserved lines on phones, the
  excerpt always reserves 2 lines, the top row is at least the thumbnail's
  height, the meta and counts rows have fixed heights and hidden tag
  overflow. Featured cards add a fixed-height image, so they match too.
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

- `components/PostEditor/PostEditor.tsx` (design v4 6B), shared by `/new`
  and the edit page: a sticky bar (cloud-save status, 草稿, 捨棄/還原, 設定,
  發布/更新), the writing area (title, toolbar, CodeMirror 6 in
  `desktop/Editor.tsx` / `mobile/Editor.tsx`) filling the window down to a
  1.5rem margin and scrolling inside, with 寫作 / 並排 / 預覽 (並排 by
  default from 1280px), and a right settings column that folds away
  (`settings/EditorSettings.tsx`). On phones 發布 opens the settings as a
  sheet whose 發布 publishes. Missing title, content or SIG show under the
  field when 發布 is pressed (never while typing). View and fold choices
  are remembered (`mdsig-editor-view`, `mdsig-editor-settings`).
- Settings: 發布到 (`SigPicker`, 7B: colour chips of the SIGs you may post
  in, the only one chosen at once, more than six → 「更多 SIG…」 with a
  search; rules from `useSigOptions`); 封面 (`CoverField`, 8B: the real
  cover from the start, else the SIG default with 「SIG 預設封面」; 更換封面
  or drop a picture; it is cropped to 16:9 on the client and uploaded as
  WebP, 調整位置 picks another region of the same picture
  (`CoverCropDialog`), 移除 goes back to the default; TIFF is uploaded
  as it is); 標籤 (`TagInput`, 9B: Enter or comma adds, Backspace removes the
  last, at most 5, suggestions from `GET /post/hashtags/top?q=` debounced
  200 ms with 「新增「#…」」, 「這個 SIG 常用」 from `?sig=`); 加入系列
  (`SeriesPicker`, 10B: search, 「建立新系列」 inline via `POST /series`, the
  order with 「這篇會是第 N 篇」, or the post's real place when editing);
  卡片預覽 (FE-U1's `PostCard`, inert).
- The empty editor's placeholder is one short line (「開始寫作…」) so the
  caret is one line tall; help is the 「Markdown 教學」 link.
- Logged out, the editor auto-saves to `localStorage` (`editorContent`,
  `postData`); signed in, it saves cloud drafts instead (see below)

## Session Management

- Use `useUserAccount` hook to read login state
- TanStack Query hooks (`usePost`, `useAllPost`, etc.) for data fetching with built-in caching
- `useAlert` hook wraps SweetAlert2 for consistent dialogs

## 關於 MDSIG (`/about`, v3 8A)

- One page with a table of contents (anchors, sticky on desktop, chips on
  phones): 資訊 (`#info`, links from `app/about/config/links.json`), 平台數據
  (`#dashboard`, `app/about/dashboard/`, chart.js loaded when the section
  comes near the screen), 更新紀錄 (`#changelog`, still read from
  `app/changelog/(Changelog)/config/changelog.json`, which the release
  owner edits), 運行狀態 (`#status`: versions, uptime and the
  status.sig.school badges 1 / 8 / 6) and 聯絡 (`#contact`).
- `/info`, `/dashboard` and `/changelog` redirect to the matching anchor
  (`next.config.js`); the page scrolls the section into view once it has
  rendered and keeps it there while 平台數據 loads.

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
  `/admin/logins`, `/admin/issue-reports` (問題回報, see below).
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

## Post page (decision 6C)

- Desktop (`app/post/[postID]/(post)/desktop/PostLayout.tsx`, v4 3B): at
  ≥1440px a sticky 目錄 on the left, the article in the middle (`Thread.tsx`,
  at most 46rem, about 38 CJK characters per line: title, date and views,
  tags, then 讚 / 收藏 / 分享 / 閱讀模式 and 編輯 / 刪除 / ⋯), and a sticky
  right column: `AuthorCard`, the series boxes (`SeriesNav`) and 同 SIG 的
  其他文章 (`SigMorePosts.tsx`, `/post/list/sig/:id`, this post left out).
  At 1280–1439px 目錄 joins the right column; under 1280px there is one
  column, the right column's cards follow the article and 目錄 is left
  out. The side columns stick at `--shell-top`; the window scrolls.
- 目錄 lists the post's h1–h3 (not the opening heading that repeats the
  title) once the Markdown is rendered, gives them ids `h-1`, `h-2`… and
  marks the section being read (scroll-spy on the window). A link such as
  `/post/<id>#h-3` opens at that section. Shown with two or more headings.
- 老師回饋 and the comments follow the article at the column's full width,
  only once the post body is rendered (so `#feedback` lands right). The
  desktop composer stays at the bottom of the window while the comments
  are on screen. `#comments` / `#comments-section` open at the comments.
- Mobile (`mobile/Thread.tsx`): one sticky place at the bottom holds
  either the bar 讚 / 留言 / 收藏 / 分享 (`mobile/components/BottomBar.tsx`)
  or the comment composer, so neither covers the other. 留言 scrolls to
  the comments and opens the composer focused; 「回覆」 opens it too;
  scrolling into the comments opens it without the keyboard, scrolling
  back up (or 「收起」) brings the bar back. A short post whose comments
  are on screen at once keeps the bar. 編輯 / 刪除 / 複製連結 / 檢舉 are in
  the header's ⋯ sheet.
- 分享 (`components/sharePost.ts`): the Web Share API where there is one,
  else the link is copied. 讚 (`components/usePostLike.ts`) is shared by
  both and shows a refusal's message (a mute's 4041 explains itself).
- Announcements (公告) have no 讚 and no comments; pinned posts show 置頂.

## Comments

- Shared by desktop (`desktop/Comments.tsx`) and mobile (`mobile/Thread.tsx`)
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

## Search and tags (v3 2B)

- Hashtags on cards and post pages link to `/tag/<tag>` (`modules/hashtag`
  strips a stored leading `#`). Tag pages show the post count and 相關標籤
  (tags on the loaded posts), with InfiniteThreadList.
- `/search?q=&type=all|posts|sigs|tags|users`: tabs 全部 / 貼文 / SIG / 標籤 /
  使用者, matches marked (`components/Search/Highlight.tsx`, PostCard
  `highlight`). 全部 is `GET /search` (5 each); 貼文 pages through
  `/post/search`, 使用者 through `/search/users`; SIG and 標籤 show up to 20
  (`utils/useSearch`). Without a query it shows the top hashtags. The
  desktop header search box and the phone search icon open it.

## 探索 (`/explore`, v3 1B)

- Search box, 正在招生 (open recruiting, colour top border, deadline), 近期活動
  (→ `/events`), 熱門標籤, and every SIG as a colour card with the member
  and follower counts and 追蹤 / 已追蹤 (`utils/useFollowSig`: `POST` /
  `DELETE /sig/:id/follow`, updates `followedSigs` and `followerCount`);
  members and managers see 已加入 / 管理中. `/data` redirects here.

## 活動 (`/events`, v3 5C)

- Events of every SIG (`GET /event/list`, `utils/useSiteEvents`): a list by
  default and a 月曆 view (`components/Events/EventCalendar.tsx`, loaded on
  demand, one month per request); 我的 SIG / 全部 / 已報名 (`?scope=`), 月曆
  (`?view=calendar`). Each event is the SIG page's `SigEventCard` (RSVP,
  加到 Google 日曆, .ics) under its SIG; an RSVP patches the cross-SIG lists
  too (`usePatchEvent`). Entry points: 探索, the home right column, 我的 →
  活動報名.

## Home (decision 3A)

- Tabs 我的 SIG / 最新 / 熱門 (`app/(home)/useHomeFeed.ts`, remembered per
  browser tab). A signed-in user with SIGs (managed, member or followed)
  starts on 我的 SIG (`GET /post/list/mysig`); everyone else on 最新.
- SIG chips: your SIGs on 我的 SIG, every SIG on 最新
  (`/post/list/sig/:id`). 熱門 has none (a SIG list has no most-liked order).
- Pinned posts (`/post/list/pinned`) on top as big-image cards; the newest
  announcement (10 days) on 最新 / 熱門. The list is InfiniteThreadList.
- Desktop right column (`HomeRail`): 近期活動 (your SIGs', or every SIG's),
  熱門標籤, 熱門貼文 (most liked of the last 30 days, widening to 180 days,
  then all time). The SIG tiles moved to 探索.

## First-login onboarding (v3 9B)

- `components/Onboarding/OnboardingGate.tsx` (in `app/device.tsx`) shows
  the three steps once when `GET /user/me` says `onboardedAt: null`: pick
  SIGs to follow, turn on notifications (`PushControl`), start. Skippable
  (略過, ✕, Escape); finishing or skipping sends `POST /user
  { onboarded: true }`. The steps load on demand.

## Notifications, web push and PWA

Contract: `design/api-contract-v4.md` §2.

- The unread count (`GET /notification/unread-count`, every 60 s while the
  tab is visible, when it becomes visible and on window focus,
  `utils/useNotifications`) is on the tab bar's 通知 and the side rail's
  通知, and on the installed app's icon (`useAppBadge`).
- The list (`components/Notifications/NotificationCenter.tsx`, v3 4B):
  grouped 今天 / 本週 / 更早, chips 全部 / 未讀 (server) / 互動 / SIG (types),
  an unread colour bar, opening one marks it read, 全部標為已讀, and on a
  single join request 同意 / 拒絕 (`POST /admin/join-requests/:id/decision`,
  `meta.request`); collapsed requests link to the request list.
  Sentences are built from type, actor and target in
  `modules/notifications/describe.ts`; only same-site `link`s are followed.
- `/notifications` shows it with 「通知設定」; on desktop the rail's 通知
  opens it in a right-side panel (`NotificationPanel.tsx`) instead.
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

- 學習歷程 `/portfolio` (`app/portfolio/`, design v3 7B): your own posts,
  SIGs and teacher feedback (`GET /user/me/portfolio`). Left, a checklist
  (`components/Portfolio/PortfolioChecklist.tsx`): 基本資料, SIG 與幹部經歷,
  文章 (all or none, or post by post), 老師回饋, 數據; everything is in by
  default. Right, a live A4 preview: `PortfolioDocument` with
  `variant="a4"` and `sections` draws 210 × 297 mm sheets with the print
  margins, scaled down to fit the column, the posts starting on a new
  sheet (on the first one when neither SIGs nor 數據 are in). On phones
  the two are tabs (選擇內容 / 預覽). 「下載 PDF」 calls `window.print()`;
  `app/portfolio/print.css` prints only the document on A4 (no header or
  rail, zoom reset, page break before the posts, posts not split). Your
  own profile links to it (`PortfolioEntry`).
- 老師回饋 (`components/TeacherFeedback/TeacherFeedback.tsx`, anchor
  `#feedback`): shown to the post's author (only once there is feedback),
  the SIG's 指導老師 and admins; SIG leaders do not see it. 指導老師 and
  admins get the editor; only a feedback's author edits it, its author or
  an admin deletes it. Shown above the comments, on desktop and mobile.
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

## Issue reports (問題回報, contract v4 §7)

Replaces the old Google Form behind 「回報問題」. Signing in is required.

- **`/report`** (`app/report/`): logged out, a card with 登入 and nothing
  else. Logged in: 類型 chips (錯誤／建議／帳號問題／其他, default 錯誤 or
  `?category=`), 標題 (1–80), 說明 (1–2000, counter), up to 3 screenshots
  (picker, paste anywhere on the page, or drop on the form; uploaded at
  once through `modules/imageUploadAPI`, same formats and 5 MB cap), and
  the read-only box 「會一起送出的資訊」 = `context`: 目前頁面 (`?from=`,
  else a same-origin `document.referrer`), 版本 (`package.json`), 瀏覽器,
  螢幕大小, 錯誤代碼 (`?digest=`). Errors show on 送出回報 under the
  field and clear when it changes. 429/4290 says 一小時內最多回報 5 次; a
  4041 shows the suspension notice text. Success: 查看我的回報 /
  回到上一頁.
- **`/me/reports`** 我的回報: `GET /issue-report/mine`, 20 per page with
  載入更多; status chip (待處理 warm, 處理中 brand, 已解決 green, 不處理
  grey), category, date, title; expanding shows the description,
  screenshots and the admin's reply with its date. `?id=` (the
  notification link) pages until it finds the report, opens it and
  scrolls to it.
- **`/admin/issue-reports`** (admins, under 其他, badge = `openCount`):
  filters status (default `active` = 待處理＋處理中), category and search;
  the drawer shows the text, screenshots (click to enlarge), the context,
  the reporter (link to `/admin/users?…&id=`, which opens that user's
  drawer), and status + reply (≤1000) with 儲存. A new reply, or moving
  to 已解決／不處理, notifies the reporter; the toast says so. `?id=`
  opens the drawer, fetching the report when it is not on the page.
- Entry points: 個人專區 → 我的回報 and 「回報問題」 in the avatar menu
  (`?from=` the current page), 關於 MDSIG → 回報錯誤 (`/report?from=/about`),
  「回報這個問題」 on `app/error.tsx` and
  `app/global-error.tsx` (`?category=bug&from=&digest=`), 「回報問題」 on
  the 404 page (`components/NotFound`, `?from=`). Build links with
  `issueReportHref()` from `modules/issueReports`.
- Shared: `modules/issueReports` (labels, limits, context, link helper),
  `components/IssueReport/` (`IssueStatusChip`, `IssueCategoryChip`,
  `IssueImages` with `ImageLightbox`).

## Validation Module

- Located at `modules/validation/index.ts`
- Helpers: `isValidObjectId`, `isValidCustomId`, `sanitizeUrlParam`
