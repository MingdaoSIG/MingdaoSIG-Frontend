"use client";

import { ImagePlus, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  imageFileProblem,
  UPLOAD_IMAGE_TYPES,
  uploadImageId,
} from "@/modules/imageUploadAPI";
import { imageUrl } from "@/modules/imageUrl";
import { isHexColor } from "@/modules/sigTheme";
import { Button, inputClass } from "./ui";

// Form fields shared by the SIG settings, the create-SIG dialog and the
// badge editor: a colour picker and an image upload with a preview.

/** The colours SIGs have used so far, as quick picks. */
export const COLOR_PRESETS = [
  "#2387c8",
  "#00aa73",
  "#a06437",
  "#faaabe",
  "#0b5a83",
  "#7a5af5",
  "#e0752d",
  "#5f6b7a",
];

/**
 * `#rrggbb` with the browser's picker, a text box and presets. The
 * preview shows the colour the way the site uses it: as a border, and
 * darkened as text (redesign-2026 §1.1).
 */
export function ColorField({
  label,
  value,
  onChange,
  previewText,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  previewText?: string;
  hint?: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  useEffect(() => {
    setText(value);
  }, [value]);
  const valid = isHexColor(value);
  const textInvalid = text !== "" && !isHexColor(text);

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="font-semibold text-ink-700 text-xs">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label={`${label}（色盤）`}
          value={valid ? value : "#0b5a83"}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-control border border-line bg-surface p-1"
        />
        <div className="w-28 shrink-0">
          <input
            id={id}
            value={text}
            maxLength={7}
            spellCheck={false}
            autoComplete="off"
            aria-invalid={textInvalid || undefined}
            aria-describedby={`${id}-hint`}
            placeholder="#rrggbb"
            onChange={(event) => {
              const next = event.target.value.trim().toLowerCase();
              setText(next);
              if (isHexColor(next)) {
                onChange(next);
              }
            }}
            className={`${inputClass} font-mono`}
          />
        </div>
        <fieldset className="flex flex-wrap gap-1">
          <legend className="sr-only">常用顏色</legend>
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`使用 ${preset}`}
              aria-pressed={value.toLowerCase() === preset}
              onClick={() => onChange(preset)}
              className={`size-7 cursor-pointer rounded-chip border-2 transition-transform hover:scale-110 ${
                value.toLowerCase() === preset
                  ? "border-ink-900"
                  : "border-surface"
              }`}
              style={{ backgroundColor: preset }}
            />
          ))}
        </fieldset>
      </div>
      {previewText && valid && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-500 text-xs">預覽</span>
          <span
            className="sig-text font-semibold"
            style={{ ["--sig-color" as string]: value }}
          >
            {previewText}
          </span>
          <span
            className="rounded-control border-[1.5px] bg-surface px-2.5 py-1 font-semibold text-ink-800 text-xs"
            style={{ borderColor: value }}
          >
            {previewText}
          </span>
          <span
            className="sig-text rounded-chip px-2 py-0.5 font-semibold text-xs"
            style={{
              ["--sig-color" as string]: value,
              backgroundColor: `color-mix(in srgb, ${value} 12%, white)`,
            }}
          >
            {previewText}
          </span>
        </div>
      )}
      <p id={`${id}-hint`} className="text-xs">
        {textInvalid ? (
          <span className="text-danger-700">
            請輸入 # 加 6 位十六進位數字，例如 #2387c8
          </span>
        ) : (
          <span className="text-ink-500">{hint}</span>
        )}
      </p>
    </div>
  );
}

/**
 * An image field: the current image, a new one picked (uploaded right
 * away with `POST /image`, so the parent only keeps its id), and 復原
 * back to the saved one.
 */
export function ImageField({
  label,
  value,
  saved,
  onChange,
  shape = "cover",
  hint,
  emptyText = "尚未設定",
}: {
  label: string;
  /** The image id (or URL) shown now. */
  value: string;
  /** The saved one; 復原 goes back to it. */
  saved?: string;
  onChange: (imageId: string) => void;
  shape?: "cover" | "square" | "icon";
  hint?: string;
  emptyText?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const url = imageUrl(value);
  const changed = saved !== undefined && value !== saved;

  const pick = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    const problem = imageFileProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setUploading(true);
    const result = await uploadImageId(file);
    setUploading(false);
    if (!result.ok) {
      setError(`上傳失敗：${result.message}`);
      return;
    }
    onChange(result.id);
  };

  const frame =
    shape === "cover"
      ? "aspect-[16/9] w-full max-w-72"
      : shape === "square"
        ? "size-20"
        : "size-14";

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span id={`${id}-label`} className="font-semibold text-ink-700 text-xs">
        {label}
      </span>
      <div
        className={`flex flex-wrap gap-3 ${shape === "cover" ? "flex-col items-start" : "items-center"}`}
      >
        <div
          className={`${frame} flex shrink-0 items-center justify-center overflow-hidden rounded-control border border-line bg-field`}
        >
          {url ? (
            // biome-ignore lint/performance/noImgElement: any API image id, previewed as is
            <img
              src={url}
              alt={`${label}預覽`}
              className="size-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-ink-400 text-xs">
              {emptyText}
            </span>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <input
            ref={input}
            type="file"
            accept={UPLOAD_IMAGE_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            onChange={(event) => {
              void pick(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => input.current?.click()}
              loading={uploading}
              aria-describedby={`${id}-hint`}
            >
              <ImagePlus aria-hidden className="size-3.5" />
              {url ? "換一張" : "上傳圖片"}
            </Button>
            {changed && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setError("");
                  onChange(saved ?? "");
                }}
                disabled={uploading}
              >
                <Undo2 aria-hidden className="size-3.5" />
                復原
              </Button>
            )}
          </div>
          <p id={`${id}-hint`} className="text-ink-500 text-xs">
            {hint ?? "JPG、PNG、WebP 或 TIFF，5 MB 以內"}
            {changed && "（尚未儲存）"}
          </p>
          {error && (
            <p role="alert" className="text-danger-700 text-xs">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
