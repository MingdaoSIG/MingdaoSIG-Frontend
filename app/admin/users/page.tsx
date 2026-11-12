"use client";

import { ExternalLink, History, ShieldCheck, ShieldOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { badgeList } from "@/app/[userID]/(User)/config/badge";
import { toast } from "@/components/mobile/Toast";
import type { ApiFailure } from "@/modules/api/client";
import {
  adminKeys,
  backendMessage,
  errorText,
  failureMessage,
  isChinese,
  isForbidden,
  PAGE_SIZE,
  send,
  useInvalidate,
  usePatchList,
  useSigNames,
  useUserDetail,
  useUsers,
} from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  type Column,
  DataTable,
  Truncate,
} from "../(admin)/components/DataTable";
import { Drawer } from "../(admin)/components/Drawer";
import {
  FilterBar,
  SearchBox,
  SelectFilter,
} from "../(admin)/components/Filters";
import { ListCard } from "../(admin)/components/ListCard";
import { useConfirm } from "../(admin)/components/Modal";
import { Pagination, pageCount } from "../(admin)/components/Pagination";
import {
  Avatar,
  Badge,
  Button,
  buttonClass,
  InfoRow,
  linkClass,
  Spinner,
} from "../(admin)/components/ui";
import { useAdmin } from "../(admin)/context";
import { formatCount, formatDate, IDENTITY_LABEL } from "../(admin)/format";
import type { AdminUser, AdminUserDetail, BadgeId } from "../(admin)/types";
import { UserEditSection } from "../(admin)/user/UserEditSection";
import { oneOf, useQueryState } from "../(admin)/useQueryState";

// 使用者: find people by name, account id, email or student number, see
// their SIGs and activity, edit their account id, display name and 關於我
// (編輯資料), make them admin (or not) and give badges.

const ROLES = ["all", "admin"] as const;

const BADGES: { id: BadgeId; label: string; icon: string }[] = [
  {
    id: "developer",
    label: "開發者（Developer）",
    icon: badgeList.developer.icon,
  },
  {
    id: "10.21_user",
    label: "10/21 活動參與者",
    icon: badgeList["10.21_user"].icon,
  },
  {
    id: "bug_hunter",
    label: "抓蟲高手（Bug Hunter）",
    icon: badgeList.bug_hunter.icon,
  },
];

/**
 * The backend refuses to demote yourself and to remove the last admin
 * (403 / 4001, "There must be at least one admin").
 */
function permissionRefusal(failure: ApiFailure, self: boolean) {
  if (!isForbidden(failure)) {
    return failureMessage(failure);
  }
  const message = backendMessage(failure);
  if (message && isChinese(message)) {
    return message;
  }
  if (/at least one admin|last admin/i.test(message)) {
    return "至少要保留一位管理員，所以不能移除這位的權限";
  }
  if (self || /self|yourself|own/i.test(message)) {
    return "不能移除自己的管理員權限，請另一位管理員操作";
  }
  return message
    ? `伺服器拒絕了這個變更（${message}）`
    : "你沒有權限變更管理員權限";
}

