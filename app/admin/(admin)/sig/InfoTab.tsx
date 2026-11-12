"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { SIG_LIST_QUERY_KEY } from "@/utils/useAdminAccess";
import { adminKeys, failureMessage, send, useInvalidate } from "../api";
import {
  Avatar,
  Button,
  Card,
  Field,
  inputClass,
  textareaClass,
} from "../components/ui";
import { useAdmin } from "../context";
import type { AdminSig } from "../types";

// 基本資料: the SIG's description and avatar (its leaders, 指導老師 and
// admins), and its name (admins only). POST /image first for a new
// avatar, then one POST /sig/:id with the fields that changed.

const DESCRIPTION_MAX = 250;
const NAME_MAX = 30;
const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png", "image/tiff"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function InfoTab({ sig }: { sig: AdminSig }) {
  const admin = useAdmin();
  const invalidate = useInvalidate();
  const nameId = useId();
  const descriptionId = useId();
  const fileId = useId();
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(sig.name);
  const [description, setDescription] = useState(sig.description ?? "");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // The saved values changed (another tab, a refetch): start over from them.
  useEffect(() => {
    setName(sig.name);
    setDescription(sig.description ?? "");
    setAvatar(null);
    setError("");
  }, [sig._id, sig.name, sig.description, sig.avatar]);

  const trimmedName = name.trim();
  const changes: Record<string, string> = {};
  if (admin.isAdmin && trimmedName !== sig.name) {
    changes.name = trimmedName;
  }
  if (description !== (sig.description ?? "")) {
    changes.description = description;
  }
  if (avatar) {
    changes.avatar = avatar;
  }
  const dirty = Object.keys(changes).length > 0;
  // The backend counts code points, not UTF-16 units.
  const nameLength = Array.from(trimmedName).length;
  const nameInvalid =
    admin.isAdmin && (nameLength < 1 || nameLength > NAME_MAX);

  const pickImage = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setError("");
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("只能上傳 JPG、PNG、WebP 或 TIFF 圖片");
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setError("圖片需小於 5 MB");
      return;
    }
    setUploading(true);
    const result = await apiRequest("/image", {
      method: "POST",
      body: file,
      auth: true,
    });
    setUploading(false);
    if (fileInput.current) {
      fileInput.current.value = "";
    }
    const id = result.ok ? result.body.id : null;
    if (!result.ok || typeof id !== "string" || !id) {
      setError(
        result.ok ? "上傳失敗，請稍後再試" : `上傳失敗：${result.message}`,
      );
      return;
    }
    setAvatar(id);
  };

  const save = async () => {
    if (!dirty || nameInvalid) {
      return;
    }
    setSaving(true);
    setError("");
    const result = await send(`/sig/${sig._id}`, { body: changes });
    setSaving(false);
    if (!result.ok) {
      const message =
        result.status === CustomStatus.INVALID_CONTENT_LENGTH
          ? `簡介最多 ${DESCRIPTION_MAX} 字，名稱最多 ${NAME_MAX} 字`
          : result.status === CustomStatus.INVALID_IMAGE_ID
            ? "頭像圖片無效，請重新上傳"
            : failureMessage(result, "你沒有權限編輯這個 SIG");
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("已儲存 SIG 資料");
    setAvatar(null);
    await invalidate(adminKeys.sigs, SIG_LIST_QUERY_KEY, ["sig", sig._id]);
  };

  const reset = () => {
    setName(sig.name);
    setDescription(sig.description ?? "");
    setAvatar(null);
    setError("");
  };

  return (
    <Card>
      <form
        className="flex max-w-2xl flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-ink-700 text-xs">頭像</span>
          <div className="flex items-center gap-4">
            <Avatar
              src={avatar ?? sig.avatar}
              name={sig.name}
              size={72}
              square
            />
            <div className="flex flex-col items-start gap-1.5">
              <input
                ref={fileInput}
                id={fileId}
                type="file"
                accept={IMAGE_TYPES.join(",")}
                className="sr-only"
                onChange={(event) => pickImage(event.target.files?.[0])}
              />
              <Button
                onClick={() => fileInput.current?.click()}
                loading={uploading}
                aria-describedby={`${fileId}-hint`}
              >
                <ImagePlus aria-hidden className="size-4" />
                {avatar ? "換一張" : "上傳新頭像"}
              </Button>
              <p id={`${fileId}-hint`} className="text-ink-500 text-xs">
                JPG、PNG、WebP 或 TIFF，5 MB 以內
                {avatar && "（尚未儲存）"}
              </p>
            </div>
          </div>
        </div>

        <Field
          label="名稱"
          htmlFor={nameId}
          hint={
            admin.isAdmin ? `1–${NAME_MAX} 字` : "SIG 名稱只有管理員可以修改"
          }
        >
          <input
            id={nameId}
            value={admin.isAdmin ? name : sig.name}
            onChange={(event) => setName(event.target.value)}
            maxLength={NAME_MAX}
            readOnly={!admin.isAdmin}
            aria-invalid={nameInvalid || undefined}
            className={`${inputClass} ${admin.isAdmin ? "" : "cursor-default bg-surface text-ink-500"}`}
          />
        </Field>

        <Field
          label="簡介"
          htmlFor={descriptionId}
          hint={
            <span className="flex justify-between">
              <span>顯示在 SIG 頁面上</span>
              <span
                className={
                  description.length >= DESCRIPTION_MAX
                    ? "text-warm-600"
                    : undefined
                }
              >
                {description.length} / {DESCRIPTION_MAX}
              </span>
            </span>
          }
        >
          <textarea
            id={descriptionId}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value.slice(0, DESCRIPTION_MAX))
            }
            maxLength={DESCRIPTION_MAX}
            rows={5}
            className={textareaClass}
          />
        </Field>

        {error && (
          <p role="alert" className="text-danger-700 text-sm">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={!dirty || nameInvalid || uploading}
          >
            儲存變更
          </Button>
          <Button onClick={reset} disabled={!dirty || saving}>
            取消
          </Button>
        </div>
      </form>
    </Card>
  );
}
