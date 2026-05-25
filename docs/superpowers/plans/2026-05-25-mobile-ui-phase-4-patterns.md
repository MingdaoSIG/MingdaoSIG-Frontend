# Mobile UI Phase 4 — Native UI Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the centered modal SIG list with a real bottom sheet (backdrop, snap points, focus trap, ESC handler, scroll lock). Add a lightweight Toast system for non-blocking notifications. Migrate the in-scope mobile-only SweetAlert calls to toasts; keep SweetAlert for blocking confirmations.

**Architecture:** Two new primitives in `components/mobile/` (BottomSheet + Toast) built on top of `motion` and Phase 3's `DraggableSheet`. No new dependencies. SigList becomes a thin wrapper using BottomSheet. Toast uses a module-level subscriber store + provider portal pattern.

**Tech Stack:** Next.js 15 App Router, React 19, `motion@12` (already installed), Tailwind v4. No new deps.

**Spec:** `docs/superpowers/specs/2026-05-25-mobile-ui-enhancement-design.md` (Phase 4 section)

**Verification approach:** This project has no Jest/Vitest test suite. Each task runs `pnpm check && pnpm types && pnpm build`. Sheet/toast UX cannot be fully verified without a real device — final manual verification is in Task 7 (human reviewer).

---

## File map

| Path | Action | Why |
|------|--------|-----|
| `components/mobile/BottomSheet/index.tsx` | Create | Full-featured bottom sheet built on `DraggableSheet`. Backdrop, snap points, ESC, scroll lock, focus management |
| `components/mobile/Toast/index.tsx` | Create | Module-level toast store + `<ToastProvider>` UI + `toast` imperative API (success/error/info) |
| `app/(home)/mobile/SigList.tsx` | Modify | Rewrite to use BottomSheet instead of fixed-overlay+DraggableSheet pattern |
| `app/device.tsx` | Modify | Mount `<ToastProvider />` in the mobile branch |
| `app/post/[postID]/(post)/mobile/Thread.tsx` | Modify | Replace `Swal.fire(...)` link-copy notification with `toast.info(...)` |
| `app/post/[postID]/(post)/mobile/Replies.tsx` | Modify | Replace `Swal.fire(alertMessageConfigs.otherError)` with `toast.error(...)` |

---

## Task 1: Create `BottomSheet` component

**Files:**
- Create: `components/mobile/BottomSheet/index.tsx`

**Context:** Builds on `DraggableSheet` from Phase 3 Task 1. Adds backdrop, snap-point support (height percentages), drag handle visual, title bar with close button, ESC key handler, body scroll lock while open, and basic focus restoration.

The component is conditionally rendered via `open` prop. AnimatePresence wraps the backdrop+sheet so they exit smoothly when `open` toggles to false. Sheet height is determined by current snap point (a state managed inside the component).

For Phase 4, focus trap is **basic**: when the sheet opens, focus moves to the close button; when it closes, focus returns to the previously focused element. We don't tab-cycle internally yet — that's a follow-up if needed.

- [ ] **Step 1: Verify directory doesn't exist**

Run: `ls components/mobile/BottomSheet 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create file with EXACTLY:**

```typescript
"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { DraggableSheet } from "@/components/mobile/DraggableSheet";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: string[];
  initialSnap?: number;
  children: ReactNode;
};

