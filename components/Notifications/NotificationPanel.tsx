"use client";

import { Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type RefObject, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NotificationCenter } from "./NotificationCenter";

// Desktop: the side rail's 「通知」 opens this right-side panel instead of
// leaving the page (v3 4B). /notifications keeps the full page.

export const NOTIFICATION_PANEL_ID = "notification-panel";

export function NotificationPanel({
  open,
  onClose,
  trigger,
}: {
  open: boolean;
  onClose: () => void;
  /** The rail entry; clicks on it toggle instead of closing twice. */
  trigger: RefObject<HTMLElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Close on navigation.
  useEffect(() => {
    closeRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    panelRef.current?.focus({ preventScroll: true });
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        panelRef.current?.contains(target) ||
        trigger.current?.contains(target)
      ) {
        return;
      }
      // Dialogs opened from the panel (SweetAlert) sit outside it.
      if ((target as Element).closest?.(".swal2-container")) {
        return;
      }
      closeRef.current();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, trigger]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      id={NOTIFICATION_PANEL_ID}
      role="dialog"
      aria-label="通知"
      tabIndex={-1}
      data-notification-panel
      className="fixed top-[calc(var(--shell-header-h)+0.5rem)] right-4 z-50 flex h-[calc(100dvh-var(--shell-header-h)-1rem)] w-[min(26rem,calc(100vw-6rem))] flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card-hover"
    >
      <header className="flex shrink-0 items-center gap-2 border-line border-b px-4 py-3">
        <h2 className="flex-1 font-bold text-base text-ink-900">通知</h2>
        <Link
          href="/notifications?settings=1"
          aria-label="通知設定"
          title="通知設定"
          className="flex size-8 items-center justify-center rounded-control text-ink-500 transition-colors hover:bg-field hover:text-ink-800"
        >
          <Settings size={17} aria-hidden />
        </Link>
        <button
          type="button"
          aria-label="關閉通知"
          onClick={() => {
            onClose();
            trigger.current?.focus();
          }}
          className="flex size-8 cursor-pointer items-center justify-center rounded-control text-ink-500 transition-colors hover:bg-field hover:text-ink-800"
        >
          <X size={18} aria-hidden />
        </button>
      </header>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <NotificationCenter variant="panel" onNavigate={onClose} />
      </div>
      <Link
        href="/notifications"
        className="block shrink-0 border-line border-t px-4 py-3 text-center font-semibold text-brand-700 text-sm transition-colors hover:bg-field"
      >
        查看全部通知
      </Link>
    </div>,
    document.body,
  );
}
