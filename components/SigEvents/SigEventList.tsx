"use client";

import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Plus,
  Rss,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Swal from "sweetalert2";
import type { TSigEvent } from "@/interfaces/Engagement";
import {
  type EventWhen,
  eventFailureMessage,
  removeSigEvent,
  sigCalendarIcsUrl,
} from "@/modules/sigEvents";
import { notice } from "@/utils/notice";
import {
  useInvalidateEvents,
  usePatchEvent,
  useSigEvents,
} from "@/utils/useSigEvents";
import { SigEventCard, type SigRef } from "./SigEventCard";
import { SigEventEditor } from "./SigEventEditor";

// 「活動」 of a SIG: the upcoming events (soonest first, an event that is
// on now included), then the past ones on request (newest first). The
// SIG's managers and admins add, edit and delete events here.

const PAGE_SIZE = 10;

const secondaryClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-50";

function EventSection({
  sig,
  when,
  canManage,
  variant,
  onEdit,
  onDelete,
  empty,
}: {
  sig: SigRef;
  when: EventWhen;
  canManage: boolean;
  variant: "desktop" | "mobile";
  onEdit: (event: TSigEvent) => void;
  onDelete: (event: TSigEvent) => void;
  empty: string;
}) {
  const list = useSigEvents(sig._id, when, PAGE_SIZE);
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];

  if (list.isPending) {
    return (
      <div aria-hidden className="flex flex-col gap-3">
        {["a", "b"].map((key) => (
          <div
            key={key}
            className="h-36 animate-pulse rounded-card border border-line bg-surface"
          />
        ))}
      </div>
    );
  }
  if (list.isError && items.length === 0) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface px-6 py-8 text-center text-ink-500 text-sm shadow-card"
      >
        <p>{list.error.message}</p>
        <button
          type="button"
          className={`${secondaryClass} h-9`}
          onClick={() => void list.refetch()}
        >
          重試
        </button>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="rounded-card border border-line border-dashed bg-surface/60 px-6 py-8 text-center text-ink-500 text-sm">
        {empty}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3" aria-label={empty}>
        {items.map((event) => (
          <li key={event._id}>
            <SigEventCard
              event={event}
              sig={sig}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
              variant={variant}
            />
          </li>
        ))}
      </ul>
      {list.hasNextPage && (
        <button
          type="button"
          className={`${secondaryClass} h-9 self-center`}
          disabled={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          {list.isFetchingNextPage ? "載入中…" : "載入更多"}
        </button>
      )}
    </div>
  );
}

export function SigEventList({
  sig,
  canManage = false,
  variant = "desktop",
}: {
  sig: SigRef;
  /** Leaders, 指導老師 and admins: 新增活動, 編輯, 刪除. */
  canManage?: boolean;
  variant?: "desktop" | "mobile";
}) {
  const mobile = variant === "mobile";
  const [showPast, setShowPast] = useState(false);
  const [editing, setEditing] = useState<TSigEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const patch = usePatchEvent();
  const invalidate = useInvalidateEvents();

  async function remove(event: TSigEvent) {
    const answer = await Swal.fire({
      icon: "warning",
      title: `刪除「${event.title}」？`,
      text:
        event.rsvpCount > 0
          ? `已經有 ${event.rsvpCount} 人報名，刪除後活動會從 SIG 頁消失。`
          : "刪除後活動會從 SIG 頁消失。",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
      confirmButtonColor: "#b42318",
      focusCancel: true,
    });
    if (!answer.isConfirmed) {
      return;
    }
    const result = await removeSigEvent(event._id);
    if (!result.ok) {
      notice("error", eventFailureMessage(result, "remove"));
      return;
    }
    notice("success", "已刪除活動");
    await invalidate(sig._id);
  }

  const height = mobile ? "h-10" : "h-9";

  return (
    <section
      aria-label={`${sig.name} 的活動`}
      className="flex flex-col gap-3"
      data-sig-events
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-1.5 font-bold text-ink-900 text-lg">
          <CalendarDays size={18} aria-hidden className="text-brand-700" />
          近期活動
        </h2>
        <span className="flex-1" />
        <a
          href={sigCalendarIcsUrl(sig._id)}
          download
          className={`${secondaryClass} ${height}`}
          title="把這個 SIG 的活動加到你的行事曆"
        >
          <Rss size={15} aria-hidden />
          SIG 行事曆
        </a>
        {canManage && (
          <Link
            href={`/admin/sigs/${sig._id}?tab=events`}
            className={`${secondaryClass} ${height}`}
            title="在管理平台查看報名名單、匯出 Excel"
          >
            <ClipboardList size={15} aria-hidden />
            報名名單
          </Link>
        )}
        {canManage && (
          <button
            type="button"
            className={`inline-flex ${height} shrink-0 cursor-pointer items-center gap-1.5 rounded-control bg-brand-700 px-3.5 font-semibold text-sm text-white transition-colors hover:bg-brand-800`}
            onClick={() => setCreating(true)}
          >
            <Plus size={16} aria-hidden />
            新增活動
          </button>
        )}
      </div>

      <EventSection
        sig={sig}
        when="upcoming"
        canManage={canManage}
        variant={variant}
        onEdit={setEditing}
        onDelete={(event) => void remove(event)}
        empty={
          canManage
            ? "還沒有排定的活動，按「新增活動」公布下一次社課"
            : "目前沒有排定的活動"
        }
      />

      <button
        type="button"
        className="flex cursor-pointer items-center gap-1 self-start font-semibold text-ink-700 text-sm hover:text-ink-900"
        aria-expanded={showPast}
        onClick={() => setShowPast((value) => !value)}
      >
        <ChevronDown
          size={16}
          aria-hidden
          className={`transition-transform ${showPast ? "rotate-180" : ""}`}
        />
        {showPast ? "隱藏過去的活動" : "過去的活動"}
      </button>
      {showPast && (
        <EventSection
          sig={sig}
          when="past"
          canManage={canManage}
          variant={variant}
          onEdit={setEditing}
          onDelete={(event) => void remove(event)}
          empty="還沒有結束的活動"
        />
      )}

      {canManage && (
        <SigEventEditor
          sigId={sig._id}
          event={editing}
          open={creating || Boolean(editing)}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(saved, created) => {
            notice(
              "success",
              created ? "已建立活動，成員會收到通知" : "已儲存活動",
            );
            patch(saved);
            void invalidate(sig._id);
          }}
        />
      )}
    </section>
  );
}
