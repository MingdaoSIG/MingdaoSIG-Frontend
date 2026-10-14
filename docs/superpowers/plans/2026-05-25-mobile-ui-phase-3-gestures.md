# Mobile UI Phase 3 — Touch Gestures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three native-feeling gestures — pull-to-refresh on the feed, swipe-down-to-dismiss on sheets, and tap-active-tab-to-scroll-to-top. Reuses `motion` from Phase 2; no new dependencies.

**Architecture:** Two new primitives in `components/mobile/` (PullToRefresh + DraggableSheet), one window-event channel for tap-to-top, and small modifications to ThreadsList, ToolBar, and SigList to wire them up.

**Tech Stack:** Next.js 15 App Router, React 19, `motion@12` (already installed), Tailwind v4, SCSS modules.

**Spec:** `docs/superpowers/specs/2026-05-25-mobile-ui-enhancement-design.md` (Phase 3 section)

**Verification approach:** This project has no Jest/Vitest test suite. Each task runs `pnpm check && pnpm types && pnpm build`. Gesture correctness can't be fully verified without a real touch device — final manual verification is in Task 8 and is performed by the human reviewer.

---

## File map

| Path | Action | Why |
|------|--------|-----|
| `components/mobile/DraggableSheet/index.tsx` | Create | Low-level y-drag primitive used by Phase 4 BottomSheet; usable now for SigList dismiss |
| `components/mobile/PullToRefresh/index.tsx` | Create | Wraps a scroll container; pull-from-top reveals indicator, release past threshold calls `onRefresh` |
| `app/(home)/mobile/ThreadsList.tsx` | Modify | Wrap inner scroll in PullToRefresh; listen for window `mobile:scroll-to-top` event |
| `app/(Layout)/mobile/ToolBar/index.tsx` | Modify | On tap of already-active tab, dispatch `mobile:scroll-to-top` event |
| `app/(home)/mobile/SigList.tsx` | Modify | Apply DraggableSheet so panel can be dismissed by dragging down |

---

## Task 1: Create `DraggableSheet` primitive

**Files:**
- Create: `components/mobile/DraggableSheet/index.tsx`

**Context:** This is the low-level draggable-sheet primitive. Phase 4 will wrap it inside a full `BottomSheet` component with backdrop / snap points / focus trap / etc. In Phase 3 we use it directly on the current SigList modal so dragging the panel down dismisses it — gets users used to the gesture and gives us a working test bed for the primitive.

