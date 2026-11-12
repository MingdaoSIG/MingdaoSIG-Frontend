"use client";

import { AtSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { CustomStatus } from "@/modules/customStatusCode";
import { isHexColor } from "@/modules/sigTheme";
import { send } from "../api";
import { ColorField, ImageField } from "../components/fields";
import { Modal } from "../components/Modal";
import { Button, Field, inputClass, textareaClass } from "../components/ui";
import {
  customIdProblem,
  SIG_CUSTOM_ID_MAX,
  sigWriteFailure,
  useRefreshSigs,
} from "../sigAdminApi";

// 新增 SIG (contract v4 §3.7): POST /admin/sigs { name, customId,
// description?, avatar?, color?, defaultCover? }. Opens the new SIG's
// page, where 幹部、老師 and 招生設定 are set.

const NAME_MAX = 30;
const DESCRIPTION_MAX = 250;

export function CreateSigDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const refresh = useRefreshSigs();
  const ids = { name: useId(), customId: useId(), description: useId() };
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [customId, setCustomId] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [idTaken, setIdTaken] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setCustomId("");
      setDescription("");
      setColor("");
      setAvatar("");
      setCover("");
      setSubmitted(false);
      setError("");
      setIdTaken("");
    }
  }, [open]);

  const trimmedName = name.trim();
  const nameLength = Array.from(trimmedName).length;
  const nameProblem =
    nameLength === 0
      ? "請輸入 SIG 名稱"
      : nameLength > NAME_MAX
        ? `最多 ${NAME_MAX} 字`
        : "";
  const trimmedId = customId.trim();
  const idProblem =
    customIdProblem(trimmedId, SIG_CUSTOM_ID_MAX) ||
    (idTaken && idTaken === trimmedId
      ? "這個 ID 已經有人使用（其他使用者或 SIG，或仍會轉址的舊 ID）"
      : "");
  const descriptionTooLong = description.length > DESCRIPTION_MAX;

  const create = async () => {
    setSubmitted(true);
    if (nameProblem || idProblem || descriptionTooLong) {
      return;
    }
    const body: Record<string, string> = {
      name: trimmedName,
      customId: trimmedId,
    };
    if (description.trim()) {
      body.description = description.trim();
    }
    if (isHexColor(color)) {
      body.color = color;
    }
    if (avatar) {
      body.avatar = avatar;
    }
    if (cover) {
      body.defaultCover = cover;
    }
    setSaving(true);
    setError("");
    const result = await send<{ _id?: string; name?: string }>("/admin/sigs", {
      body,
    });
    setSaving(false);
    if (!result.ok) {
      if (result.status === CustomStatus.CUSTOM_ID_ALREADY_EXISTS) {
        setIdTaken(trimmedId);
        return;
      }
      setError(sigWriteFailure(result));
      return;
    }
    toast.success(`已新增 SIG：${trimmedName}`);
    await refresh();
    onClose();
    if (result.data?._id) {
      router.push(`/admin/sigs/${result.data._id}`);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      wide
      title="新增 SIG"
      description="建立後可以在 SIG 頁面設定幹部、指導老師和招生。"
      initialFocus={nameRef}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button variant="primary" onClick={create} loading={saving}>
            建立 SIG
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4 pb-1"
        onSubmit={(event) => {
          event.preventDefault();
          void create();
        }}
      >
        <Field
          label="名稱"
          htmlFor={ids.name}
          hint={
            submitted && nameProblem ? (
              <span className="text-danger-700">{nameProblem}</span>
            ) : (
              `1–${NAME_MAX} 字`
            )
          }
        >
          <input
            ref={nameRef}
            id={ids.name}
            value={name}
            maxLength={NAME_MAX + 10}
            aria-invalid={(submitted && !!nameProblem) || undefined}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：天文觀測"
            className={inputClass}
          />
        </Field>
        <Field
          label="SIG ID（網址）"
          htmlFor={ids.customId}
          hint={
            submitted && idProblem ? (
              <span className="text-danger-700">{idProblem}</span>
            ) : (
              <>
                SIG 頁面會是 /@{trimmedId || "…"}
                ；小寫英文、數字和底線，可用點分段，最多 {SIG_CUSTOM_ID_MAX}{" "}
                個字元，不能和任何使用者或 SIG 重複
              </>
            )
          }
        >
          <div className="relative">
            <AtSign
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-400"
            />
            <input
              id={ids.customId}
              value={customId}
              maxLength={SIG_CUSTOM_ID_MAX + 10}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="none"
              aria-invalid={(submitted && !!idProblem) || undefined}
              onChange={(event) =>
                setCustomId(event.target.value.toLowerCase())
              }
              placeholder="astronomy"
              className={`${inputClass} pl-8 font-mono`}
            />
          </div>
        </Field>
        <Field
          label="簡介（選填）"
          htmlFor={ids.description}
          hint={
            <span className="flex justify-end">
              <span className={descriptionTooLong ? "text-danger-700" : ""}>
                {description.length} / {DESCRIPTION_MAX}
              </span>
            </span>
          }
        >
          <textarea
            id={ids.description}
            value={description}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            className={textareaClass}
          />
        </Field>
        <ColorField
          label="代表色（選填）"
          value={color}
          onChange={setColor}
          previewText={trimmedName || "SIG 名稱"}
          hint="沒有設定時使用網站的主色"
        />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
          <ImageField
            label="頭像（選填）"
            value={avatar}
            onChange={setAvatar}
            shape="square"
            hint="5 MB 以內"
          />
          <ImageField
            label="預設封面（選填）"
            value={cover}
            onChange={setCover}
            hint="沒有封面的貼文會用這張圖"
          />
        </div>
        {error && (
          <p role="alert" className="text-danger-700 text-sm">
            {error}
          </p>
        )}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
