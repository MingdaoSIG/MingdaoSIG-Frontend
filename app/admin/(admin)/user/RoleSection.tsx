"use client";

import { useEffect, useId, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import type { ApiFailure } from "@/modules/api/client";
import { backendMessage, failureMessage, isChinese, isForbidden } from "../api";
import { useConfirm } from "../components/Modal";
import { Badge, type BadgeTone, Button, selectClass } from "../components/ui";
import { ROLE_LABEL, roleOf, setUserRole } from "../moderationApi";
import type { AdminUserDetail, UserRole } from "../types";

// 角色 in the user drawer (contract v4 §5.2), admins only: 一般使用者,
// 內容管理員 or 管理員, replacing the old admin switch. The backend keeps
// refusing to demote yourself and to remove the last admin.

const ROLES: UserRole[] = ["user", "moderator", "admin"];

const ROLE_HINT: Record<UserRole, string> = {
  user: "沒有管理平台的權限。",
  moderator:
    "可以處理貼文、留言與檢舉，查看使用者並禁言；不能停權、變更角色或徽章。",
  admin: "可以使用管理平台的所有功能，包括停權與變更其他人的角色。",
};

export const ROLE_TONE: Record<UserRole, BadgeTone> = {
  user: "mute",
  moderator: "ok",
  admin: "info",
};

const PERMISSION: Record<UserRole, number> = {
  user: 1,
  moderator: 3,
  admin: 2,
};

/** 403/4001: yourself, or the last admin. */
function roleRefusal(failure: ApiFailure, self: boolean) {
  if (!isForbidden(failure)) {
    return failureMessage(failure);
  }
  const message = backendMessage(failure);
  if (message && isChinese(message)) {
    return message;
  }
  if (/at least one admin|last admin/i.test(message)) {
    return "至少要保留一位管理員，所以不能變更這位的角色";
  }
  if (self || /self|yourself|own/i.test(message)) {
    return "不能移除自己的管理員權限，請另一位管理員操作";
  }
  return message
    ? `伺服器拒絕了這個變更（${message}）`
    : "你沒有權限變更這位使用者的角色";
}

export function RoleBadge({ user }: { user: AdminUserDetail }) {
  const role = roleOf(user);
  return <Badge tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Badge>;
}

export function RoleSection({
  user,
  isSelf,
  onSaved,
}: {
  user: AdminUserDetail;
  isSelf: boolean;
  onSaved: (change: { role: UserRole; permission: number }) => void;
}) {
  const saved = roleOf(user);
  const [role, setRole] = useState<UserRole>(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirm = useConfirm();
  const selectId = useId();
  const lockedSelf = isSelf && saved === "admin";

  useEffect(() => {
    setRole(saved);
    setError("");
  }, [user._id, saved]);

  const save = async () => {
    const name = user.name || "這位使用者";
    const ok = await confirm({
      title: `把 ${name} 設為${ROLE_LABEL[role]}？`,
      description: `${ROLE_HINT[role]}${
        saved === "admin" ? "對方會失去管理員權限。" : ""
      }`,
      confirmLabel: `設為${ROLE_LABEL[role]}`,
      tone: saved === "admin" ? "danger" : "primary",
    });
    if (!ok) {
      return;
    }
    setBusy(true);
    setError("");
    const result = await setUserRole(user._id, role);
    setBusy(false);
    if (!result.ok) {
      const message = roleRefusal(result, isSelf);
      setError(message);
      toast.error(message);
      return;
    }
    const permission =
      typeof result.data?.permission === "number"
        ? result.data.permission
        : PERMISSION[role];
    onSaved({ role, permission });
    toast.success(`已設為${ROLE_LABEL[role]}`);
  };

  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        角色
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id={selectId}
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          disabled={busy || lockedSelf}
          className={`${selectClass} w-auto min-w-40 flex-1 sm:flex-none`}
        >
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {ROLE_LABEL[item]}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant={role === "user" && saved !== "user" ? "danger" : "primary"}
          onClick={save}
          loading={busy}
          disabled={role === saved || lockedSelf}
        >
          變更角色
        </Button>
      </div>
      <p className="mt-1.5 text-ink-500 text-xs">
        {lockedSelf
          ? "不能變更自己的角色，請另一位管理員操作。"
          : ROLE_HINT[role]}
      </p>
      {error && (
        <p role="alert" className="mt-1.5 text-danger-700 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
