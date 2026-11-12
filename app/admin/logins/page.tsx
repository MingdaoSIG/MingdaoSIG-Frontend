"use client";

import Link from "next/link";
import { useEffect } from "react";
import { errorText, PAGE_SIZE } from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  type Column,
  DataTable,
  Truncate,
} from "../(admin)/components/DataTable";
import { FilterBar, FilterChip } from "../(admin)/components/Filters";
import { ListCard } from "../(admin)/components/ListCard";
import { Pagination, pageCount } from "../(admin)/components/Pagination";
import { Avatar, Badge } from "../(admin)/components/ui";
import { formatCount, formatDateTime } from "../(admin)/format";
import {
  describeUserAgent,
  LOGIN_METHOD_LABEL,
  type LoginEntry,
  useLogins,
} from "../(admin)/moderationApi";
import { useQueryState } from "../(admin)/useQueryState";
import { shortHash } from "../(admin)/user/LoginSection";

// 登入紀錄 (contract v4 §5.3, admins only): every successful login of the
// last 180 days, newest first. The address is kept only as a hash, so two
// logins can be compared but no IP is shown. `?user=` narrows it to one
// person (from the user drawer).

function userLabel(entry: LoginEntry) {
  return entry.user?.name || "已刪除的使用者";
}

function userHref(entry: LoginEntry) {
  const key = entry.user?.customId || entry.user?.name;
  return key ? `/admin/users?q=${encodeURIComponent(key)}` : null;
}

function MethodBadge({ method }: { method: string }) {
  return (
    <Badge tone={method === "session" ? "ok" : "info"}>
      {LOGIN_METHOD_LABEL[method] ?? method}
    </Badge>
  );
}

export default function AdminLoginsPage() {
  const { get, set, page } = useQueryState();
  const user = get("user");
  const userName = get("userName");
  const logins = useLogins({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    user: user || undefined,
  });

  const items = logins.data?.items ?? [];
  const total = logins.data?.total ?? 0;
  const pages = pageCount(total, PAGE_SIZE);

  useEffect(() => {
    if (logins.isSuccess && !logins.isPlaceholderData && page > pages) {
      set({ page: pages > 1 ? pages : null }, { replace: true });
    }
  }, [logins.isSuccess, logins.isPlaceholderData, page, pages]);

  const columns: Column<LoginEntry>[] = [
    {
      key: "user",
      header: "使用者",
      primary: true,
      cell: (entry) => {
        const href = userHref(entry);
        const name = (
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar
              src={entry.user?.avatar}
              name={entry.user?.name}
              size={28}
            />
            <span className="min-w-0">
              <Truncate className="font-medium text-ink-900">
                {userLabel(entry)}
              </Truncate>
              <Truncate className="text-ink-500 text-xs">
                {entry.user?.customId ? `@${entry.user.customId}` : "—"}
              </Truncate>
            </span>
          </span>
        );
        return href ? (
          <Link href={href} className="block min-w-0 hover:text-brand-700">
            {name}
          </Link>
        ) : (
          name
        );
      },
    },
    {
      key: "method",
      header: "方式",
      className: "w-[7.5rem]",
      cell: (entry) => <MethodBadge method={entry.method} />,
    },
    {
      key: "device",
      optional: true,
      header: "裝置",
      className: "w-[24%]",
      cell: (entry) => (
        <span title={entry.userAgent} className="block min-w-0">
          <Truncate>
            {describeUserAgent(entry.userAgent) || entry.userAgent || "—"}
          </Truncate>
        </span>
      ),
    },
    {
      key: "ip",
      optional: true,
      header: "IP 雜湊",
      className: "w-[8rem]",
      cell: (entry) => (
        <code className="font-mono text-ink-700 text-xs" title={entry.ipHash}>
          {shortHash(entry.ipHash)}
        </code>
      ),
    },
    {
      key: "time",
      header: "時間",
      className: "w-[10rem]",
      cell: (entry) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDateTime(entry.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="登入紀錄"
        description={
          logins.data
            ? `近 180 天共 ${formatCount(total)} 筆；IP 只保存雜湊值，相同的雜湊代表同一個位址。`
            : "載入中…"
        }
      />
      <ListCard
        toolbar={
          user ? (
            <FilterBar>
              <FilterChip
                label={`使用者：${userName || "指定的使用者"}`}
                onClear={() => set({ user: null, userName: null })}
              />
            </FilterBar>
          ) : undefined
        }
        footer={
          <div className="sm:ml-auto">
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              unit="筆"
              onPage={(next) => set({ page: next > 1 ? next : null })}
              disabled={logins.isFetching}
            />
          </div>
        }
      >
        <DataTable
          caption="登入紀錄"
          rows={items}
          rowKey={(entry) => entry._id}
          rowLabel={(entry) => `${userLabel(entry)} 的登入`}
          columns={columns}
          card={(entry) => (
            <span className="flex items-start gap-3">
              <Avatar
                src={entry.user?.avatar}
                name={entry.user?.name}
                size={36}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-ink-900 text-sm">
                    {userLabel(entry)}
                  </span>
                  <MethodBadge method={entry.method} />
                </span>
                <span className="block truncate text-ink-500 text-xs">
                  {formatDateTime(entry.createdAt)} ·{" "}
                  {describeUserAgent(entry.userAgent) || "未知裝置"}
                </span>
                <span className="block truncate text-ink-500 text-xs">
                  IP 雜湊{" "}
                  <code className="font-mono" title={entry.ipHash}>
                    {shortHash(entry.ipHash)}
                  </code>
                </span>
              </span>
            </span>
          )}
          loading={logins.isPending}
          fetching={logins.isFetching && !logins.isPending}
          error={logins.isError ? errorText(logins.error) : null}
          onRetry={() => logins.refetch()}
          empty={user ? "這位使用者近 180 天沒有登入" : "還沒有登入紀錄"}
        />
      </ListCard>
    </>
  );
}
