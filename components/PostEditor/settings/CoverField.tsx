"use client";

import { Crop, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";
import Swal from "sweetalert2";
import { imageFileProblem } from "@/modules/imageUploadAPI";
import { imageUrl } from "@/modules/imageUrl";
import { FALLBACK_DEFAULT_COVERS } from "@/modules/sigTheme/fallbackCovers";
import { promptLogin } from "@/utils/loginPrompt";
import useSig from "@/utils/useSig";
import { useUserAccount } from "@/utils/useUserAccount";
import { CoverCropDialog } from "./CoverCropDialog";
import {
  CENTER_CROP,
  type CoverCrop,
  cropToFile,
  loadImage,
} from "./coverCrop";

// 封面 (v4 8B): the cover the post will get, from the start. Without an
// upload that is the SIG's default cover, labelled 「SIG 預設封面」.
// 更換封面 or a drop on it picks a picture, which is cropped to 16:9 in
// the middle and uploaded; 調整位置 picks another 16:9 region of the same
// picture and uploads that, and 移除 goes back to the default. The
// upload itself is the page's (`onFile`), so each page keeps its checks.

type Original = {
  url: string;
  width: number;
  height: number;
  image: HTMLImageElement;
  crop: CoverCrop;
};

export function CoverField({
  cover,
  sigId,
  onFile,
  onRemove,
  mobile,
}: {
  /** The uploaded cover (image id or URL), or "" for the SIG default. */
  cover: string;
  sigId: string;
  /** Uploads a picked file (the page's handleFileChange). */
  onFile?: (e: ChangeEvent<HTMLInputElement>) => unknown;
  onRemove: () => void;
  mobile: boolean;
}) {
  const { isLogin, login } = useUserAccount();
  const { data: sig } = useSig(sigId || undefined);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [original, setOriginal] = useState<Original | null>(null);
  const [cropping, setCropping] = useState(false);

  const defaultCover =
    (sigId && (sig?.defaultCover || FALLBACK_DEFAULT_COVERS[sigId])) || "";
  const shown = imageUrl(cover || defaultCover);
  const isDefault = !cover;

  // The picture behind 調整位置 lives as an object URL: free it when it is
  // replaced, when the cover is removed, and when the editor closes.
  const urlRef = useRef<string | null>(null);
  function keepOriginal(next: Original | null) {
    if (urlRef.current && urlRef.current !== next?.url) {
      URL.revokeObjectURL(urlRef.current);
    }
    urlRef.current = next?.url ?? null;
    setOriginal(next);
  }
  useEffect(() => {
    if (!cover && urlRef.current) {
      keepOriginal(null);
    }
  }, [cover]);
  useEffect(
    () => () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    },
    [],
  );

  async function upload(file: File) {
    setBusy(true);
    try {
      await onFile?.({
        target: { files: [file] as unknown as FileList, value: "" },
      } as unknown as ChangeEvent<HTMLInputElement>);
    } finally {
      setBusy(false);
    }
  }

  async function pick(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!isLogin) {
      promptLogin(login, { text: "登入後才能上傳封面圖片" });
      return;
    }
    const problem = imageFileProblem(file);
    if (problem) {
      Swal.fire("無法使用這張圖片", problem, "error");
      return;
    }
    // Browsers cannot draw TIFF: upload it as it is.
    if (file.type === "image/tiff") {
      await upload(file);
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      const next: Original = {
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        image,
        crop: CENTER_CROP,
      };
      await upload(await cropToFile(image, CENTER_CROP));
      keepOriginal(next);
    } catch (error) {
      URL.revokeObjectURL(url);
      console.error("Cover crop failed:", error);
      // Could not crop: keep the old behaviour and upload the file.
      await upload(file);
    }
  }

  async function applyCrop(crop: CoverCrop) {
    if (!original) {
      return;
    }
    setBusy(true);
    try {
      await upload(await cropToFile(original.image, crop));
      keepOriginal({ ...original, crop });
      setCropping(false);
    } catch (error) {
      console.error("Cover crop failed:", error);
      Swal.fire("裁切失敗", "請換一張圖片再試", "error");
    } finally {
      setBusy(false);
    }
  }

  const button = `inline-flex cursor-pointer items-center gap-1.5 rounded-control px-3 font-semibold text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    mobile ? "h-11" : "h-9"
  }`;

  return (
    <div className="flex flex-col gap-2" data-cover-field>
      <span className="font-semibold text-ink-900 text-sm">封面</span>
      <div
        className={`relative aspect-video w-full overflow-hidden rounded-control border bg-field ${
          dragging ? "border-brand-700 ring-2 ring-brand-700/30" : "border-line"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void pick(event.dataTransfer.files?.[0]);
        }}
        data-cover-preview
        data-cover-default={isDefault || undefined}
      >
        {shown ? (
          <Image
            src={shown}
            alt={isDefault ? "SIG 預設封面" : "封面"}
            fill
            unoptimized
            sizes="320px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center text-ink-500 text-xs">
            <ImagePlus aria-hidden className="size-6 text-ink-400" />
            {sigId ? "上傳一張封面" : "選好 SIG 後會顯示它的預設封面"}
          </div>
        )}
        {isDefault && shown && (
          <span className="absolute top-2 left-2 rounded-chip bg-ink-900/70 px-2 py-0.5 font-semibold text-white text-xs">
            SIG 預設封面
          </span>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70 font-semibold text-ink-700 text-sm">
            上傳中…
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <label
          htmlFor={inputId}
          className={`${button} border border-line-strong bg-surface text-ink-800 hover:bg-field`}
          onClick={(event) => {
            if (!isLogin) {
              event.preventDefault();
              promptLogin(login, { text: "登入後才能上傳封面圖片" });
            }
          }}
        >
          <ImagePlus aria-hidden className="size-4" />
          更換封面
        </label>
        {!isDefault && original && (
          <button
            type="button"
            className={`${button} border border-line-strong bg-surface text-ink-800 hover:bg-field`}
            onClick={() => setCropping(true)}
            disabled={busy}
          >
            <Crop aria-hidden className="size-4" />
            調整位置
          </button>
        )}
        {!isDefault && (
          <button
            type="button"
            className={`${button} text-danger-700 hover:bg-danger-50`}
            onClick={() => {
              onRemove();
              if (inputRef.current) {
                inputRef.current.value = "";
              }
            }}
            disabled={busy}
          >
            <Trash2 aria-hidden className="size-4" />
            移除
          </button>
        )}
      </div>
      <p className="text-ink-500 text-xs">
        JPG、PNG、WebP 或 TIFF，5 MB 以內。也可以把圖片拖到封面上。
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/webp,image/jpeg,image/png,image/tiff"
        className="hidden"
        onChange={(event) => {
          void pick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {original && (
        <CoverCropDialog
          open={cropping}
          imageUrl={original.url}
          naturalWidth={original.width}
          naturalHeight={original.height}
          initial={original.crop}
          busy={busy}
          onCancel={() => setCropping(false)}
          onApply={applyCrop}
        />
      )}
    </div>
  );
}
