"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CalendarPlus,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { SigEventEditor } from "@/components/SigEvents/SigEventEditor";
import type { TEventRsvp, TSigEvent } from "@/interfaces/Engagement";
import { ApiError } from "@/modules/api/client";
import {
  capacityText,
  type EventWhen,
  eventFailureMessage,
  eventIcsUrl,
  eventPhase,
  fetchAllRsvps,
  fetchRsvpPage,
  fetchSigEvents,
  formatEventTime,
  googleCalendarUrl,
  removeSigEvent,
} from "@/modules/sigEvents";
import { sigEventsKey, useInvalidateEvents } from "@/utils/useSigEvents";
import { errorText } from "../api";
import { type Column, DataTable, Truncate } from "../components/DataTable";
import { Drawer } from "../components/Drawer";
import { FilterBar, SelectFilter } from "../components/Filters";
import { ListCard } from "../components/ListCard";
import { useConfirm } from "../components/Modal";
import { Pagination } from "../components/Pagination";
import {
  Badge,
  Button,
  buttonClass,
  EmptyState,
  ErrorState,
  InfoRow,
  linkClass,
  Spinner,
} from "../components/ui";
import { formatCount, formatDateTime } from "../format";
import type { AdminSig } from "../types";
import { oneOf, useQueryState } from "../useQueryState";
import { downloadRsvps } from "../xlsx";

// 活動: the SIG's events for its leaders, 指導老師 and admins. The table
// lists them (即將舉行 includes events on now); a row opens the RSVP list
// with the Excel export. Create and edit use the same dialog as the SIG
// page (SigEventEditor).

const PAGE_SIZE = 20;
const RSVP_PAGE_SIZE = 50;
const WHEN = ["upcoming", "past", "all"] as const;
const WHEN_OPTIONS = [
  { value: "upcoming", label: "即將舉行" },
  { value: "past", label: "已結束" },
  { value: "all", label: "全部" },
];

function PhaseBadge({ event }: { event: TSigEvent }) {
  const phase = eventPhase(event);
  if (phase === "past") {
    return <Badge tone="mute">已結束</Badge>;
  }
  if (phase === "ongoing") {
    return <Badge tone="ok">進行中</Badge>;
  }
  return <Badge tone="info">即將舉行</Badge>;
}

function RsvpBadge({ event }: { event: TSigEvent }) {
  if (eventPhase(event) === "past") {
    return null;
  }
  if (!event.rsvpOpen) {
    return <Badge tone="warn">報名關閉</Badge>;
  }
  if (event.capacity > 0 && event.rsvpCount >= event.capacity) {
    return <Badge tone="danger">額滿</Badge>;
  }
  return null;
}

function useRsvps(eventId: string | null, page: number) {
  return useQuery({
    queryKey: [...sigEventsKey("rsvps"), eventId, page],
    queryFn: async ({ signal }) => {
      const result = await fetchRsvpPage(
        eventId ?? "",
        { skip: (page - 1) * RSVP_PAGE_SIZE, limit: RSVP_PAGE_SIZE },
        signal,
      );
      if (!result.ok) {
        throw new ApiError({
          ...result,
          message: eventFailureMessage(result, "load"),
        });
      }
      return result.data;
    },
    enabled: Boolean(eventId),
    placeholderData: keepPreviousData,
  });
}

