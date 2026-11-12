"use client";

import { useMemo } from "react";
import { errorText, useAdminSigs } from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  type Column,
  DataTable,
  Truncate,
} from "../(admin)/components/DataTable";
import {
  FilterBar,
  SearchBox,
  SelectFilter,
} from "../(admin)/components/Filters";
import { ListCard } from "../(admin)/components/ListCard";
import { Avatar, Badge } from "../(admin)/components/ui";
import { useAdmin } from "../(admin)/context";
import { formatCount } from "../(admin)/format";
import type { AdminSig, UserRef } from "../(admin)/types";
import { oneOf, useQueryState } from "../(admin)/useQueryState";

// SIG: every SIG (admins) or the caller's own, with member counts and a
// warning for SIGs that have no leader or 指導老師. Opens the SIG page.

const FILTERS = ["all", "no-leader", "no-moderator", "pending"] as const;

function names(people: UserRef[]) {
  return people.map((p) => p.name || p.customId || "（未命名）").join("、");
}

export default function AdminSigsPage() {
  const admin = useAdmin();
  const { get, set } = useQueryState();
  const q = get("q");
  const filter = oneOf(get("filter"), FILTERS, "all");
  const sigs = useAdminSigs();

  const all = sigs.data ?? [];
  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    return all.filter((sig) => {
      if (
        needle &&
        !sig.name.toLowerCase().includes(needle) &&
        !(sig.customId ?? "").toLowerCase().includes(needle)
      ) {
        return false;
      }
      switch (filter) {
        case "no-leader":
          return sig.leaders.length === 0;
        case "no-moderator":
          return sig.moderators.length === 0;
        case "pending":
          return (sig.pendingJoinRequests ?? 0) > 0;
        default:
          return true;
      }
    });
  }, [all, q, filter]);

  const missing = all.filter(
    (sig) => sig.leaders.length === 0 || sig.moderators.length === 0,
  ).length;

  const columns: Column<AdminSig>[] = [
    {
      key: "name",
      header: "SIG",
      primary: true,
      cell: (sig) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar src={sig.avatar} name={sig.name} size={28} square />
          <span className="min-w-0">
            <Truncate className="font-medium text-ink-900">{sig.name}</Truncate>
            <Truncate className="text-ink-500 text-xs">
              {sig.customId ? `@${sig.customId}` : "—"}
            </Truncate>
          </span>
        </span>
      ),
    },
    {
      key: "members",
      header: "成員",
      className: "w-[5rem] text-right",
      cell: (sig) => (
        <span className="tabular-nums">{formatCount(sig.memberCount)}</span>
      ),
    },
    {
      key: "leaders",
      header: "幹部",
      className: "w-[24%]",
      cell: (sig) =>
        sig.leaders.length === 0 ? (
          <Badge tone="warn">尚未設定幹部</Badge>
        ) : (
          <Truncate>{names(sig.leaders)}</Truncate>
        ),
    },
    {
      key: "moderators",
      header: "指導老師",
      className: "w-[20%]",
      cell: (sig) =>
        sig.moderators.length === 0 ? (
          <Badge tone="warn">尚未設定指導老師</Badge>
        ) : (
          <Truncate>{names(sig.moderators)}</Truncate>
        ),
    },
    {
      key: "pending",
      header: "待審申請",
      className: "w-[6.5rem]",
      cell: (sig) =>
        (sig.pendingJoinRequests ?? 0) > 0 ? (
          <Badge tone="warn">{sig.pendingJoinRequests} 筆</Badge>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="SIG"
        description={
          sigs.data
            ? admin.isAdmin
              ? `共 ${all.length} 個 SIG${missing > 0 ? `，${missing} 個缺少幹部或指導老師` : ""}`
              : `你管理 ${all.length} 個 SIG`
            : "載入中…"
        }
      />
      <ListCard
        toolbar={
          <FilterBar>
            <SearchBox
              value={q}
              onCommit={(next) => set({ q: next }, { replace: true })}
              label="搜尋 SIG"
              placeholder="搜尋 SIG 名稱…"
              className="sm:flex-1"
            />
            <SelectFilter
              label="顯示"
              value={filter}
              options={[
                { value: "all", label: "全部" },
                { value: "no-leader", label: "尚未設定幹部" },
                { value: "no-moderator", label: "尚未設定指導老師" },
                { value: "pending", label: "有待審申請" },
              ]}
              onChange={(next) => set({ filter: next === "all" ? null : next })}
              className="sm:w-44"
            />
          </FilterBar>
        }
      >
        <DataTable
          caption="SIG 列表"
          rows={rows}
          rowKey={(sig) => sig._id}
          rowLabel={(sig) => sig.name}
          columns={columns}
          card={(sig) => (
            <span className="flex items-center gap-3">
              <Avatar src={sig.avatar} name={sig.name} size={40} square />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink-900 text-sm">
                  {sig.name}
                </span>
                <span className="block truncate text-ink-500 text-xs">
                  {formatCount(sig.memberCount)} 位成員 · 幹部{" "}
                  {sig.leaders.length} · 指導老師 {sig.moderators.length}
                </span>
                {(sig.leaders.length === 0 ||
                  sig.moderators.length === 0 ||
                  (sig.pendingJoinRequests ?? 0) > 0) && (
                  <span className="mt-1 flex flex-wrap gap-1">
                    {sig.leaders.length === 0 && (
                      <Badge tone="warn">尚未設定幹部</Badge>
                    )}
                    {sig.moderators.length === 0 && (
                      <Badge tone="warn">尚未設定指導老師</Badge>
                    )}
                    {(sig.pendingJoinRequests ?? 0) > 0 && (
                      <Badge tone="info">
                        {sig.pendingJoinRequests} 筆待審
                      </Badge>
                    )}
                  </span>
                )}
              </span>
            </span>
          )}
          rowHref={(sig) => `/admin/sigs/${sig._id}`}
          loading={sigs.isPending}
          fetching={sigs.isFetching && !sigs.isPending}
          error={sigs.isError ? errorText(sigs.error) : null}
          onRetry={() => sigs.refetch()}
          empty={q || filter !== "all" ? "沒有符合條件的 SIG" : "沒有 SIG"}
        />
      </ListCard>
    </>
  );
}
