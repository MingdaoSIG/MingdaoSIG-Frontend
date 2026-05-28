# Mobile UI Phase 2 — Motion Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `motion` library, page transitions between routes, animated tab indicator, universal tap-scale feedback on pressables, and spring-based modal entry. After Phase 2 the mobile app stops feeling like a static website.

**Architecture:** One new dependency (`motion`, ~10kb gz). Five new primitives in `components/mobile/` and `utils/useNavDirection/`. Existing files get small wrappers — no rewrites.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, SCSS modules. New: `motion` (motion.dev — modern framer-motion).

**Spec:** `docs/superpowers/specs/2026-05-25-mobile-ui-enhancement-design.md` (Phase 2 section)

**Verification approach:** This project has no Jest/Vitest test suite. Each task runs `pnpm check && pnpm types && pnpm build`. Animation correctness can't be fully checked without a real browser interaction — final manual verification is in Task 9, executed by the human reviewer.

---

## File map

| Path | Action | Why |
|------|--------|-----|
| `package.json` / `pnpm-lock.yaml` | Modify | Add `motion` dependency |
| `utils/useNavDirection/index.tsx` | Create | Track pathname stack → returns 1 (forward), -1 (back), 0 (initial) |
| `components/mobile/TapScale/index.tsx` | Create | Universal `motion`-wrapped pressable (`whileTap={{ scale: 0.94 }}`) — exports `TapScale`, `TapScaleButton`, `TapScaleLink` |
| `components/mobile/PageTransition/index.tsx` | Create | Wraps mobile route content with `AnimatePresence` keyed on `usePathname`; slide direction from `useNavDirection` |
| `app/device.tsx` | Modify | Wrap mobile `{children}` in `<PageTransition>` |
| `app/(Layout)/mobile/ToolBar/index.tsx` | Modify | Use `TapScaleLink` for each tab; render accent bar as `<motion.span layoutId="tab-indicator">` so it tweens between active tabs |
| `app/(home)/mobile/ButtonTools.tsx` | Modify | Replace manual `left-0`/`left-20` CSS toggle with `motion.div animate={{ x }}` spring; wrap buttons in `TapScale` |
| `app/(home)/mobile/SigList.tsx` | Modify | Replace CSS `animate-slideUp` keyframes with `motion` spring entry (transitional — Phase 4 rewrites entirely) |

---

## Task 1: Install `motion` dependency

**Files:**
- Modify: `package.json` (automatic via pnpm)
- Modify: `pnpm-lock.yaml` (automatic)

