"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import type { ApiFailure } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { isSubmitEnter } from "@/utils/keyboard";
import { SIG_LIST_QUERY_KEY } from "@/utils/useAdminAccess";
import {
  adminKeys,
  failureMessage,
  send,
  useInvalidate,
  useUsers,
} from "../api";
import { Modal, useConfirm } from "../components/Modal";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  inputClass,
  Spinner,
} from "../components/ui";
import { useAdmin } from "../context";
import { IDENTITY_LABEL } from "../format";
import type { AdminSig, AdminUser, UserRef } from "../types";
import { useStaffDetails } from "./useSigDetail";

// 幹部與老師. Adding and removing them is admin only on the backend, so
// leaders and 指導老師 see the lists without the buttons. Admins pick a
// person by searching /admin/users, or type a student number (leaders) or
// an email (指導老師) as before.

type Role = "leader" | "moderator";

const ROLE: Record<
  Role,
  { title: string; add: string; noun: string; key: string; idField: string }
> = {
  leader: {
    title: "幹部",
    add: "新增幹部",
    noun: "幹部",
    key: "學號",
    idField: "leaderId",
  },
  moderator: {
    title: "指導老師",
    add: "新增老師",
    noun: "指導老師",
    key: "Email",
    idField: "moderatorId",
  },
};

function addFailure(role: Role, failure: ApiFailure) {
  if (failure.status === CustomStatus.ALREADY_LEADER) {
    return "這位使用者已經是幹部";
  }
  if (failure.status === CustomStatus.ALREADY_MODERATOR) {
    return "這位使用者已經是指導老師";
  }
  if (failure.status === CustomStatus.INVALID_USER_ID) {
    return role === "leader"
      ? "找不到這個學號的帳號（對方可能還沒登入過 MDSIG）"
      : "找不到這個 Email 的帳號（對方可能還沒登入過 MDSIG）";
  }
  return failureMessage(failure, "只有管理員可以新增幹部與指導老師");
}

export function StaffTab({ sig }: { sig: AdminSig }) {
  const admin = useAdmin();
  const [adding, setAdding] = useState<Role | null>(null);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
      <StaffCard
        sig={sig}
        kind="leader"
        people={sig.leaders}
        onAdd={() => setAdding("leader")}
      />
      <StaffCard
        sig={sig}
        kind="moderator"
        people={sig.moderators}
        onAdd={() => setAdding("moderator")}
      />
      {!admin.isAdmin && (
        <p className="text-ink-500 text-sm xl:col-span-2">
          新增或移除幹部與指導老師需要由管理員操作。
        </p>
      )}
      {admin.isAdmin && (
        <AddStaffDialog
          sig={sig}
          kind={adding}
          onClose={() => setAdding(null)}
        />
      )}
    </div>
  );
}

