"use client";

import { AtSign, TriangleAlert } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { isHexColor } from "@/modules/sigTheme";
import { send } from "../api";
import { ColorField, ImageField } from "../components/fields";
import { useConfirm } from "../components/Modal";
import { Button, Card, Field, inputClass } from "../components/ui";
import {
  customIdProblem,
  SIG_CUSTOM_ID_MAX,
  sigWriteFailure,
  useRefreshSigs,
} from "../sigAdminApi";
import type { AdminSig } from "../types";

// 基本資料, admin only (contract v4 §3.7): the SIG's customId (its
// address; old addresses keep redirecting), its accent colour and the
// default cover of posts without one. One POST /sig/:id with the fields
// that changed. The name stays in InfoTab.

export function SigAdminSettings({ sig }: { sig: AdminSig }) {
  const confirm = useConfirm();
  const refresh = useRefreshSigs();
  const customIdId = useId();
  const savedColor = sig.color ?? "";
  const savedCover = sig.defaultCover ?? "";
  const [customId, setCustomId] = useState(sig.customId ?? "");
  const [color, setColor] = useState(savedColor);
  const [cover, setCover] = useState(savedCover);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setCustomId(sig.customId ?? "");
    setColor(sig.color ?? "");
    setCover(sig.defaultCover ?? "");
    setTouched(false);
    setError("");
  }, [sig._id, sig.customId, sig.color, sig.defaultCover]);

  const trimmedId = customId.trim();
  const idChanged = trimmedId !== (sig.customId ?? "");
  const idProblem = idChanged
    ? customIdProblem(trimmedId, SIG_CUSTOM_ID_MAX)
    : "";
  const changes: Record<string, string> = {};
  if (idChanged) {
    changes.customId = trimmedId;
  }
  if (color !== savedColor && isHexColor(color)) {
    changes.color = color;
  }
  if (cover !== savedCover && cover) {
    changes.defaultCover = cover;
  }
  const dirty = Object.keys(changes).length > 0;
  const previous = (sig.previousCustomIds ?? []).filter(
    (id) => id && id !== sig.customId,
  );

  const save = async () => {
    setTouched(true);
    if (!dirty || idProblem) {
      return;
    }
    if (idChanged) {
      const ok = await confirm({
        title: "變更 SIG 的網址？",
        description: (
          <>
            SIG 頁面會從 <b>/@{sig.customId}</b> 改成 <b>/@{trimmedId}</b>
            。舊網址會自動轉到新網址，但印出來的 QR code 或文件請記得更新。
          </>
        ),
        confirmLabel: "變更網址",
      });
      if (!ok) {
        return;
      }
    }
    setSaving(true);
    setError("");
    const result = await send(`/sig/${sig._id}`, { body: changes });
    setSaving(false);
    if (!result.ok) {
      const message = sigWriteFailure(result);
      setError(message);
      toast.error(message);
      return;
    }
    toast.success(idChanged ? `網址已改為 /@${trimmedId}` : "已儲存");
    await refresh(sig._id);
  };

  const reset = () => {
    setCustomId(sig.customId ?? "");
    setColor(savedColor);
    setCover(savedCover);
    setTouched(false);
    setError("");
  };

  return (
    <Card
      title="網址與外觀"
      actions={<span className="text-ink-500 text-xs">只有管理員可以修改</span>}
    >
      <form
        noValidate
        className="flex max-w-2xl flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Field
          label="SIG ID（網址）"
          htmlFor={customIdId}
          hint={
            idChanged && touched && idProblem ? (
              <span className="text-danger-700">{idProblem}</span>
            ) : (
              `小寫英文、數字和底線，可用點分段，最多 ${SIG_CUSTOM_ID_MAX} 個字元`
            )
          }
        >
          <div className="relative">
            <AtSign
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-400"
            />
            <input
              id={customIdId}
              value={customId}
              maxLength={SIG_CUSTOM_ID_MAX + 10}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="none"
              aria-invalid={(idChanged && touched && !!idProblem) || undefined}
              onChange={(event) =>
                setCustomId(event.target.value.toLowerCase())
              }
              onBlur={() => setTouched(true)}
              className={`${inputClass} pl-8 font-mono`}
            />
          </div>
        </Field>
        {idChanged && !idProblem && (
          <p className="-mt-3 flex gap-2 rounded-control bg-warm-50 px-3 py-2 text-sm text-warm-600">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            <span>
              SIG 的網址會變成 /@{trimmedId}。舊連結 /@{sig.customId}{" "}
              會自動轉到新網址。
            </span>
          </p>
        )}
        {previous.length > 0 && (
          <p className="-mt-3 text-ink-500 text-xs">
            會轉到這裡的舊網址：
            {previous.map((id) => `/@${id}`).join("、")}
          </p>
        )}

        <ColorField
          label="代表色"
          value={color}
          onChange={setColor}
          previewText={sig.name}
          hint="貼文列表、SIG 方塊和統計圖表都會用這個顏色"
        />

        <ImageField
          label="預設封面"
          value={cover}
          saved={savedCover}
          onChange={setCover}
          hint="沒有封面的貼文會用這張圖（建議 16:9）；JPG、PNG、WebP 或 TIFF，5 MB 以內"
        />

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
            disabled={!dirty}
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
