# Mobile Post Page Redesign — Design Spec

**Date:** 2026-05-25
**Branch:** `feat/mobile-ui-enhancement` (or a successor; user opens one PR after all work lands)
**Status:** Approved design; pending implementation plan

> **Post-implementation update (2026-05-25):** Reply threading was implemented per this spec, then removed in commit `17c9a90` after testing revealed the backend doesn't persist the `comment.reply` field — all comments come back with `reply=""` regardless of what the frontend sends. Comments are now a flat list (matching desktop convention). The sections below have been updated to reflect the current state; original threading design preserved in git history if/when backend support lands.

## Goal

Redesign the mobile post page (post content + comments) end-to-end. Replace today's brittle `position:absolute` layout with a clean flex shell, surface author/SIG information, add native-feeling actions (share, animated like), and replace the fiddly slide-up comments panel with an inline comment list and pinned composer.

The target user opens a post and sees an experience that feels like a modern mobile community app (Threads / Medium / Instagram), not a hacked-together web page.

## Scope

### In scope

- Mobile route at `app/post/[postID]/(post)/mobile/*`
- Six new components in `app/post/[postID]/(post)/mobile/components/`: `PostHeader`, `PostBody`, `PostActions`, `CommentList`, `CommentItem`, `CommentComposer`
- One new utility module `modules/relativeTime/` for "3小時前" formatting (zh-TW)
- Extension of `app/post/[postID]/(post)/apis/CommentAPI.tsx` if needed (no comment-like endpoint per the decision below; just preserved existing endpoints)
- Reuse of Phase 1–4 mobile primitives: `TapScale`, `useSafeArea`, `toast`, `motion`

### Out of scope

- Desktop post page (`app/post/[postID]/(post)/desktop/*`) — untouched
- ThreadInfo desktop component — untouched
- Post editor (`app/post/[postID]/edit/*`) — untouched
- Backend changes — none required for this PR
- Comment-like UI — deferred to a follow-up PR once backend ships `POST /comment/:id/like`
- Reply threading (any nesting). Removed post-implementation — backend doesn't persist `comment.reply`. Re-introduce when backend supports it.
- Comment sorting controls (always newest-first, flat list)
- Hashtag filtering / SIG list links from the post — chips are decorative only

## Architecture

A single mobile post page replaces today's `Thread.tsx` and `Replies.tsx`. The new shell uses flex layout from top to bottom; the existing mobile `HeaderBar` and `ToolBar` (Phase 1 work) stay outside, untouched.

```
<wrapMobile>                                  (existing, position:absolute 100dvw 100dvh)
  <HeaderBarMobile />                         (existing, fixed top)
  <PageTransition>                            (Phase 2, fills wrapMobile)
    <Thread post={post} isAnnouncement?>      (REWRITE)
      <PostHeader />                          ── header card: back / author / SIG / time / share
      <PostBody />                            ── body card: title (wraps!) / hashtags / content
      <PostActions />                         ── actions card: heart+count / comment+count / edit
      <CommentList />                         ── inline scrollable list
        <CommentItem />                       ── per comment: avatar / name / time / content
      <CommentComposer />                     ── sticky-bottom: avatar / input / send
    </Thread>
  </PageTransition>
  <ToolBarMobile />                           (existing, fixed bottom)
</wrapMobile>
```

The Thread component itself is a flex column. The header + body + actions + comment list scroll naturally; the composer is `position: sticky; bottom: 0` so it pins inside the scroll area but doesn't overlap the toolbar.

### File map

| Path | Action | Why |
|------|--------|-----|
| `app/post/[postID]/(post)/mobile/Thread.tsx` | Rewrite | New top-level shell using the components below |
| `app/post/[postID]/(post)/mobile/Thread.module.scss` | Delete | Old absolute-positioning hack no longer needed |
| `app/post/[postID]/(post)/mobile/Replies.tsx` | Delete | Replaced by CommentList + CommentComposer |
| `app/post/[postID]/(post)/mobile/Replies.module.scss` | Delete | Same |
| `app/post/[postID]/(post)/components/Reply.tsx` | Keep | Still used by desktop `ThreadInfo.tsx`. Mobile gets its own CommentItem. |
| `app/post/[postID]/(post)/components/Reply.module.scss` | Keep | Same |
| `app/post/[postID]/(post)/mobile/components/PostHeader.tsx` | Create | Back / author / SIG / share |
| `app/post/[postID]/(post)/mobile/components/PostBody.tsx` | Create | Title / hashtags / divider / MdPreview |
| `app/post/[postID]/(post)/mobile/components/PostActions.tsx` | Create | Like / comment count / edit (owner) |
| `app/post/[postID]/(post)/mobile/components/CommentList.tsx` | Create | Inline flat list (newest first) |
| `app/post/[postID]/(post)/mobile/components/CommentItem.tsx` | Create | Avatar / name / time / content (mobile-specific; desktop keeps Reply) |
| `app/post/[postID]/(post)/mobile/components/CommentComposer.tsx` | Create | Sticky composer (flat — no reply mode) |
| `utils/useUser/index.tsx` | Create | TanStack-Query-cached fetch of `/user/:id` for PostHeader author info |
| `modules/relativeTime/index.ts` | Create | "剛剛 / N 分鐘前 / …" — zh-TW formatter |

