"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * A dialog over the page, for forms that need more than a SweetAlert
 * (previews, uploads). Centered on desktop, a sheet from the bottom on
 * phones. Escape and the backdrop close it unless `busy`.
 */
export function Modal({
  open,
  onClose,
  title,
  busy = false,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** While saving: the dialog cannot be dismissed. */
  busy?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(busy);
  const onCloseRef = useRef(onClose);
  busyRef.current = busy;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(
      "textarea, input, select, button:not([data-modal-close])",
    );
    (first ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busyRef.current) {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-[rgba(17,29,41,0.45)] sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="關閉"
        tabIndex={-1}
        data-modal-close
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!busy) {
            onClose();
          }
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card bg-surface pb-[env(safe-area-inset-bottom)] shadow-card-hover focus:outline-none sm:w-[30rem] sm:rounded-card sm:pb-0"
      >
        <header className="flex shrink-0 items-center gap-3 border-line border-b px-5 py-4">
          <h2
            id={titleId}
            className="min-w-0 flex-1 truncate font-bold text-ink-900 text-lg"
          >
            {title}
          </h2>
          <button
            type="button"
            data-modal-close
            aria-label="關閉"
            disabled={busy}
            onClick={onClose}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-line border-t px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
