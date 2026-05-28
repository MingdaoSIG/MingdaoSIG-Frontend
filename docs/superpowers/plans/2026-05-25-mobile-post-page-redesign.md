# Mobile Post Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the mobile post page (post content + comments) with a flex shell, author/SIG header, inline comments with one-level threading, sticky composer, and animated like — replacing today's brittle `position:absolute` layout and slide-up comments panel.

**Architecture:** Single-route rewrite. New components live in `app/post/[postID]/(post)/mobile/components/`. Two new utilities (`useUser` / `useSig` hooks + `relativeTime` formatter). The top-level `Thread.tsx` becomes a thin composition shell; the legacy SCSS / Replies / mobile Reply consumer files are deleted (the shared `(post)/components/Reply.tsx` stays because desktop ThreadInfo still uses it).

**Tech Stack:** Next.js 15 App Router, React 19, TanStack Query 5 (already in deps), `motion@12` (Phase 2), `md-editor-rt` (unchanged), Tailwind v4. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-25-mobile-post-page-redesign-design.md`

> **Post-execution note (2026-05-25):** This plan was executed in commits `8efc589` through `7b89f1d`. After implementation, reply threading was removed in commit `17c9a90` (backend doesn't persist `comment.reply`). The component code in Tasks 7-10 below describes the *original* threaded implementation; the actual shipped code is the flat-list version. See the design spec for current behavior. Other post-execution refinements: send button visibility (`7bf2fe7`), composer min-w-0 (`1760547`), MdPreview transparency (`2ea08d8`), back chevron SVG (`e24e867`), avatar fallback to `/images/default-avatar.png` (`8e5b1a5`), and the reply removal (`17c9a90`).

**Verification approach:** No Jest/Vitest in this project. Each task ends with `pnpm check && pnpm types && pnpm build`. Visual/gesture correctness validated by the human reviewer at the end.

---

## File map (final state)

| Path | Action | Why |
|------|--------|-----|
| `modules/relativeTime/index.ts` | Create | zh-TW "剛剛 / N 分鐘前 / …" formatter |
| `utils/useUser/index.tsx` | Create | TanStack-Query cached `/user/:id` for author info |
| `utils/useSig/index.tsx` | Create | TanStack-Query cached `/sig/:id` for SIG badge — added per plan self-review (spec mentioned useUser but the same problem applies to SIG name lookup) |
| `app/post/[postID]/(post)/mobile/components/PostHeader.tsx` | Create | Back / author / SIG / time / share |
| `app/post/[postID]/(post)/mobile/components/PostBody.tsx` | Create | Title (wraps) / hashtags / MdPreview |
| `app/post/[postID]/(post)/mobile/components/PostActions.tsx` | Create | Like / comment count / edit |
| `app/post/[postID]/(post)/mobile/components/CommentItem.tsx` | Create | Avatar / name / time / content / reply |
| `app/post/[postID]/(post)/mobile/components/CommentList.tsx` | Create | Inline list with thread grouping + empty/loading states |
| `app/post/[postID]/(post)/mobile/components/CommentComposer.tsx` | Create | Sticky bottom composer with reply mode |
| `app/post/[postID]/(post)/mobile/Thread.tsx` | Rewrite | Thin composition shell using the above |
| `app/post/[postID]/(post)/mobile/Thread.module.scss` | Delete | Obsolete absolute-positioning hack |
| `app/post/[postID]/(post)/mobile/Replies.tsx` | Delete | Replaced by CommentList + CommentComposer |
| `app/post/[postID]/(post)/mobile/Replies.module.scss` | Delete | Same |
| `app/post/[postID]/(post)/components/Reply.tsx` | Keep | Used by desktop `ThreadInfo.tsx` — leave alone |
| `app/post/[postID]/(post)/components/Reply.module.scss` | Keep | Same |

---

## Task 1: Create `relativeTime` utility

**Files:**
- Create: `modules/relativeTime/index.ts`

**Context:** Pure function producing zh-TW relative time strings. Used by PostHeader (post createdAt) and CommentItem (comment createdAt).

- [ ] **Step 1: Verify directory does not exist**

Run: `ls modules/relativeTime 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create the file**

Create `modules/relativeTime/index.ts` with EXACTLY:

```typescript
export function relativeTime(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const ageMs = Date.now() - date.getTime();
  const ageSec = Math.floor(ageMs / 1000);
  if (ageSec < 60) {
    return "剛剛";
  }
  const ageMin = Math.floor(ageSec / 60);
  if (ageMin < 60) {
    return `${ageMin} 分鐘前`;
  }
  const ageHr = Math.floor(ageMin / 60);
  if (ageHr < 24) {
    return `${ageHr} 小時前`;
  }
  const ageDay = Math.floor(ageHr / 24);
  if (ageDay < 7) {
    return `${ageDay} 天前`;
  }
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

export default relativeTime;
```

- [ ] **Step 3: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add modules/relativeTime/
git commit -m "feat(utils): add relativeTime formatter for zh-TW