export function BottomSheet({
  open,
  onClose,
  title,
  snapPoints = ["60%", "90%"],
  initialSnap = 0,
  children,
}: BottomSheetProps) {
  const [snapIndex, setSnapIndex] = useState(initialSnap);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const handleHandleClick = useCallback(() => {
    setSnapIndex((current) => (current + 1) % snapPoints.length);
  }, [snapPoints.length]);

  const height = snapPoints[snapIndex];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999998,
            }}
          />
          <DraggableSheet
            key="sheet"
            onDismiss={onClose}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              height,
              maxHeight: "95dvh",
              backgroundColor: "rgba(255, 255, 255, 0.97)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.15)",
              zIndex: 999999,
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <button
              type="button"
              onClick={handleHandleClick}
              aria-label="Toggle sheet height"
              style={{
                padding: "10px 0",
                display: "flex",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                cursor: "grab",
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 4,
                  backgroundColor: "#cbd5e1",
                  borderRadius: 2,
                }}
              />
            </button>
            {title && (
              <div
                style={{
                  padding: "0 20px 12px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 18,
                    color: "#0f172a",
                  }}
                >
                  {title}
                </h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {children}
            </div>
          </DraggableSheet>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
```

**Notes for the implementer:**
- `snapPoints` are CSS height values (e.g., `"60%"`, `"90%"`, `"100dvh"`). Default is `["60%", "90%"]`.
- Tapping the drag handle cycles through snap points (a convenience — drag-to-resize is not implemented in this iteration).
- The component renders nothing when `open=false`. AnimatePresence handles the exit animation.
- z-index 999998 (backdrop) and 999999 (sheet) match the existing SigList overlay z-index.
- The drag handle button has `cursor: grab` for desktop debugging.
- ARIA: `role="dialog" aria-modal="true" aria-label={title}` on the sheet.
- Body scroll is locked via `document.body.style.overflow = "hidden"`. The cleanup restores the original value.
- Focus management: on open, the close button is focused; on close, focus returns to whatever was focused before. Not a full focus trap (Tab can leak out) — basic but adequate for V1.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. If Biome flags any inline-style preferences, work with them.

- [ ] **Step 4: Commit**

```bash
git add components/mobile/BottomSheet/
git commit -m "feat(mobile): add BottomSheet primitive

Full-featured bottom sheet built on DraggableSheet:
- Backdrop with fade in/out (click to dismiss)
- Snap-point height (default ['60%', '90%']); tap drag handle to cycle
- Drag handle visual at top
- Optional title + close button
- ESC key dismisses
- Body scroll locked while open
- Focus moves to close button on open, restored on close
- Safe-area-bottom padding so content clears iOS home indicator
- ARIA: role='dialog', aria-modal='true', aria-label={title}

Drag-to-dismiss inherited from DraggableSheet (offset>80 or
velocity>500)."
```

---

## Task 2: Rewrite `SigList` using `BottomSheet`

**Files:**
- Modify: `app/(home)/mobile/SigList.tsx`

**Context:** SigList currently uses a `fixed inset-0` overlay + centered `DraggableSheet` pattern (its own backdrop, its own panel). We rewrite it as a thin wrapper around `BottomSheet`. The SIG grid content stays the same; only the wrapping changes.

The caller passes `sigListToggle(false)` to close — we pass that to BottomSheet's `onClose` prop. The parent `ThreadsList` currently conditionally renders `{showList && <SigList sigListToggle={setShowList} />}` — that pattern works with BottomSheet because BottomSheet checks `open` internally. To minimize parent changes, SigList keeps accepting `sigListToggle` and passes `open={true}` always (since parent only mounts it when showing). The exit animation works because BottomSheet uses AnimatePresence internally — but only if the parent UNMOUNTS BottomSheet. The unmount happens when `sigListToggle(false)` is called → `showList` becomes false → SigList is unmounted, but THEN BottomSheet exits its `open` state too late to animate.

Better: change SigList to ALWAYS render (parent passes `open` instead of conditionally mounting). Update ThreadsList to match.

Actually simplest: have SigList ALWAYS pass `open={true}` to BottomSheet, and the parent conditionally mounts SigList as today. The exit animation won't fire because the whole SigList tree is unmounted before AnimatePresence can run. Acceptable trade-off — entry animation works (spring up), exit just disappears with the backdrop click immediately.

The cleanest fix: pass `open` from parent down. Let's do that. ThreadsList will always render `<SigList open={showList} onClose={() => setShowList(false)} />` instead of conditionally rendering.

- [ ] **Step 1: Read current SigList**

Run: `cat 'app/(home)/mobile/SigList.tsx'`
Expected: see imports (DraggableSheet, Link, etc.), the `SIG` helper, the `SigList` component with `sigListToggle` prop, the fixed-inset overlay structure.

- [ ] **Step 2: Replace ENTIRE file with EXACTLY:**

```typescript
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/mobile/BottomSheet";
import type { Sig } from "@/interfaces/Sig";
// Modules
import maxMatch from "@/modules/maxMatch";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SIG = (child: Pick<Sig, "_id" | "name" | "customId">) => {
  return (
    <Link
      className="group relative flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#6fa8ff] via-[#4a9dd4] to-[#30b4ac] p-2 transition-all duration-300 hover:rotate-3 hover:scale-110 hover:shadow-lg"
      href={`/@${child.customId}`}
    >
      <div className="absolute inset-0 rounded-2xl bg-white/0 transition-colors duration-300 group-hover:bg-white/10" />
      {maxMatch(child.name).map((name) => (
        <p
          key={name}
          className="relative z-10 text-center font-semibold text-white text-xs leading-3"
        >
          {name}
        </p>
      ))}
    </Link>
  );
};

type SigListProps = {
  open: boolean;
  onClose: () => void;
};

const SigList = ({ open, onClose }: SigListProps) => {
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }
    (async () => {
      try {
        const res = await (
          await fetch(`${API_URL}/sig/list`, { method: "GET" })
        ).json();
        setSigs(res.data);
        setIsLoading(false);
      } catch (_error) {
        setIsLoading(false);
      }
    })();
  }, [open]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="探索 SIGs"
      snapPoints={["60%", "90%"]}
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6fa8ff] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 place-items-center gap-4">
            {sigs.map((item) => {
              if (item._id !== "652d60b842cdf6a660c2b778") {
                return (
                  <SIG
                    _id={item._id}
                    name={item.name}
                    customId={item.customId}
                    key={item._id}
                  />
                );
              }
              return null;
            })}
          </div>
          <p className="mt-6 text-center text-gray-500 text-xs">
            選擇一個 SIG 來探索更多內容
          </p>
        </>
      )}
    </BottomSheet>
  );
};

