"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Modal } from "@/components/Modal";
import type { Sig } from "@/interfaces/Sig";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  imageFileProblem,
  UPLOAD_IMAGE_TYPES,
  uploadImageId,
} from "@/modules/imageUploadAPI";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { useUserAccount } from "@/utils/useUserAccount";

import { UpdateSigAPI } from "../apis/JoinSigAPI";

/** The backend limit for a SIG description. */
export const SIG_DESCRIPTION_MAX = 250;

type Step = "idle" | "uploading" | "saving";

/**
 * 「編輯 SIG」 for the SIG's managers and admins: the description and the
 * avatar. A new avatar is uploaded only when saving (`POST /image`, then
 * `POST /sig/:id` with its id), so a cancelled edit leaves nothing behind.
 */
export function EditSigDialog({
  sig,
  open,
  onClose,
  onSaved,
}: {
  sig: Sig;
  open: boolean;
  onClose: () => void;
  /** The SIG as saved; the page shows it right away. */
  onSaved: (sig: Sig) => void;
}) {
  const { token } = useUserAccount();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState(sig.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const descriptionId = useId();
  const counterId = useId();

  // Start from the SIG as it is each time the dialog opens.
  useEffect(() => {
    if (open) {
      setDescription(sig.description ?? "");
      setFile(null);
      setError(null);
      setStep("idle");
    }
  }, [open, sig.description]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const busy = step !== "idle";
  const tooLong = description.length > SIG_DESCRIPTION_MAX;
  const descriptionChanged = description !== (sig.description ?? "");
  const canSave = !busy && !tooLong && (descriptionChanged || Boolean(file));

  function pick(picked: File | undefined) {
    if (!picked) {
      return;
    }
    const problem = imageFileProblem(picked);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFile(picked);
  }

  async function save() {
    if (!canSave || !sig._id) {
      return;
    }
    setError(null);
    const body: { description?: string; avatar?: string } = {};
    if (descriptionChanged) {
      body.description = description;
    }
    if (file) {
      setStep("uploading");
      const upload = await uploadImageId(file);
      if (!upload.ok) {
        setError(`圖片上傳失敗：${upload.message}`);
        setStep("idle");
        return;
      }
      body.avatar = upload.id;
    }
    setStep("saving");
    const result = await UpdateSigAPI(sig._id, body, token);
    setStep("idle");
    if (!result.ok) {
      setError(
        result.status === CustomStatus.FORBIDDEN
          ? "你沒有權限編輯這個 SIG"
          : result.status === CustomStatus.INVALID_CONTENT_LENGTH
            ? `SIG 簡介最多 ${SIG_DESCRIPTION_MAX} 字`
            : result.status === CustomStatus.INVALID_IMAGE_ID
              ? "圖片無法使用，請換一張再試"
              : `儲存失敗：${result.message}`,
      );
      return;
    }
    const saved =
      result.data && typeof result.data === "object" ? result.data : {};
    const next: Sig = { ...sig, ...body, ...(saved as Partial<Sig>) };
    onSaved(next);
    queryClient.invalidateQueries({ queryKey: ["sig", sig._id] });
    queryClient.invalidateQueries({ queryKey: ["sigs"] });
    onClose();
  }

  const avatarSrc = preview ?? imageUrl(sig.avatar) ?? DEFAULT_AVATAR_URL;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="編輯 SIG"
      busy={busy}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="h-10 cursor-pointer rounded-control bg-brand-700 px-5 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === "uploading"
              ? "上傳圖片中…"
              : step === "saving"
                ? "儲存中…"
                : "儲存"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="flex items-center gap-4">
          {/* biome-ignore lint/performance/noImgElement: blob: previews cannot go through next/image */}
          <img
            src={avatarSrc}
            alt=""
            className="size-20 shrink-0 rounded-full border border-line bg-field object-cover"
          />
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <p className="font-semibold text-ink-900 text-sm">SIG 頭像</p>
            <input
              ref={fileInput}
              type="file"
              accept={UPLOAD_IMAGE_TYPES.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-label="選擇 SIG 頭像圖片"
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
                className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ImagePlus size={16} aria-hidden />
                {file ? "換一張" : "更換頭像"}
              </button>
              {file && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setFile(null)}
                  className="h-10 cursor-pointer px-1 font-semibold text-brand-700 text-sm hover:underline disabled:opacity-50"
                >
                  不換了
                </button>
              )}
            </div>
            <p className="text-ink-500 text-xs">
              JPG、PNG、WebP 或 TIFF，5 MB 以內
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <label
            htmlFor={descriptionId}
            className="font-semibold text-ink-900 text-sm"
          >
            SIG 簡介
          </label>
          <textarea
            id={descriptionId}
            value={description}
            rows={6}
            disabled={busy}
            aria-describedby={counterId}
            aria-invalid={tooLong}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-control border border-line-strong bg-surface px-3 py-2 text-[16px] text-ink-800 leading-[1.7] focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/20 disabled:opacity-60 sm:text-[15px]"
            placeholder="介紹這個 SIG 在做什麼"
          />
          <p
            id={counterId}
            aria-live="polite"
            className={`self-end text-xs tabular-nums ${
              tooLong ? "text-danger-700" : "text-ink-500"
            }`}
          >
            {description.length}/{SIG_DESCRIPTION_MAX}
            {tooLong && "，超過上限"}
          </p>
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-control bg-danger-700/8 px-3 py-2 text-danger-700 text-sm"
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
