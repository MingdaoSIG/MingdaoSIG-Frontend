# Mobile UI Enhancement — Native-Feel Design Spec

**Date:** 2026-05-25
**Branch:** `feat/mobile-ui-enhancement`
**Status:** Approved design; pending implementation plan

## Goal

Make MDSIG's mobile experience feel like a native app while staying a web app. No PWA / installability work — this spec is purely about look, feel, and interaction quality.

The target user sees an experience that:

- Respects iPhone safe areas (home indicator, notch)
- Has fluid transitions between screens
- Responds to taps and gestures the way native apps do
- Uses native UI patterns (bottom sheets, toasts) instead of webby ones (centered modals, blocking alerts for non-confirmations)

## Scope

### In scope

- Mobile-only changes (`useIsMobile === true` branch / `(Layout)/mobile/` / `(home)/mobile/` / `app/post/[postID]/(post)/mobile/` / `components/mobile/`)
- Screens: home/feed, post detail, post editor (new + edit), user profile, info
- Cross-platform parity between iOS Safari and Android Chrome — no platform-specific gestures
- One new dependency: `motion` (motion.dev, the modern framer-motion package)
- Building BottomSheet, Toast, PullToRefresh, PageTransition, TapScale primitives in-house on top of `motion`

### Out of scope

- Desktop layout (unchanged)
- Admin pages (`app/admin/*`)
- Dashboard, changelog, data pages
- PWA: no manifest, no service worker, no install prompt, no offline shell
- iOS-only gestures (swipe-from-left to go back)
- New visual identity / colors — same gradient + Tailwind theme as today
- Migrating SweetAlerts outside the in-scope mobile screens

## Architecture

Four phases. Each phase is a separate PR. Each phase is independently valuable.

```
app/
├── (Layout)/mobile/
│   ├── HeaderBar/         ← Phase 1 polish + safe-area
│   └── ToolBar/           ← Phase 1 labels + Phase 2 animated indicator + Phase 3 scroll-to-top
├── (home)/mobile/
│   ├── ThreadsList.tsx    ← Phase 1 padding + Phase 3 PullToRefresh wrap
│   ├── ButtonTools.tsx    ← Phase 2 layoutId-based filter pill
│   └── SigList.tsx        ← Phase 4 rewrite to use BottomSheet
├── layout.tsx             ← Phase 1 viewport + theme-color
└── styles/globals.css     ← Phase 1 safe-area utilities, tap-highlight, overscroll

components/mobile/         ← NEW directory
├── BottomSheet/           ← Phase 4
├── Toast/                 ← Phase 4
├── PullToRefresh/         ← Phase 3
├── DraggableSheet/        ← Phase 3 (reused by Phase 4)
├── PageTransition/        ← Phase 2
└── TapScale/              ← Phase 2

utils/
├── useSafeArea/           ← Phase 1
└── useNavDirection/       ← Phase 2

package.json               ← Phase 2: + motion (~10kb gz)
```

### Key decisions

- **Library:** `motion` (motion.dev). One dependency, ~10kb gz. Used for all animation and gesture work from Phase 2 onward.
- **Bottom sheet and toast built in-house** on top of `motion`. No `vaul`, no `sonner`. Keeps bundle small and gives full control over the look.
- **SweetAlert stays** for blocking confirmations (logout). New Toast component is for non-blocking notifications only.
- **Desktop layout untouched** — every change is gated behind `useIsMobile`, scoped to `(Layout)/mobile/` / `(home)/mobile/` / `components/mobile/`, or to file paths that are already mobile-specific.
- **Cross-platform:** no iOS-only swipe-back. Gestures must work identically on iOS Safari and Android Chrome.

## Phase 1 — Foundation Polish

**Goal:** Quality-of-life wins on every device, every load. Zero new dependencies.

### Changes by file

