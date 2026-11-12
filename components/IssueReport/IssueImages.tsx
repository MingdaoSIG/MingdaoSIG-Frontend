"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { imageUrl } from "@/modules/imageUrl";

// The screenshots of a 問題回報 as thumbnails; a click opens the image
// full size over the page (Esc, the close button or the backdrop close
// it). Shared by /me/reports and the admin drawer.

export function IssueImages({
  ids,
  size = "md",
}: {
  ids: string[];
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (ids.length === 0) {
    return null;
  }
  const box = size === "sm" ? "size-20" : "size-24 sm:size-28";
  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {ids.map((id, index) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`放大第 ${index + 1} 張截圖`}
              className={`${box} block cursor-zoom-in overflow-hidden rounded-control border border-line bg-field transition-shadow hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/40`}
            >
              {/* biome-ignore lint/performance/noImgElement: user screenshots at their own size, from the API */}
              <img
                src={imageUrl(id)}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && ids[open] && (
        <ImageLightbox
          src={imageUrl(ids[open]) ?? ""}
          label={`第 ${open + 1} 張截圖`}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

export function ImageLightbox({
  src,
  label,
  onClose,
}: {
  src: string;
  label: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

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
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink-900/80"
    >
      <div
        className="flex h-full w-full items-center justify-center p-4 sm:p-10"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: user screenshots at their own size, from the API */}
        <img
          src={src}
          alt={label}
          className="max-h-full max-w-full rounded-control bg-surface object-contain shadow-card"
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="關閉圖片"
        className="fixed top-[calc(0.75rem+env(safe-area-inset-top))] right-3 flex size-10 cursor-pointer items-center justify-center rounded-full bg-surface/90 text-ink-800 shadow-card hover:bg-surface"
      >
        <X aria-hidden className="size-5" />
      </button>
    </dialog>
  );
}