### Data fetching

Two existing concerns plus one new one:

1. **Post fetch** — unchanged. Continues to use the existing `useEffect` in `app/post/[postID]/page.tsx` with `fetch(/post/:id)`.
2. **Comments fetch** — unchanged endpoints (`GetCommentAPI` / `PostCommentAPI`). Composer always submits with `reply=""` (flat comments only — reply threading was removed post-implementation; see status note at the top).
3. **User fetch (new)** — the single-post API returns `user` as a string ID, not populated. Add a new `useUser(userId)` hook (in `utils/useUser/index.tsx`) that fetches `/user/:id` via TanStack Query (5-minute cache). PostHeader consumes it. On failure, falls back to `{ customId: "anonymous", avatar: defaultAvatarUrl, _id: userId }`. (Verified during self-review: no existing useUser hook in the codebase — only `useUserAccount` which is about the *current* logged-in user, not arbitrary users by ID.)

## Visual design (component-by-component)

### PostHeader

- Container: rounded glassmorphism card (`bg-white/70 backdrop-blur-md`, `rounded-2xl`, padding 10/12)
- Layout (flex row): `[back chevron] [author avatar 40px] [name + sig badge + time, flex:1] [share button]`
- Back chevron: `‹` (24px), tap → `router.back()`; visible always
- Author avatar: 40px round, links to `/@{author.customId}`
- Author name + meta below:
  - Line 1: `@{customId}` (font-size 13, weight 600, dark-green)
  - Line 2: SIG badge (`bg-[sigDefaultColors[sig._id]]`, color white, rounded-full px-2 py-0.5 text-[10px]) + relative time. For announcement posts (`isAnnouncement`), the SIG badge text is "公告" with a neutral dark color (`#003F47`) instead of the SIG name.
- Share button: round 34px button. On tap: `navigator.share({ url, title })` if available; fallback to `navigator.clipboard.writeText(url) + toast.info("已複製連結")`.
- Wrapped in `TapScale` for avatar, share button, and back button

### PostBody

- Container: glassmorphism card (`rounded-2xl`, padding 16)
- Title: `<h2>`, full-wrap (no nowrap/ellipsis), font-size 22, line-height 1.3, weight 700, color dark-green
- Hashtags: row of `Hashtag` chips (existing background `#5FCDF5`, white text, rounded-full px-2.5 py-0.5 text-xs). Hidden when empty or for announcements.
- Thin divider (`border-t border-black/10`)
- Markdown content: `<MdPreview value={post.content} previewTheme="github" />`. No changes to md-editor-rt setup; existing styles for preview remain.
- Announcement variant (`isAnnouncement=true`): hide hashtag row + divider; keep title as-is (NO 🔔 prefix — the announcement signal comes from PostHeader showing a "公告" badge instead of a SIG badge). Keep MdPreview.

### PostActions

- Container: glassmorphism card (`rounded-2xl`, padding 10/14)
- Layout (flex row, gap 18): `[heart+count] [comment+count] [flex spacer] [EDIT (owner only)]`
- Like button: `TapScale` with `whileTap={{ scale: 0.85 }}`. Filled red `#EE5757` when current user has liked; outline `#888` otherwise. Count shown next to icon.
  - Heart-pump animation on tap: motion `animate` keyframes scale `[1, 1.3, 1]` over 300ms when transitioning to liked state
  - Optimistic update on the existing `/post/:id/like` endpoint (reuses current onLike logic)
- Comment count: tap → smooth-scroll to CommentList anchor
- EDIT button: existing 24px `/icons/edit.svg` icon (preserves visual convention from current Thread.tsx). Visible only when `post.user === currentUser._id`. Tap → `router.push(/post/:id/edit)`. Wrapped in `TapScale`.

### CommentList

- Container: vertical flex with gap 8, padding 12
- Section header: `<h3>留言</h3>` + count "(N 則)" in gray
- Body:
  - Loading: 3 skeleton placeholders (animated pulse)
  - Empty: centered card "💬 / 尚無留言 / 搶先留下你的想法吧！"
  - Populated: flat list of `CommentItem`s sorted newest first by `createdAt`
- Sort: newest first (`createdAt` descending)

### CommentItem