export default SigList;
```

**Notes:**
- Props changed from `{ sigListToggle }` to `{ open, onClose }`. Caller must be updated (next step in this task — update ThreadsList).
- The fetch effect only runs when `open` becomes true (and re-fetches if SigList re-opens — that's OK; usually cached at the network layer anyway).
- `DraggableSheet` import is gone (BottomSheet handles dragging internally).
- The `motion` import is gone (BottomSheet handles all animation).
- The footer "選擇一個 SIG 來探索更多內容" text is preserved but moved into the content area as `<p>` below the grid.

- [ ] **Step 3: Update `ThreadsList.tsx` to match the new SigList API**

Read `app/(home)/mobile/ThreadsList.tsx`. Change the line:

```tsx
{showList && <SigList sigListToggle={setShowList} />}
```

to:

```tsx
<SigList open={showList} onClose={() => setShowList(false)} />
```

(Always render SigList, pass `open` as a prop — this lets BottomSheet's AnimatePresence animate the exit.)

- [ ] **Step 4: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. Biome may sort className — let it.

- [ ] **Step 5: Commit (both files in one commit)**

```bash
git add 'app/(home)/mobile/SigList.tsx' 'app/(home)/mobile/ThreadsList.tsx'
git commit -m "feat(mobile): rewrite SIG list as BottomSheet

- SigList now wraps BottomSheet instead of using its own fixed
  overlay + DraggableSheet pattern. Props changed to { open,
  onClose } so the parent always mounts the component (lets
  AnimatePresence animate the exit).
- ThreadsList updated to pass open/onClose instead of the previous
  conditional mount.
- Fetch effect only runs while open=true.
- Behaviour gained: snap-point cycling, ESC dismiss, body scroll
  lock, restored focus on close, safe-area-bottom padding."
```

---

## Task 3: Create `Toast` component (store + provider + imperative API)

**Files:**
- Create: `components/mobile/Toast/index.tsx`

**Context:** A single file containing:
- Module-level subscriber store for toasts
- `toast.success/error/info` imperative API
- `<ToastProvider>` React component that renders the toast UI
- Auto-dismiss after 3s unless `action` button attached
- Stack of up to 3 (oldest dismissed when 4th added)
- Each toast can be manually swiped horizontally to dismiss

Approach: module-level array + Set of listeners. Provider's `useEffect` subscribes; calls `useState` setter on change. Toasts rendered top-center with slide-down enter from above. Each toast has a timer (cleared if action button attached).

- [ ] **Step 1: Verify directory doesn't exist**

Run: `ls components/mobile/Toast 2>&1 || echo "not present"`
Expected: "not present".

- [ ] **Step 2: Create file with EXACTLY:**

```typescript
"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastInternal = {
  id: number;
  type: ToastType;
  message: string;
  action?: ToastAction;
};

