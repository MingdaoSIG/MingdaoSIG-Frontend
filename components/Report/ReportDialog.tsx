"use client";

import { useCallback, useId, useState } from "react";
import { Modal } from "@/components/Modal";
import { toast } from "@/components/mobile/Toast";
import type { ReportReason, ReportTarget } from "@/interfaces/Reading";
import { apiRequest } from "@/modules/api/client";
import { CustomStatus } from "@/modules/customStatusCode";
import { promptLogin } from "@/utils/loginPrompt";
import { notice } from "@/utils/notice";
import { isMobileViewport } from "@/utils/useIsMobile";
import { useUserAccount } from "@/utils/useUserAccount";

// 檢舉 a post or a comment (contract v4 §4.6): pick a reason, add a note,
// send. The backend allows one open report per person and target (4029)
// and refuses reports on your own content (4001).

export const REPORT_REASONS: {
  value: ReportReason;
  label: string;
  hint: string;
}[] = [
  {
    value: "spam",
    label: "垃圾訊息或廣告",
    hint: "洗版、廣告、與 SIG 無關的推銷",
  },
  {
    value: "harassment",
    label: "騷擾或霸凌",
    hint: "人身攻擊、嘲諷、針對特定人",
  },
  {
    value: "inappropriate",
    label: "不當內容",
    hint: "暴力、色情、歧視或令人不適",
  },
  { value: "privacy", label: "侵犯隱私", hint: "公開他人的個資、照片或對話" },
  { value: "other", label: "其他", hint: "請在下方說明" },
];

export const REPORT_NOTE_MAX = 300;

type Open = { target: ReportTarget; label: string };

function ReportDialog({
  open,
  onClose,
}: {
  open: Open | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = useId();
  const noteId = useId();
  const tooLong = note.length > REPORT_NOTE_MAX;
  const needsNote = reason === "other" && note.trim().length === 0;
  const canSend = Boolean(reason) && !tooLong && !needsNote && !sending;
  const kind = open?.target.kind === "comment" ? "留言" : "貼文";

  function close() {
    if (sending) {
      return;
    }
    setReason(null);
    setNote("");
    setError(null);
    onClose();
  }

  async function send() {
    if (!open || !reason || !canSend) {
      return;
    }
    setSending(true);
    setError(null);
    const result = await apiRequest("/report", {
      method: "POST",
      auth: true,
      body: { target: open.target, reason, note: note.trim() },
    });
    setSending(false);
    if (result.ok) {
      setReason(null);
      setNote("");
      onClose();
      notice("success", "已送出檢舉，管理員會盡快處理");
      return;
    }
    if (result.status === CustomStatus.ALREADY_APPLIED) {
      setReason(null);
      setNote("");
      onClose();
      notice("info", `你已經檢舉過這則${kind}，管理員處理中`);
      return;
    }
    if (result.status === CustomStatus.FORBIDDEN) {
      setError(`不能檢舉自己的${kind}`);
      return;
    }
    setError(`沒有送出：${result.message}`);
  }

  return (
    <Modal
      open={Boolean(open)}
      onClose={close}
      title={`檢舉${kind}`}
      busy={sending}
      footer={
        <>
          <button
            type="button"
            onClick={close}
            disabled={sending}
            className="h-10 cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className="h-10 cursor-pointer rounded-control bg-danger-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-danger-700/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "送出中…" : "送出檢舉"}
          </button>
        </>
      }
    >
      {open && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <p className="line-clamp-2 rounded-control bg-field px-3 py-2 text-ink-700 text-sm">
            {open.label}
          </p>
          <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
            <legend className="mb-1.5 p-0 font-semibold text-ink-900 text-sm">
              原因
            </legend>
            {REPORT_REASONS.map((item) => (
              <label
                key={item.value}
                className={`flex cursor-pointer items-start gap-3 rounded-control border px-3 py-2.5 transition-colors ${
                  reason === item.value
                    ? "border-brand-700 bg-brand-50"
                    : "border-line hover:bg-field"
                }`}
              >
                <input
                  type="radio"
                  name={name}
                  value={item.value}
                  checked={reason === item.value}
                  onChange={() => setReason(item.value)}
                  className="mt-1 size-4 shrink-0 accent-brand-700"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold text-ink-900 text-sm">
                    {item.label}
                  </span>
                  <span className="text-ink-500 text-xs leading-5">
                    {item.hint}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={noteId}
              className="font-semibold text-ink-900 text-sm"
            >
              補充說明{reason === "other" ? "" : "（選填）"}
            </label>
            <textarea
              id={noteId}
              value={note}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
              placeholder="讓管理員更快了解狀況"
              className="w-full resize-none rounded-control border border-line-strong bg-surface px-3 py-2 text-[16px] text-ink-800 leading-[1.6] placeholder:text-ink-400 focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/20 sm:text-sm"
            />
            <span
              className={`self-end text-xs tabular-nums ${
                tooLong ? "text-danger-700" : "text-ink-500"
              }`}
              aria-live="polite"
            >
              {note.length}/{REPORT_NOTE_MAX}
            </span>
          </div>
          <p className="text-ink-500 text-xs leading-5">
            檢舉不會通知作者。管理員處理後，你會收到通知。
          </p>
          {error && (
            <p role="alert" className="text-danger-700 text-sm">
              {error}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}

/**
 * `open(target, label)` starts a report; render `dialog` once. Logged out,
 * it explains that reporting needs an account instead.
 */
export function useReport() {
  const { isLogin, isLoading, login } = useUserAccount();
  const [current, setCurrent] = useState<Open | null>(null);

  const open = useCallback(
    (target: ReportTarget, label: string) => {
      if (isLoading) {
        return;
      }
      if (!isLogin) {
        if (isMobileViewport()) {
          toast.info("登入後才能檢舉", {
            key: "login",
            action: { label: "登入", onClick: () => login() },
          });
        } else {
          promptLogin(login, { text: "登入後才能檢舉內容。" });
        }
        return;
      }
      setCurrent({ target, label });
    },
    [isLogin, isLoading, login],
  );

  const dialog = (
    <ReportDialog open={current} onClose={() => setCurrent(null)} />
  );
  return { open, dialog };
}
