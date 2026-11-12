"use client";

import { AtSign, Info, Pencil, TriangleAlert } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { CustomStatus } from "@/modules/customStatusCode";
import { failureMessage, send } from "../api";
import {
  Button,
  Field,
  InfoRow,
  inputClass,
  textareaClass,
} from "../components/ui";
import {
  customIdFailure,
  customIdProblem,
  USER_CUSTOM_ID_MAX,
} from "../sigAdminApi";
import type { AdminUserDetail } from "../types";

// 編輯資料 in the user drawer (contract v4 §5.8): an admin changes the
// account id (the profile address; the old one keeps redirecting), the
// display name and the 關於我 text with POST /admin/users/:id. Name,
// class and student number come from the school system on every login.

const DISPLAY_NAME_MAX = 30;
const DESCRIPTION_MAX = 250;

export type UserEdit = {
  customId?: string;
  displayName?: string;
  description?: string;
  previousCustomIds?: string[];
};

function length(value: string) {
  return Array.from(value).length;
}

export function UserEditSection({
  user,
  onSaved,
}: {
  user: AdminUserDetail;
  /** The saved values, for the list and the drawer. */
  onSaved: (saved: UserEdit) => void;
}) {
  const ids = { customId: useId(), displayName: useId(), description: useId() };
  const [editing, setEditing] = useState(false);
  const [customId, setCustomId] = useState(user.customId ?? "");
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [description, setDescription] = useState(user.description ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCustomId(user.customId ?? "");
    setDisplayName(user.displayName ?? "");
    setDescription(user.description ?? "");
    setSubmitted(false);
    setError("");
  };

  useEffect(() => {
    reset();
    setEditing(false);
  }, [user._id]);

  useEffect(reset, [user.customId, user.displayName, user.description]);

  const trimmedId = customId.trim();
  const idChanged = trimmedId !== (user.customId ?? "");
  const idProblem = idChanged
    ? customIdProblem(trimmedId, USER_CUSTOM_ID_MAX)
    : "";
  const trimmedName = displayName.trim();
  const nameChanged = trimmedName !== (user.displayName ?? "");
  const nameProblem =
    nameChanged &&
    (length(trimmedName) < 1 || length(trimmedName) > DISPLAY_NAME_MAX)
      ? `顯示名稱要 1–${DISPLAY_NAME_MAX} 字`
      : "";
  const descriptionChanged = description !== (user.description ?? "");
  const descriptionProblem =
    length(description) > DESCRIPTION_MAX ? `最多 ${DESCRIPTION_MAX} 字` : "";
  const dirty = idChanged || nameChanged || descriptionChanged;
  const previous = (user.previousCustomIds ?? []).filter(
    (id) => id && id !== user.customId,
  );

  const save = async () => {
    setSubmitted(true);
    if (!dirty || idProblem || nameProblem || descriptionProblem) {
      return;
    }
    const body: Record<string, string> = {};
    if (idChanged) {
      body.customId = trimmedId;
    }
    if (nameChanged) {
      body.displayName = trimmedName;
    }
    if (descriptionChanged) {
      body.description = description;
    }
    setSaving(true);
    setError("");
    const result = await send<UserEdit>(`/admin/users/${user._id}`, { body });
    setSaving(false);
    if (!result.ok) {
      const message =
        customIdFailure(result, USER_CUSTOM_ID_MAX) ||
        (result.status === CustomStatus.INVALID_CONTENT_LENGTH ||
        result.status === CustomStatus.INVALID_BODY
          ? `顯示名稱 1–${DISPLAY_NAME_MAX} 字，關於我最多 ${DESCRIPTION_MAX} 字`
          : failureMessage(result, "只有管理員可以編輯使用者資料"));
      setError(message);
      return;
    }
    const saved: UserEdit = {
      customId:
        result.data?.customId ?? (idChanged ? trimmedId : user.customId),
      displayName:
        result.data?.displayName ??
        (nameChanged ? trimmedName : user.displayName),
      description:
        result.data?.description ??
        (descriptionChanged ? description : user.description),
      previousCustomIds: result.data?.previousCustomIds,
    };
    onSaved(saved);
    toast.success(
      idChanged
        ? `已更新，個人頁面改為 /@${saved.customId}`
        : "已更新使用者資料",
    );
    setEditing(false);
  };

  if (!editing) {
    return (
      <>
        <dl>
          <InfoRow label="帳號 ID">
            {user.customId ? `@${user.customId}` : "—"}
          </InfoRow>
          <InfoRow label="顯示名稱">{user.displayName || "—"}</InfoRow>
          <InfoRow label="關於我">
            <span className="line-clamp-3 whitespace-pre-wrap">
              {user.description || "—"}
            </span>
          </InfoRow>
        </dl>
        {previous.length > 0 && (
          <p className="mt-1 text-ink-500 text-xs">
            會轉到這裡的舊網址：{previous.map((id) => `/@${id}`).join("、")}
          </p>
        )}
        <Button size="sm" className="mt-2" onClick={() => setEditing(true)}>
          <Pencil aria-hidden className="size-3.5" />
          編輯資料
        </Button>
      </>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <p className="flex gap-2 rounded-control bg-field px-3 py-2 text-ink-700 text-xs leading-relaxed">
        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-500" />
        姓名、班級和學號每次登入時都會由學校系統更新，不能在這裡修改。
      </p>
      <Field
        label="帳號 ID（個人頁面網址）"
        htmlFor={ids.customId}
        hint={
          submitted && idProblem ? (
            <span className="text-danger-700">{idProblem}</span>
          ) : (
            `小寫英文、數字和底線，可用點分段，最多 ${USER_CUSTOM_ID_MAX} 個字元`
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
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            maxLength={USER_CUSTOM_ID_MAX + 10}
            aria-invalid={(submitted && !!idProblem) || undefined}
            onChange={(event) => setCustomId(event.target.value.toLowerCase())}
            className={`${inputClass} pl-8 font-mono`}
          />
        </div>
      </Field>
      {idChanged && !idProblem && (
        <p className="-mt-1 flex gap-2 rounded-control bg-warm-50 px-3 py-2 text-warm-600 text-xs">
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span>
            個人頁面會變成 /@{trimmedId}，舊網址 /@{user.customId}{" "}
            會自動轉到新網址。
          </span>
        </p>
      )}
      <Field
        label="顯示名稱"
        htmlFor={ids.displayName}
        hint={
          submitted && nameProblem ? (
            <span className="text-danger-700">{nameProblem}</span>
          ) : (
            `1–${DISPLAY_NAME_MAX} 字`
          )
        }
      >
        <input
          id={ids.displayName}
          value={displayName}
          maxLength={DISPLAY_NAME_MAX + 10}
          aria-invalid={(submitted && !!nameProblem) || undefined}
          onChange={(event) => setDisplayName(event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field
        label="關於我"
        htmlFor={ids.description}
        hint={
          <span className="flex justify-between gap-2">
            <span className="text-danger-700">
              {submitted ? descriptionProblem : ""}
            </span>
            <span
              className={`tabular-nums ${descriptionProblem ? "text-danger-700" : ""}`}
            >
              {length(description)} / {DESCRIPTION_MAX}
            </span>
          </span>
        }
      >
        <textarea
          id={ids.description}
          value={description}
          rows={4}
          aria-invalid={(submitted && !!descriptionProblem) || undefined}
          onChange={(event) => setDescription(event.target.value)}
          className={textareaClass}
        />
      </Field>
      {error && (
        <p role="alert" className="text-danger-700 text-xs">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          variant="primary"
          loading={saving}
          disabled={!dirty}
        >
          儲存
        </Button>
        <Button
          size="sm"
          disabled={saving}
          onClick={() => {
            reset();
            setEditing(false);
          }}
        >
          取消
        </Button>
      </div>
    </form>
  );
}