function StaffCard({
  sig,
  kind: role,
  people,
  onAdd,
}: {
  sig: AdminSig;
  kind: Role;
  people: UserRef[];
  onAdd: () => void;
}) {
  const admin = useAdmin();
  const details = useStaffDetails(people, admin.isAdmin);
  const confirm = useConfirm();
  const invalidate = useInvalidate();
  const [busy, setBusy] = useState<string | null>(null);
  const info = ROLE[role];

  const remove = async (person: UserRef) => {
    const ok = await confirm({
      title: `移除${info.noun}「${person.name || "這位使用者"}」？`,
      description: `對方不會再是 ${sig.name} 的${info.noun}，也不會再收到入社申請通知。`,
      confirmLabel: "移除",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    setBusy(person._id);
    const result = await send(`/sig/${sig._id}/${role}`, {
      method: "DELETE",
      body: { [info.idField]: person._id },
    });
    setBusy(null);
    if (!result.ok) {
      toast.error(
        result.status === CustomStatus.NOT_LEADER ||
          result.status === CustomStatus.NOT_MODERATOR
          ? `對方已經不是${info.noun}了`
          : failureMessage(result, "只有管理員可以移除幹部與指導老師"),
      );
      await invalidate(adminKeys.sigs);
      return;
    }
    toast.success(`已移除${info.noun}`);
    await invalidate(adminKeys.sigs, adminKeys.overview, SIG_LIST_QUERY_KEY);
  };

  return (
    <Card
      padded={false}
      title={`${info.title}（${people.length}）`}
      actions={
        admin.isAdmin && (
          <Button size="sm" variant="primary" onClick={onAdd}>
            <Plus aria-hidden className="size-3.5" />
            {info.add}
          </Button>
        )
      }
    >
      {people.length === 0 ? (
        <div className="border-line border-t">
          <EmptyState title={`尚未設定${info.noun}`}>
            {role === "leader"
              ? "沒有幹部時，入社申請會寄給指導老師或管理員。"
              : "建議每個 SIG 至少有一位指導老師。"}
          </EmptyState>
        </div>
      ) : (
        <ul>
          {people.map((person) => {
            const full = details.get(person._id);
            const meta = [
              person.customId && `@${person.customId}`,
              full?.code,
              full?.email,
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={person._id}
                className="flex items-center gap-3 border-line border-t px-4 py-2.5 lg:px-5"
              >
                <Avatar src={person.avatar} name={person.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900 text-sm">
                    {person.name || "（未命名）"}
                  </p>
                  <p className="truncate text-ink-500 text-xs">{meta || "—"}</p>
                </div>
                {admin.isAdmin && (
                  <Button
                    size="sm"
                    variant="danger-outline"
                    onClick={() => remove(person)}
                    loading={busy === person._id}
                    aria-label={`移除${info.noun} ${person.name ?? ""}`}
                  >
                    移除
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STUDENT_CODE = /^[A-Za-z0-9]{3,20}$/;

function AddStaffDialog({
  sig,
  kind: role,
  onClose,
}: {
  sig: AdminSig;
  kind: Role | null;
  onClose: () => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const invalidate = useInvalidate();
  const info = ROLE[role ?? "leader"];
  const existing = new Set(
    (role === "moderator" ? sig.moderators : sig.leaders).map((p) => p._id),
  );

  useEffect(() => {
    setText("");
    setQuery("");
    setError("");
  }, [role]);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), 250);
    return () => clearTimeout(timer);
  }, [text]);

  const results = useUsers(
    { skip: 0, limit: 8, q: query || undefined },
    Boolean(role) && query.length > 0,
  );

  const add = async (code: string, label: string) => {
    if (!role) {
      return;
    }
    setBusy(label);
    setError("");
    const result = await send(`/sig/${sig._id}/${role}`, { body: { code } });
    setBusy(null);
    if (!result.ok) {
      setError(addFailure(role, result));
      return;
    }
    toast.success(`已新增${info.noun}：${label}`);
    await invalidate(adminKeys.sigs, adminKeys.overview, SIG_LIST_QUERY_KEY);
    onClose();
  };

  /** Leaders are added by student number, 指導老師 by email. */
  const keyOf = (user: AdminUser) =>
    role === "moderator" ? (user.email ?? "") : (user.code ?? "");

  const typed = text.trim();
  const typedFits =
    role === "moderator" ? EMAIL.test(typed) : STUDENT_CODE.test(typed);

  return (
    <Modal
      open={Boolean(role)}
      onClose={onClose}
      wide
      title={`${info.add}：${sig.name}`}
      description={`搜尋姓名、帳號 ID、Email 或學號；也可以直接輸入${info.key}。`}
      initialFocus={inputRef}
      footer={<Button onClick={onClose}>關閉</Button>}
    >
      <label htmlFor={inputId} className="sr-only">
        搜尋使用者
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-400"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={text}
          maxLength={100}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (isSubmitEnter(event) && typedFits) {
              event.preventDefault();
              void add(typed, typed);
            }
          }}
          placeholder={
            role === "moderator"
              ? "例如：teacher@ms.mingdao.edu.tw"
              : "例如：王小明 或 11S001"
          }
          autoComplete="off"
          className={`${inputClass} pl-8`}
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-danger-700 text-sm">
          {error}
        </p>
      )}

      <div className="mt-3 min-h-[8rem]" aria-live="polite">
        {!query ? (
          <p className="py-6 text-center text-ink-500 text-sm">
            輸入關鍵字開始搜尋
          </p>
        ) : results.isPending ||
          (results.isFetching && results.isPlaceholderData) ? (
          <div className="py-6 text-center">
            <Spinner label="搜尋中" />
          </div>
        ) : results.isError ? (
          <p className="py-6 text-center text-danger-700 text-sm">
            搜尋失敗：{failureMessageFromError(results.error)}
          </p>
        ) : (results.data?.items.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-ink-500 text-sm">
            找不到「{query}」
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-control border border-line">
            {results.data?.items.map((user) => {
              const key = keyOf(user);
              const already = existing.has(user._id);
              const label = user.name || user.email || "使用者";
              return (
                <li
                  key={user._id}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Avatar src={user.avatar} name={user.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-medium text-ink-900 text-sm">
                      {label}
                      {user.identity && (
                        <Badge tone="mute">
                          {IDENTITY_LABEL[user.identity] ?? user.identity}
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-ink-500 text-xs">
                      {[user.code, user.class, user.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {already ? (
                    <Badge tone="info">已是{info.noun}</Badge>
                  ) : key ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => add(key, label)}
                      loading={busy === label}
                      disabled={busy !== null && busy !== label}
                    >
                      新增
                    </Button>
                  ) : (
                    <span className="text-ink-500 text-xs">
                      沒有{info.key}，無法設為{info.noun}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {typedFits && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-control bg-field px-3 py-2">
          <p className="min-w-0 truncate text-ink-700 text-sm">
            直接用{info.key}「{typed}」新增
          </p>
          <Button
            size="sm"
            onClick={() => add(typed, typed)}
            loading={busy === typed}
          >
            新增
          </Button>
        </div>
      )}
    </Modal>
  );
}

function failureMessageFromError(error: unknown) {
  return error instanceof Error ? error.message : "請稍後再試";
}
