"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { errorText, PAGE_SIZE, useAudit, useSigNames } from "../(admin)/api";
import {
  AUDIT_ACTIONS,
  actionLabel,
  actionTone,
  auditDetail,
  TARGET_KINDS,
  targetHref,
  targetKindLabel,
  targetText,
} from "../(admin)/auditLabels";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  type Column,
  DataTable,
  Truncate,
} from "../(admin)/components/DataTable";
import { Drawer } from "../(admin)/components/Drawer";
import {
  FilterBar,
  FilterChip,
  SelectFilter,
} from "../(admin)/components/Filters";
import { ListCard } from "../(admin)/components/ListCard";
import { Pagination, pageCount } from "../(admin)/components/Pagination";
import { Badge, Button, InfoRow, linkClass } from "../(admin)/components/ui";
import { useAdmin } from "../(admin)/context";
import { formatCount, formatDateTime, formatRelative } from "../(admin)/format";
import type { AuditEntry } from "../(admin)/types";
import { useQueryState } from "../(admin)/useQueryState";

// 操作紀錄: who pinned, removed, changed a permission or a SIG, and when.

function actorName(entry: AuditEntry) {
  return entry.actor?.name || entry.actor?.customId || "已刪除的使用者";
}

export default function AdminAuditPage() {
  const admin = useAdmin();
  const { get, set, page } = useQueryState();
  const action = get("action");
  const actor = get("actor");
  const actorLabel = get("actorName");
  const targetKind = get("targetKind");
  const targetId = get("targetId");

  const audit = useAudit({
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    action: action || undefined,
    actor: actor || undefined,
    targetKind: targetKind || undefined,
    targetId: targetId || undefined,
  });
  const [open, setOpen] = useState<AuditEntry | null>(null);
  const { names } = useSigNames();

  const items = audit.data?.items ?? [];
  const total = audit.data?.total ?? 0;
  const pages = pageCount(total, PAGE_SIZE);

  useEffect(() => {
    if (audit.isSuccess && !audit.isPlaceholderData && page > pages) {
      set({ page: pages > 1 ? pages : null }, { replace: true });
    }
  }, [audit.isSuccess, audit.isPlaceholderData, page, pages]);

  const current = useMemo(
    () => (open ? (items.find((e) => e._id === open._id) ?? open) : null),
    [open, items],
  );

  const filterActor = (entry: AuditEntry) => {
    if (entry.actor?._id) {
      set({ actor: entry.actor._id, actorName: actorName(entry) });
    }
  };

  const columns: Column<AuditEntry>[] = [
    {
      key: "time",
      header: "時間",
      className: "w-[9.5rem]",
      primary: true,
      cell: (entry) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatDateTime(entry.createdAt)}
        </span>
      ),
    },
    {
      key: "actor",
      header: "操作者",
      className: "w-[16%]",
      cell: (entry) =>
        entry.actor?._id && entry.actor._id !== actor ? (
          <button
            type="button"
            onClick={() => filterActor(entry)}
            title="只看這個人的操作"
            className="block max-w-full cursor-pointer truncate text-left text-ink-800 hover:text-brand-700 hover:underline"
          >
            {actorName(entry)}
          </button>
        ) : (
          <Truncate>{actorName(entry)}</Truncate>
        ),
    },
    {
      key: "action",
      header: "動作",
      className: "w-[10rem]",
      cell: (entry) => (
        <Badge tone={actionTone(entry)}>{actionLabel(entry)}</Badge>
      ),
    },
    {
      key: "target",
      header: "對象",
      cell: (entry) => (
        <Truncate>
          {`${targetKindLabel(entry.target.kind)}：${targetText(entry, names)}`}
        </Truncate>
      ),
    },
    {
      key: "detail",
      optional: true,
      header: "細節",
      className: "w-[18%]",
      cell: (entry) => (
        <Truncate className="text-ink-500">
          {auditDetail(entry) || "—"}
        </Truncate>
      ),
    },
  ];

  const filtered = Boolean(action || actor || targetKind || targetId);
  const href = current ? targetHref(current) : null;

  return (
    <>
      <PageHeader
        title="操作紀錄"
        description={
          audit.data ? `共 ${formatCount(total)} 筆，最新的在最前面` : "載入中…"
        }
      />
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <ListCard
            toolbar={
              <div className="flex flex-col gap-2">
                <FilterBar>
                  <SelectFilter
                    label="動作"
                    value={action}
                    options={[
                      { value: "", label: "全部動作" },
                      ...AUDIT_ACTIONS.map((a) => ({
                        value: a.id,
                        label: a.label,
                      })),
                    ]}
                    onChange={(next) => set({ action: next })}
                    className="sm:w-48"
                  />
                  <SelectFilter
                    label="對象"
                    value={targetKind}
                    options={[
                      { value: "", label: "全部對象" },
                      ...TARGET_KINDS.map((kind) => ({
                        value: kind.id,
                        label: kind.label,
                      })),
                    ]}
                    onChange={(next) =>
                      set({ targetKind: next, targetId: null })
                    }
                    className="sm:w-36"
                  />
                  {actor !== admin.userId && (
                    <Button
                      onClick={() =>
                        set({ actor: admin.userId, actorName: "我" })
                      }
                    >
                      只看我的操作
                    </Button>
                  )}
                </FilterBar>
                {(actor || targetId) && (
                  <div className="flex flex-wrap gap-2">
                    {actor && (
                      <FilterChip
                        label={`操作者：${actorLabel || actor}`}
                        onClear={() => set({ actor: null, actorName: null })}
                      />
                    )}
                    {targetId && (
                      <FilterChip
                        label={`對象 ID：${targetId}`}
                        onClear={() => set({ targetId: null })}
                      />
                    )}
                  </div>
                )}
              </div>
            }
            footer={
              <div className="sm:ml-auto">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  unit="筆"
                  onPage={(next) => set({ page: next > 1 ? next : null })}
                  disabled={audit.isFetching}
                />
              </div>
            }
          >
            <DataTable
              caption="操作紀錄"
              rows={items}
              rowKey={(entry) => entry._id}
              rowLabel={(entry) =>
                `${actorName(entry)} ${actionLabel(entry)} ${entry.target.label ?? ""}`
              }
              columns={columns}
              card={(entry) => (
                <span className="flex flex-col gap-1">
                  <span className="flex items-center gap-1.5">
                    <Badge tone={actionTone(entry)}>{actionLabel(entry)}</Badge>
                    <span className="truncate text-ink-900 text-sm">
                      {targetText(entry, names)}
                    </span>
                  </span>
                  <span className="truncate text-ink-500 text-xs">
                    {actorName(entry)} · {formatRelative(entry.createdAt)}
                    {auditDetail(entry) && ` · ${auditDetail(entry)}`}
                  </span>
                </span>
              )}
              onOpen={(entry) => setOpen(entry)}
              activeKey={current?._id}
              compact={Boolean(current)}
              loading={audit.isPending}
              fetching={audit.isFetching && !audit.isPending}
              error={audit.isError ? errorText(audit.error) : null}
              onRetry={() => audit.refetch()}
              empty={filtered ? "沒有符合條件的紀錄" : "還沒有任何操作紀錄"}
            />
          </ListCard>
        </div>

        <Drawer
          open={Boolean(current)}
          onClose={() => setOpen(null)}
          title={current ? actionLabel(current) : ""}
          subtitle={current && formatDateTime(current.createdAt)}
          footer={
            current && (
              <>
                {current.actor?._id && current.actor._id !== actor && (
                  <Button size="sm" onClick={() => filterActor(current)}>
                    只看 {actorName(current)} 的操作
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    set({
                      targetKind: current.target.kind,
                      targetId: current.target.id,
                    })
                  }
                >
                  這個對象的所有紀錄
                </Button>
              </>
            )
          }
        >
          {current && (
            <dl>
              <InfoRow label="操作者">
                {actorName(current)}
                {current.actor?.customId && ` @${current.actor.customId}`}
              </InfoRow>
              <InfoRow label="動作">{actionLabel(current)}</InfoRow>
              <InfoRow label="對象">
                {targetKindLabel(current.target.kind)}：
                {href ? (
                  <Link href={href} className={linkClass}>
                    {targetText(current, names)}
                  </Link>
                ) : (
                  targetText(current, names)
                )}
              </InfoRow>
              <InfoRow label="對象 ID">
                <code className="break-all text-xs">{current.target.id}</code>
              </InfoRow>
              {auditDetail(current) && (
                <InfoRow label="細節">{auditDetail(current)}</InfoRow>
              )}
              {current.meta && Object.keys(current.meta).length > 0 && (
                <InfoRow label="原始資料">
                  <pre className="whitespace-pre-wrap break-all rounded-control bg-field px-2 py-1.5 text-ink-700 text-xs">
                    {JSON.stringify(current.meta, null, 2)}
                  </pre>
                </InfoRow>
              )}
            </dl>
          )}
        </Drawer>
      </div>
    </>
  );
}