- Container: glassmorphism card (`rounded-2xl`, padding 12)
- Layout (flex row, gap 10): `[avatar 36px] [content column, flex:1]`
- Avatar: 36px (one size only — no top/reply variant since threading is removed)
- Content column:
  - Line 1: `@{customId}` (weight 600, size 13) + relative time (gray, size 11)
  - Line 2: comment text (color `#354242`, size 13, line-height 1.5). Uses `Linkify` like today's Reply.
- Tap author name OR avatar → `router.push(/@{customId})`
- Wrapped in `TapScaleLink` for avatar and name (both navigate to profile)

### CommentComposer

- Container: sticky bottom (`position: sticky; bottom: 0`), backdrop-blur, white/97 background, border-top
- Layout (flex row, gap 8, padding 8/12):
  - Avatar: 32px (current user, or `/images/default-avatar.png` if not logged in)
  - Input: flex-1 with `min-w-0`, `<textarea rows={1}>` that auto-grows to max 72px (~3 lines) then scrolls
  - Send button: round 36px, cyan `#009BB0` + white inline SVG icon when text is non-empty + user is logged in; gray-200 bg + gray-400 icon otherwise
- Submit:
  - If logged out: tap send → `toast.info("登入後即可留言", { action: { label: "登入", onClick: login } })`
  - Empty text: tap send → no-op (button is visually disabled)
  - Valid: call `PostCommentAPI(post._id, "", text, token)`. On success: clear input, call `onSubmitted()` to refetch, `toast.success("留言成功")`. On failure: `toast.error("發送失敗")`.
- Keyboard: Enter submits, Shift+Enter newline. iOS keyboard naturally pushes the sticky composer up.

## Module: relativeTime

Path: `modules/relativeTime/index.ts`

Single exported function: `relativeTime(date: Date | string | number): string`

Rules (zh-TW):

| Age | Output |
|-----|--------|
| < 60 sec | `剛剛` |
| < 60 min | `${N} 分鐘前` |
| < 24 hr | `${N} 小時前` |
| < 7 days | `${N} 天前` |
| ≥ 7 days | `YYYY/M/D` |

Used by PostHeader (post createdAt) and CommentItem (comment createdAt).

## Accessibility

- All interactive elements use `TapScale` so tap feedback is universal
- Comment likes are NOT in V1 (per scope), so no a11y for that path needed yet
- Like button on the post: `aria-label="按讚"` / `aria-pressed={liked}`
- Share button: `aria-label="分享貼文"`
- Back button: `aria-label="返回"`
- Composer textarea: `aria-label="留言內容"`
- Comment section: `<section aria-labelledby="comments-heading">` with `<h3 id="comments-heading">留言</h3>`
- Skeleton placeholders: `aria-busy="true"` on the container; remove when loaded
- Empty state: rendered as `<output>` (implicit `role="status"`)
- All toasts already use proper roles (Phase 4 work)

## Performance

- User fetch for PostHeader: TanStack Query with 5-min cache so navigating away and back doesn't re-fetch
- MdPreview: unchanged; still uses md-editor-rt's lazy-loaded preview component
- Comment list: simple render of all comments (typical post: ≤ 50 comments — no virtualization needed)
- Skeleton placeholders during initial fetches prevent layout shift

## Testing approach

No automated test suite. Per-task verification: `pnpm check && pnpm types && pnpm build`. Final manual verification on Chrome DevTools iPhone emulation + ideally a real device. Reviewer test plan:

- Open a post → see author info, SIG badge, share button, full title (try a long title)
- Tap heart → animates fill, count increments; tap again → un-likes
- Tap share → native share dialog OR clipboard + toast
- Tap comment count → page smooth-scrolls to comments section
- Send a comment → appears at top of the flat list
- Log out → tap send → toast with "登入" action
- Test announcement post → confirm no hashtags/divider; "公告" badge in header instead of SIG name
- Empty post (no comments) → empty state visible
- Network failure on comment send → optimistic item disappears + error toast

## Rollout

One PR. Lands on `feat/mobile-ui-enhancement` (or its successor) — same branch as the 4-phase mobile UI work, per the user's preference of opening a single PR for all the mobile work.

## Open questions

None blocking. Decisions deferred to implementation:

- Default avatar URL: `/images/default-avatar.png` (local static asset, matches desktop ThreadInfo convention). All avatars also have `onError` handlers that swap to this default if the configured URL fails to load.
- `useUser` hook location: `utils/useUser/index.tsx` (new — no similar hook existed). Symmetric `useSig` hook also added at `utils/useSig/index.tsx` for the SIG badge name lookup (same problem — single-post API returns `sig` as a string ID).
- Exact px/spacing values for cards: follow Tailwind classes already in use in the codebase (`bg-white/70`, `backdrop-blur-md`, `rounded-2xl`, gaps in 8px increments).
