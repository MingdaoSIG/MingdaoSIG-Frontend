"use client";

import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { imageFileProblem, UPLOAD_IMAGE_TYPES } from "@/modules/imageUploadAPI";
import { ISSUE_IMAGES_MAX } from "@/modules/issueReports";

// Up to three screenshots for a 問題回報. Files come from the picker,
// the clipboard (anywhere on the page) or a drop on the form; each one
// uploads right away through POST /image (modules/imageUploadAPI, the
// same formats and 5 MB cap as the editor).

export type Shot = {
  key: string;
  preview: string;
  /** The image id once uploaded. */
  id: string | null;
};

/** The image files in a paste or a drop, in order. */
export function imageFilesOf(list: FileList | DataTransferItemList | null) {
  const files: File[] = [];
  if (!list) {
    return files;
  }
  for (let index = 0; index < list.length; index++) {
    const item = list[index];
    const file = item instanceof File ? item : item.getAsFile();
    if (file?.type.startsWith("image/")) {
      files.push(file);
    }
  }
  return files;
}

/** Why some of these files cannot be added, or null. */
export function filesProblem(files: File[], room: number) {
  if (room <= 0) {
    return `最多 ${ISSUE_IMAGES_MAX} 張截圖`;
  }
  for (const file of files) {
    const problem = imageFileProblem(file);
    if (problem) {
      return problem;
    }
  }
  return files.length > room ? `最多 ${ISSUE_IMAGES_MAX} 張截圖` : null;
}

export function ScreenshotPicker({
  shots,
  error,
  disabled,
  onAdd,
  onRemove,
}: {
  shots: Shot[];
  error: string | null;
  disabled: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const full = shots.length >= ISSUE_IMAGES_MAX;

  // Pasting an image anywhere on the page adds it; text pastes are left
  // alone.
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = imageFilesOf(event.clipboardData?.items ?? null);
      if (files.length === 0) {
        return;
      }
      event.preventDefault();
      onAddRef.current(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
    >
      <legend className="mb-2 p-0 font-semibold text-ink-900 text-sm">
        截圖（選填，最多 {ISSUE_IMAGES_MAX} 張）
      </legend>
      <div className="flex flex-wrap gap-2">
        {shots.map((shot, index) => (
          <div
            key={shot.key}
            className="relative size-24 overflow-hidden rounded-control border border-line bg-field sm:size-28"
          >
            {/* biome-ignore lint/performance/noImgElement: local blob: previews of picked files */}
            <img
              src={shot.preview}
              alt={`第 ${index + 1} 張截圖`}
              className={`size-full object-cover ${shot.id ? "" : "opacity-50"}`}
            />
            {!shot.id && (
              <span className="absolute inset-0 flex items-center justify-center">
                <LoaderCircle
                  aria-hidden
                  className="size-6 animate-spin text-brand-700"
                />
                <span className="sr-only">上傳中</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(shot.key)}
              disabled={disabled}
              aria-label={`移除第 ${index + 1} 張截圖`}
              className="absolute top-1 right-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-ink-900/70 text-white transition-colors hover:bg-ink-900 disabled:cursor-not-allowed"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex size-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-line-strong border-dashed bg-surface text-ink-500 text-xs transition-colors hover:border-brand-700/50 hover:bg-field hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:size-28"
          >
            <ImagePlus aria-hidden className="size-6" />
            加入截圖
          </button>
        )}
      </div>
      <p className="text-ink-500 text-xs leading-5">
        JPG、PNG、WebP 或 TIFF，每張 5 MB 以內。也可以直接貼上或拖曳圖片到這裡。
      </p>
      {error && (
        <p id={errorId} role="alert" className="text-danger-700 text-sm">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_IMAGE_TYPES.join(",")}
        multiple
        hidden
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) {
            onAdd(files);
          }
        }}
      />
    </fieldset>
  );
}
