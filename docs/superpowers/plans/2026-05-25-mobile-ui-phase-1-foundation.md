# Mobile UI Phase 1 — Foundation Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply foundational mobile-browser polish — safe-area handling, larger tap targets, labeled tab bar, native scroll/tap behavior, themed status bar — without adding any new dependencies.

**Architecture:** Pure CSS + viewport metadata changes. One tiny new hook. All changes are scoped to mobile (`(Layout)/mobile/`, `(home)/mobile/`, or global CSS that does not affect desktop look). No JS framework changes.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, SCSS modules. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-25-mobile-ui-enhancement-design.md` (Phase 1 section)

**Verification approach:** This project has no Jest/Vitest test suite. Each task's "verification" runs `pnpm check && pnpm types && pnpm build` and explicit manual browser checks in Chrome DevTools iPhone emulation (and a real iOS device for the final task).

---

## File map

| Path | Action | Why |
|------|--------|-----|
| `app/styles/globals.css` | Modify | Add safe-area utility classes, body-level touch styles, overscroll behavior |
| `app/layout.tsx` | Modify | Re-enable pinch-zoom; set `viewportFit: "cover"`; set static `themeColor` |
| `app/(Layout)/mobile/HeaderBar/HeaderBar.module.scss` | Modify | Pad top by safe-area inset |
| `app/(Layout)/mobile/ToolBar/index.tsx` | Modify | Add labels, restructure to use accent-bar active state, larger tap targets |
| `app/(Layout)/mobile/ToolBar/ToolBar.module.scss` | Modify | Safe-area-bottom padding, new structure rules, accent bar |
| `app/(home)/mobile/ThreadsList.tsx` | Modify | Replace hardcoded `pt-16 pb-16` with safe-area-aware padding |
| `utils/useSafeArea/index.tsx` | Create | Returns numeric safe-area insets at runtime; not consumed in Phase 1 but spec-listed and used by Phases 3 & 4 |

---

## Task 1: Add safe-area utilities and touch styles to globals.css

**Files:**
- Modify: `app/styles/globals.css`

**Context:** The current CSS already uses `100dvh` and has a `@layer utilities` section. We add safe-area-aware padding utilities, kill the 300ms tap delay and the blue webkit tap highlight, and stop iOS body bounce (which would compete with Phase 3's pull-to-refresh). We do not change the `body { overflow: hidden }` rule — the scrollable surface is the inner threads container.

- [ ] **Step 1: Read current globals.css to confirm the structure has not drifted**

Run: `cat app/styles/globals.css`
Expected: see `body { ... overflow: hidden; ... }` and `@layer utilities { ... }` block at the end.

- [ ] **Step 2: Add body-level touch styles**

In `app/styles/globals.css`, modify the existing `body` rule to add the new properties. The final `body` block must read:

```css
body {
  max-width: 100dvw;
  max-height: 100dvh;
  overflow: hidden;
  color: black;
  font-family: "Noto Sans TC", sans-serif;
  animation: 1s ease-out 0s 1 fadeIn;
  overscroll-behavior-y: none;
  -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 3: Add a global rule eliminating the 300ms tap delay on interactive elements**

In `app/styles/globals.css`, immediately after the `body` block, add:

```css
button,
a,
[role="button"] {
  touch-action: manipulation;
}
```

- [ ] **Step 4: Add safe-area utility classes inside `@layer utilities`**

In `app/styles/globals.css`, inside the existing `@layer utilities { ... }` block (before the closing brace), append:

```css
  /* Safe-area utilities (iOS notch / home indicator) */
  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }

  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .pl-safe {
    padding-left: env(safe-area-inset-left);
  }

  .pr-safe {
    padding-right: env(safe-area-inset-right);
  }
```

- [ ] **Step 5: Verify build + lint + types pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: all three succeed. Biome may auto-format the CSS — that's fine.

- [ ] **Step 6: Commit**

```bash
git add app/styles/globals.css
git commit -m "style(mobile): add safe-area utilities and touch polish

Adds .pt-safe / .pb-safe / .pl-safe / .pr-safe utility classes that
read env(safe-area-inset-*). Sets overscroll-behavior-y: none and
-webkit-tap-highlight-color: transparent on body. Adds
touch-action: manipulation to interactive elements to eliminate the
300ms tap delay. Phase 1 foundation work."
```

---

## Task 2: Update root layout viewport and add themeColor

**Files:**
- Modify: `app/layout.tsx`

**Context:** Today the viewport object disables pinch-zoom (`userScalable: false, maximumScale: 1`). That's an accessibility violation. We re-enable it. We also need `viewportFit: "cover"` for `env(safe-area-inset-*)` to return non-zero values on iOS, and we set a `themeColor` so the iOS status bar matches the gradient instead of being a stark white strip. We pick a single color matching the gradient peak (`#74C5E9`); per-route variation is deferred per the spec's Open Questions.

- [ ] **Step 1: Read current `app/layout.tsx`**

Run: `cat app/layout.tsx`
Expected: see `export const viewport: Viewport = { ... }` at the bottom.

- [ ] **Step 2: Replace the viewport export**

In `app/layout.tsx`, replace the existing `viewport` export block with:

```typescript
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#74C5E9",
};
```

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: all three succeed.

- [ ] **Step 4: Manual verification (Chrome DevTools)**

Open the dev server: `pnpm dev`
Visit `http://localhost:3000` in Chrome with DevTools open, device emulation set to "iPhone 14 Pro" (or "iPhone 14 Pro Max").
Expected:
- Pinch-zoom now works in the emulator
- The browser tab/address area in real iOS Safari (if you have a device) shows the cyan `#74C5E9` color in the chrome around the page

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx
git commit -m "fix(a11y): re-enable pinch-zoom and add themed status bar

Restores userScalable: true (was false) and bumps maximumScale to 5.
Disabling user scaling is an accessibility violation; readability is
more important than preventing accidental zoom for a school
community app. Adds viewportFit: 'cover' so env(safe-area-inset-*)
returns non-zero on iOS, and sets themeColor: #74C5E9 to match the
page gradient (per-route variation deferred per spec)."
```

---

## Task 3: Apply safe-area padding to HeaderBar

**Files:**
- Modify: `app/(Layout)/mobile/HeaderBar/HeaderBar.module.scss`

**Context:** The mobile header is fixed at `top: 0` with a 4rem height. On iPhones with a dynamic island or notch, the OS status bar sits in the top ~44px. Without safe-area padding, the header's content (logo + login button) overlaps the dynamic island. We pad the top by the inset and grow the total height to compensate.

- [ ] **Step 1: Read current scss**

Run: `cat app/\(Layout\)/mobile/HeaderBar/HeaderBar.module.scss`
Expected: see `.nav { height: variables.$mobile-headerbar-height; padding: 0.5rem 0.5rem 0.5rem 1rem; position: fixed; ... }`

- [ ] **Step 2: Update the `.nav` block**

In `app/(Layout)/mobile/HeaderBar/HeaderBar.module.scss`, replace the existing `.nav` block with:

```scss
.nav {
  height: calc(#{variables.$mobile-headerbar-height} + env(safe-area-inset-top));
  width: 100%;
  padding:
    calc(0.5rem + env(safe-area-inset-top))
    0.5rem
    0.5rem
    1rem;
  position: fixed;
  z-index: 9999;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  user-select: none;
  backdrop-filter: blur(10px);
  background-color: variables.$panel-background-color;
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
}
```

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: all succeed.

- [ ] **Step 4: Manual verification (Chrome DevTools iPhone emulation)**

`pnpm dev`, visit `http://localhost:3000`, emulate iPhone 14 Pro.
DevTools doesn't simulate safe-area-inset by default; to test, in DevTools' Console run:
```js
document.documentElement.style.setProperty('--mock-top', '44px');
```
Then in DevTools' Elements panel inspect the `.nav` element — its `padding-top` should be `calc(0.5rem + env(safe-area-inset-top))`. On a real iPhone, the logo should sit clearly below the dynamic island.

- [ ] **Step 5: Commit**

```bash
git add app/\(Layout\)/mobile/HeaderBar/HeaderBar.module.scss
git commit -m "style(mobile): pad header by iOS safe-area-inset-top

Header height and top padding now grow to clear the iOS dynamic
island / notch via env(safe-area-inset-top)."
```

---

## Task 4: Refactor ToolBar with labels, larger tap targets, safe-area-bottom, and accent-bar active state

**Files:**
- Modify: `app/(Layout)/mobile/ToolBar/index.tsx`
- Modify: `app/(Layout)/mobile/ToolBar/ToolBar.module.scss`

**Context:** Today's bottom tab bar has four icon-only links inside circular backgrounds. The active state is signaled by changing the background color via inline style. Tap targets are visually small (~25px icon inside an icon-shaped click area). On iOS the toolbar sits flush at `bottom: 0`, so the home indicator overlaps it. We need: labels under icons, ≥44×44px hit areas, a 2px top accent bar for active state (replaces the inline-bg approach), and bottom padding from the safe-area inset.

This task touches both the JSX (to add labels and restructure) and the SCSS (to size and style). They're committed together since they're interdependent.

- [ ] **Step 1: Read both files**

Run: `cat app/\(Layout\)/mobile/ToolBar/index.tsx app/\(Layout\)/mobile/ToolBar/ToolBar.module.scss`
Expected: see the current 4-item menu array and the SCSS using `.iconWrapper / .iconBackground / .icon`.

- [ ] **Step 2: Rewrite `app/(Layout)/mobile/ToolBar/index.tsx`**

Replace the entire file contents with:

```typescript
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
              <Link
                href={item.route}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                style={{
                  opacity: item.clickable ? 1 : 0.4,
                  pointerEvents: item.clickable ? "auto" : "none",
                }}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setSelected(index)}
              >
                {isActive && <span className={styles.activeIndicator} />}
                <Image
                  src={item.icon}
                  height={24}
                  width={24}
                  alt=""
                  aria-hidden="true"
                />
                <span className={styles.label}>{item.label}</span>
              </Link>
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

- [ ] **Step 3: Rewrite `app/(Layout)/mobile/ToolBar/ToolBar.module.scss`**

Replace the entire file contents with:

```scss
@use "@/app/styles/variables.scss";

.toolBarWrapper {
  height: calc(
    #{variables.$mobile-toolbar-height} + env(safe-area-inset-bottom)
  );
  width: 100%;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
  background-color: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  user-select: none;
  z-index: 9999;
}

.tabList {
  list-style: none;
  margin: 0;
  padding: 0;
  height: variables.$mobile-toolbar-height;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
}

.tabItem {
  flex: 1 1 0;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.tab {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 44px;
  min-height: 44px;
  padding: 6px 8px;
  color: #354242;
  transition: opacity 0.2s;
}

.tabActive {
  color: #009bb0;
}

.activeIndicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 3px;
  background-color: #009bb0;
  border-radius: 0 0 4px 4px;
}

.label {
  font-size: 11px;
  line-height: 1;
  font-weight: 500;
}
```

- [ ] **Step 4: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: all succeed. Note: Biome may complain about the empty `alt=""` — that's intentional (decorative image; label below carries the meaning) — but if it does flag, change to `alt={item.label}` and remove the `<span className={styles.label}>` text from the screen reader perspective. The Biome rule for empty alt is OFF per CLAUDE.md so this should pass as-is.

- [ ] **Step 5: Manual verification (Chrome DevTools iPhone emulation)**

`pnpm dev`, visit `http://localhost:3000`, emulate iPhone 14 Pro.
Expected:
- Four tabs at the bottom each show an icon AND a text label ("Home" / "You" / "Post" / "Info")
- The active tab (Home on first load) has cyan icon + label color and a 3px cyan accent bar at the top of the tab
- Each tab's hit area is at least 44×44 (use DevTools "Inspect" to measure the `.tab` element — it should report ≥44px in both dimensions)
- Toolbar background is mostly opaque white with a subtle blur on the gradient underneath
- On a real iPhone, the toolbar should clear the home indicator (no overlap)

- [ ] **Step 6: Commit**

```bash
git add app/\(Layout\)/mobile/ToolBar/index.tsx app/\(Layout\)/mobile/ToolBar/ToolBar.module.scss
git commit -m "feat(mobile): tab bar with labels, 44px targets, safe-area-bottom

Replaces icon-only circular tabs with labeled tab bar:
- Each tab now shows icon + label (Home/You/Post/Info)
- Hit area enforced ≥ 44x44 per WCAG
- Active state: 3px cyan accent bar at top + cyan icon/label color
  (replaces the previous inline-bg circle approach)
- padding-bottom: env(safe-area-inset-bottom) clears iOS home indicator
- Semantic markup: <nav><ul><li><a> with aria-current=page
- Background nudged from solid white to translucent + backdrop-blur to
  match the panel aesthetic of the rest of the mobile shell"
```

---

## Task 5: Update ThreadsList padding to account for safe-area

**Files:**
- Modify: `app/(home)/mobile/ThreadsList.tsx`

**Context:** The feed wrapper currently uses `pt-16 pb-16` (4rem top + bottom). After Task 4 the toolbar grew taller (to include safe-area-inset-bottom) and after Task 3 the header grew too. The hardcoded `pt-16 pb-16` no longer matches, so the first thread tucks under the header and the last one tucks under the toolbar. Replace with arbitrary-value Tailwind classes that read the safe-area inset.

- [ ] **Step 1: Read the file**

Run: `cat app/\(home\)/mobile/ThreadsList.tsx`
Expected: see the wrapper div `<div className="scrollbar-hide relative mx-auto h-auto w-full max-w-7xl overflow-y-auto px-2 pt-16 pb-16 sm:px-4 md:px-6 lg:px-8">`.

- [ ] **Step 2: Replace the wrapper div's className**

In `app/(home)/mobile/ThreadsList.tsx`, change the wrapper div's className from:

```tsx
<div className="scrollbar-hide relative mx-auto h-auto w-full max-w-7xl overflow-y-auto px-2 pt-16 pb-16 sm:px-4 md:px-6 lg:px-8">
```

to:

```tsx
<div
  className="scrollbar-hide relative mx-auto h-auto w-full max-w-7xl overflow-y-auto px-2 pt-[calc(4rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))] sm:px-4 md:px-6 lg:px-8"
>
```

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: all succeed. Biome's `useSortedClasses` rule may reorder the classes — that's fine; let it.

- [ ] **Step 4: Manual verification (Chrome DevTools iPhone emulation)**

`pnpm dev`, visit `http://localhost:3000`, emulate iPhone 14 Pro.
Expected:
- The "Latest / Top" pill and the "SIGs" button at the top of the feed sit clearly below the header — not tucked under it
- The last visible thread card has whitespace below it — not tucked under the toolbar
- Scroll all the way down: bottom of last card stays above the toolbar with breathing room

- [ ] **Step 5: Commit**

```bash
git add app/\(home\)/mobile/ThreadsList.tsx
git commit -m "fix(mobile-feed): top/bottom padding respects safe-area insets

Replaces hardcoded pt-16/pb-16 with arbitrary-value Tailwind classes
that add env(safe-area-inset-top|bottom) to the 4rem header/toolbar
height. Prevents the first/last thread cards from being hidden under
the now-taller header and toolbar on iPhones with notch/home
indicator."
```

---

## Task 6: Create the `useSafeArea` hook

**Files:**
- Create: `utils/useSafeArea/index.tsx`

**Context:** The spec lists this for Phase 1 even though it isn't consumed until Phase 3 (the PullToRefresh indicator needs the top inset for JS-driven positioning) and Phase 4 (Toast positioning). Creating it now keeps Phase 1's deliverable matching the spec exactly and makes Phases 3 & 4 simpler.

The hook reads CSS `env(safe-area-inset-*)` by inspecting computed style on a temporary div. SSR returns zeros (env() isn't available server-side anyway).

- [ ] **Step 1: Verify the directory does not yet exist**

Run: `ls utils/useSafeArea 2>&1 || echo "not present"`
Expected: "not present" or "No such file or directory".

- [ ] **Step 2: Create the hook**

Create `utils/useSafeArea/index.tsx` with this exact content:

```typescript
"use client";

import { useEffect, useState } from "react";

export type SafeAreaInsets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

const ZERO: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

function readInsets(): SafeAreaInsets {
  if (typeof window === "undefined") {
    return ZERO;
  }
  const probe = document.createElement("div");
  probe.style.position = "fixed";
  probe.style.top = "env(safe-area-inset-top)";
  probe.style.right = "env(safe-area-inset-right)";
  probe.style.bottom = "env(safe-area-inset-bottom)";
  probe.style.left = "env(safe-area-inset-left)";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  document.body.appendChild(probe);
  const styles = window.getComputedStyle(probe);
  const insets: SafeAreaInsets = {
    top: parsePx(styles.top),
    right: parsePx(styles.right),
    bottom: parsePx(styles.bottom),
    left: parsePx(styles.left),
  };
  document.body.removeChild(probe);
  return insets;
}

function parsePx(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>(ZERO);

  useEffect(() => {
    setInsets(readInsets());
    const onResize = () => setInsets(readInsets());
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return insets;
}

export default useSafeArea;
```

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: all succeed. The file exports a default *and* a named export, matching the pattern of `utils/useIsMobile/index.tsx`.

- [ ] **Step 4: Smoke-test the hook does not crash**

Temporarily (do NOT commit this temporary change) add this line near the top of `app/(home)/mobile/ThreadsList.tsx`'s component body:

```typescript
const _safeArea = useSafeArea();
console.info("safe-area", _safeArea);
```

(Import: `import useSafeArea from "@/utils/useSafeArea";`)

`pnpm dev`, open the home page in Chrome DevTools iPhone emulation, open the Console.
Expected: see one log per render with `{ top: 0, right: 0, bottom: 0, left: 0 }` in the emulator (DevTools doesn't simulate safe-area). On a real iPhone, top and bottom should be non-zero.

Then **revert the smoke-test change** — do not commit it:
```bash
git checkout -- app/\(home\)/mobile/ThreadsList.tsx
```

Re-run `pnpm check && pnpm types && pnpm build` to confirm we're back to a green state.

- [ ] **Step 5: Commit**

```bash
git add utils/useSafeArea/
git commit -m "feat(utils): add useSafeArea hook

Returns numeric { top, right, bottom, left } safe-area insets at
runtime by probing CSS env(safe-area-inset-*) on a temp element.
SSR returns zeros. Re-reads on resize and orientationchange.

Not consumed in Phase 1 — used by Phase 3's PullToRefresh indicator
positioning and Phase 4's Toast stack positioning."
```

---

## Task 7: End-of-phase verification and PR

**Files:** none (verification + PR)

**Context:** Phase 1 is now complete. Before opening the PR, run the full quality gate, do one comprehensive manual check on a real iPhone if available, and confirm Desktop is unchanged.

- [ ] **Step 1: Full quality gate**

Run: `pnpm check && pnpm types && pnpm build`
Expected: all green. If anything fails, fix it and re-run.

- [ ] **Step 2: Confirm desktop is visually unchanged**

`pnpm dev`. Visit `http://localhost:3000` with **DevTools closed and window ≥1024px wide**. Click around home, post detail, info.
Expected: everything looks exactly as it did before Phase 1. The global CSS additions (`-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`) do not visually change desktop. The viewport change re-enables pinch-zoom on desktop too, but desktop browsers don't pinch in the same way and existing UX is unaffected.

- [ ] **Step 3: Mobile verification matrix (Chrome DevTools)**

Still in `pnpm dev`, switch DevTools to device emulation and check each device:

| Device | Check |
|--------|-------|
| iPhone SE | Tab labels visible; pull-down doesn't trigger iOS bounce |
| iPhone 14 Pro | (emulator does not show notch; rely on real device test) |
| iPhone 14 Pro Max | Same |
| Pixel 7 | No regression; labels still fit; toolbar height looks right |
| Galaxy S20 Ultra | Same |

For each: navigate Home → Post → Info → Home. No tap-flash blue squares. Tab bar always has labels.

- [ ] **Step 4 (optional but recommended): Real iPhone test**

If you have an iPhone available:
- Run `pnpm dev` and connect via the LAN URL Next.js prints (e.g. `http://192.168.x.x:3000`)
- Confirm: tab bar sits ABOVE the home indicator; header sits BELOW the dynamic island; pinch-zoom works on post content; the iOS status bar matches the page color (cyan tint visible)

If results match expectations, proceed to Step 5. If anything is off, debug and re-iterate before opening the PR.

- [ ] **Step 5: Push and open PR**

```bash
git push -u origin feat/mobile-ui-enhancement
gh pr create --base main --title "feat(mobile): Phase 1 — foundation polish (safe-area, tap targets, themed status bar)" --body "$(cat <<'EOF'
## Summary

Phase 1 of the 4-phase mobile UI enhancement design (see `docs/superpowers/specs/2026-05-25-mobile-ui-enhancement-design.md`).

- Safe-area insets respected on header (top) and tab bar (bottom)
- Tab bar redesigned with labels + ≥44px hit areas + accent-bar active state
- Pinch-zoom re-enabled (was disabled — a11y violation)
- Themed status bar (#74C5E9 matching gradient)
- Killed 300ms tap delay and webkit tap-highlight flash
- Added `useSafeArea` hook for use in Phases 3 & 4 (not yet consumed)

Zero new dependencies. Desktop layout untouched.

## Test plan

- [x] `pnpm check && pnpm types && pnpm build` green
- [x] Desktop layout visually unchanged (≥1024px viewport)
- [x] Chrome DevTools iPhone SE / 14 Pro / Pixel 7 / Galaxy S20 — tab bar shows labels, no tap-flash
- [ ] Real iPhone (reviewer): header below dynamic island, tab bar above home indicator, pinch-zoom works on post content, status bar tint matches page

## Out of scope (later phases)

- Page transitions, tap-scale, animated indicators → Phase 2
- Pull-to-refresh, swipe gestures → Phase 3
- Bottom sheet for SIG list, toast system → Phase 4

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL is printed. Return the URL.

---

## Self-review checklist (for the plan author, before handing off)

- **Spec coverage:** Every Phase 1 row of the spec's "Changes by file" table maps to a task above. The acceptance criteria for Phase 1 are all covered by Tasks 1–7. ✓
- **Placeholder scan:** No "TBD" / "TODO" / "similar to" / "appropriate error handling" anywhere. Every code block is complete. ✓
- **Type consistency:** `useSafeArea` returns `SafeAreaInsets = { top, right, bottom, left }` — same shape everywhere it's referenced. Tab `name` / `label` / `route` / `icon` / `clickable` fields are used consistently in the new ToolBar. ✓
- **Verification adaptation:** Each task has a `pnpm check && pnpm types && pnpm build` step and an explicit manual browser check, replacing the "write failing test" step that would apply if this codebase had a test suite. ✓