export default function AdminUsersPage() {
  const { get, set, page } = useQueryState();
  const q = get("q");
  const role = oneOf(get("role"), ROLES, "all");
  const sig = get("sig");
  const users = useUsers({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    q: q || undefined,
    role,
    sig: sig || undefined,
  });
  const { sigs } = useSigNames();
  const [open, setOpen] = useState<AdminUser | null>(null);

  const items = users.data?.items ?? [];
  const total = users.data?.total ?? 0;
  const pages = pageCount(total, PAGE_SIZE);

  useEffect(() => {
    if (users.isSuccess && !users.isPlaceholderData && page > pages) {
      set({ page: pages > 1 ? pages : null }, { replace: true });
    }
  }, [users.isSuccess, users.isPlaceholderData, page, pages]);

  const current = useMemo(
    () => (open ? (items.find((u) => u._id === open._id) ?? open) : null),
    [open, items],
  );

  const sigOptions = useMemo(
    () => [
      { value: "", label: "全部 SIG" },
      ...sigs.map((s) => ({ value: s._id, label: s.name })),
    ],
    [sigs],
  );

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "使用者",
      primary: true,
      cell: (user) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar src={user.avatar} name={user.name} size={28} />
          <span className="min-w-0">
            <Truncate className="font-medium text-ink-900">
              {user.name || "（未命名）"}
            </Truncate>
            <Truncate className="text-ink-500 text-xs">
              {user.customId ? `@${user.customId}` : "—"}
            </Truncate>
          </span>
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      className: "w-[24%]",
      cell: (user) => <Truncate>{user.email || "—"}</Truncate>,
    },
    {
      key: "code",
      optional: true,
      header: "學號",
      className: "w-[6.5rem]",
      cell: (user) => <Truncate>{user.code || "—"}</Truncate>,
    },
    {
      key: "class",
      optional: true,
      header: "班級／身分",
      className: "w-[7.5rem]",
      cell: (user) => (
        <Truncate>
          {[user.class, IDENTITY_LABEL[user.identity ?? ""]]
            .filter(Boolean)
            .join(" · ") || "—"}
        </Truncate>
      ),
    },
    {
      key: "flags",
      header: "權限",
      className: "w-[7.5rem]",
      cell: (user) => <UserFlags user={user} />,
    },
    {
      key: "created",
      optional: true,
      header: "加入日期",
      className: "w-[7rem]",
      cell: (user) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDate(user.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="使用者"
        description={users.data ? `共 ${formatCount(total)} 位` : "載入中…"}
      />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <ListCard
            toolbar={
              <FilterBar>
                <SearchBox
                  value={q}
                  onCommit={(next) => set({ q: next }, { replace: true })}
                  label="搜尋使用者"
                  placeholder="姓名、帳號 ID、Email 或學號…"
                  className="sm:flex-1"
                />
                <SelectFilter
                  label="身分"
                  value={role}
                  options={[
                    { value: "all", label: "全部使用者" },
                    { value: "admin", label: "管理員" },
                  ]}
                  onChange={(next) =>
                    set({ role: next === "all" ? null : next })
                  }
                  className="sm:w-36"
                />
                <SelectFilter
                  label="SIG 成員"
                  value={sig}
                  options={sigOptions}
                  onChange={(next) => set({ sig: next })}
                  className="sm:w-44"
                />
              </FilterBar>
            }
            footer={
              <div className="sm:ml-auto">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  unit="位"
                  onPage={(next) => set({ page: next > 1 ? next : null })}
                  disabled={users.isFetching}
                />
              </div>
            }
          >
            <DataTable
              caption="使用者列表"
              rows={items}
              rowKey={(user) => user._id}
              rowLabel={(user) => user.name || user.email || "使用者"}
              columns={columns}
              card={(user) => (
                <span className="flex items-center gap-3">
                  <Avatar src={user.avatar} name={user.name} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-ink-900 text-sm">
                        {user.name || "（未命名）"}
                      </span>
                      <UserFlags user={user} dash={false} />
                    </span>
                    <span className="block truncate text-ink-500 text-xs">
                      {[user.code, user.class, user.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </span>
              )}
              onOpen={(user) => setOpen(user)}
              activeKey={current?._id}
              compact={Boolean(current)}
              loading={users.isPending}
              fetching={users.isFetching && !users.isPending}
              error={users.isError ? errorText(users.error) : null}
              onRetry={() => users.refetch()}
              empty={
                q || sig || role !== "all"
                  ? "沒有符合條件的使用者"
                  : "還沒有使用者"
              }
            />
          </ListCard>
        </div>
        {current && <UserDrawer user={current} onClose={() => setOpen(null)} />}
      </div>
    </>
  );
}

function UserFlags({
  user,
  dash = true,
}: {
  user: AdminUser;
  /** A table cell shows 「—」 when there is nothing to show. */
  dash?: boolean;
}) {
  const badges = user.badge ?? [];
  return (
    <span className="flex items-center gap-1">
      {user.permission === 2 && <Badge tone="info">管理員</Badge>}
      {badges.map((id) => {
        const badge = BADGES.find((b) => b.id === id);
        return badge ? (
          <Image
            key={id}
            src={badge.icon}
            alt={badge.label}
            title={badge.label}
            width={16}
            height={16}
            className="size-4"
          />
        ) : null;
      })}
      {dash && user.permission !== 2 && badges.length === 0 && (
        <span className="text-ink-400">—</span>
      )}
    </span>
  );
}

function UserDrawer({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  const admin = useAdmin();
  const detail = useUserDetail(user._id);
  // What this drawer changed, until the refetch catches up (the user may
  // also drop out of the filtered list, e.g. after removing admin).
  const [changed, setChanged] = useState<Partial<AdminUserDetail>>({});
  const full: AdminUserDetail = { ...user, ...detail.data, ...changed };
  const isSelf = user._id === admin.userId;
  const isAdminUser = full.permission === 2;
  const confirm = useConfirm();
  const invalidate = useInvalidate();
  const patch = usePatchList<AdminUser>(adminKeys.users);
  const [busy, setBusy] = useState<"permission" | "badges" | null>(null);
  const [permissionError, setPermissionError] = useState("");
  const [badges, setBadges] = useState<BadgeId[]>(full.badge ?? []);
  const savedBadges = (full.badge ?? []).slice().sort().join(",");
  const badgesChanged = badges.slice().sort().join(",") !== savedBadges;

  useEffect(() => {
    setChanged({});
  }, [user._id]);

  // Another user, or fresh data: start from what is saved.
  useEffect(() => {
    setBadges(full.badge ?? []);
    setPermissionError("");
  }, [user._id, savedBadges]);

  const togglePermission = async () => {
    const next = !isAdminUser;
    const ok = await confirm({
      title: next
        ? `把 ${full.name ?? "這位使用者"} 設為管理員？`
        : `移除 ${full.name ?? "這位使用者"} 的管理員權限？`,
      description: next
        ? "管理員可以使用管理平台的所有功能，包括下架貼文與變更其他人的權限。"
        : "移除後，對方就不能再使用管理平台的管理員功能。",
      confirmLabel: next ? "設為管理員" : "移除權限",
      tone: next ? "primary" : "danger",
    });
    if (!ok) {
      return;
    }
    setBusy("permission");
    setPermissionError("");
    const result = await send<{ permission?: number }>(
      `/admin/users/${user._id}/permission`,
      { body: { admin: next } },
    );
    setBusy(null);
    if (!result.ok) {
      const message = permissionRefusal(result, isSelf);
      setPermissionError(message);
      toast.error(message);
      return;
    }
    const permission =
      typeof result.data?.permission === "number"
        ? result.data.permission
        : next
          ? 2
          : 1;
    patch(user._id, { permission });
    setChanged((prev) => ({ ...prev, permission }));
    toast.success(next ? "已設為管理員" : "已移除管理員權限");
    await invalidate(adminKeys.users);
  };

  const saveBadges = async () => {
    setBusy("badges");
    const result = await send<{ badge?: BadgeId[] }>(
      `/admin/users/${user._id}/badges`,
      { body: { badges } },
    );
    setBusy(null);
    if (!result.ok) {
      toast.error(failureMessage(result));
      return;
    }
    const badge = Array.isArray(result.data?.badge)
      ? result.data.badge
      : badges;
    patch(user._id, { badge });
    setChanged((prev) => ({ ...prev, badge }));
    toast.success("已更新徽章");
    await invalidate(adminKeys.users);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <Avatar src={full.avatar} name={full.name} size={36} />
          <span className="min-w-0">
            <span className="block truncate">{full.name || "（未命名）"}</span>
            <span className="block truncate font-normal text-ink-500 text-xs">
              {full.customId ? `@${full.customId}` : ""}
            </span>
          </span>
        </span>
      }
      footer={
        <>
          {full.customId && (
            <Link
              href={`/@${full.customId}`}
              target="_blank"
              className={buttonClass("secondary", "sm")}
            >
              <ExternalLink aria-hidden className="size-3.5" />
              個人頁面
            </Link>
          )}
          <Link
            href={`/admin/audit?actor=${user._id}&actorName=${encodeURIComponent(full.name ?? "")}`}
            className={buttonClass("secondary", "sm")}
          >
            <History aria-hidden className="size-3.5" />
            操作紀錄
          </Link>
        </>
      }
    >
      <dl>
        <InfoRow label="Email">{full.email || "—"}</InfoRow>
        <InfoRow label="學號">{full.code || "—"}</InfoRow>
        <InfoRow label="班級">{full.class || "—"}</InfoRow>
        <InfoRow label="身分">
          {IDENTITY_LABEL[full.identity ?? ""] ?? "—"}
        </InfoRow>
        <InfoRow label="加入日期">{formatDate(full.createdAt)}</InfoRow>
        <InfoRow label="貼文">
          {detail.isPending ? (
            "…"
          ) : (
            <Link
              href={`/admin/posts?q=${encodeURIComponent(full.customId ?? full.name ?? "")}&status=all`}
              className={linkClass}
            >
              {formatCount(full.postCount)} 篇
            </Link>
          )}
        </InfoRow>
        <InfoRow label="留言">
          {detail.isPending ? (
            "…"
          ) : (
            <Link
              href={`/admin/comments?user=${user._id}&userName=${encodeURIComponent(full.name ?? "")}&status=all`}
              className={linkClass}
            >
              {formatCount(full.commentCount)} 則
            </Link>
          )}
        </InfoRow>
      </dl>
      {detail.isError && (
        <p role="alert" className="mt-1 text-danger-700 text-xs">
          部分資料載入失敗：{errorText(detail.error)}
        </p>
      )}

      <Section title="編輯資料">
        {detail.isPending ? (
          <Spinner />
        ) : (
          <UserEditSection
            user={full}
            onSaved={(saved) => {
              patch(user._id, { customId: saved.customId });
              setChanged((prev) => ({ ...prev, ...saved }));
              void invalidate(adminKeys.users);
            }}
          />
        )}
      </Section>

      <Section title="加入的 SIG">
        {detail.isPending ? (
          <Spinner />
        ) : (full.sigs?.length ?? 0) === 0 ? (
          <p className="text-ink-500 text-sm">尚未加入任何 SIG</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {full.sigs?.map((s) => (
              <li key={s._id}>
                <Link
                  href={`/admin/sigs/${s._id}`}
                  className="inline-flex h-7 items-center rounded-chip bg-field px-2 text-ink-700 text-xs hover:bg-brand-50 hover:text-brand-800"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="管理的 SIG">
        {detail.isPending ? (
          <Spinner />
        ) : (full.managedSigs?.length ?? 0) === 0 ? (
          <p className="text-ink-500 text-sm">沒有擔任幹部或指導老師</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {full.managedSigs?.map((s) => (
              <li key={`${s._id}-${s.role}`}>
                <Link
                  href={`/admin/sigs/${s._id}?tab=staff`}
                  className="inline-flex h-7 items-center gap-1 rounded-chip bg-brand-50 px-2 text-brand-800 text-xs hover:bg-brand-700/15"
                >
                  {s.name}
                  <span className="text-brand-700/80">
                    · {s.role === "moderator" ? "指導老師" : "幹部"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="管理員權限">
        <div className="flex flex-wrap items-center gap-2">
          {isAdminUser ? (
            <Badge tone="info">管理員</Badge>
          ) : (
            <Badge tone="mute">一般使用者</Badge>
          )}
          <Button
            size="sm"
            variant={isAdminUser ? "danger-outline" : "secondary"}
            onClick={togglePermission}
            loading={busy === "permission"}
            disabled={isSelf && isAdminUser}
          >
            {isAdminUser ? (
              <ShieldOff aria-hidden className="size-3.5" />
            ) : (
              <ShieldCheck aria-hidden className="size-3.5" />
            )}
            {isAdminUser ? "移除管理員權限" : "設為管理員"}
          </Button>
        </div>
        {isSelf && isAdminUser && (
          <p className="mt-1.5 text-ink-500 text-xs">
            不能移除自己的管理員權限，請另一位管理員操作。
          </p>
        )}
        {permissionError && (
          <p role="alert" className="mt-1.5 text-danger-700 text-xs">
            {permissionError}
          </p>
        )}
      </Section>

      <Section title="徽章">
        <fieldset>
          <legend className="sr-only">徽章</legend>
          <div className="flex flex-col gap-1">
            {BADGES.map((badge) => (
              <label
                key={badge.id}
                className="flex cursor-pointer items-center gap-2 rounded-control px-1 py-1 text-ink-800 text-sm hover:bg-field"
              >
                <input
                  type="checkbox"
                  checked={badges.includes(badge.id)}
                  onChange={(event) =>
                    setBadges((prev) =>
                      event.target.checked
                        ? [...prev, badge.id]
                        : prev.filter((id) => id !== badge.id),
                    )
                  }
                  className="size-4 cursor-pointer accent-brand-700"
                />
                <Image
                  src={badge.icon}
                  alt=""
                  width={18}
                  height={18}
                  className="size-[18px]"
                />
                {badge.label}
              </label>
            ))}
          </div>
        </fieldset>
        <Button
          size="sm"
          variant="primary"
          className="mt-2"
          onClick={saveBadges}
          disabled={!badgesChanged}
          loading={busy === "badges"}
        >
          儲存徽章
        </Button>
      </Section>
    </Drawer>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 border-line border-t pt-3">
      <h3 className="mb-2 font-semibold text-ink-900 text-sm">{title}</h3>
      {children}
    </section>
  );
}