| File | Change |
|------|--------|
| `app/layout.tsx` | `viewport`: `userScalable: true`, `maximumScale: 5`, `viewportFit: "cover"`. Set `themeColor` (start with one color, allow per-route override later). |
| `app/styles/globals.css` | Add `.pt-safe`, `.pb-safe` utility classes that read `env(safe-area-inset-top|bottom)`. Add `body { overscroll-behavior-y: none; -webkit-tap-highlight-color: transparent; }`. Add `button, a, [role="button"] { touch-action: manipulation; }`. |
| `app/(Layout)/mobile/HeaderBar/HeaderBar.module.scss` | `padding-top: env(safe-area-inset-top)`; `height: calc(4rem + env(safe-area-inset-top))`. |
| `app/(Layout)/mobile/ToolBar/ToolBar.module.scss` + `index.tsx` | `padding-bottom: env(safe-area-inset-bottom)`. Bump icon hit-area to ≥44×44px. Add labels under each icon ("Home" / "You" / "Post" / "Info"). Active state: a 2px accent bar rendered above the icon plus color change on the icon itself. Inactive icons render at reduced opacity. |
| `app/(home)/mobile/ThreadsList.tsx` | Replace hardcoded `pt-16 pb-16` with `pt-[calc(4rem+env(safe-area-inset-top))]` and matching bottom. |
| `utils/useSafeArea/index.tsx` (NEW) | Hook returning `{ top, bottom, left, right }` numeric values read from CSS env(). Used by JS-driven positioning (PTR indicator, Toast). |

### Acceptance criteria

- iPhone 14 Pro: tab bar sits above the home indicator; header sits below the dynamic island
- All tab-bar icons have visible labels and a ≥44×44px hit area
- No 300ms tap delay; no blue tap-highlight flash
- Pinch-zoom works on post detail content
- Status bar color matches page background via `theme-color` meta
- `pnpm build`, `pnpm check`, `pnpm types` all pass

## Phase 2 — Motion Shell

**Goal:** App stops feeling like a website. Routes transition, taps feel responsive, indicators glide.

### New dependency

- `motion` (`^11`). Tree-shake-friendly. Used for all subsequent phases.

### New components

| Component | Purpose |
|-----------|---------|
| `components/mobile/PageTransition/index.tsx` | Wraps mobile children. Uses `AnimatePresence mode="wait"` keyed on `usePathname`. Slides in from right on forward nav, from left on back. Direction comes from `useNavDirection`. Duration ~200ms, easeOut. |
| `components/mobile/TapScale/index.tsx` | Generic motion-wrapped pressable. Exports `TapScale` (div) and `TapScaleLink` (wraps `next/link`). Default `whileTap={{ scale: 0.94 }}`. |
| `utils/useNavDirection/index.tsx` | Tracks pathname stack via `usePathname` + `popstate`. Returns `1` (forward), `-1` (back), or `0` (initial). |

### Modifications

| File | Change |
|------|--------|
| `app/device.tsx` | Wrap mobile `{children}` in `<PageTransition>`. |
| `app/(Layout)/mobile/ToolBar/index.tsx` | Wrap each tab in `TapScale`. Render `<motion.div layoutId="tab-indicator">` accent bar on active tab. Transition: spring, stiffness 400, damping 30. |
| `app/(home)/mobile/ButtonTools.tsx` | Replace the manual `left-0`/`left-20` absolute-positioned pill with a `motion.div` using `animate={{ x: activeTab === "latest" ? 0 : 80 }}` and `transition={{ type: "spring", stiffness: 400, damping: 30 }}` so it springs between Latest/Top instead of CSS-tweening linearly. Wrap Latest/Top/SIGs buttons in `TapScale`. |
| `app/(home)/mobile/SigList.tsx` | Swap CSS `animate-slideUp` for `motion` spring on the modal panel. (Phase 4 rewrites this entirely; this is a transitional polish.) |

### Accessibility