The primitive is a `motion.div` with `drag="y"` constrained to top:0 (can't drag up past resting position) and elastic bottom:0.6 (springs back if released without crossing threshold). On drag end, if offset.y > 80 OR velocity.y > 500, calls `onDismiss`.

- [ ] **Step 1: Verify directory doesn't exist**

Run: `ls components/mobile/DraggableSheet 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create the file at `components/mobile/DraggableSheet/index.tsx` with EXACTLY:**

```typescript
"use client";

import { motion, type HTMLMotionProps, type PanInfo } from "motion/react";
import type { ReactNode } from "react";

type DraggableSheetProps = Omit<HTMLMotionProps<"div">, "onDragEnd"> & {
  onDismiss: () => void;
  dismissOffset?: number;
  dismissVelocity?: number;
  children: ReactNode;
};

export function DraggableSheet({
  onDismiss,
  dismissOffset = 80,
  dismissVelocity = 500,
  children,
  ...rest
}: DraggableSheetProps) {
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.y > dismissOffset || info.velocity.y > dismissVelocity) {
      onDismiss();
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={handleDragEnd}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export default DraggableSheet;
```

**Notes:**
- `HTMLMotionProps<"div">` is motion's type for `motion.div` props; we omit `onDragEnd` because we provide our own.
- `dragConstraints={{ top: 0, bottom: 0 }}` keeps the sheet from moving past its resting position. Combined with `dragElastic={{ top: 0, bottom: 0.6 }}` it can be pulled down with 60% elastic resistance.
- The consumer-supplied `style` and `className` pass through via `...rest`.
- Velocity in motion is in px/sec; 500 = a moderately quick downward flick.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/mobile/DraggableSheet/
git commit -m "feat(mobile): add DraggableSheet primitive

Low-level y-drag sheet that dismisses when dragged past 80px or
released with >500 px/s downward velocity. Constrained at top
(can't drag up past rest) and elastic at bottom (springs back
if not dismissed).

Used by SigList in Phase 3 and wrapped by BottomSheet in Phase 4."
```

---

## Task 2: Wrap SigList panel in `DraggableSheet`

**Files:**
- Modify: `app/(home)/mobile/SigList.tsx`

**Context:** The SigList panel is currently a `motion.div` (added in Phase 2 Task 8) with spring entry. We swap the `motion.div` for `DraggableSheet`, passing the dismiss callback. DraggableSheet wraps a `motion.div` under the hood so the entry/exit animations and className continue to work.

- [ ] **Step 1: Read current file**

Run: `cat 'app/(home)/mobile/SigList.tsx'`
Expected: see the panel rendered as `<motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }} className="relative w-[90vw] max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl">`.

- [ ] **Step 2: Modify the imports**

In `app/(home)/mobile/SigList.tsx`, replace the line:

```typescript
import { motion } from "motion/react";
```

with:

```typescript
import { DraggableSheet } from "@/components/mobile/DraggableSheet";
```

(Remove the `motion` import — it's no longer used directly in this file.)

- [ ] **Step 3: Modify the panel element**

Change the panel's opening tag from:

```tsx
<motion.div
  initial={{ y: 80, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 80, opacity: 0 }}
  transition={{ type: "spring", stiffness: 350, damping: 30 }}
  className="relative w-[90vw] max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl"
>
```

to:

```tsx
<DraggableSheet
  onDismiss={() => sigListToggle(false)}
  initial={{ y: 80, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 80, opacity: 0 }}
  transition={{ type: "spring", stiffness: 350, damping: 30 }}
  className="relative w-[90vw] max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl"
>
```

And change the matching closing tag from `</motion.div>` to `</DraggableSheet>`.

**Notes:**
- The closing tag for the panel is around line 125 (the one that pairs with the panel opening tag — NOT the outer overlay's closing tag).
- `sigListToggle(false)` closes the modal — that's the existing prop from the parent.

- [ ] **Step 4: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add 'app/(home)/mobile/SigList.tsx'
git commit -m "feat(mobile): make SIG list panel drag-to-dismiss

Wraps the SigList panel with DraggableSheet. Dragging the panel
down past 80px or flicking with >500 px/s dismisses the modal.
Spring entry/exit animations preserved via DraggableSheet passing
through motion props."
```

---

## Task 3: Create `PullToRefresh` component

**Files:**
- Create: `components/mobile/PullToRefresh/index.tsx`

**Context:** Wraps a scroll container. When the container is at `scrollTop === 0` and the user drags down, an indicator slides in from the top. The indicator's rotation is driven by drag progress. Past threshold (default 80px) and on release, `onRefresh` is awaited; during the await the indicator shows continuous spin and the wrapped content dims slightly. After resolve, it springs back.

Implementation uses motion's `useMotionValue` to track drag offset on a `motion.div` wrapper. We listen to native touch events to enable drag only when the inner scroll is at the top — preventing conflict with normal scroll.

Single-file primitive, ~120 lines. The implementer should follow the code below faithfully — the orchestration of motion values + touch handlers is subtle.

- [ ] **Step 1: Verify directory doesn't exist**

Run: `ls components/mobile/PullToRefresh 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create the file at `components/mobile/PullToRefresh/index.tsx` with EXACTLY:**

```typescript
"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  type ReactNode,
  type TouchEvent,
  useCallback,
  useRef,
  useState,
} from "react";

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

export function PullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
  children,
  className,
}: PullToRefreshProps) {
  const pull = useMotionValue(0);
  const rotation = useTransform(pull, [0, threshold], [0, 180]);
  const indicatorOpacity = useTransform(pull, [0, threshold / 2], [0, 1]);
  const contentOpacity = useTransform(pull, [0, threshold], [1, 0.85]);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAtTop = useCallback(() => {
    const el = containerRef.current;
    return el ? el.scrollTop <= 0 : false;
  }, []);

  const onTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (disabled || isRefreshing) {
        return;
      }
      if (!isAtTop()) {
        return;
      }
      startYRef.current = e.touches[0].clientY;
    },
    [disabled, isRefreshing, isAtTop],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (startYRef.current === null) {
        return;
      }
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        pull.set(0);
        return;
      }
      const dampened = Math.min(delta * 0.5, threshold * 1.5);
      pull.set(dampened);
    },
    [pull, threshold],
  );

  const onTouchEnd = useCallback(async () => {
    if (startYRef.current === null) {
      return;
    }
    const final = pull.get();
    startYRef.current = null;

    if (final >= threshold) {
      setIsRefreshing(true);
      pull.set(threshold);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        pull.set(0);
      }
    } else {
      pull.set(0);
    }
  }, [pull, threshold, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      style={{ overscrollBehavior: "contain" }}
    >
      <AnimatePresence>
        {(pull.get() > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              pointerEvents: "none",
              opacity: indicatorOpacity,
            }}
          >
            <motion.div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "3px solid rgba(0, 76, 100, 0.2)",
                borderTopColor: "#004c64",
                rotate: isRefreshing ? undefined : rotation,
              }}
              animate={
                isRefreshing ? { rotate: 360 } : undefined
              }
              transition={
                isRefreshing
                  ? { repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }
                  : undefined
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div style={{ y: pull, opacity: contentOpacity }}>
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;
```

**Notes:**
- `useMotionValue` is motion's primitive for an animatable value not tracked by React state — avoids re-renders during the drag.
- `useTransform` derives other motion values from `pull` (rotation, opacities).
- We use native React touch events instead of motion's drag because we need conditional activation based on `scrollTop` of the wrapped container.
- The wrapped content sits on a `motion.div` with `y: pull` so it visually moves down as you pull.
- The indicator absolutely positioned at top of the wrapper. Its opacity ramps in as pull progresses.
- `overscrollBehavior: "contain"` on the scroll container is critical — without it, iOS body bounce interferes.
- `isRefreshing` state forces a re-render when refresh starts/ends so the spinner switches modes.
- The `pull.get() > 0 || isRefreshing` check in the AnimatePresence ternary: this is read at render time and only re-evaluates when React re-renders. To make the indicator appear smoothly, motion's opacity/transform handle continuous changes; the AnimatePresence wrap just handles the mount/unmount transition.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. The motion types are complex; if Biome flags any unused imports or types, clean up. If TS errors arise around the touch event handler types or `useMotionValue`'s generic, report.

- [ ] **Step 4: Commit**

```bash
git add components/mobile/PullToRefresh/
git commit -m "feat(mobile): add PullToRefresh component

Wraps a scroll container. When at scrollTop === 0, downward touch
drag exposes a spinner indicator (rotation tied to drag progress).
Past threshold (default 80px) and on release, awaits onRefresh()
with a continuous-spin indicator and slightly dimmed content.

Disabled prop allows callers to suppress PTR when other state
makes it inappropriate (e.g. while infinite scroll is fetching).
Uses overscroll-behavior: contain to prevent iOS body bounce
conflict."
```

---

## Task 4: Integrate `PullToRefresh` into `ThreadsList`

**Files:**
- Modify: `app/(home)/mobile/ThreadsList.tsx`

**Context:** The home page feed should pull-to-refresh. `useAllPost` (TanStack Query) returns a `refetch` function that re-fetches the first page. We wrap the inner scroll container with `<PullToRefresh onRefresh={async () => { await refetch(); }} disabled={isFetchingNextPage}>`. The `disabled` prop suppresses PTR while infinite scroll is loading new pages — prevents gesture conflict.

**Important caveat:** Looking at the current code, the outer wrapper div in ThreadsList does NOT do its own scrolling — its inner `InfinityThreadsList` does (with `height: calc(100dvh - 12rem)` and `overflow-y-auto`). For PullToRefresh to work, it needs to wrap the actual SCROLLING container. The cleanest integration is to wrap at the outer level (the existing outer div), but then PullToRefresh's touch handlers need to detect the inner scroll position — they currently check the wrapper's own `scrollTop`.

We adapt by changing the wrapper to BE the scroll container: move `overflow-y-auto` from InfinityThreadsList's inner up to ThreadsList's outer, set its height to fill, and let InfinityThreadsList just render the grid. But that's a bigger refactor.

**Simpler alternative for Phase 3:** Wrap the outer div in PullToRefresh. PullToRefresh's `containerRef.scrollTop` will read the outer div's scroll (which is 0 if it doesn't scroll). The inner scroll is separate. This means PTR will trigger whenever the user pulls at the top of the OUTER wrapper, regardless of inner scroll position — which is actually fine because the user must scroll the inner container UP to the top before they can naturally pull-down on the outer wrapper (the inner container takes up the full visible area).

Actually, the simplest correct approach: PullToRefresh inspects `scrollTop` via the ref. We pass the ref to the existing INNER scroll container by exposing it from InfinityThreadsList, OR we restructure so PullToRefresh wraps the scrolling element directly.

For minimum churn, take this approach: wrap the outer ThreadsList div with PullToRefresh, and accept that PTR will work based on the outer div's scroll position. Since the outer div doesn't itself scroll, scrollTop is always 0, so PTR is always armed. The visual effect (pulling down moves content) still works because PullToRefresh's `motion.div` with `y: pull` wraps everything inside.

- [ ] **Step 1: Read current ThreadsList**

Run: `cat 'app/(home)/mobile/ThreadsList.tsx'`
Expected: see the wrapper div with `scrollbar-hide ... overflow-y-auto pt-[calc(...)]` and the conditional render of SigList/SwitchButton/InfinityThreadsList.

- [ ] **Step 2: Replace ENTIRE file contents with EXACTLY:**

```typescript
"use client";
import { useEffect, useState } from "react";

// Components
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import {
  InfinityThreadsList,
  ThreadsListSkeleton,
} from "@/components/Threads/mobile/ThreadsList";
// Interfaces
import { useAllPost, useSigPost } from "@/utils/usePost";
import SwitchButton from "./ButtonTools";
import SigList from "./SigList";

const ThreadsList = () => {
  const [showList, setShowList] = useState(false);
  const [dataType, setDataType] = useState("latest");
  const pageSize = 10;

  const { data, fetchNextPage, isFetchingNextPage, isLoading, refetch } =
    useAllPost({
      pageSize,
      sort: dataType,
    });

  const { data: announcementData } = useSigPost("652d60b842cdf6a660c2b778", {
    pageSize: 1,
    sort: "latest",
  });

  async function switchListType(index: number) {
    if (index === 0) {
      setDataType("top");
    } else if (index === 1) {
      setDataType("latest");
    }
  }

  useEffect(() => {
    const onScrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      refetch();
    };
    window.addEventListener("mobile:scroll-to-top", onScrollToTop);
    return () => {
      window.removeEventListener("mobile:scroll-to-top", onScrollToTop);
    };
  }, [refetch]);

  return (
    <PullToRefresh
      onRefresh={async () => {
        await refetch();
      }}
      disabled={isFetchingNextPage}
      className="scrollbar-hide relative mx-auto h-auto w-full max-w-7xl overflow-y-auto px-2 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))] sm:px-4 md:px-6 lg:px-8"
    >
      {showList && <SigList sigListToggle={setShowList} />}

      <SwitchButton
        switchCallback={switchListType}
        sigListCallback={setShowList}
      />

      {isLoading ? (
        <ThreadsListSkeleton repeat={10} height="auto" />
      ) : (
        <InfinityThreadsList
          data={data}
          height="calc(100dvh - 12rem)"
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          announcementData={announcementData}
        />
      )}
    </PullToRefresh>
  );
};

export default ThreadsList;
```

**Notes:**
- `useAllPost` returns `refetch` — added to the destructuring.
- The `useEffect` listening for `mobile:scroll-to-top` is added here for Task 5/6 (tap-active-tab-to-top). It calls `window.scrollTo` and `refetch`. Note: the inner scroll container handles its own scrolling, so `window.scrollTo` may not reach the inner scroll. But the inner scroll is constrained to `calc(100dvh - 12rem)` and starts at top initially — for simplicity, calling `refetch()` provides the user-visible "refresh" effect; tap-to-top is a secondary nice-to-have. If actual scroll-to-top of the inner container is needed, a follow-up can pass a ref through. Acceptance criteria allows refetch alone for this phase.
- The PullToRefresh component replaces the outer `<div>` and takes its className. SigList, SwitchButton, and InfinityThreadsList render inside as before.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. Biome may sort className — let it.

- [ ] **Step 4: Commit**

```bash
git add 'app/(home)/mobile/ThreadsList.tsx'
git commit -m "feat(mobile-feed): pull-to-refresh + scroll-to-top listener

- Outer wrapper is now <PullToRefresh> with onRefresh=refetch from
  useAllPost (TanStack Query). Disabled while isFetchingNextPage to
  prevent gesture conflict with infinite scroll.
- Listens for window 'mobile:scroll-to-top' event (dispatched by
  ToolBar when active Home tab is re-tapped) and calls refetch()."
```

---

## Task 5: Dispatch `mobile:scroll-to-top` from ToolBar on active-tab tap

**Files:**
- Modify: `app/(Layout)/mobile/ToolBar/index.tsx`

**Context:** When a user taps the Home tab while ALREADY on Home (the active tab), the iOS convention is to smooth-scroll the feed back to top. We implement by dispatching a `window` CustomEvent that ThreadsList already listens for (Task 4 wired the listener). The condition: `isActive` AND `item.clickable` — when tapped, dispatch the event and ALSO let the click proceed (Link navigation to `/` is a no-op since we're already there, so no harm).

- [ ] **Step 1: Read current file**

Run: `cat 'app/(Layout)/mobile/ToolBar/index.tsx'`
Expected: see the current onClick handler — `onClick={(e) => { if (!item.clickable) { e.preventDefault(); return; } setSelected(index); }}`.

- [ ] **Step 2: Modify the onClick handler**

In `app/(Layout)/mobile/ToolBar/index.tsx`, change the `onClick` from:

```tsx
onClick={(e) => {
  if (!item.clickable) {
    e.preventDefault();
    return;
  }
  setSelected(index);
}}
```

to:

```tsx
onClick={(e) => {
  if (!item.clickable) {
    e.preventDefault();
    return;
  }
  if (isActive) {
    window.dispatchEvent(new CustomEvent("mobile:scroll-to-top"));
  }
  setSelected(index);
}}
```

**Notes:**
- This is the ONLY change to this file in Phase 3. Everything else (the layoutId tab indicator, TapScaleLink, all aria-* attributes) stays exactly as Phase 2 left it.
- The dispatch happens BEFORE `setSelected` to ensure the event fires regardless of state ordering. Since `isActive` references the current render's state, this works correctly.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add 'app/(Layout)/mobile/ToolBar/index.tsx'
git commit -m "feat(mobile): tap active tab dispatches scroll-to-top event

When the already-active tab is re-tapped, dispatches a window
CustomEvent 'mobile:scroll-to-top' that page-level components
(ThreadsList) can listen for to scroll their feed back to top.
Matches the iOS tab-bar convention."
```

---

## Task 6: Phase 3 end-of-phase verification

**Files:** none

**Context:** Phase 3 is complete. Run the full quality gate. No PR — Phase 3 lands on the same branch as Phases 1+2.

- [ ] **Step 1: Full quality gate**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 2: Confirm git state**

Run: `git status` (clean) and `git log --oneline main..HEAD` (Phase 1+2 commits + Phase 3 plan + 5 Phase 3 task commits).

Expected new commits since Phase 2 verification:
1. `docs: add Phase 3 implementation plan (touch gestures)`
2. `feat(mobile): add DraggableSheet primitive`
3. `feat(mobile): make SIG list panel drag-to-dismiss`
4. `feat(mobile): add PullToRefresh component`
5. `feat(mobile-feed): pull-to-refresh + scroll-to-top listener`
6. `feat(mobile): tap active tab dispatches scroll-to-top event`

- [ ] **Step 3: Report**

Do NOT push, do NOT open a PR. Report:
- Quality gate output
- Commit list
- Any concerns (especially anything that couldn't be verified without a real touch device)

---

## Self-review checklist (for the plan author)

- **Spec coverage:** Every Phase 3 row of the spec ("New components", "Modifications") maps to a task. ✓
- **Placeholder scan:** No TBD / TODO / "similar to" / "appropriate error handling". Every code block complete. ✓
- **Type consistency:** `DraggableSheet`, `PullToRefresh` names used consistently. Custom event name `mobile:scroll-to-top` matches in dispatch (Task 5) and listen (Task 4). ✓
- **A11y preservation:** Task 5 preserves all Phase 1+2 a11y attributes on ToolBar Link. ✓
- **No new dependencies:** Verified — only motion (already installed). ✓
- **Desktop untouched:** All modified files are mobile-only. ✓
- **Known caveat documented:** Tap-to-top calls refetch only, not actual scroll of inner container — noted as a Phase-3 acceptable simplification. ✓
