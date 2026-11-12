"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CloudCheck,
  CloudExclamationPoint,
  CloudUpload,
  FilePlus,
  FileText,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import type { TDraftSummary } from "@/interfaces/Reading";
import { ApiError } from "@/modules/api/client";
import {
  DRAFT_LIMIT,
  deleteDraft,
  draftKeys,
  listDrafts,
} from "@/modules/drafts";
import relativeTime from "@/modules/relativeTime";
import { notice } from "@/utils/notice";
import type { DraftStatus } from "./useCloudDraft";

// The cloud-draft strip above the editor (contract v4 §4.5): the save
// state (「已儲存到雲端 hh:mm」), the 「草稿」 list to resume or delete a
// draft, and the one-time offer to upload the draft kept on this device.

export function formatClock(date: Date) {
  return date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function DraftStatusText({
  status,
  onRetry,
  onManage,
}: {
  status: DraftStatus;
  onRetry: () => void;
  onManage: () => void;
}) {
  const base = "flex min-w-0 items-center gap-1.5 text-[13px]";
  switch (status.kind) {
    case "off":
      return null;
    case "idle":
      return (
        <span className={`${base} text-ink-500`}>
          <CloudUpload aria-hidden className="size-4 shrink-0" />
          開始寫，就會自動存到雲端
        </span>
      );
    case "pending":
      return (
        <span className={`${base} text-ink-500`}>
          <CloudUpload aria-hidden className="size-4 shrink-0" />
          有尚未儲存的變更
        </span>
      );
    case "saving":
      return (
        <span className={`${base} text-ink-500`}>
          <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin" />
          儲存中…
        </span>
      );
    case "saved":
      return (
        <span className={`${base} text-ok-700`}>
          <CloudCheck aria-hidden className="size-4 shrink-0" />
          已儲存到雲端 {formatClock(status.at)}
        </span>
      );
    case "full":
      return (
        <span className={`${base} text-danger-700`}>
          <CloudExclamationPoint aria-hidden className="size-4 shrink-0" />
          <span className="line-clamp-2 min-w-0">
            雲端草稿已滿（最多 {DRAFT_LIMIT} 份），這份還沒存到雲端
          </span>
          <button
            type="button"
            onClick={onManage}
            className="shrink-0 cursor-pointer font-semibold underline underline-offset-2"
          >
            管理草稿
          </button>
        </span>
      );
    case "error":
      return (
        <span className={`${base} text-danger-700`}>
          <CloudExclamationPoint aria-hidden className="size-4 shrink-0" />
          <span className="line-clamp-2 min-w-0">
            無法儲存到雲端：{status.message}，稍後會自動重試
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 cursor-pointer font-semibold underline underline-offset-2"
          >
            重試
          </button>
        </span>
      );
    default:
      return null;
  }
}

export function useDraftList(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: draftKeys.list(userId),
    queryFn: async ({ signal }) => {
      const result = await listDrafts(signal);
      if (!result.ok) {
        throw new ApiError(result);
      }
      return result.data;
    },
    enabled: enabled && Boolean(userId),
    staleTime: 0,
  });
}