- All `motion.div` animations respect `prefers-reduced-motion` (motion's default behavior collapses to instant when set)

### Acceptance criteria

- Navigating Home → Post: page slides in from right; navigating back slides in from left
- Tab bar accent bar tweens smoothly between tabs when active route changes
- All buttons/cards/tabs scale to 0.94 on press
- SIG list panel enters with spring physics (slight overshoot ~5%)
- Bundle size increase from `motion` ≤ 12kb gzipped
- Acceptance from Phase 1 still holds

## Phase 3 — Touch Gestures

**Goal:** Three gestures that make the app feel native. No new dependencies — reuses `motion`.

### New components

| Component | Purpose |
|-----------|---------|
| `components/mobile/PullToRefresh/index.tsx` | Wraps a scroll container. Props: `onRefresh: () => Promise<void>`, optional `threshold` (default 80). Enables drag only when `scrollTop === 0`. Renders a spinner whose rotation is driven by drag `motionValue`. Releasing past threshold awaits `onRefresh()` then springs back. |
| `components/mobile/DraggableSheet/index.tsx` | Low-level draggable sheet primitive. `motion.div drag="y"` with `dragConstraints`, `dragElastic`, and `onDragEnd` that calls `onDismiss` when offset > 80 or velocity > 500. Reused by Phase 4 BottomSheet. |

### Modifications

| File | Change |
|------|--------|
| `app/(home)/mobile/ThreadsList.tsx` | Wrap inner scroll container in `<PullToRefresh onRefresh={refetch}>` where `refetch` comes from `useAllPost`. Set `overscroll-behavior: contain` on the inner scroll. While `isFetchingNextPage`, disable PTR to avoid gesture conflict. |
| `app/(Layout)/mobile/ToolBar/index.tsx` | When the currently active tab is tapped (vs. an inactive one), dispatch `window.dispatchEvent(new CustomEvent("mobile:scroll-to-top"))`. |
| `app/(home)/mobile/ThreadsList.tsx` | Listen for `mobile:scroll-to-top` and call `scrollTo({ top: 0, behavior: "smooth" })` on the inner scroll container, then `refetch()`. |
| `app/(home)/mobile/SigList.tsx` | Apply `DraggableSheet` to the modal panel so it can be dismissed by dragging down. (Phase 4 supersedes this fully.) |

### Accessibility

- All gestures are additive — every action they trigger is also available without the gesture. Pull-to-refresh has a fallback in "tap active tab" (which also refreshes).
- `prefers-reduced-motion`: gestures still work, but the spring-back animation collapses to instant.

### Acceptance criteria

- Feed: pulling down from top reveals a spinner that rotates with drag; release past 80px triggers `refetch()`
- During refresh: spinner spins continuously; feed dims to ~60% opacity; PTR indicator holds at threshold height
- Drag below threshold: spring back without triggering refresh
- SIG list modal can be dismissed by dragging the panel down
- Tapping the active "Home" tab smooth-scrolls the feed to top and refetches
- Infinite scroll still works — `onScroll` and `touchmove` handlers in `InfinityThreadsList` continue to fire
- iOS body bounce does not interfere (verified via `overscroll-behavior: contain`)

### Risk

PTR + infinite scroll can fight on iOS. Mitigation: disable PTR while `isFetchingNextPage === true`. If that's insufficient, fallback is to gate PTR behind `scrollTop === 0 && !isFetchingNextPage` strictly and add a small dead-zone.

## Phase 4 — Native UI Patterns

**Goal:** Replace the centered modal with a real bottom sheet. Add a non-blocking toast system. Keep SweetAlert only for true confirmations.

### New components

| Component | Purpose |
|-----------|---------|
| `components/mobile/BottomSheet/index.tsx` | Props: `open`, `onClose`, `title`, `snapPoints` (e.g. `["60%", "90%"]`), `initialSnap`, `children`. Built on `DraggableSheet`. Includes drag handle, backdrop with fade tied to sheet position, body scroll lock while open, focus trap, ESC handler, close button. |
| `components/mobile/Toast/index.tsx` | Imperative API: `toast.success(msg)`, `toast.error(msg, { action? })`, `toast.info(msg)`. Top-center stack of up to 3. Auto-dismiss after 3s unless `action` button is attached. Swipe horizontally to dismiss. Provider mounted once in `app/device.tsx` (mobile branch). |

### Modifications

| File | Change |
|------|--------|
| `app/(home)/mobile/SigList.tsx` | Rewrite: replace `fixed inset-0` overlay + centered modal with `<BottomSheet open={open} onClose={onClose} title="探索 SIGs" snapPoints={["60%", "90%"]}>` wrapping the existing SIG grid. |
| `app/device.tsx` | Mount `<ToastProvider />` in the mobile branch alongside HeaderBar/ToolBar. Provider is mobile-only; the `toast` imperative API is a no-op on desktop (calls from shared code are safely swallowed). |
| `app/post/[postID]/(post)/mobile/Thread.tsx` | Replace `Swal.fire(...)` calls (link copy notifications) with `toast.info(...)`. |
| `app/post/[postID]/(post)/mobile/Replies.tsx` | Replace `Swal.fire(alertMessageConfigs.otherError)` with `toast.error("無法載入回覆")`. |

### Shared files (desktop + mobile) — not migrated

These files contain `Swal.fire` calls but are imported by both desktop and mobile layouts. They stay on SweetAlert to honor the "desktop untouched" promise. They can be migrated in a follow-up if/when desktop adopts the toast pattern:

- `app/page.tsx` (root) — landing redirect alert
- `app/post/[postID]/edit/page.tsx` — editor save/error alerts

### SweetAlert stays (intentionally)

- `app/(Layout)/mobile/HeaderBar/UserLogin/index.tsx` — logout confirmation (destructive action requires blocking confirm)
- All `app/admin/*` SweetAlerts (admin is out of scope)
- All desktop SweetAlerts (desktop is out of scope)
- Shared files listed above (avoid changing desktop behavior)

### Acceptance criteria

- SIG list opens as a bottom sheet at 60% height with drag handle visible at top
- Dragging the handle up snaps to 90%; dragging down past threshold dismisses the sheet
- Tapping backdrop, pressing ESC, or close button all dismiss
- Body scroll is locked while sheet is open; keyboard focus is trapped inside the sheet
- `toast.success` / `toast.error` / `toast.info` render top-center, auto-dismiss in 3s unless action attached
- Up to 3 toasts stack; oldest dismisses when 4th appears
- Toasts can be swiped left or right to dismiss early
- All in-scope mobile-only SweetAlert→toast migrations are complete; logout confirm and shared-file SweetAlerts still use SweetAlert
- Calling `toast.x(...)` on desktop is a no-op (does not throw); useful for any code path shared between layouts
- Acceptance from Phases 1–3 still holds

## Cross-Cutting Concerns

### Accessibility

- `userScalable: true` (Phase 1) — pinch-zoom allowed
- Every gesture (PTR, drag-dismiss) is additive — never the only way to do something
- `prefers-reduced-motion` collapses motion to instant; gestures and dismisses still work
- ToolBar tabs include text labels (Phase 1) for screen-reader clarity
- BottomSheet has focus trap + ESC handler + ARIA roles (`role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the title)
- Toast announces via `role="status"` (info/success) or `role="alert"` (error)

### Performance budget

- `motion` adds ≤ 12kb gz to the mobile bundle (Phase 2)
- No new dependencies in Phases 1, 3, 4
- Page transitions ≤ 200ms — chosen short to keep navigation snappy
- All gestures use `transform` + `opacity` (GPU-friendly); no layout-thrashing properties

### Testing approach

This project has no automated test suite. Verification per phase is manual + build-checked:

- `pnpm build`, `pnpm check`, `pnpm types` must pass after every phase
- Manual test plan per phase, executed on real iOS Safari + Android Chrome devices:
  - **Phase 1:** iPhone 14 Pro (notch + home indicator), Android device with gesture nav
  - **Phase 2:** Forward + back navigation between Home / Post / Profile, tap on each tab, modal open
  - **Phase 3:** Pull at top, scroll to bottom + back to top + pull, drag SIG modal down, tap active Home tab
  - **Phase 4:** Open SIG sheet, drag up/down/dismiss, trigger each migrated toast, error toast with retry action, stack 4 toasts in quick succession

### Rollout

- Each phase ships as a separate PR off `feat/mobile-ui-enhancement`
- Phases are sequential — each depends on the prior. Foundation polish ships first because everything else assumes safe-area handling exists.
- Each PR includes screenshots/video of before/after on the affected screens

## Open Questions

None blocking. Below are minor decisions deferred to implementation:

- `useNavDirection` exact mechanics — pathname stack vs. listening to `popstate` only. Implementation plan will choose based on simplest correct behavior. On first render direction is `0` (no offset, fade-only).
- BottomSheet focus trap: build manually with `useEffect` + `tabindex` cycling, or import a small focus-trap helper. Default: build manually if ≤ 40 lines; otherwise add `focus-trap` (~3kb). Decision deferred to implementation.
- Theme-color per route (Phase 1): start with single static color matching the gradient peak; per-route override deferred unless visually needed.
