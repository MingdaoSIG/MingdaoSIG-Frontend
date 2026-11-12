"use client";

import { Flag, Link2, MoreHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { notice } from "@/utils/notice";

/**
 * 「⋯」 next to a post's title (desktop): 複製連結, and 檢舉貼文 for
 * anyone but the author.
 */
export function PostMoreMenu({
  onReport,
}: {
  /** Absent on your own post. */
  onReport?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  async function copyLink() {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      notice("success", "已複製連結");
    } catch {
      notice("error", "無法複製連結");
    }
  }

  const item =
    "flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left text-sm transition-colors hover:bg-field";

  return (
    <div ref={ref} className="relative" data-reader-hide>
      <button
        ref={buttonRef}
        type="button"
        aria-label="更多動作"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-700 transition-colors hover:bg-field"
      >
        <MoreHorizontal aria-hidden className="size-5" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute top-full right-0 z-50 mt-1.5 flex w-44 flex-col gap-0.5 rounded-card border border-line bg-surface p-1.5 shadow-card-hover"
        >
          <button
            type="button"
            role="menuitem"
            className={`${item} text-ink-800`}
            onClick={copyLink}
          >
            <Link2 aria-hidden className="size-4 text-ink-500" />
            複製連結
          </button>
          {onReport && (
            <button
              type="button"
              role="menuitem"
              className={`${item} text-danger-700`}
              onClick={() => {
                setOpen(false);
                onReport();
              }}
            >
              <Flag aria-hidden className="size-4" />
              檢舉貼文
            </button>
          )}
        </div>
      )}
    </div>
  );
}