**Context:** The `motion` package (motion.dev, formerly framer-motion's mini variant) is the modern fork maintained by Matt Perry. It exports React bindings under the `motion/react` import path. We're pinning the major version, letting pnpm pick the latest minor.

- [ ] **Step 1: Verify motion is not already a dependency**

Run: `grep -E '"motion"' package.json || echo "not present"`
Expected: `not present`.

- [ ] **Step 2: Install motion as a runtime dependency**

Run: `pnpm add motion`
Expected: motion is added to `dependencies` in `package.json`. Lockfile updated. Version should be `^11.x` or `^12.x`.

- [ ] **Step 3: Verify install didn't break the build**

Run: `pnpm check && pnpm types && pnpm build`
Expected: same as before — clean check + types, only pre-existing `/admin` build error.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add motion library

motion (motion.dev) is the modern fork of framer-motion. Used in
Phase 2+ for page transitions, tab indicator animation, button
tap-scale feedback, and (later) gesture-driven bottom sheet."
```

---

## Task 2: Create `useNavDirection` hook

**Files:**
- Create: `utils/useNavDirection/index.tsx`

**Context:** Page transitions need to know which way to slide — forward navigation (Home → Post) slides in from the right; back navigation (Post → Home via browser back) slides in from the left. Next.js doesn't expose forward/back direction natively, so we track it ourselves by maintaining a small pathname stack: when the new pathname matches the previous entry in the stack, it's a back; otherwise it's a forward. Initial render returns 0 (no slide — fade only).

This implementation is best-effort. Edge cases like `/a → /b → /a → /b` produce "back" then "forward" but a `/a → /b → /c → /a` is detected as forward (the deeper pop-and-jump-back case is rare and the worst outcome is a "wrong-direction" slide, which is cosmetic).

- [ ] **Step 1: Verify directory doesn't exist**

Run: `ls utils/useNavDirection 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create the hook**

Create `utils/useNavDirection/index.tsx` with EXACTLY:

```typescript
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type NavDirection = -1 | 0 | 1;

export function useNavDirection(): NavDirection {
  const pathname = usePathname();
  const stackRef = useRef<string[]>([]);
  const [direction, setDirection] = useState<NavDirection>(0);

  useEffect(() => {
    const stack = stackRef.current;

    if (stack.length === 0) {
      stack.push(pathname);
      return;
    }

    if (stack[stack.length - 1] === pathname) {
      return;
    }

    if (stack.length >= 2 && stack[stack.length - 2] === pathname) {
      stack.pop();
      setDirection(-1);
      return;
    }

    stack.push(pathname);
    setDirection(1);
  }, [pathname]);

  return direction;
}

export default useNavDirection;
```

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean check + types. Pre-existing `/admin` build error OK.

- [ ] **Step 4: Commit**

```bash
git add utils/useNavDirection/
git commit -m "feat(utils): add useNavDirection hook for page transitions

Tracks pathname history in a ref-based stack and returns 1 (forward
navigation), -1 (browser/router back), or 0 (initial / unchanged).
PageTransition uses this to pick a slide direction.

Best-effort heuristic: detects back when the new pathname matches
the previous stack entry. Edge cases like A->B->A->B produce
back-then-forward (correct); worst case is a wrong-direction slide
on unusual nav patterns, which is cosmetic only."
```

---

## Task 3: Create `TapScale` component

**Files:**
- Create: `components/mobile/TapScale/index.tsx`

**Context:** Every pressable surface (buttons, links, cards) should respond to touch with a small scale-down. This is the cheapest, most impactful "feels alive" change. We expose three variants:

- `TapScale` — wraps a `<div>` (use for cards, generic surfaces)
- `TapScaleButton` — wraps a `<button>`
- `TapScaleLink` — wraps `next/link` so anchors work

All three accept all standard motion props on top of their native props. Default `whileTap={{ scale: 0.94 }}` is applied if the consumer doesn't override.

- [ ] **Step 1: Verify directory doesn't exist**

Run: `ls components/mobile 2>&1 || echo "not present"`
Expected: "not present" (this is the first thing in `components/mobile/`).

- [ ] **Step 2: Create the component**

Create `components/mobile/TapScale/index.tsx` with EXACTLY:

```typescript
"use client";

import { motion } from "motion/react";
import Link from "next/link";

export const TapScale = motion.div;
export const TapScaleButton = motion.button;
export const TapScaleLink = motion.create(Link);

export const defaultTapAnimation = {
  whileTap: { scale: 0.94 },
  transition: { type: "spring" as const, stiffness: 400, damping: 30 },
};
```

**Notes for the implementer:**
- `motion.div` / `motion.button` are pre-built primitives that accept any HTML div/button props PLUS motion props (`whileTap`, `animate`, `initial`, etc.). Consumers pass `whileTap={{ scale: 0.94 }}` themselves — we don't auto-apply it.
- `motion.create(Link)` wraps Next.js's `Link` component so it also accepts motion props.
- `defaultTapAnimation` is an exported object consumers can spread (`<TapScale {...defaultTapAnimation}>`) when they want the default behavior. Keeps the call sites tidy.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. The `motion.create(Link)` call has good TS types via motion's declarations — should not need any `any` casts.

If `pnpm types` complains about the `Link` import being unused at runtime but only used in `motion.create()`, this is expected — `motion.create()` does call it. The TS check should be satisfied as long as `Link` is imported.

- [ ] **Step 4: Commit**

```bash
git add components/mobile/TapScale/
git commit -m "feat(mobile): add TapScale primitive for tap feedback

Three exports wrapping motion's react primitives:
- TapScale (div), TapScaleButton (button), TapScaleLink (next/link)
- defaultTapAnimation = { whileTap: { scale: 0.94 }, spring }

Consumers apply whileTap explicitly or spread defaultTapAnimation.
Used by ToolBar, ButtonTools, and (Phase 3+) other interactive
surfaces."
```

---

## Task 4: Create `PageTransition` component

**Files:**
- Create: `components/mobile/PageTransition/index.tsx`

**Context:** Wraps the mobile route children in `AnimatePresence` keyed on `usePathname()`. When the pathname changes, the old wrapper exits and the new one enters. Slide direction comes from `useNavDirection`: forward = slide in from right (+24px), back = slide in from left (-24px), initial = no slide (just fade). Duration is short (200ms easeOut) — long transitions kill perceived snappiness.

The wrapper needs to be a transparent layout citizen — it shouldn't change how the page content renders. We give it `width: 100%` and `height: 100%` and trust the inner content to layout normally inside it.

- [ ] **Step 1: Verify directory doesn't exist**

Run: `ls components/mobile/PageTransition 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create the component**

Create `components/mobile/PageTransition/index.tsx` with EXACTLY:

```typescript
"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { useNavDirection } from "@/utils/useNavDirection";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const direction = useNavDirection();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ x: direction * 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -direction * 24, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ width: "100%", height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
```

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean check + types.

- [ ] **Step 4: Commit**

```bash
git add components/mobile/PageTransition/
git commit -m "feat(mobile): add PageTransition component

Wraps children in AnimatePresence keyed on usePathname. New route
slides in from the side useNavDirection indicates; old route slides
out the opposite way. Initial render and unchanged-pathname renders
have direction=0 -> fade only, no horizontal motion.

Duration 200ms easeOut keeps navigation feeling snappy. Wrapper has
100% width/height so the page content lays out as before."
```

---

## Task 5: Wire `PageTransition` into `device.tsx`

**Files:**
- Modify: `app/device.tsx`

**Context:** Currently `device.tsx` renders `<HeaderBarMobile />{children}<ToolBarMobile />` in the mobile branch. We wrap `{children}` with `PageTransition`. The header and toolbar are NOT wrapped — they're persistent (and they're position:fixed anyway, so wrapping them would be visually weird).

- [ ] **Step 1: Read current `app/device.tsx`**

Run: `cat app/device.tsx`
Expected: see the mobile branch with `<div className="wrapMobile"><HeaderBarMobile />{children}<ToolBarMobile /></div>`.

- [ ] **Step 2: Modify `app/device.tsx`**

Replace the entire file contents with EXACTLY:

```typescript
"use client";

// Third-Party Package
import { Fragment, type ReactNode } from "react";
import HeaderBarDesktop from "@/app/(Layout)/desktop/HeaderBar";
// Desktop-Side Component
import ToolBarDesktop from "@/app/(Layout)/desktop/ToolBar";
import HeaderBarMobile from "@/app/(Layout)/mobile/HeaderBar";
// Mobile-Side Component
import ToolBarMobile from "@/app/(Layout)/mobile/ToolBar";
import { PageTransition } from "@/components/mobile/PageTransition";

// Utils
import useIsMobile from "@/utils/useIsMobile";

export function Device({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <Fragment>
      {isMobile ? (
        <div className="wrapMobile">
          <HeaderBarMobile />
          <PageTransition>{children}</PageTransition>
          <ToolBarMobile />
        </div>
      ) : (
        <div className="wrap">
          <HeaderBarDesktop />
          {children}
          <ToolBarDesktop />
        </div>
      )}
    </Fragment>
  );
}
```

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/device.tsx
git commit -m "feat(mobile): wrap route children in PageTransition

Mobile branch only. Header and toolbar are persistent (and
position:fixed) so they stay outside the transition wrapper.
Desktop layout is unchanged."
```

---

## Task 6: Apply animated tab indicator + `TapScaleLink` to ToolBar

**Files:**
- Modify: `app/(Layout)/mobile/ToolBar/index.tsx`

**Context:** Today the toolbar's active indicator (the 3px accent bar above the active tab) is rendered conditionally: `{isActive && <span className={styles.activeIndicator} />}`. When the active tab changes, the old indicator instantly unmounts and the new one mounts — the eye sees a jump. We replace that with `motion`'s `layoutId` pattern: render the indicator only on the active tab but give it `layoutId="tab-indicator"`. Motion notices the layoutId is shared between the old and new mount and tweens the position between them, producing a sliding accent.

We also wrap each `<Link>` in `motion.create(Link)` so we get `whileTap={{ scale: 0.94 }}` per WCAG-conscious tap feedback. Since Task 4 of Phase 1 already added `aria-disabled` / `tabIndex={-1}` / `preventDefault` logic, we preserve all of that.

- [ ] **Step 1: Read current `app/(Layout)/mobile/ToolBar/index.tsx`**

Read the file and confirm it has the structure from Phase 1 Task 4 (after the a11y fix from commit `e09054b`): `<nav><ul>...<li><Link>...<span className={styles.activeIndicator}/>...</Link></li></ul></nav>`.

- [ ] **Step 2: Replace the file contents**

Replace the entire `app/(Layout)/mobile/ToolBar/index.tsx` with EXACTLY:

```typescript
"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { TapScaleLink } from "@/components/mobile/TapScale";
import { useUserAccount } from "@/utils/useUserAccount";
import styles from "./ToolBar.module.scss";

const ToolBar = () => {
  const { isLogin, userData, isLoading } = useUserAccount();

  const path = usePathname();
  const [selected, setSelected] = useState<number>(pathToSelected(path));

  useEffect(() => {
    setSelected(pathToSelected(path));
  }, [path]);

  const menu = [
    {
      name: "home",
      label: "Home",
      route: "/",
      icon: "/icons/bx-home-circle.svg",
      clickable: !isLoading,
    },
    {
      name: "user",
      label: "You",
      route: userData ? `/@${userData.customId}` : "/",
      icon: "/icons/bx-user.svg",
      clickable: !isLoading && isLogin,
    },
    {
      name: "new",
      label: "Post",
      route: "/new",
      icon: "/icons/plus-circle.svg",
      clickable: !isLoading,
    },
    {
      name: "info",
      label: "Info",
      route: "/info",
      icon: "/icons/info.svg",
      clickable: !isLoading,
    },
  ];

  return (
    <nav className={styles.toolBarWrapper} aria-label="Primary">
      <ul className={styles.tabList}>
        {menu.map((item, index) => {
          const isActive = selected === index;
          return (
            <li key={item.name} className={styles.tabItem}>
              <TapScaleLink
                href={item.route}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                style={{
                  opacity: item.clickable ? 1 : 0.4,
                  pointerEvents: item.clickable ? "auto" : "none",
                }}
                aria-current={isActive ? "page" : undefined}
                aria-disabled={!item.clickable || undefined}
                tabIndex={item.clickable ? undefined : -1}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={(e) => {
                  if (!item.clickable) {
                    e.preventDefault();
                    return;
                  }
                  setSelected(index);
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    className={styles.activeIndicator}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <Image
                  src={item.icon}
                  height={24}
                  width={24}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.label}>{item.label}</span>
              </TapScaleLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ToolBar;

function pathToSelected(path: string) {
  const homeRegex = /^\/$/gm;
  const userRegex = /^\/@(?!$)(?=.{1,25}$)[a-z0-9_]+(\.[a-z0-9_]+)*$/gm;
  const newRegex = /^\/new$/gm;
  const infoRegex = /^\/info$/gm;

  if (homeRegex.test(path)) {
    return 0;
  }
  if (userRegex.test(path)) {
    return 1;
  }
  if (newRegex.test(path)) {
    return 2;
  }
  if (infoRegex.test(path)) {
    return 3;
  }

  return -1;
}
```

**Implementer notes:**
- The previous file used plain `<Link>` — we replace with `<TapScaleLink>` which is `motion.create(Link)`. It accepts all `Link` props PLUS motion props (`whileTap`, `transition`, `animate`, etc.).
- The accent bar is now `<motion.span layoutId="tab-indicator">`. Motion sees the same `layoutId` across re-renders even when the element moves to a different DOM parent, and animates the position.
- Plain `Link` import was removed since `TapScaleLink` replaces it. Confirm the import list compiles.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. If Biome flags class name sort order, run `pnpm check:fix` and re-stage.

- [ ] **Step 4: Commit**

```bash
git add 'app/(Layout)/mobile/ToolBar/index.tsx'
git commit -m "feat(mobile): animate tab indicator and add tap feedback

- Active tab accent bar is now <motion.span layoutId='tab-indicator'>
  so motion auto-tweens it between tabs (spring 400/30) instead of
  the old instant unmount/mount jump
- Each tab is now <TapScaleLink> with whileTap scale 0.94 spring
- All Phase 1 a11y guards (aria-disabled, tabIndex, preventDefault)
  are preserved"
```

---

## Task 7: Refactor `ButtonTools` filter pill with motion + add `TapScale`

**Files:**
- Modify: `app/(home)/mobile/ButtonTools.tsx`

**Context:** The Latest/Top filter pill is currently a div absolutely positioned at `left-0` or `left-20`, transitioning via CSS `transition-all duration-500`. The duration-500 (500ms) is slow and the easing is linear, both of which feel un-app-like. We replace with a `motion.div` driven by `animate={{ x: 0 | 80 }}` and a spring transition (stiffness 400, damping 30 — matches the rest of the motion vocabulary established in Task 6). We also wrap the three buttons (Latest, Top, SIGs) in `TapScaleButton`.

Width math from the current code: container is `w-40` (10rem = 160px), each pill is `w-20` (5rem = 80px), so the pill slides from `x: 0` to `x: 80px`.

- [ ] **Step 1: Read current file**

Run: `cat app/\(home\)/mobile/ButtonTools.tsx`
Expected: see `const [activeTab, setActiveTab] = useState<"latest" | "top">("latest")` and the absolute-positioned pill div with `left-0`/`left-20` toggle.

- [ ] **Step 2: Replace file contents**

Replace `app/(home)/mobile/ButtonTools.tsx` with EXACTLY:

```typescript
"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { TapScaleButton } from "@/components/mobile/TapScale";

type Props = {
  switchCallback: (value: number) => void;
  sigListCallback: (value: boolean) => void;
};

const ButtonTools = ({ switchCallback, sigListCallback }: Props) => {
  const [activeTab, setActiveTab] = useState<"latest" | "top">("latest");

  return (
    <div className="mb-2 flex h-16 flex-row items-center justify-between md:mb-4">
      {/* Toggle Button */}
      <div className="relative flex w-40 select-none rounded-full bg-white/50 backdrop-blur-sm">
        <motion.div
          className="absolute h-10 w-20 rounded-full bg-md-dark-green"
          animate={{ x: activeTab === "latest" ? 0 : 80 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        <TapScaleButton
          type="button"
          className={`relative h-10 w-20 text-center text-sm md:text-base ${
            activeTab === "latest" ? "text-white" : "text-md-dark-green"
          }`}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={() => {
            setActiveTab("latest");
            switchCallback(1);
          }}
        >
          Latest
        </TapScaleButton>
        <TapScaleButton
          type="button"
          className={`relative h-10 w-20 text-center text-sm md:text-base ${
            activeTab === "top" ? "text-white" : "text-md-dark-green"
          }`}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={() => {
            setActiveTab("top");
            switchCallback(0);
          }}
        >
          Top
        </TapScaleButton>
      </div>

      {/* SIGs Button */}
      <TapScaleButton
        type="button"
        className="h-10 rounded-full bg-white/50 px-5 py-2 text-md-dark-green text-sm backdrop-blur-sm hover:bg-white/60 md:px-6 md:text-base"
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={() => sigListCallback(true)}
      >
        SIGs
      </TapScaleButton>
    </div>
  );
};

export default ButtonTools;
```

**Implementer notes:**
- The `transition-colors duration-500` class on the text was REMOVED from the inner buttons. Text color now snaps. The pill background slides via motion, so the visual story still works (pill arrives at the new tab, text color snaps to match).
- The old SIGs button had `transition-colors` for the hover background — that's preserved by Tailwind's `hover:` modifier which uses default transitions; the explicit `transition-colors` class can be dropped.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. Biome's `useSortedClasses` may re-order the className strings — let it.

- [ ] **Step 4: Commit**

```bash
git add 'app/(home)/mobile/ButtonTools.tsx'
git commit -m "feat(mobile): spring-animate filter pill, tap-scale buttons

- Latest/Top pill is now <motion.div animate={x}> with spring
  (stiffness 400, damping 30) instead of CSS transition-all 500ms
- Latest, Top, and SIGs buttons each get TapScaleButton with
  whileTap scale 0.94 spring
- Removed redundant transition-colors classes that were only there
  for the CSS-tween fallback"
```

---

## Task 8: Apply spring entry to `SigList` modal

**Files:**
- Modify: `app/(home)/mobile/SigList.tsx`

**Context:** The current SigList uses CSS animations (`animate-fadeIn`, `animate-slideUp`) for the overlay and panel. These are defined somewhere (probably global) with linear easing. We swap the panel's CSS animation for a motion spring entry — small change, sets up Phase 4 which rewrites this entirely as a BottomSheet. We don't touch the backdrop or grid content yet; just the panel's entry animation.

Look for the `animate-slideUp` class on the panel element and replace it with a `motion.div` wrapper around the panel.

- [ ] **Step 1: Read current file**

Run: `cat app/\(home\)/mobile/SigList.tsx`
Expected: see the SigList component with a `<div className="relative w-[90vw] max-w-md animate-slideUp overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl">` panel.

- [ ] **Step 2: Modify the panel element**

In `app/(home)/mobile/SigList.tsx`:

1. Add to the imports at the top:
```typescript
import { motion } from "motion/react";
```

2. Locate the panel div (the one with `animate-slideUp` class). Change its opening tag from:

```tsx
<div className="relative w-[90vw] max-w-md animate-slideUp overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl">
```

to:

```tsx
<motion.div
  initial={{ y: 80, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 80, opacity: 0 }}
  transition={{ type: "spring", stiffness: 350, damping: 30 }}
  className="relative w-[90vw] max-w-md overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-xl"
>
```

3. Find the matching closing `</div>` and change it to `</motion.div>`. (This is the closing tag that pairs with the panel div — at the end of the SigList JSX, just before the closing `</div>` of the outer overlay.)

**Notes:**
- The `animate-slideUp` Tailwind class has been removed from the className.
- The outer overlay `<div>` (the one with `fixed top-0 left-0 z-[999999] grid h-screen w-screen animate-fadeIn place-items-center bg-black/70 backdrop-blur-sm`) stays a regular div — we don't AnimatePresence-wrap it because Phase 4 rewrites the whole component as a BottomSheet anyway.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. Biome may sort the className — let it.

- [ ] **Step 4: Commit**

```bash
git add 'app/(home)/mobile/SigList.tsx'
git commit -m "feat(mobile): spring entry for SIG list panel (transitional)

Replaces animate-slideUp keyframes with motion.div spring entry
(stiffness 350, damping 30). Transitional — Phase 4 rewrites the
whole modal as a BottomSheet."
```

---

## Task 9: Phase 2 end-of-phase verification

**Files:** none

**Context:** Phase 2 is complete. Run the full quality gate. No PR — Phase 2 lands on the same branch as Phase 1 per the rollout decision.

- [ ] **Step 1: Full quality gate**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean check + types. Pre-existing `/admin` build error is the only build failure.

- [ ] **Step 2: Bundle size sanity check**

Run: `pnpm build 2>&1 | grep -E '(First Load JS|Route)' | head -30`

Compare to a checkout of pre-Phase-2 if possible. Expected: `motion` adds ~10-12kb to the route bundles that import it (mobile shell). If you see >20kb added per route, something might be wrong (motion bundled multiple times?). Report numbers in the final report.

- [ ] **Step 3: Confirm git state**

Run: `git status` (expect clean) and `git log --oneline main..HEAD` (expect Phase 1 commits + 8 new Phase 2 commits).

Expected new commits since Phase 1's last commit:
1. `chore(deps): add motion library`
2. `feat(utils): add useNavDirection hook for page transitions`
3. `feat(mobile): add TapScale primitive for tap feedback`
4. `feat(mobile): add PageTransition component`
5. `feat(mobile): wrap route children in PageTransition`
6. `feat(mobile): animate tab indicator and add tap feedback`
7. `feat(mobile): spring-animate filter pill, tap-scale buttons`
8. `feat(mobile): spring entry for SIG list panel (transitional)`

- [ ] **Step 4: Report**

Do NOT push or open a PR. Report:
- Quality gate output
- Bundle size delta from `motion`
- Commit list
- Anything unexpected encountered during execution

---

## Self-review checklist (for the plan author, before handing off)

- **Spec coverage:** Every Phase 2 row of the spec's "Modifications" + "New components" tables maps to a task above. ✓
- **Placeholder scan:** No TBD / TODO / "similar to" / "appropriate error handling". Every code block is complete. ✓
- **Type consistency:** `NavDirection = -1 | 0 | 1`, `TapScale` / `TapScaleButton` / `TapScaleLink` names used consistently. ✓
- **Spring constants consistent:** Every spring transition uses `{ type: "spring", stiffness: 400, damping: 30 }` (or 350/30 for the heavier panel motion in Task 8) — same vocabulary across the codebase. ✓
- **A11y preservation:** Task 6 preserves the Phase 1 keyboard fix (`aria-disabled`, `tabIndex={-1}`, `e.preventDefault()`). ✓
- **Desktop unchanged:** No desktop file is modified. `device.tsx` modification only wraps the mobile branch. ✓
- **Verification adaptation:** Each task uses `pnpm check && pnpm types && pnpm build` + commit pattern, matching Phase 1's adapted-TDD discipline. ✓
