"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import {
  BADGE_DESCRIPTION_MAX,
  BADGE_KEY_PATTERN,
  BADGE_NAME_MAX,
} from "@/modules/badges";
import { isHexColor } from "@/modules/sigTheme";
import { failureMessage, send } from "../api";
import { ColorField, ImageField } from "../components/fields";
import { Modal, useConfirm } from "../components/Modal";
import {
  Badge,
  Button,
  Field,
  inputClass,
  textareaClass,
} from "../components/ui";
import { formatCount } from "../format";
import { type AdminBadge, useRefreshBadges } from "../sigAdminApi";
import { BadgeIcon } from "../user/UserBadgeEditor";

// Create or edit one badge (contract v4 §5.9). POST /admin/badges creates
// a badge with a new key and updates the fields given for an existing
// one, so a new key is checked against the list first. 停用 is
// DELETE /admin/badges/:key; users keep a retired badge, but it is hidden.

function length(value: string) {
  return Array.from(value).length;
}

export function BadgeDialog({
  badge,
  existingKeys,
  open,
  onClose,
}: {
  /** null: a new badge. */
  badge: AdminBadge | null;
  existingKeys: string[];
  open: boolean;
  onClose: () => void;
}) {
  const ids = { key: useId(), name: useId(), description: useId() };
  const firstRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();
  const refresh = useRefreshBadges();
  const creating = badge === null;
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [icon, setIcon] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState<"save" | "retire" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setKey(badge?.key ?? "");
      setName(badge?.name ?? "");
      setDescription(badge?.description ?? "");
      setColor(badge?.color ?? "");
      setIcon(badge?.icon ?? "");
      setSubmitted(false);
      setBusy(null);
      setError("");
    }
  }, [open, badge]);

  const trimmedKey = key.trim();
  const keyProblem = !creating
    ? ""
    : trimmedKey === ""
      ? "請輸入代碼"
      : !BADGE_KEY_PATTERN.test(trimmedKey)
        ? "只能用小寫英文、數字、底線、點和連字號，最多 30 個字元"
        : existingKeys.includes(trimmedKey)
          ? "這個代碼已經有徽章使用"
          : "";
  const trimmedName = name.trim();
  const nameProblem =
    length(trimmedName) < 1 || length(trimmedName) > BADGE_NAME_MAX
      ? `名稱要 1–${BADGE_NAME_MAX} 字`
      : "";
  const descriptionProblem =
    length(description.trim()) > BADGE_DESCRIPTION_MAX
      ? `最多 ${BADGE_DESCRIPTION_MAX} 字`
      : "";
  const colorProblem = color !== "" && !isHexColor(color);

  const body: Record<string, string> = { key: trimmedKey };
  if (creating || trimmedName !== badge?.name) {
    body.name = trimmedName;
  }
  if (
    creating
      ? description.trim()
      : description.trim() !== (badge?.description ?? "")
  ) {
    body.description = description.trim();
  }
  if (
    creating
      ? isHexColor(color)
      : color !== (badge?.color ?? "") && !colorProblem
  ) {
    body.color = color;
  }
  if (creating ? icon : icon !== (badge?.icon ?? "")) {
    body.icon = icon;
  }
  const dirty = Object.keys(body).length > 1;

  const save = async () => {
    setSubmitted(true);
    if (
      !dirty ||
      keyProblem ||
      nameProblem ||
      descriptionProblem ||
      colorProblem
    ) {
      return;
    }
    setBusy("save");
    setError("");
    const result = await send("/admin/badges", { body });
    setBusy(null);
    if (!result.ok) {
      setError(failureMessage(result, "只有管理員可以管理徽章"));
      return;
    }
    toast.success(creating ? `已新增徽章：${trimmedName}` : "已儲存徽章");
    await refresh();
    onClose();
  };

  const setRetired = async (retire: boolean) => {
    if (!badge) {
      return;
    }
    const users = badge.userCount ?? 0;
    const ok = await confirm(
      retire
        ? {
            title: `停用「${badge.name}」？`,
            description:
              users > 0
                ? `${formatCount(users)} 位使用者有這個徽章。停用後徽章會從個人頁面隱藏，但不會從他們身上移除，之後恢復就會再出現。`
                : "停用後就不能再頒發這個徽章，之後可以恢復。",
            confirmLabel: "停用",
            tone: "danger",
          }
        : {
            title: `恢復「${badge.name}」？`,
            description: "恢復後，有這個徽章的使用者會再顯示它，也能再頒發。",
            confirmLabel: "恢復",
          },
    );
    if (!ok) {
      return;
    }
    setBusy("retire");
    const result = retire
      ? await send(`/admin/badges/${encodeURIComponent(badge.key)}`, {
          method: "DELETE",
        })
      : await send("/admin/badges", {
          body: { key: badge.key, removed: false },
        });
    setBusy(null);
    if (!result.ok) {
      toast.error(failureMessage(result, "只有管理員可以管理徽章"));
      return;
    }
    toast.success(retire ? "已停用徽章" : "已恢復徽章");
    await refresh();
    onClose();
  };

  const preview = {
    key: trimmedKey || "new",
    name: trimmedName || "徽章",
    icon,
    iconPath: badge?.iconPath,
    color,
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      wide
      title={creating ? "新增徽章" : `編輯徽章：${badge?.name}`}
      initialFocus={firstRef}
      footer={
        <>
          {badge && (
            <span className="mr-auto">
              {badge.removed ? (
                <Button
                  onClick={() => setRetired(false)}
                  loading={busy === "retire"}
                  disabled={busy === "save"}
                >
                  <ArchiveRestore aria-hidden className="size-4" />
                  恢復使用
                </Button>
              ) : (
                <Button
                  variant="danger-outline"
                  onClick={() => setRetired(true)}
                  loading={busy === "retire"}
                  disabled={busy === "save"}
                >
                  <Archive aria-hidden className="size-4" />
                  停用
                </Button>
              )}
            </span>
          )}
          <Button onClick={onClose} disabled={Boolean(busy)}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={save}
            loading={busy === "save"}
            disabled={!dirty || busy === "retire"}
          >
            {creating ? "建立徽章" : "儲存"}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-4 pb-1"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {badge?.removed && (
          <p className="rounded-control bg-field px-3 py-2 text-ink-700 text-sm">
            <Badge tone="mute">已停用</Badge>{" "}
            這個徽章不會顯示在個人頁面，也不能再頒發。
          </p>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
          <Field
            label="代碼"
            htmlFor={ids.key}
            hint={
              creating ? (
                submitted && keyProblem ? (
                  <span className="text-danger-700">{keyProblem}</span>
                ) : (
                  "建立後不能修改，例如 contest_2026"
                )
              ) : (
                "代碼不能修改"
              )
            }
          >
            <input
              ref={creating ? firstRef : undefined}
              id={ids.key}
              value={key}
              readOnly={!creating}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="none"
              maxLength={40}
              aria-invalid={(submitted && !!keyProblem) || undefined}
              onChange={(event) => setKey(event.target.value.toLowerCase())}
              className={`${inputClass} font-mono ${creating ? "" : "cursor-default bg-surface text-ink-500"}`}
            />
          </Field>
          <Field
            label="名稱"
            htmlFor={ids.name}
            hint={
              submitted && nameProblem ? (
                <span className="text-danger-700">{nameProblem}</span>
              ) : (
                `1–${BADGE_NAME_MAX} 字，滑過徽章時顯示`
              )
            }
          >
            <input
              ref={creating ? undefined : firstRef}
              id={ids.name}
              value={name}
              maxLength={BADGE_NAME_MAX + 10}
              aria-invalid={(submitted && !!nameProblem) || undefined}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：專題競賽得獎"
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          label="說明（選填）"
          htmlFor={ids.description}
          hint={
            <span className="flex justify-between gap-2">
              <span className="text-danger-700">
                {submitted ? descriptionProblem : ""}
              </span>
              <span
                className={`tabular-nums ${descriptionProblem ? "text-danger-700" : ""}`}
              >
                {length(description.trim())} / {BADGE_DESCRIPTION_MAX}
              </span>
            </span>
          }
        >
          <textarea
            id={ids.description}
            value={description}
            rows={2}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="怎麼得到這個徽章"
            className={textareaClass}
          />
        </Field>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
          <ImageField
            label="圖示"
            value={icon || (badge?.iconPath ?? "")}
            saved={badge ? badge.icon || (badge.iconPath ?? "") : undefined}
            onChange={setIcon}
            shape="icon"
            hint="正方形，建議透明背景的 PNG 或 WebP"
            emptyText="無"
          />
          <ColorField
            label="顏色（選填）"
            value={color}
            onChange={setColor}
            hint="沒有圖示時，徽章用這個顏色加名稱的第一個字"
          />
        </div>
        <div className="flex items-center gap-3 rounded-control bg-field px-3 py-2">
          <span className="text-ink-500 text-xs">個人頁面上的樣子</span>
          <BadgeIcon badge={preview} size={24} />
          <span className="text-ink-700 text-sm">
            {preview.name}
            {description.trim() && `：${description.trim()}`}
          </span>
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