type ToastOptions = {
  action?: ToastAction;
};

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 3000;

let toasts: ToastInternal[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function add(type: ToastType, message: string, options?: ToastOptions) {
  const id = nextId++;
  const next: ToastInternal = { id, type, message, action: options?.action };
  toasts = [...toasts, next];
  if (toasts.length > MAX_TOASTS) {
    toasts = toasts.slice(toasts.length - MAX_TOASTS);
  }
  notify();
  if (!options?.action) {
    setTimeout(() => remove(id), AUTO_DISMISS_MS);
  }
}

function remove(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    add("success", message, options),
  error: (message: string, options?: ToastOptions) =>
    add("error", message, options),
  info: (message: string, options?: ToastOptions) =>
    add("info", message, options),
};

const typeStyles: Record<ToastType, { bg: string; icon: string; fg: string }> =
  {
    success: { bg: "rgba(16, 185, 129, 0.95)", icon: "✓", fg: "#10b981" },
    error: { bg: "rgba(239, 68, 68, 0.95)", icon: "!", fg: "#ef4444" },
    info: { bg: "rgba(59, 130, 246, 0.95)", icon: "i", fg: "#3b82f6" },
  };

function ToastItem({ toast: t }: { toast: ToastInternal }) {
  const styles = typeStyles[t.type];

  const handleDragEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400) {
      remove(t.id);
    }
  };

  return (
    <motion.div
      layout
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={handleDragEnd}
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -32, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      role={t.type === "error" ? "alert" : "status"}
      style={{
        backgroundColor: styles.bg,
        color: "white",
        padding: "12px 16px",
        borderRadius: 14,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        backdropFilter: "blur(10px)",
        maxWidth: "90vw",
        pointerEvents: "auto",
        touchAction: "pan-y",
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: "white",
          color: styles.fg,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        {styles.icon}
      </span>
      <span style={{ flex: 1 }}>{t.message}</span>
      {t.action && (
        <button
          type="button"
          onClick={() => {
            t.action?.onClick();
            remove(t.id);
          }}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            border: "none",
            color: "white",
            padding: "4px 10px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t.action.label}
        </button>
      )}
    </motion.div>
  );
}

export function ToastProvider() {
  const [items, setItems] = useState<ToastInternal[]>(toasts);

  useEffect(() => {
    const listener = () => setItems([...toasts]);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "calc(env(safe-area-inset-top) + 8px)",
        left: 0,
        right: 0,
        zIndex: 9999999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastProvider;
```

**Notes:**
- Module-level `toasts` array + `listeners` set. Provider subscribes via useEffect.
- `toast.success/error/info` exported as a singleton object. Callable from anywhere.
- Auto-dismiss timer set in `add()`; cleared by `remove()` (the timer fires but `remove()` is idempotent — filtering an already-removed id is a no-op).
- `MAX_TOASTS = 3`: when adding a 4th, oldest is dropped from the array before notify.
- Container is `position: fixed` at top with `pointerEvents: none` so it doesn't block touches; individual toast items have `pointerEvents: auto`.
- Drag-x: dismiss when |offset.x| > 80 or |velocity.x| > 400.
- z-index 9999999 (one more digit than BottomSheet's 999999) so toasts appear above sheets.
- ARIA: `role="alert"` for errors (interrupts assistive tech), `role="status"` for success/info.

- [ ] **Step 3: Verify build + types + lint pass**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. If Biome warns about `let toasts` mutation or `let nextId++`, those are intentional module-level mutables for the subscriber pattern; if it errors, suggest the implementer wraps them in a small closure.

- [ ] **Step 4: Commit**

```bash
git add components/mobile/Toast/
git commit -m "feat(mobile): add Toast system (provider + imperative API)

Three-piece component in one file:
- Module-level subscriber store + toast.success/error/info API
  (callable from anywhere in client code)
- ToastProvider component that renders the active stack
- ToastItem component (motion-driven enter/exit, swipe-x to dismiss)

Auto-dismiss after 3s unless an action button is attached. Stack
caps at 3 — oldest drops when a 4th arrives. ARIA: role='alert'
for errors, role='status' for success/info. Container respects
safe-area-inset-top."
```

---

## Task 4: Mount `ToastProvider` in `device.tsx`

**Files:**
- Modify: `app/device.tsx`

**Context:** The ToastProvider needs to be mounted exactly once in the React tree (otherwise multiple subscribers will fight). We add it inside the mobile branch of device.tsx. Desktop branch is NOT modified.

When `toast.x(...)` is called from shared code (like `app/page.tsx`) on desktop, the call adds to the module-level store but no `<ToastProvider>` is rendered to display it — effectively a no-op for desktop users. This matches the spec: shared files are NOT migrated to toast in Phase 4 (they stay on SweetAlert), so this no-op behavior is only theoretical for now.

- [ ] **Step 1: Read current `app/device.tsx`**

Run: `cat app/device.tsx`
Expected: mobile branch has `<HeaderBarMobile /><PageTransition>{children}</PageTransition><ToolBarMobile />`.

- [ ] **Step 2: Replace ENTIRE file with EXACTLY:**

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
import { ToastProvider } from "@/components/mobile/Toast";

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
          <ToastProvider />
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

- [ ] **Step 3: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/device.tsx
git commit -m "feat(mobile): mount ToastProvider in mobile shell

Single mount point inside the mobile branch of Device. Desktop
branch unchanged — toast.x() calls from shared code there are
effectively no-ops (the underlying store still records them but
no provider renders them), which is fine because shared files
intentionally stay on SweetAlert per the spec."
```

---

## Task 5: Migrate `Thread.tsx` (mobile) SweetAlert → toast

**Files:**
- Modify: `app/post/[postID]/(post)/mobile/Thread.tsx`

**Context:** The mobile Thread component has one `Swal.fire(...)` call inside `onLike()` — when an un-logged-in user taps the like button, it shows a "Please login first" warning. This is a NON-blocking notification (the user can still see the page; we just inform them). Migrate to `toast.info()`.

We do NOT add any other toasts — just replace this one Swal call.

- [ ] **Step 1: Read current file**

Run: `cat 'app/post/[postID]/(post)/mobile/Thread.tsx'`
Expected: see `import Swal from "sweetalert2";` and inside `onLike()`:
```tsx
Swal.fire({
  title: "Please login first",
  text: "You must login to like someone's post",
  icon: "warning",
  confirmButtonText: "Confirm",
});
```

**Step 2: Make 2 changes:**

**Change A: Replace the Swal import with a toast import**

Change:
```typescript
import Swal from "sweetalert2";
```

to:
```typescript
import { toast } from "@/components/mobile/Toast";
```

**Change B: Replace the Swal.fire call**

Change:
```tsx
Swal.fire({
  title: "Please login first",
  text: "You must login to like someone's post",
  icon: "warning",
  confirmButtonText: "Confirm",
});
```

to:
```tsx
toast.info("Please login to like this post");
```

- [ ] **Step 3: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. Should report `Swal` is no longer imported (we removed it) — no error.

- [ ] **Step 4: Commit**

```bash
git add 'app/post/[postID]/(post)/mobile/Thread.tsx'
git commit -m "refactor(mobile-post): replace login-warning Swal with toast

The 'Please login first' notification when an un-logged-in user
taps Like is informational, not a confirmation. Switched to
toast.info() for a less interruptive native-feel notification."
```

---

## Task 6: Migrate `Replies.tsx` (mobile) SweetAlert → toast

**Files:**
- Modify: `app/post/[postID]/(post)/mobile/Replies.tsx`

**Context:** The mobile Replies component uses `Swal.fire(alertMessageConfigs.otherError)` somewhere — likely an error notification when reply fetching/posting fails. Migrate to `toast.error()`.

**Step 1: Read current file**

Run: `cat 'app/post/[postID]/(post)/mobile/Replies.tsx'`
Expected: see `import Swal from "sweetalert2";` and at least one `Swal.fire(alertMessageConfigs.otherError)` or similar call. Note the message text used.

**Step 2: Make 2 changes:**

**Change A: Replace the Swal import**

If the file imports both `Swal` and `alertMessageConfigs`:

Change the `import Swal from "sweetalert2";` line to:
```typescript
import { toast } from "@/components/mobile/Toast";
```

If `alertMessageConfigs` is imported and no longer used after this migration, also remove that import. Verify with the build.

**Change B: Replace the Swal.fire call**

Change `Swal.fire(alertMessageConfigs.otherError);` (and any similar Swal calls in this file) to:
```typescript
toast.error("無法載入回覆");
```

If there are multiple Swal calls with different messages, use appropriate text for each:
- "otherError" or unspecified error → `toast.error("無法載入回覆")`
- A success case → `toast.success("...")`
- An info case → `toast.info("...")`

Use judgment based on the original Swal config's `icon` and `text` fields. If unclear, default to `toast.error("無法載入回覆")` for warning/error icons.

- [ ] **Step 3: Verify**

Run: `pnpm check && pnpm types && pnpm build`
Expected: clean. If `alertMessageConfigs` is now unused, Biome's `noUnusedImports` will fix it; re-stage if needed.

- [ ] **Step 4: Commit**

```bash
git add 'app/post/[postID]/(post)/mobile/Replies.tsx'
git commit -m "refactor(mobile-post): replace error Swal with toast in Replies

Reply errors now show as toast.error('無法載入回覆') instead of
blocking SweetAlert dialogs — non-blocking native-feel."
```

---

## Task 7: Phase 4 end-of-phase verification

**Files:** none

**Context:** Phase 4 complete. Final phase. Run quality gate. No PR — all 4 phases land on the branch; the user opens a single PR after this.

- [ ] **Step 1: Full quality gate**

Run: `pnpm check && pnpm types && pnpm build` from `/Users/lazp/Projects/Mingdao/MingdaoSIG-Frontend`
Expected: clean.

- [ ] **Step 2: Confirm git state**

Run: `git status` (clean) and `git log --oneline main..HEAD` (Phase 1+2+3 commits + Phase 4 plan + 6 Phase 4 task commits).

Expected new commits since Phase 3 verification:
1. `docs: add Phase 4 implementation plan (native UI patterns)`
2. `feat(mobile): add BottomSheet primitive`
3. `feat(mobile): rewrite SIG list as BottomSheet` (touches 2 files: SigList + ThreadsList)
4. `feat(mobile): add Toast system (provider + imperative API)`
5. `feat(mobile): mount ToastProvider in mobile shell`
6. `refactor(mobile-post): replace login-warning Swal with toast`
7. `refactor(mobile-post): replace error Swal with toast in Replies`

- [ ] **Step 3: Verify ALL FOUR phases work together by reading the final state**

Run: `git diff main -- app/\(Layout\)/mobile/ app/\(home\)/mobile/ components/mobile/ utils/useSafeArea/ utils/useNavDirection/ | head -100`

Just confirm no obvious conflicts or weird states. Don't try to fully understand — just check no merge markers or duplicate code blocks.

- [ ] **Step 4: Report**

Do NOT push, do NOT open PR. Report:
- Quality gate output
- Commit list since main
- Total commits across all 4 phases
- Anything unexpected or worth highlighting
- Recommend next steps to the user (e.g. "Test on real iPhone, then open PR")

---

## Self-review checklist

- **Spec coverage:** BottomSheet, Toast, SigList rewrite, ToastProvider mount, Thread.tsx migration, Replies.tsx migration — all six spec items present. ✓
- **Placeholder scan:** No TBD / TODO / vague wording. Each code block is complete. ✓
- **Type consistency:** `BottomSheet` props (`open`, `onClose`, `title`, `snapPoints`, `initialSnap`, `children`) consistent. `toast.success/error/info(message, options?)` signature consistent. ✓
- **A11y:** BottomSheet has `role="dialog"`, `aria-modal="true"`, `aria-label`. Toast has `role="alert"` for errors, `role="status"` for others. Focus management on sheet open/close. ✓
- **No new deps:** Confirmed. ✓
- **Desktop untouched:** All modified app/ files are inside mobile-only directories or only modify the mobile branch of device.tsx. ✓
- **SweetAlert migration scoped:** Only mobile-only files (Thread + Replies). Shared files (page.tsx, edit/page.tsx) NOT touched per spec. Logout confirmation NOT migrated per spec. ✓