export function DraftList({
  userId,
  currentId,
  onResume,
  onNew,
  onDeleted,
  mobile,
}: {
  userId: string;
  currentId: string | null;
  onResume: (draft: TDraftSummary) => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
  mobile: boolean;
}) {
  const client = useQueryClient();
  const drafts = useDraftList(userId, true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const items = drafts.data ?? [];
  const row = mobile ? "min-h-11" : "min-h-9";

  // Asked in place: a SweetAlert would open under the dialog.
  async function remove(draft: TDraftSummary) {
    setConfirming(null);
    setDeleting(draft._id);
    const result = await deleteDraft(draft._id);
    setDeleting(null);
    if (!result.ok && result.kind !== "not-found") {
      notice("error", `刪除失敗：${result.message}`);
      return;
    }
    client.setQueryData<TDraftSummary[]>(draftKeys.list(userId), (old) =>
      (old ?? []).filter((item) => item._id !== draft._id),
    );
    onDeleted(draft._id);
    notice("success", "已刪除草稿");
  }

  return (
    <div className="flex flex-col gap-3" data-drafts>
      <div className="flex items-center justify-between gap-2">
        <p className="text-ink-500 text-sm">
          {drafts.data
            ? `${items.length} / ${DRAFT_LIMIT} 份`
            : drafts.isError
              ? ""
              : "載入中…"}
        </p>
        <button
          type="button"
          onClick={onNew}
          className={`flex cursor-pointer items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-800 text-sm hover:bg-field ${row}`}
        >
          <FilePlus aria-hidden className="size-4" />
          開新草稿
        </button>
      </div>
      {drafts.isError ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm">
          <p className="text-danger-700">
            草稿載入失敗：
            {drafts.error instanceof ApiError
              ? drafts.error.message
              : "請稍後再試"}
          </p>
          <button
            type="button"
            className="cursor-pointer font-semibold text-brand-700 hover:underline"
            onClick={() => drafts.refetch()}
          >
            重試
          </button>
        </div>
      ) : drafts.data && items.length === 0 ? (
        <p className="rounded-control bg-field px-3 py-6 text-center text-ink-500 text-sm">
          還沒有雲端草稿
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((draft) => {
            const current = draft._id === currentId;
            return (
              <li
                key={draft._id}
                className={`flex items-start gap-3 rounded-control border p-3 ${
                  current ? "border-brand-700/50 bg-brand-50" : "border-line"
                }`}
                data-draft={draft._id}
              >
                <FileText
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-ink-500"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-ink-900 text-sm">
                      {draft.title || "未命名草稿"}
                    </span>
                    {current && (
                      <span className="shrink-0 rounded-chip bg-surface px-1.5 font-semibold text-[11px] text-brand-800">
                        目前
                      </span>
                    )}
                    {draft.post && (
                      <span className="shrink-0 rounded-chip bg-warm-50 px-1.5 font-semibold text-[11px] text-warm-600">
                        編輯中的貼文
                      </span>
                    )}
                  </p>
                  {draft.excerpt && (
                    <p className="mt-0.5 line-clamp-2 text-ink-700 text-xs leading-5">
                      {draft.excerpt}
                    </p>
                  )}
                  <p className="mt-0.5 text-ink-500 text-xs">
                    {draft.updatedAt
                      ? `${relativeTime(draft.updatedAt)}儲存`
                      : ""}
                  </p>
                </div>
                {confirming === draft._id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-danger-700 text-xs">刪除？</span>
                    <button
                      type="button"
                      onClick={() => setConfirming(null)}
                      className={`cursor-pointer rounded-control border border-line-strong bg-surface px-2.5 font-semibold text-ink-700 text-xs hover:bg-field ${row}`}
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(draft)}
                      className={`cursor-pointer rounded-control bg-danger-700 px-2.5 font-semibold text-white text-xs hover:bg-danger-700/90 ${row}`}
                    >
                      刪除
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    {!current && (
                      <button
                        type="button"
                        onClick={() => onResume(draft)}
                        className={`cursor-pointer rounded-control bg-brand-700 px-3 font-semibold text-white text-xs hover:bg-brand-800 ${row}`}
                      >
                        繼續編輯
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirming(draft._id)}
                      disabled={deleting === draft._id}
                      aria-label={`刪除草稿：${draft.title || "未命名草稿"}`}
                      className={`flex cursor-pointer items-center justify-center rounded-control text-ink-500 hover:bg-field hover:text-danger-700 disabled:opacity-40 ${
                        mobile ? "size-11" : "size-9"
                      }`}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** 「草稿」: the list in a dialog (desktop) or a sheet (phones). */
export function DraftsDialog({
  open,
  onClose,
  mobile,
  ...list
}: {
  open: boolean;
  onClose: () => void;
  mobile: boolean;
  userId: string;
  currentId: string | null;
  onResume: (draft: TDraftSummary) => void;
  onNew: () => void;
  onDeleted: (id: string) => void;
}) {
  if (mobile) {
    return (
      <BottomSheet open={open} onClose={onClose} title="雲端草稿">
        {open && <DraftList {...list} mobile />}
      </BottomSheet>
    );
  }
  return (
    <Modal open={open} onClose={onClose} title="雲端草稿">
      <DraftList {...list} mobile={false} />
    </Modal>
  );
}

/** Asked once: 「把這台裝置上的草稿存到雲端」. */
export function LocalDraftOffer({
  title,
  busy,
  onUpload,
  onDismiss,
  mobile,
}: {
  title: string;
  busy: boolean;
  onUpload: () => void;
  onDismiss: () => void;
  mobile: boolean;
}) {
  return (
    <section
      aria-label="這台裝置上的草稿"
      className={`flex gap-x-4 gap-y-2 rounded-card border border-brand-700/25 bg-brand-50 px-4 py-2.5 text-ink-800 text-sm ${
        mobile ? "flex-col" : "items-center"
      }`}
    >
      <p className={`leading-6 ${mobile ? "" : "min-w-0 flex-1"}`}>
        這台裝置上有一份登入前寫的草稿
        {title ? `「${title}」` : ""}
        。存到雲端後，換裝置也能繼續寫。
      </p>
      <div className={`flex shrink-0 gap-2 ${mobile ? "*:flex-1" : ""}`}>
        <button
          type="button"
          onClick={onDismiss}
          disabled={busy}
          className={`cursor-pointer rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 hover:bg-field disabled:opacity-50 ${
            mobile ? "h-11" : "h-9"
          }`}
        >
          不用了
        </button>
        <button
          type="button"
          onClick={onUpload}
          disabled={busy}
          className={`cursor-pointer rounded-control bg-brand-700 px-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-50 ${
            mobile ? "h-11" : "h-9"
          }`}
        >
          {busy ? "上傳中…" : "把這台裝置上的草稿存到雲端"}
        </button>
      </div>
    </section>
  );
}

/** The strip: status on the left, 「草稿」 on the right. */
export function DraftBar({
  status,
  onRetry,
  onOpenList,
  mobile,
}: {
  status: DraftStatus;
  onRetry: () => void;
  onOpenList: () => void;
  mobile: boolean;
}) {
  if (status.kind === "off") {
    return null;
  }
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        mobile ? "w-full" : "min-h-9"
      }`}
      aria-live="polite"
      data-draft-status={status.kind}
    >
      <DraftStatusText
        status={status}
        onRetry={onRetry}
        onManage={onOpenList}
      />
      <button
        type="button"
        onClick={onOpenList}
        className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm shadow-card hover:bg-field ${
          mobile ? "h-11" : "h-9"
        }`}
      >
        <FileText aria-hidden className="size-4" />
        草稿
      </button>
    </div>
  );
}
