"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { errorText } from "../(admin)/api";
import { BadgeDialog } from "../(admin)/badges/BadgeDialog";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  type Column,
  DataTable,
  Truncate,
} from "../(admin)/components/DataTable";
import { FilterBar, SelectFilter } from "../(admin)/components/Filters";
import { ListCard } from "../(admin)/components/ListCard";
import { Badge, Button } from "../(admin)/components/ui";
import { formatCount } from "../(admin)/format";
import { type AdminBadge, useAdminBadges } from "../(admin)/sigAdminApi";
import { oneOf, useQueryState } from "../(admin)/useQueryState";
import { BadgeIcon } from "../(admin)/user/UserBadgeEditor";

// 徽章 (contract v4 §5.9): the badge collection. Create, edit and retire
// badges; they are given to people in the user drawer. A retired badge
// stays on the users who have it but is hidden everywhere.

const FILTERS = ["active", "retired", "all"] as const;

export default function AdminBadgesPage() {
  const { get, set } = useQueryState();
  const filter = oneOf(get("filter"), FILTERS, "active");
  const badges = useAdminBadges();
  const [editing, setEditing] = useState<AdminBadge | null>(null);
  const [creating, setCreating] = useState(false);

  const all = badges.data ?? [];
  const rows = useMemo(
    () =>
      all.filter((badge) =>
        filter === "all"
          ? true
          : filter === "retired"
            ? badge.removed
            : !badge.removed,
      ),
    [all, filter],
  );
  const retired = all.filter((badge) => badge.removed).length;

  const columns: Column<AdminBadge>[] = [
    {
      key: "name",
      header: "徽章",
      primary: true,
      cell: (badge) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <BadgeIcon badge={badge} size={24} />
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5">
              <Truncate className="font-medium text-ink-900">
                {badge.name}
              </Truncate>
              {badge.removed && <Badge tone="mute">已停用</Badge>}
            </span>
            <Truncate className="font-mono text-ink-500 text-xs">
              {badge.key}
            </Truncate>
          </span>
        </span>
      ),
    },
    {
      key: "description",
      header: "說明",
      optional: true,
      className: "w-[38%]",
      cell: (badge) =>
        badge.description ? (
          <Truncate className="text-ink-700">{badge.description}</Truncate>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      key: "color",
      header: "顏色",
      className: "w-[7rem]",
      cell: (badge) =>
        badge.color ? (
          <span className="flex items-center gap-1.5 font-mono text-xs">
            <span
              aria-hidden
              className="size-3.5 rounded-chip border border-line"
              style={{ backgroundColor: badge.color }}
            />
            {badge.color}
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      key: "users",
      header: "擁有人數",
      className: "w-[6rem] text-right",
      cell: (badge) => (
        <span className="tabular-nums">
          {formatCount(badge.userCount ?? 0)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="徽章"
        description={
          badges.data
            ? `共 ${all.length} 個徽章${retired > 0 ? `，${retired} 個已停用` : ""}。到「使用者」打開一位使用者即可頒發。`
            : "載入中…"
        }
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-4" />
            新增徽章
          </Button>
        }
      />
      <ListCard
        toolbar={
          <FilterBar>
            <SelectFilter
              label="顯示"
              value={filter}
              options={[
                { value: "active", label: "使用中" },
                { value: "retired", label: "已停用" },
                { value: "all", label: "全部" },
              ]}
              onChange={(next) =>
                set({ filter: next === "active" ? null : next })
              }
              className="sm:w-40"
            />
          </FilterBar>
        }
      >
        <DataTable
          caption="徽章列表"
          rows={rows}
          rowKey={(badge) => badge.key}
          rowLabel={(badge) => `徽章：${badge.name}`}
          columns={columns}
          card={(badge) => (
            <span className="flex items-center gap-3">
              <BadgeIcon badge={badge} size={32} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-semibold text-ink-900 text-sm">
                    {badge.name}
                  </span>
                  {badge.removed && <Badge tone="mute">已停用</Badge>}
                </span>
                <span className="block truncate text-ink-500 text-xs">
                  {badge.key} · {formatCount(badge.userCount ?? 0)} 人
                  {badge.description ? ` · ${badge.description}` : ""}
                </span>
              </span>
            </span>
          )}
          onOpen={(badge) => setEditing(badge)}
          activeKey={editing?.key}
          loading={badges.isPending}
          fetching={badges.isFetching && !badges.isPending}
          error={badges.isError ? errorText(badges.error) : null}
          onRetry={() => badges.refetch()}
          empty={
            filter === "retired"
              ? "沒有停用的徽章"
              : filter === "all"
                ? "還沒有徽章"
                : "沒有使用中的徽章"
          }
        />
      </ListCard>
      <BadgeDialog
        badge={editing}
        existingKeys={all.map((badge) => badge.key)}
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </>
  );
}
