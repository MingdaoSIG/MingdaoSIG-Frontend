"use client";

import { X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "./ui";

// In-app dialogs on the native <dialog> element: it sits in the browser's
// top layer (above the fixed headers), traps focus, makes the page behind
// it inert and closes with Esc. Replaces SweetAlert in the admin panel.

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocus,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Focused when the dialog opens; else the first focusable element. */
  initialFocus?: React.RefObject<HTMLElement | null>;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.showModal();
      initialFocus?.current?.focus();
    }
    if (!open && dialog.open) {
      dialog.close();
      returnFocus.current?.focus();
    }
  }, [open, initialFocus]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Esc: let React decide, so the open state stays the truth.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className={`m-auto max-h-[calc(100dvh-2rem)] rounded-card border border-line bg-surface p-0 text-ink-800 shadow-card backdrop:bg-ink-900/40 ${
        wide
          ? "w-[min(36rem,calc(100%-2rem))]"
          : "w-[min(26rem,calc(100%-2rem))]"
      }`}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start gap-3 px-5 pt-5">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-bold text-base text-ink-900">
                {title}
              </h2>
              {description && (
                <div id={descriptionId} className="mt-1 text-ink-500 text-sm">
                  {description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉"
              className="-mt-1 -mr-1 flex size-8 cursor-pointer items-center justify-center rounded-control text-ink-500 hover:bg-field"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
          {children && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4">
              {children}
            </div>
          )}
          {footer && (
            <div className="flex flex-wrap justify-end gap-2 px-5 pt-4 pb-5">
              {footer}
            </div>
          )}
          {!footer && <div className="h-5" />}
        </div>
      )}
    </dialog>
  );
}

type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
};

type ConfirmRequest = ConfirmOptions & { resolve: (value: boolean) => void };

const ConfirmContext = createContext<
  ((options: ConfirmOptions) => Promise<boolean>) | null
>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setRequest({ ...options, resolve });
      }),
    [],
  );

  const finish = (value: boolean) => {
    request?.resolve(value);
    setRequest(null);
  };

  const danger = request?.tone === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={Boolean(request)}
        onClose={() => finish(false)}
        title={request?.title ?? ""}
        description={request?.description}
        // Destructive actions start on 取消, so Enter does not delete.
        initialFocus={danger ? cancelRef : confirmRef}
        footer={
          <>
            <Button ref={cancelRef} onClick={() => finish(false)}>
              {request?.cancelLabel ?? "取消"}
            </Button>
            <Button
              ref={confirmRef}
              variant={danger ? "danger" : "primary"}
              onClick={() => finish(true)}
            >
              {request?.confirmLabel ?? "確定"}
            </Button>
          </>
        }
      />
    </ConfirmContext.Provider>
  );
}

/** `await confirm({ title, … })` resolves true for the confirm button. */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return confirm;
}