function RsvpList({ event, sig }: { event: TSigEvent; sig: AdminSig }) {
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const rsvps = useRsvps(event._id, page);
  const rows: TEventRsvp[] = rsvps.data?.items ?? [];
  const total = rsvps.data?.total ?? event.rsvpCount;

  const exportAll = async () => {
    setExporting(true);
    const result = await fetchAllRsvps(event._id);
    if (!result.ok) {
      setExporting(false);
      toast.error(eventFailureMessage(result.failure, "load"));
      return;
    }
    if (result.items.length === 0) {
      setExporting(false);
      toast.error("還沒有人報名，沒有名單可以匯出");
      return;
    }
    try {
      await downloadRsvps(sig.name, event, result.items);
      toast.success(`已匯出 ${result.items.length} 位報名者`);
    } catch (error) {
      console.error("RSVP export failed:", error);
      toast.error("匯出失敗，請稍後再試");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section aria-labelledby={`rsvps-${event._id}`} className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <h3
          id={`rsvps-${event._id}`}
          className="flex-1 font-bold text-ink-900 text-sm"
        >
          報名名單
          <span className="ml-1.5 font-normal text-ink-500">
            {formatCount(total)} 人
          </span>
        </h3>
        <Button
          size="sm"
          onClick={() => void exportAll()}
          loading={exporting}
          disabled={total === 0}
        >
          <Download aria-hidden className="size-3.5" />
          匯出 Excel
        </Button>
      </div>
      {rsvps.isError ? (
        <ErrorState
          message={errorText(rsvps.error)}
          onRetry={() => void rsvps.refetch()}
        />
      ) : rsvps.isPending ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="py-3 text-ink-500 text-sm">還沒有人報名</p>
      ) : (
        <>
          <ol
            className="divide-y divide-line rounded-control border border-line"
            aria-busy={rsvps.isFetching || undefined}
          >
            {rows.map((row, index) => (
              <li
                key={row.user._id}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <span className="w-7 shrink-0 text-ink-400 text-xs tabular-nums">
                  {(page - 1) * RSVP_PAGE_SIZE + index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <Truncate className="font-medium text-ink-900">
                    {row.user.name || "（未命名）"}
                  </Truncate>
                  <Truncate className="text-ink-500 text-xs">
                    {[
                      row.user.class,
                      row.user.customId ? `@${row.user.customId}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </Truncate>
                </span>
                <span className="shrink-0 text-ink-500 text-xs tabular-nums">
                  {formatDateTime(row.createdAt)}
                </span>
              </li>
            ))}
          </ol>
          {total > RSVP_PAGE_SIZE && (
            <div className="mt-2">
              <Pagination
                page={page}
                pageSize={RSVP_PAGE_SIZE}
                total={total}
                unit="人"
                onPage={setPage}
                disabled={rsvps.isFetching}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function EventsTab({ sig }: { sig: AdminSig }) {
  const { get, set } = useQueryState();
  const when: EventWhen = oneOf(get("when"), WHEN, "upcoming");
  const page = Math.max(1, Number(get("page")) || 1);
  const confirm = useConfirm();
  const invalidate = useInvalidateEvents();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<TSigEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const events = useQuery({
    queryKey: [...sigEventsKey(sig._id), "admin", when, page],
    queryFn: async ({ signal }) => {
      const result = await fetchSigEvents(
        sig._id,
        { when, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE },
        signal,
      );
      if (!result.ok) {
        throw new ApiError({
          ...result,
          message: eventFailureMessage(result, "load"),
        });
      }
      return result.data;
    },
    placeholderData: keepPreviousData,
  });
  const items = events.data?.items ?? [];
  const total = events.data?.total ?? 0;
  const current = items.find((event) => event._id === openId) ?? null;

  const remove = async (event: TSigEvent) => {
    const ok = await confirm({
      title: `刪除「${event.title}」？`,
      description:
        event.rsvpCount > 0
          ? `已經有 ${event.rsvpCount} 人報名。刪除後活動會從 SIG 頁消失，報名名單也無法再查看。`
          : "刪除後活動會從 SIG 頁消失。",
      confirmLabel: "刪除活動",
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    setBusy(event._id);
    const result = await removeSigEvent(event._id);
    setBusy(null);
    if (!result.ok) {
      toast.error(eventFailureMessage(result, "remove"));
      return;
    }
    toast.success("已刪除活動");
    setOpenId(null);
    await invalidate(sig._id);
  };

  const columns: Column<TSigEvent>[] = [
    {
      key: "title",
      header: "活動",
      primary: true,
      cell: (event) => (
        <span className="flex min-w-0 flex-col">
          <Truncate className="font-medium text-ink-900">
            {event.title}
          </Truncate>
          <Truncate className="text-ink-500 text-xs">
            {formatEventTime(event)}
          </Truncate>
        </span>
      ),
    },
    {
      key: "location",
      header: "地點",
      className: "w-[20%]",
      optional: true,
      cell: (event) => <Truncate>{event.location || "—"}</Truncate>,
    },
    {
      key: "rsvp",
      header: "報名",
      className: "w-[8.5rem]",
      cell: (event) => (
        <span className="tabular-nums">
          {formatCount(event.rsvpCount)}
          {event.capacity > 0 ? ` / ${formatCount(event.capacity)}` : ""}
          <span className="text-ink-400"> 人</span>
        </span>
      ),
    },
    {
      key: "state",
      header: "狀態",
      className: "w-[10rem]",
      cell: (event) => (
        <span className="flex flex-wrap gap-1">
          <PhaseBadge event={event} />
          <RsvpBadge event={event} />
        </span>
      ),
    },
  ];

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <ListCard
          toolbar={
            <FilterBar>
              <SelectFilter
                label="顯示"
                value={when}
                options={WHEN_OPTIONS}
                onChange={(next) =>
                  set({
                    when: next === "upcoming" ? null : next,
                    page: null,
                  })
                }
                className="sm:w-36"
              />
              <span className="hidden flex-1 sm:block" />
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus aria-hidden className="size-4" />
                新增活動
              </Button>
            </FilterBar>
          }
          footer={
            total > PAGE_SIZE ? (
              <div className="sm:ml-auto">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  unit="場"
                  onPage={(next) => set({ page: next > 1 ? next : null })}
                  disabled={events.isFetching}
                />
              </div>
            ) : undefined
          }
        >
          <DataTable
            caption={`${sig.name} 的活動`}
            rows={items}
            rowKey={(event) => event._id}
            rowLabel={(event) => event.title}
            columns={columns}
            card={(event) => (
              <span className="flex flex-col gap-1">
                <span className="flex min-w-0 items-center gap-1.5">
                  <PhaseBadge event={event} />
                  <RsvpBadge event={event} />
                  <span className="truncate font-semibold text-ink-900 text-sm">
                    {event.title}
                  </span>
                </span>
                <span className="text-ink-500 text-xs">
                  {formatEventTime(event)}
                  {event.location ? ` · ${event.location}` : ""}
                </span>
                <span className="text-ink-700 text-xs">
                  {capacityText(event)}
                </span>
              </span>
            )}
            onOpen={(event) => setOpenId(event._id)}
            activeKey={openId}
            compact={Boolean(current)}
            loading={events.isPending}
            fetching={events.isFetching && !events.isPending}
            error={events.isError ? errorText(events.error) : null}
            onRetry={() => void events.refetch()}
            empty={
              <EmptyState
                title={
                  when === "past"
                    ? "還沒有結束的活動"
                    : when === "all"
                      ? "還沒有活動"
                      : "目前沒有排定的活動"
                }
              >
                {when !== "past" &&
                  "按「新增活動」公布社課或活動，成員會收到通知。"}
              </EmptyState>
            }
          />
        </ListCard>
      </div>

      <Drawer
        open={Boolean(current)}
        onClose={() => setOpenId(null)}
        title={current?.title ?? ""}
        subtitle={current && formatEventTime(current)}
        footer={
          current && (
            <>
              <Button size="sm" onClick={() => setEditing(current)}>
                <Pencil aria-hidden className="size-3.5" />
                編輯
              </Button>
              {sig.customId && (
                <Link
                  href={`/@${sig.customId}?tab=events`}
                  target="_blank"
                  className={buttonClass("secondary", "sm")}
                >
                  <ExternalLink aria-hidden className="size-3.5" />
                  在網站上查看
                </Link>
              )}
              <Button
                size="sm"
                variant="danger-outline"
                onClick={() => void remove(current)}
                loading={busy === current._id}
                className="ml-auto"
              >
                <Trash2 aria-hidden className="size-3.5" />
                刪除
              </Button>
            </>
          )
        }
      >
        {current && (
          <>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <PhaseBadge event={current} />
              <RsvpBadge event={current} />
              {current.rsvpOpen ? (
                <Badge tone="ok">開放報名</Badge>
              ) : (
                <Badge tone="mute">不開放報名</Badge>
              )}
            </div>
            <dl>
              <InfoRow label="時間">{formatEventTime(current)}</InfoRow>
              <InfoRow label="地點">{current.location || "—"}</InfoRow>
              <InfoRow label="名額">
                {current.capacity > 0
                  ? `${formatCount(current.capacity)} 人`
                  : "不限"}
              </InfoRow>
              <InfoRow label="報名">{capacityText(current)}</InfoRow>
              {current.description && (
                <InfoRow label="說明">
                  <span className="whitespace-pre-line">
                    {current.description}
                  </span>
                </InfoRow>
              )}
              <InfoRow label="行事曆">
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  <a
                    href={googleCalendarUrl(current, {
                      sigName: sig.name,
                      sigCustomId: sig.customId,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${linkClass} inline-flex items-center gap-1`}
                  >
                    <CalendarPlus aria-hidden className="size-3.5" />
                    Google 日曆
                  </a>
                  <a
                    href={eventIcsUrl(current._id)}
                    download
                    className={linkClass}
                  >
                    .ics
                  </a>
                </span>
              </InfoRow>
            </dl>
            <RsvpList key={current._id} event={current} sig={sig} />
          </>
        )}
      </Drawer>

      <SigEventEditor
        sigId={sig._id}
        event={editing}
        open={creating || Boolean(editing)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={(_saved, created) => {
          toast.success(created ? "已建立活動，成員會收到通知" : "已儲存活動");
          void invalidate(sig._id);
        }}
      />
    </div>
  );
}