Pure function producing '剛剛 / N 分鐘前 / N 小時前 / N 天前 /
YYYY/M/D' from a Date/string/number. Used by PostHeader and
CommentItem in the upcoming post-page redesign. Returns '' for
invalid inputs (defensive)."
```

---

## Task 2: Create `useUser` hook

**Files:**
- Create: `utils/useUser/index.tsx`

**Context:** The single-post API returns `user` as a string ID. PostHeader needs avatar + customId. Wrap a TanStack Query call in `useUser(userId)` returning the `User` from `/user/:id`. 5-minute stale time. On failure, the hook returns `data === undefined` — consumers fall back to a default avatar + "anonymous". Pattern mirrors `utils/usePost/index.ts` but uses `useQuery` (single fetch) instead of `useInfiniteQuery`.

- [ ] **Step 1: Verify directory does not exist**

Run: `ls utils/useUser 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create the file**

Create `utils/useUser/index.tsx` with EXACTLY:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";

import type { User } from "@/interfaces/User";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useUser = (userId: string | undefined) => {
  return useQuery<User | null, Error>({
    queryKey: ["user", userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }
      const response = await fetch(`${API_URL}/user/${userId}`, {
        method: "GET",
      });
      if (!response.ok) {
        return null;
      }
      const responseData = await response.json();
      return (responseData?.data as User) ?? null;
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
};

export default useUser;
```

- [ ] **Step 3: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add utils/useUser/
git commit -m "feat(utils): add useUser hook for author info lookup

TanStack-Query-cached fetch of /user/:id with 5-min staleTime.
Returns null on failure so consumers can render with fallback
(avatar/name). Used by PostHeader in the post-page redesign.

The single-post API returns user as a string ID rather than a
populated object, so the mobile post page needs a follow-up
fetch."
```

---

## Task 3: Create `useSig` hook

**Files:**
- Create: `utils/useSig/index.tsx`

**Context:** Same situation as useUser — single-post API returns `sig` as a string ID, but the SIG badge needs the name. Pattern identical to useUser, but for `/sig/:id`.

- [ ] **Step 1: Verify directory does not exist**

Run: `ls utils/useSig 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create the file**

Create `utils/useSig/index.tsx` with EXACTLY:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";

import type { Sig } from "@/interfaces/Sig";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const useSig = (sigId: string | undefined) => {
  return useQuery<Sig | null, Error>({
    queryKey: ["sig", sigId],
    queryFn: async () => {
      if (!sigId) {
        return null;
      }
      const response = await fetch(`${API_URL}/sig/${sigId}`, {
        method: "GET",
      });
      if (!response.ok) {
        return null;
      }
      const responseData = await response.json();
      return (responseData?.data as Sig) ?? null;
    },
    enabled: Boolean(sigId),
    staleTime: 5 * 60 * 1000,
  });
};

export default useSig;
```

- [ ] **Step 3: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add utils/useSig/
git commit -m "feat(utils): add useSig hook for SIG badge lookup

Mirrors useUser. TanStack-Query-cached fetch of /sig/:id with 5-min
staleTime. Returns null on failure so consumers can render with
'SIG' fallback label."
```

---

## Task 4: Create `PostHeader` component

**Files:**
- Create: `app/post/[postID]/(post)/mobile/components/PostHeader.tsx`

**Context:** Top card of the post. Shows back-chevron, author avatar (40px), `@customId`, SIG badge + relative time below the name, share button (Web Share API w/ clipboard fallback). For announcement posts the SIG badge shows "公告" in neutral dark color instead of the SIG name+color.

`sigDefaultColors` is at `@/components/Threads/configs/sigDefaultColors`.

- [ ] **Step 1: Verify the components directory does not yet exist (it's the first thing created there)**

Run: `ls app/post/\[postID\]/\(post\)/mobile/components 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create the file**

Create `app/post/[postID]/(post)/mobile/components/PostHeader.tsx` with EXACTLY:

```tsx
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { TapScale, TapScaleLink } from "@/components/mobile/TapScale";
import { toast } from "@/components/mobile/Toast";
import { sigDefaultColors } from "@/components/Threads/configs/sigDefaultColors";
import type { TThread } from "@/interfaces/Thread";
import relativeTime from "@/modules/relativeTime";
import useSig from "@/utils/useSig";
import useUser from "@/utils/useUser";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_AVATAR = `${API_URL}/image/653299930b891d1f6b5b4458`;

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
};

export default function PostHeader({ post, isAnnouncement }: Props) {
  const router = useRouter();
  const { data: user } = useUser(post.user);
  const { data: sig } = useSig(typeof post.sig === "string" ? post.sig : undefined);

  const customId = user?.customId ?? "anonymous";
  const avatar = user?.avatar || DEFAULT_AVATAR;
  const sigId = typeof post.sig === "string" ? post.sig : "";
  const sigName = isAnnouncement ? "公告" : sig?.name ?? "SIG";
  const sigColor = isAnnouncement
    ? "#003F47"
    : sigDefaultColors[sigId] || "#009BB0";

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url, title: post.title });
        return;
      } catch (_err) {
        // user cancelled or share failed; fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.info("已複製連結");
    } catch (_err) {
      toast.error("無法複製連結");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2.5 backdrop-blur-md">
      <TapScale
        onClick={() => router.back()}
        className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/5 text-gray-600 text-lg"
        whileTap={{ scale: 0.9 }}
        aria-label="返回"
      >
        ‹
      </TapScale>
      <TapScaleLink
        href={`/@${customId}`}
        className="flex-shrink-0"
        whileTap={{ scale: 0.9 }}
      >
        <Image
          src={avatar}
          alt={`${customId} avatar`}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
          unoptimized
        />
      </TapScaleLink>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-[13px] text-md-dark-green leading-tight">
          @{customId}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className="rounded-full px-2 py-0.5 font-semibold text-[10px] text-white"
            style={{ backgroundColor: sigColor }}
          >
            {sigName}
          </span>
          <span className="text-[10px] text-gray-500">
            {relativeTime(post.createdAt ?? "")}
          </span>
        </div>
      </div>
      <TapScale
        onClick={handleShare}
        className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-black/5 text-gray-600"
        whileTap={{ scale: 0.9 }}
        aria-label="分享貼文"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </TapScale>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. Biome may sort className strings — let it.

Note: if `pnpm types` complains that `post.sig` is `string` (not `string | object`) so `typeof post.sig === "string"` is always true, that's fine — the typeof narrowing here is defensive against the populated case. Biome / TS may flag the `typeof` check as always-true. If so, simplify to just `post.sig` (no typeof check) and pass it directly to `useSig(post.sig)`.

- [ ] **Step 4: Commit**

```bash
git add 'app/post/[postID]/(post)/mobile/components/PostHeader.tsx'
git commit -m "feat(mobile-post): add PostHeader component

Glassmorphism card with back-chevron, author avatar + @customId
(via useUser), SIG badge + relative time below the name (via
useSig + relativeTime), and a share button (Web Share API with
clipboard fallback via toast). Announcement posts show '公告'
neutral badge instead of the SIG name+color."
```

---

## Task 5: Create `PostBody` component

**Files:**
- Create: `app/post/[postID]/(post)/mobile/components/PostBody.tsx`

**Context:** Middle card. Shows the title (wraps naturally — no `nowrap`/`ellipsis` truncation!), optional hashtag chips, divider, and the markdown-rendered post content via `md-editor-rt`'s `MdPreview`. For announcements, hide the hashtags + divider.

- [ ] **Step 1: Create the file**

Create `app/post/[postID]/(post)/mobile/components/PostBody.tsx` with EXACTLY:

```tsx
"use client";

import { MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/preview.css";
import "md-editor-rt/lib/style.css";
import "@/app/mdEditorConfig";

import type { TThread } from "@/interfaces/Thread";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
};

export default function PostBody({ post, isAnnouncement }: Props) {
  const hashtags = post.hashtag ?? [];
  const showHashtags = !isAnnouncement && hashtags.length > 0;

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl bg-white/70 p-4 backdrop-blur-md">
      <h2 className="m-0 font-bold text-[22px] text-md-dark-green leading-tight">
        {post.title}
      </h2>
      {showHashtags && (
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[#5FCDF5] px-2.5 py-0.5 font-semibold text-[11px] text-white"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      {!isAnnouncement && (
        <div className="my-1 h-px w-full bg-black/10" />
      )}
      <MdPreview
        value={post.content}
        language="en-US"
        previewTheme="github"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add 'app/post/[postID]/(post)/mobile/components/PostBody.tsx'
git commit -m "feat(mobile-post): add PostBody component

Title now wraps naturally (no nowrap/ellipsis truncation — the
core readability bug of the old design). Hashtag chips render
when present (hidden for announcement posts). Divider hidden for
announcement variant. Content unchanged: md-editor-rt MdPreview
with github theme."
```

---

## Task 6: Create `PostActions` component

**Files:**
- Create: `app/post/[postID]/(post)/mobile/components/PostActions.tsx`

**Context:** Bottom card of the post (above comments). Heart-with-count, comment-with-count, and (for owners) edit icon. Heart fills red and "pumps" when toggling on (motion keyframes scale [1, 1.3, 1] over 300ms). Like uses the existing `/post/:id/like` endpoint via the same pattern as today's Thread.tsx.

Comment count is a button that emits a window event (`mobile:scroll-to-comments`) which Thread.tsx will listen for to smooth-scroll to the comments section.

- [ ] **Step 1: Create the file**

Create `app/post/[postID]/(post)/mobile/components/PostActions.tsx` with EXACTLY:

```tsx
"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { TapScale } from "@/components/mobile/TapScale";
import type { TThread } from "@/interfaces/Thread";
import { useUserAccount } from "@/utils/useUserAccount";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  post: TThread;
  commentCount: number;
};

export default function PostActions({ post, commentCount }: Props) {
  const router = useRouter();
  const { isLogin, isLoading, token, userData } = useUserAccount();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes ?? 0);

  useEffect(() => {
    if (isLogin && userData?._id) {
      setLiked(Boolean(post.like?.includes(userData._id)));
    }
  }, [isLogin, post.like, userData?._id]);

  const onLike = async () => {
    if (isLoading) {
      return;
    }
    if (!isLogin) {
      const { toast } = await import("@/components/mobile/Toast");
      toast.info("登入後即可按讚");
      return;
    }
    const willLike = !liked;
    setLiked(willLike);
    setLikeCount((c) => c + (willLike ? 1 : -1));
    try {
      await fetch(`${API_URL}/post/${post._id}/like`, {
        method: willLike ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
    } catch (_err) {
      setLiked(!willLike);
      setLikeCount((c) => c + (willLike ? -1 : 1));
    }
  };

  const onCommentTap = () => {
    window.dispatchEvent(new CustomEvent("mobile:scroll-to-comments"));
  };

  const onEdit = () => {
    router.push(`/post/${post._id}/edit`);
  };

  const isOwner = isLogin && post.user === userData?._id;

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/70 px-3.5 py-2.5 backdrop-blur-md">
      <TapScale
        onClick={onLike}
        className="flex cursor-pointer items-center gap-1.5 p-1"
        whileTap={{ scale: 0.85 }}
        aria-label="按讚"
        aria-pressed={liked}
      >
        <motion.svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 32 32"
          animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <path
            d="M26.9399 6.38798C26.2047 5.64761 25.3304 5.05985 24.3673 4.65849C23.4042 4.25714 22.3713 4.05012 21.3279 4.04932C19.3543 4.04964 17.4528 4.79101 15.9999 6.12665C14.5471 4.79079 12.6455 4.04938 10.6719 4.04932C9.62728 4.0504 8.59319 4.25806 7.62914 4.66034C6.66509 5.06262 5.79011 5.65158 5.05456 6.39332C1.91723 9.54398 1.91856 14.472 5.05723 17.6093L15.9999 28.552L26.9426 17.6093C30.0812 14.472 30.0826 9.54398 26.9399 6.38798Z"
            fill={liked ? "#EE5757" : "#BDBDBD"}
          />
        </motion.svg>
        <span
          className="font-semibold text-sm"
          style={{ color: liked ? "#EE5757" : "#354242" }}
        >
          {likeCount}
        </span>
      </TapScale>
      <TapScale
        onClick={onCommentTap}
        className="flex cursor-pointer items-center gap-1.5 p-1 text-md-dark-green"
        whileTap={{ scale: 0.9 }}
        aria-label="跳至留言"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="font-semibold text-sm">{commentCount}</span>
      </TapScale>
      <div className="flex-1" />
      {isOwner && (
        <TapScale
          onClick={onEdit}
          className="flex cursor-pointer items-center justify-center p-1"
          whileTap={{ scale: 0.9 }}
          aria-label="編輯貼文"
        >
          <Image src="/icons/edit.svg" width={24} height={24} alt="編輯" />
        </TapScale>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. If Biome flags the inline-style on the span color, leave as-is (dynamic color cannot be expressed as a static Tailwind class).

The dynamic import of `toast` (`await import("@/components/mobile/Toast")`) keeps the toast tree-shaken from the SSR side — Toast already has `"use client"` but defensive. If lint flags the dynamic import, replace with a static `import { toast } from "@/components/mobile/Toast";` at the top.

- [ ] **Step 3: Commit**

```bash
git add 'app/post/[postID]/(post)/mobile/components/PostActions.tsx'
git commit -m "feat(mobile-post): add PostActions component

Heart + count (motion-animated pump on like, optimistic POST/DELETE
/post/:id/like via existing API), comment + count (taps dispatch
window 'mobile:scroll-to-comments'), and EDIT icon for the post
owner. All wrapped in TapScale for press feedback. Logged-out tap
on heart shows a toast instead of silently failing."
```

---

## Task 7: Create `CommentItem` component

**Files:**
- Create: `app/post/[postID]/(post)/mobile/components/CommentItem.tsx`

**Context:** A single comment, used for both top-level and reply variants. Reply variant uses smaller avatar (28px vs 36px) and no "回覆" button (1-level threading cap). Tap author → navigate to profile. Tap "回覆" → invokes parent callback. Linkify for URLs in content.

- [ ] **Step 1: Create the file**

Create `app/post/[postID]/(post)/mobile/components/CommentItem.tsx` with EXACTLY:

```tsx
"use client";

import Image from "next/image";
import Linkify from "react-linkify";

import { TapScale, TapScaleLink } from "@/components/mobile/TapScale";
import type { TComments } from "@/interfaces/comments";
import relativeTime from "@/modules/relativeTime";
import { jumpOut } from "@/utils/jumpOut";

type Props = {
  comment: TComments;
  variant?: "top" | "reply";
  onReply?: (comment: TComments) => void;
};

export default function CommentItem({
  comment,
  variant = "top",
  onReply,
}: Props) {
  const isReply = variant === "reply";
  const avatarSize = isReply ? 28 : 36;
  const containerClass = isReply
    ? "ml-6 flex gap-2 rounded-xl bg-white/55 p-2.5 backdrop-blur-md"
    : "flex gap-2.5 rounded-2xl bg-white/70 p-3 backdrop-blur-md";
  const nameClass = isReply
    ? "font-semibold text-[12px] text-md-dark-green"
    : "font-semibold text-[13px] text-md-dark-green";
  const timeClass = isReply
    ? "text-[10px] text-gray-500"
    : "text-[11px] text-gray-500";
  const contentClass = isReply
    ? "text-[12px] text-[#354242] leading-relaxed"
    : "text-[13px] text-[#354242] leading-relaxed";

  return (
    <div className={containerClass}>
      <TapScaleLink
        href={`/@${comment.user.customId}`}
        className="flex-shrink-0"
        whileTap={{ scale: 0.9 }}
      >
        <Image
          src={comment.user.avatar}
          alt={`${comment.user.customId} avatar`}
          width={avatarSize}
          height={avatarSize}
          className="rounded-full object-cover"
          style={{ width: avatarSize, height: avatarSize }}
          unoptimized
        />
      </TapScaleLink>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <TapScaleLink
            href={`/@${comment.user.customId}`}
            className={nameClass}
            whileTap={{ scale: 0.96 }}
          >
            @{comment.user.customId}
          </TapScaleLink>
          <span className={timeClass}>
            {relativeTime(comment.createdAt ?? "")}
          </span>
        </div>
        <p className={`mt-0.5 break-words ${contentClass}`}>
          <Linkify
            componentDecorator={(decoratedHref, decoratedText, key) => (
              <button
                type="button"
                key={key}
                className="break-words text-[#0070f3] underline-offset-2 hover:underline"
                onClick={() => jumpOut(decoratedHref)}
              >
                {decoratedText}
              </button>
            )}
          >
            {comment.content}
          </Linkify>
        </p>
        {!isReply && onReply && (
          <div className="mt-1.5 flex gap-3">
            <TapScale
              onClick={() => onReply(comment)}
              className="cursor-pointer font-semibold text-[11px] text-md-dark-green"
              whileTap={{ scale: 0.92 }}
              aria-label={`回覆 @${comment.user.customId}`}
            >
              ↩ 回覆
            </TapScale>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. `react-linkify` is already a project dependency. `jumpOut` exists in `utils/jumpOut`.

- [ ] **Step 3: Commit**

```bash
git add 'app/post/[postID]/(post)/mobile/components/CommentItem.tsx'
git commit -m "feat(mobile-post): add CommentItem component

Single comment view, used for both top-level (36px avatar, '回覆'
button) and reply variants (28px avatar, indented 24px, no reply
button — 1-level threading cap).

Tap author → /@customId profile. Linkify wraps URLs in content
using existing jumpOut helper. Wrapped in TapScale for press
feedback."
```

---

## Task 8: Create `CommentList` component

**Files:**
- Create: `app/post/[postID]/(post)/mobile/components/CommentList.tsx`

**Context:** Renders the section header, loading skeleton, empty state, or grouped comment thread (top-level + nested replies). Sorting: top-level newest-first, replies oldest-first.

- [ ] **Step 1: Create the file**

Create `app/post/[postID]/(post)/mobile/components/CommentList.tsx` with EXACTLY:

```tsx
"use client";

import type { TComments } from "@/interfaces/comments";

import CommentItem from "./CommentItem";

type Props = {
  comments: TComments[];
  isLoading: boolean;
  onReply: (comment: TComments) => void;
};

function CommentSkeleton({ small = false }: { small?: boolean }) {
  return (
    <div
      className={
        small
          ? "ml-6 flex animate-pulse gap-2 rounded-xl bg-white/55 p-2.5"
          : "flex animate-pulse gap-2.5 rounded-2xl bg-white/70 p-3"
      }
      aria-busy="true"
    >
      <div
        className="flex-shrink-0 rounded-full bg-white/80"
        style={{
          width: small ? 28 : 36,
          height: small ? 28 : 36,
        }}
      />
      <div className="flex-1 space-y-2">
        <div className="h-2.5 w-20 rounded bg-white/80" />
        <div className="h-2 w-full rounded bg-white/80" />
        <div className="h-2 w-3/5 rounded bg-white/80" />
      </div>
    </div>
  );
}

export default function CommentList({ comments, isLoading, onReply }: Props) {
  const topLevel = comments
    .filter((c) => !c.reply)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );

  const repliesByParent = new Map<string, TComments[]>();
  for (const comment of comments) {
    if (comment.reply) {
      const arr = repliesByParent.get(comment.reply) ?? [];
      arr.push(comment);
      repliesByParent.set(comment.reply, arr);
    }
  }
  for (const arr of repliesByParent.values()) {
    arr.sort(
      (a, b) =>
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime(),
    );
  }

  return (
    <section
      id="comments-section"
      aria-labelledby="comments-heading"
      className="flex flex-col gap-2 px-1"
    >
      <div className="flex items-baseline gap-2 px-1 pt-2">
        <h3
          id="comments-heading"
          className="m-0 font-bold text-base text-md-dark-green"
        >
          留言
        </h3>
        <span className="text-gray-500 text-xs">{comments.length} 則</span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <CommentSkeleton />
          <CommentSkeleton small />
          <CommentSkeleton />
        </div>
      ) : comments.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl bg-white/55 p-8 text-center backdrop-blur-md"
        >
          <div className="mb-2 text-3xl">💬</div>
          <div className="font-semibold text-[13px] text-md-dark-green">
            尚無留言
          </div>
          <div className="mt-1 text-[11px] text-gray-600">
            搶先留下你的想法吧！
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {topLevel.map((top) => (
            <div key={top._id} className="flex flex-col gap-2">
              <CommentItem comment={top} variant="top" onReply={onReply} />
              {(repliesByParent.get(top._id) ?? []).map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  variant="reply"
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. Biome may want the skeleton small/large branches as separate components — but the inline ternary is acceptable for a 30-line helper.

- [ ] **Step 3: Commit**

```bash
git add 'app/post/[postID]/(post)/mobile/components/CommentList.tsx'
git commit -m "feat(mobile-post): add CommentList component

Renders section header (留言 + count), 3-item pulse skeleton while
loading, '尚無留言' empty state, or the grouped thread of top-level
comments + their replies (sorted newest-first / oldest-first
respectively).

Owns the id='comments-section' anchor that PostActions' comment-tap
scrolls to."
```

---

## Task 9: Create `CommentComposer` component

**Files:**
- Create: `app/post/[postID]/(post)/mobile/components/CommentComposer.tsx`

**Context:** Sticky bottom composer. Shows the current user's avatar + an auto-growing textarea + send button. When `replyingTo` is set, a small banner appears above the input ("↩ 回覆 @{user} ✕"). Optimistically submits; surfaces success/error via toasts. Logged-out tap on send shows toast with 登入 action.

- [ ] **Step 1: Create the file**

Create `app/post/[postID]/(post)/mobile/components/CommentComposer.tsx` with EXACTLY:

```tsx
"use client";

import Image from "next/image";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { TapScale } from "@/components/mobile/TapScale";
import { toast } from "@/components/mobile/Toast";
import type { TComments } from "@/interfaces/comments";
import { useUserAccount } from "@/utils/useUserAccount";

import { PostCommentAPI } from "../../apis/CommentAPI";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DEFAULT_AVATAR = `${API_URL}/image/653299930b891d1f6b5b4458`;

type Props = {
  postId: string;
  replyingTo: TComments | null;
  onClearReply: () => void;
  onSubmitted: () => void;
};

export default function CommentComposer({
  postId,
  replyingTo,
  onClearReply,
  onSubmitted,
}: Props) {
  const { isLogin, isLoading, userData, token, login } = useUserAccount();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const avatar = userData?.avatar || DEFAULT_AVATAR;
  const canSend = !submitting && text.trim().length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
  }, [text]);

  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSend = async (e?: FormEvent | KeyboardEvent) => {
    e?.preventDefault();
    if (isLoading) {
      return;
    }
    if (!isLogin) {
      toast.info("登入後即可留言", {
        action: { label: "登入", onClick: () => login() },
      });
      return;
    }
    if (!canSend) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await PostCommentAPI(
        postId,
        replyingTo?._id ?? "",
        text.trim(),
        token,
      );
      if (res?.status === 2000) {
        setText("");
        onClearReply();
        onSubmitted();
        toast.success("留言成功");
      } else {
        toast.error("發送失敗");
      }
    } catch (_err) {
      toast.error("發送失敗");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSend(e);
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-10">
      {replyingTo && (
        <div className="flex items-center justify-between bg-[#009BB0]/10 px-3.5 py-1.5 text-[11px] text-md-dark-green">
          <span>
            ↩ 回覆 <strong>@{replyingTo.user.customId}</strong>
          </span>
          <button
            type="button"
            onClick={onClearReply}
            className="text-gray-500"
            aria-label="取消回覆"
          >
            ✕
          </button>
        </div>
      )}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-black/5 border-t bg-white/97 px-3 py-2 backdrop-blur-md"
      >
        <Image
          src={avatar}
          alt="your avatar"
          width={32}
          height={32}
          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
          unoptimized
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? "寫下你的回覆…" : "寫下你的想法…"}
          aria-label="留言內容"
          rows={1}
          className="min-h-[2rem] flex-1 resize-none rounded-2xl bg-[#f1f5f9] px-3.5 py-1.5 text-[13px] text-md-dark-green outline-none"
        />
        <TapScale
          onClick={handleSend}
          className={
            canSend
              ? "flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-md-light-green text-white"
              : "flex h-8 w-8 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-gray-300 text-white"
          }
          whileTap={canSend ? { scale: 0.9 } : undefined}
          aria-label="送出留言"
        >
          ➤
        </TapScale>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. The `useUserAccount()` hook exposes `login` (verified by reading `utils/useUserAccount` during planning — it does). If for some reason it doesn't, swap `login()` to a `router.push("/api/auth/signin")` redirect.

The `Enter` to submit + `Shift+Enter` for newline is the conventional behavior — keeps single-line feel without losing multiline ability.

- [ ] **Step 3: Commit**

```bash
git add 'app/post/[postID]/(post)/mobile/components/CommentComposer.tsx'
git commit -m "feat(mobile-post): add CommentComposer component

Sticky bottom composer with auto-growing textarea (max 3 lines via
72px scrollHeight cap). Reply mode shows banner above the input;
Enter submits, Shift+Enter newline. Optimistic toast feedback on
success/failure. Logged-out send → toast.info with '登入' action."
```

---

## Task 10: Rewrite `Thread.tsx` + delete obsolete files

**Files:**
- Rewrite: `app/post/[postID]/(post)/mobile/Thread.tsx`
- Delete: `app/post/[postID]/(post)/mobile/Thread.module.scss`
- Delete: `app/post/[postID]/(post)/mobile/Replies.tsx`
- Delete: `app/post/[postID]/(post)/mobile/Replies.module.scss`

**Context:** Thread becomes a thin composition shell. Owns the comments fetch and the `replyingTo` state. Wires together all six new components. Listens for the `mobile:scroll-to-comments` window event (dispatched by PostActions when the user taps the comment count).

- [ ] **Step 1: Replace `Thread.tsx` with EXACTLY:**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { TComments } from "@/interfaces/comments";
import type { TThread } from "@/interfaces/Thread";

import { GetCommentAPI } from "../apis/CommentAPI";
import CommentComposer from "./components/CommentComposer";
import CommentList from "./components/CommentList";
import PostActions from "./components/PostActions";
import PostBody from "./components/PostBody";
import PostHeader from "./components/PostHeader";

type Props = {
  post: TThread;
  isAnnouncement?: boolean;
};

export default function Thread({ post, isAnnouncement }: Props) {
  const [comments, setComments] = useState<TComments[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<TComments | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const commentsAnchorRef = useRef<HTMLDivElement>(null);

  const refetchComments = useCallback(async () => {
    try {
      const res = await GetCommentAPI(post);
      setComments(res?.data ?? []);
    } catch (_err) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [post]);

  useEffect(() => {
    setCommentsLoading(true);
    refetchComments();
  }, [refetchComments]);

  useEffect(() => {
    const onScrollToComments = () => {
      commentsAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };
    window.addEventListener(
      "mobile:scroll-to-comments",
      onScrollToComments,
    );
    return () => {
      window.removeEventListener(
        "mobile:scroll-to-comments",
        onScrollToComments,
      );
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="scrollbar-hide absolute inset-0 flex flex-col overflow-y-auto pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col gap-2 px-2 pt-2">
        <PostHeader post={post} isAnnouncement={isAnnouncement} />
        <PostBody post={post} isAnnouncement={isAnnouncement} />
        {!isAnnouncement && (
          <PostActions post={post} commentCount={comments.length} />
        )}
      </div>
      {!isAnnouncement && (
        <>
          <div ref={commentsAnchorRef} className="mt-2 px-1">
            <CommentList
              comments={comments}
              isLoading={commentsLoading}
              onReply={setReplyingTo}
            />
          </div>
          <CommentComposer
            postId={post._id ?? ""}
            replyingTo={replyingTo}
            onClearReply={() => setReplyingTo(null)}
            onSubmitted={() => {
              refetchComments();
            }}
          />
        </>
      )}
    </div>
  );
}
```

**Notes:**
- The outer container uses `position: absolute; inset: 0` (matching the layout fix from the previous mobile-UI Phase 2 hotfix). It's the scroll container; comments + composer live inside it.
- Top/bottom padding accounts for the existing fixed HeaderBar + ToolBar (Phase 1 work).
- `pb-[calc(4rem+env(safe-area-inset-bottom))]` reserves space for the bottom toolbar so the composer (sticky inside this scroller) sits above the toolbar visually.
- Announcement posts: hide PostActions, CommentList, CommentComposer entirely (matches the existing announcement = read-only behavior).

- [ ] **Step 2: Delete obsolete files**

Run:
```bash
git rm 'app/post/[postID]/(post)/mobile/Thread.module.scss'
git rm 'app/post/[postID]/(post)/mobile/Replies.tsx'
git rm 'app/post/[postID]/(post)/mobile/Replies.module.scss'
```

- [ ] **Step 3: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

If anything fails because the old Replies.tsx had unique exports that are imported elsewhere — search for residual imports:
```bash
grep -rn "from.*mobile/Replies" app/ components/ utils/ modules/ 2>/dev/null
```
Expected: no results.

Also check for leftover Reply-from-components imports in mobile (we don't want any mobile file still importing the desktop-shared Reply):
```bash
grep -rn "from.*components/Reply" app/post/\[postID\]/\(post\)/mobile/ 2>/dev/null
```
Expected: no results.

- [ ] **Step 4: Commit (the rewrite, deletions, and any leftover cleanup in one commit)**

```bash
git add 'app/post/[postID]/(post)/mobile/Thread.tsx'
git commit -m "feat(mobile-post): rewrite Thread as composition shell

Thread.tsx is now a thin composition wrapping the new components
(PostHeader, PostBody, PostActions, CommentList, CommentComposer).
It owns the comments fetch (GetCommentAPI), the replyingTo state,
and the scroll-to-comments event listener (PostActions dispatches
the event when the user taps the comment count).

Deletes the obsolete Thread.module.scss (replaced by Tailwind
utilities + per-component glassmorphism cards), Replies.tsx, and
Replies.module.scss. The shared (post)/components/Reply.tsx stays
because desktop ThreadInfo still uses it.

Layout uses absolute inset-0 + flex column with overflow-y-auto,
matching the Phase 2 PageTransition fix. Composer is sticky inside
this scroll container so it floats above the bottom toolbar."
```

---

## Task 11: End-of-feature verification

**Files:** none

**Context:** All implementation complete. Run quality gate, confirm git state, manual smoke check. NO PR — lands on the same branch (`feat/mobile-ui-enhancement`) per the user's branch strategy.

- [ ] **Step 1: Full quality gate**

Working dir: `/Users/lazp/Projects/Mingdao/MingdaoSIG-Frontend`

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean across the board.

- [ ] **Step 2: Confirm desktop is untouched**

Run:
```bash
git diff main -- app/post/\[postID\]/\(post\)/desktop/ app/post/\[postID\]/\(post\)/components/Reply.tsx app/post/\[postID\]/\(post\)/components/Reply.module.scss
```
Expected: NO output (these files unchanged since the branch began). If output appears, investigate before continuing.

- [ ] **Step 3: Cross-check files**

Run: `ls app/post/\[postID\]/\(post\)/mobile/`
Expected: ONLY `Thread.tsx` and `components/`. NO Replies.tsx, NO Replies.module.scss, NO Thread.module.scss.

Run: `ls app/post/\[postID\]/\(post\)/mobile/components/`
Expected: PostHeader.tsx, PostBody.tsx, PostActions.tsx, CommentItem.tsx, CommentList.tsx, CommentComposer.tsx (6 files).

Run: `ls utils/useUser/ utils/useSig/ modules/relativeTime/`
Expected: each shows `index.tsx` or `index.ts` (3 new utilities present).

- [ ] **Step 4: Git state**

Run:
```bash
git status
git log --oneline c2dfb40~1..HEAD
```

Expected: clean working tree. Commit list shows the spec commit (`c2dfb40`) plus the 10 new task commits (relativeTime, useUser, useSig, PostHeader, PostBody, PostActions, CommentItem, CommentList, CommentComposer, Thread-rewrite-and-deletes).

- [ ] **Step 5: Report**

Report:
- Quality gate output
- File checklist results (above)
- Commit list
- Anything unexpected
- Recommend the user manually test on Chrome DevTools iPhone emulation: visit a real post, verify (a) long title wraps, (b) author + SIG badge render (or fall back gracefully if `/user/:id` / `/sig/:id` 404), (c) like animation pumps on toggle, (d) comment count tap smooth-scrolls to comments, (e) tap "回覆" on a top-level comment → banner appears in composer, (f) send a reply → appears indented under parent, (g) share button works (native share dialog or clipboard toast)

DO NOT push or open a PR.

---

## Self-review checklist (for the plan author)

- **Spec coverage:**
  - PostHeader (back/author/SIG/share/time) — Task 4 ✓
  - PostBody (wrapped title, hashtags, MdPreview, announcement variant) — Task 5 ✓
  - PostActions (like + count + animation + comment count scroll + edit) — Task 6 ✓
  - CommentItem (avatar/name/time/content/reply) — Task 7 ✓
  - CommentList (header/empty/loading/threading) — Task 8 ✓
  - CommentComposer (sticky/reply mode/optimistic) — Task 9 ✓
  - Thread.tsx rewrite + deletions — Task 10 ✓
  - useUser hook — Task 2 ✓
  - useSig hook — Task 3 (added beyond spec; documented in plan header) ✓
  - relativeTime utility — Task 1 ✓
  - Reply.tsx preserved (desktop dependency) — Task 10 verification step ✓
- **Placeholder scan:** No TBD / TODO / "similar to" / "appropriate error handling". Every code block is complete. ✓
- **Type consistency:** `TComments` props consistent. `TThread` props consistent. Variant strings `"top" | "reply"` consistent between CommentItem and CommentList. Window event name `mobile:scroll-to-comments` matches between PostActions dispatch (Task 6) and Thread listen (Task 10). ✓
- **No new deps:** Confirmed — TanStack Query, motion, md-editor-rt, react-linkify all already in deps. ✓
- **Mobile-only:** All changes scoped to `app/post/[postID]/(post)/mobile/*`, `components/mobile/*` (existing), `utils/useUser/*`, `utils/useSig/*`, `modules/relativeTime/*`. Desktop untouched. Verification step confirms. ✓
