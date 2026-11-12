"use client";

import { ExternalLink, History } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useBadges } from "@/modules/badges";
import {
  adminKeys,
  errorText,
  isObjectId,
  PAGE_SIZE,
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
import { Pagination, pageCount } from "../(admin)/components/Pagination";
import {
  Avatar,
  Badge,
  buttonClass,
  InfoRow,
  linkClass,
  Spinner,
} from "../(admin)/components/ui";
import { useAdmin } from "../(admin)/context";
import { formatCount, formatDate, IDENTITY_LABEL } from "../(admin)/format";
import { roleOf } from "../(admin)/moderationApi";
import type { AdminUser, AdminUserDetail } from "../(admin)/types";
import { oneOf, useQueryState } from "../(admin)/useQueryState";
import { LoginSection } from "../(admin)/user/LoginSection";
import { RoleBadge, RoleSection } from "../(admin)/user/RoleSection";
import {
  SuspensionBadge,
  SuspensionSection,
} from "../(admin)/user/SuspensionSection";
import { BadgeIcon, UserBadgeEditor } from "../(admin)/user/UserBadgeEditor";
import { UserEditSection } from "../(admin)/user/UserEditSection";

// 使用者: find people by name, account id, email or student number, see
// their SIGs and activity, edit their account id, display name and 關於我
// (編輯資料), set their role (一般使用者／內容管理員／管理員), mute or ban
// them, see their logins and give badges.
// Content moderators (contract v4 §5.2) read, and mute; nothing else.

const ROLES = ["all", "admin", "moderator"] as const;
const STATES = ["all", "suspended"] as const;

export default function AdminUsersPage() {
  const { get, set, page } = useQueryState();
  const q = get("q");
  const role = oneOf(get("role"), ROLES, "all");
  const state = oneOf(get("state"), STATES, "all");
  const sig = get("sig");
  const users = useUsers({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    q: q || undefined,
    role,
    sig: sig || undefined,
    // 停權中: a mute or ban in force (contract v4 §5.1).
    suspended: state === "suspended" ? 1 : undefined,
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

  // `?id=` opens that user's drawer (links from other admin pages, such
  // as 問題回報); closing the drawer drops it.
  const idParam = get("id");
  useEffect(() => {
    if (isObjectId(idParam) && open?._id !== idParam) {
      setOpen(
        items.find((u) => u._id === idParam) ?? ({ _id: idParam } as AdminUser),
      );
    }
  }, [idParam]);
  const closeDrawer = () => {
    setOpen(null);
    if (idParam) {
      set({ id: null }, { keepPage: true, replace: true });
    }
  };

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
      header: "權限／狀態",
      className: "w-[10rem]",
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
                    { value: "moderator", label: "內容管理員" },
                  ]}
                  onChange={(next) =>
                    set({ role: next === "all" ? null : next })
                  }
                  className="sm:w-36"
                />
                <SelectFilter
                  label="狀態"
                  value={state}
                  options={[
                    { value: "all", label: "全部狀態" },
                    { value: "suspended", label: "停權中" },
                  ]}
                  onChange={(next) =>
                    set({ state: next === "all" ? null : next })
                  }
                  className="sm:w-32"
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
                q || sig || role !== "all" || state !== "all"
                  ? "沒有符合條件的使用者"
                  : "還沒有使用者"
              }
            />
          </ListCard>
        </div>
        {current && <UserDrawer user={current} onClose={closeDrawer} />}
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
  const { byKey } = useBadges();
  const badges = user.badge ?? [];
  const role = roleOf(user);
  const suspended = Boolean(user.suspension);
  return (
    <span className="flex items-center gap-1">
      {role === "admin" && <Badge tone="info">管理員</Badge>}
      {role === "moderator" && <Badge tone="ok">內容管理員</Badge>}
      <SuspensionBadge suspension={user.suspension} />
      {badges.map((id) => {
        const badge = byKey.get(id);
        return badge ? (
          <span key={id} title={badge.name} className="inline-flex">
            <BadgeIcon badge={badge} size={16} />
            <span className="sr-only">{badge.name}</span>
          </span>
        ) : null;
      })}
      {dash && role === "user" && !suspended && badges.length === 0 && (
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
  const invalidate = useInvalidate();
  const patch = usePatchList<AdminUser>(adminKeys.users);
  // Content moderators may open SIG pages only for the SIGs they manage.
  const sigHref = (sigId: string, tab?: string) =>
    admin.isAdmin || admin.managedSigIds.includes(sigId)
      ? `/admin/sigs/${sigId}${tab ? `?tab=${tab}` : ""}`
      : null;

  useEffect(() => {
    setChanged({});
  }, [user._id]);

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
          {admin.isAdmin && (
            <Link
              href={`/admin/audit?actor=${user._id}&actorName=${encodeURIComponent(full.name ?? "")}`}
              className={buttonClass("secondary", "sm")}
            >
              <History aria-hidden className="size-3.5" />
              操作紀錄
            </Link>
          )}
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

      {admin.isAdmin && (
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
      )}

      <Section title="加入的 SIG">
        {detail.isPending ? (
          <Spinner />
        ) : (full.sigs?.length ?? 0) === 0 ? (
          <p className="text-ink-500 text-sm">尚未加入任何 SIG</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {full.sigs?.map((s) => {
              const href = sigHref(s._id);
              const chip =
                "inline-flex h-7 items-center rounded-chip bg-field px-2 text-ink-700 text-xs";
              return (
                <li key={s._id}>
                  {href ? (
                    <Link
                      href={href}
                      className={`${chip} hover:bg-brand-50 hover:text-brand-800`}
                    >
                      {s.name}
                    </Link>
                  ) : (
                    <span className={chip}>{s.name}</span>
                  )}
                </li>
              );
            })}
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
            {full.managedSigs?.map((s) => {
              const href = sigHref(s._id, "staff");
              const chip =
                "inline-flex h-7 items-center gap-1 rounded-chip bg-brand-50 px-2 text-brand-800 text-xs";
              const body = (
                <>
                  {s.name}
                  <span className="text-brand-700/80">
                    · {s.role === "moderator" ? "指導老師" : "幹部"}
                  </span>
                </>
              );
              return (
                <li key={`${s._id}-${s.role}`}>
                  {href ? (
                    <Link
                      href={href}
                      className={`${chip} hover:bg-brand-700/15`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <span className={chip}>{body}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="角色">
        {admin.isAdmin ? (
          <RoleSection
            user={full}
            isSelf={isSelf}
            onSaved={({ role, permission }) => {
              patch(user._id, { permission, role });
              setChanged((prev) => ({ ...prev, permission, role }));
              void invalidate(adminKeys.users);
            }}
          />
        ) : (
          <RoleBadge user={full} />
        )}
      </Section>

      <Section title="停權／禁言">
        {detail.isPending ? (
          <Spinner />
        ) : (
          <SuspensionSection
            user={full}
            onChanged={(suspension) => {
              patch(user._id, { suspension });
              setChanged((prev) => ({ ...prev, suspension }));
            }}
          />
        )}
      </Section>

      {admin.isAdmin && (
        <Section title="登入紀錄">
          <LoginSection userId={user._id} userName={full.name ?? ""} />
        </Section>
      )}

      {admin.isAdmin && (
        <Section title="徽章">
          <UserBadgeEditor
            userId={user._id}
            saved={full.badge ?? []}
            onSaved={(badge) => {
              patch(user._id, { badge });
              setChanged((prev) => ({ ...prev, badge }));
              void invalidate(adminKeys.users);
            }}
          />
        </Section>
      )}
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
