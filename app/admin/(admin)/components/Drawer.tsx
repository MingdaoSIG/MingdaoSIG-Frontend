"use client";

import { ArrowLeft, X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";
import useIsMobile from "@/utils/useIsMobile";

// Details and actions for the selected row. On desktop a panel beside the
// list (the list narrows, it is not covered); on phones a full-screen
// sheet. Esc closes it either way, and focus goes back to the row.

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const isMobile = useIsMobile();
  if (!open) {
    return null;
  }
  return isMobile ? (
    <Sheet onClose={onClose} title={title} subtitle={subtitle} footer={footer}>
      {children}
    </Sheet>
  ) : (
    <Panel onClose={onClose} title={title} subtitle={subtitle} footer={footer}>
      {children}
    </Panel>
  );
}

type PartProps = {
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/** Remembers what had focus, moves focus in, and gives it back on close. */
function useFocusReturn(target: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    target.current?.focus({ preventScroll: true });
    return () => {
      if (previous?.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [target]);
}

function Panel({ onClose, title, subtitle, children, footer }: PartProps) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  useFocusReturn(ref);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // A confirm dialog on top handles its own Esc.
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        document.querySelector("dialog[open]")
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="sticky top-6 flex max-h-[calc(100dvh-7rem)] w-[22rem] shrink-0 flex-col self-start rounded-card border border-line bg-surface shadow-card 2xl:w-[26rem]"
    >
      <div className="flex items-start gap-2 border-line border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2
            id={titleId}
            className="break-words font-bold text-base text-ink-900 leading-snug"
          >
            {title}
          </h2>
          {subtitle && (
            <div className="mt-0.5 text-ink-500 text-xs">{subtitle}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉詳細資料"
          title="關閉（Esc）"
          className="-mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 hover:bg-field"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {children}
      </div>
      {footer && (
        <div className="flex flex-wrap gap-2 border-line border-t px-4 py-3">
          {footer}
        </div>
      )}
    </aside>
  );
}

function Sheet({ onClose, title, subtitle, children, footer }: PartProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!dialog.open) {
      dialog.showModal();
    }
    closeRef.current?.focus();
    return () => {
      if (dialog.open) {
        dialog.close();
      }
      if (previous?.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-canvas p-0 text-ink-800"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-line border-b bg-surface px-2 pt-[env(safe-area-inset-top)]">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-12 cursor-pointer items-center gap-1 rounded-control px-2 font-semibold text-brand-700 text-sm"
          >
            <ArrowLeft aria-hidden className="size-4" />
            返回
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <h2
            id={titleId}
            className="break-words font-bold text-ink-900 text-lg leading-snug"
          >
            {title}
          </h2>
          {subtitle && (
            <div className="mt-1 text-ink-500 text-sm">{subtitle}</div>
          )}
          <div className="mt-4 rounded-card border border-line bg-surface p-4 shadow-card">
            {children}
          </div>
        </div>
        {footer && (
          <div className="flex flex-wrap gap-2 border-line border-t bg-surface px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
