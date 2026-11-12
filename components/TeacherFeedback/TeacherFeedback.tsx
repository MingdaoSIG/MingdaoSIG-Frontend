"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Lock, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import Swal from "sweetalert2";
import type { TFeedback } from "@/interfaces/Engagement";
import type { Sig } from "@/interfaces/Sig";
import type { TThread } from "@/interfaces/Thread";
import type { User } from "@/interfaces/User";
import { ApiError } from "@/modules/api/client";
import {
  createFeedback,
  editFeedback,
  FEEDBACK_MAX,
  feedbackFailureMessage,
  feedbackLength,
  feedbackOf,
  fetchFeedback,
  removeFeedback,
} from "@/modules/feedback";
import { DEFAULT_AVATAR_URL, imageUrl } from "@/modules/imageUrl";
import { notice } from "@/utils/notice";
import useSig from "@/utils/useSig";
import { useUserAccount } from "@/utils/useUserAccount";

// 老師回饋 on the post page (design/api-contract-v4.md §3.2), anchored at
// #feedback. Shown only to the post's author, the moderators (指導老師)
// of its SIG and admins; teachers and admins get an editor. The author
// sees it only once there is feedback.

const ADMIN_PERMISSION = 2;

function idOf(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  return (value as User | Sig | null)?._id;
}

/** Who may read and write feedback on this post. */
export function useFeedbackAccess(post: TThread) {
  const { isLogin, userData, isLoading } = useUserAccount();
  const userId = isLogin ? (userData?._id ?? "") : "";
  const isAdmin = Boolean(userId) && userData?.permission === ADMIN_PERMISSION;
  const isAuthor = Boolean(userId) && idOf(post.user) === userId;
  const { data: sig, isPending: sigPending } = useSig(idOf(post.sig));
  const isTeacher = Boolean(userId && sig?.moderator?.includes(userId));
  return {
    userId,
    isAdmin,
    isAuthor,
    canRead: isAuthor || isAdmin || isTeacher,
    canWrite: isAdmin || isTeacher,
    /** Still working out the role. */
    pending: isLoading || (Boolean(userId) && sigPending),
  };
}

function feedbackKey(postId: string, userId: string) {
  return ["feedback", postId, userId] as const;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function wasEdited(entry: TFeedback) {
  return (
    new Date(entry.updatedAt).getTime() - new Date(entry.createdAt).getTime() >
    1000
  );
}

const secondaryClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-control border border-line-strong bg-surface px-3 font-semibold text-ink-700 text-sm transition-colors hover:bg-field disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-control bg-brand-700 px-4 font-semibold text-sm text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50";
const textareaClass =
  "w-full resize-none rounded-control border border-line-strong bg-surface px-3 py-2 text-[16px] text-ink-800 leading-[1.7] placeholder:text-ink-400 focus:border-brand-700/50 focus:outline-none focus:ring-2 focus:ring-brand-700/20 disabled:opacity-60 sm:text-[15px]";

function Counter({ value, id }: { value: string; id?: string }) {
  const count = feedbackLength(value);
  return (
    <span
      id={id}
      aria-live="polite"
      className={`text-xs tabular-nums ${
        count > FEEDBACK_MAX ? "text-danger-700" : "text-ink-500"
      }`}
    >
      {count}/{FEEDBACK_MAX}
    </span>
  );
}

function FeedbackEntry({
  entry,
  canEdit,
  canDelete,
  onSaved,
  onRemoved,
  mobile,
}: {
  entry: TFeedback;
  canEdit: boolean;
  canDelete: boolean;
  onSaved: (entry: TFeedback) => void;
  onRemoved: (id: string) => void;
  mobile: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editorId = useId();
  const height = mobile ? "h-10" : "h-8";

  async function save() {
    const content = text.trim();
    if (!content) {
      setError("回饋內容不能空白");
      return;
    }
    if (feedbackLength(content) > FEEDBACK_MAX) {
      setError(`回饋最多 ${FEEDBACK_MAX} 字`);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await editFeedback(entry._id, content);
    setBusy(false);
    if (!result.ok) {
      setError(feedbackFailureMessage(result));
      return;
    }
    onSaved(feedbackOf(result.data) ?? { ...entry, content });
    setEditing(false);
    notice("success", "已更新回饋");
  }

  async function remove() {
    const answer = await Swal.fire({
      icon: "warning",
      title: "刪除這則回饋？",
      text: "作者將不會再看到這則回饋。",
      showCancelButton: true,
      confirmButtonText: "刪除",
      cancelButtonText: "取消",
      confirmButtonColor: "#b42318",
      focusCancel: true,
    });
    if (!answer.isConfirmed) {
      return;
    }
    setBusy(true);
    const result = await removeFeedback(entry._id);
    setBusy(false);
    if (!result.ok) {
      notice("error", feedbackFailureMessage(result));
      return;
    }
    onRemoved(entry._id);
    notice("success", "已刪除回饋");
  }

  return (
    <li className="flex gap-3" data-feedback-entry>
      <Image
        src={imageUrl(entry.author.avatar) ?? DEFAULT_AVATAR_URL}
        width={36}
        height={36}
        alt=""
        unoptimized
        className="size-9 shrink-0 rounded-full bg-field object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-[13.5px]">
          <span className="font-semibold text-ink-900">
            {entry.author.name || "指導老師"}
          </span>
          <span className="text-ink-500 text-xs">
            {formatDate(entry.createdAt)}
            {wasEdited(entry) && "（已編輯）"}
          </span>
        </p>
        {editing ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={editorId} className="sr-only">
              編輯回饋
            </label>
            <textarea
              id={editorId}
              value={text}
              rows={4}
              disabled={busy}
              onChange={(e) => setText(e.target.value)}
              className={textareaClass}
            />
            <div className="flex items-center gap-2">
              <Counter value={text} />
              <span className="flex-1" />
              <button
                type="button"
                className={`${secondaryClass} ${height}`}
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setText(entry.content);
                  setError(null);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className={`${primaryClass} ${height}`}
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? "儲存中…" : "儲存"}
              </button>
            </div>
            {error && (
              <p role="alert" className="text-danger-700 text-xs">
                {error}
              </p>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[14.4px] text-ink-700 leading-[1.65]">
            {entry.content}
          </p>
        )}
        {!editing && (canEdit || canDelete) && (
          <div className="flex gap-3 text-xs">
            {canEdit && (
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 font-semibold text-ink-500 hover:text-brand-700"
                onClick={() => {
                  setText(entry.content);
                  setEditing(true);
                }}
              >
                <Pencil size={12} aria-hidden />
                編輯
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1 font-semibold text-ink-500 hover:text-danger-700"
                disabled={busy}
                onClick={() => void remove()}
              >
                <Trash2 size={12} aria-hidden />
                刪除
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function TeacherFeedback({
  post,
  variant = "desktop",
  className = "",
}: {
  post: TThread;
  variant?: "desktop" | "mobile";
  className?: string;
}) {
  const mobile = variant === "mobile";
  const postId = post._id ?? "";
  const access = useFeedbackAccess(post);
  const queryClient = useQueryClient();
  const key = feedbackKey(postId, access.userId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const composerId = useId();
  const counterId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const scrolled = useRef(false);

  const list = useQuery<TFeedback[], Error>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const result = await fetchFeedback(postId, signal);
      if (!result.ok) {
        throw new ApiError(result);
      }
      return result.data;
    },
    enabled: Boolean(postId) && access.canRead && !access.pending,
    retry: (count, failure) =>
      !(failure instanceof ApiError && failure.httpStatus === 403) && count < 2,
  });
  const entries = list.data ?? [];
  const forbidden =
    list.error instanceof ApiError && list.error.httpStatus === 403;
  const visible =
    access.canRead &&
    !forbidden &&
    (access.canWrite || entries.length > 0 || list.isError);

  // A notification links to /post/<id>#feedback: go there once it shows.
  useEffect(() => {
    if (
      visible &&
      list.isSuccess &&
      !scrolled.current &&
      window.location.hash === "#feedback"
    ) {
      scrolled.current = true;
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [visible, list.isSuccess]);

  if (!visible) {
    return null;
  }

  const setEntries = (update: (old: TFeedback[]) => TFeedback[]) =>
    queryClient.setQueryData<TFeedback[]>(key, (old) => update(old ?? []));

  async function send() {
    const content = draft.trim();
    if (!content) {
      setError("請先寫下回饋內容");
      return;
    }
    if (feedbackLength(content) > FEEDBACK_MAX) {
      setError(`回饋最多 ${FEEDBACK_MAX} 字`);
      return;
    }
    setSending(true);
    setError(null);
    const result = await createFeedback(postId, content);
    setSending(false);
    if (!result.ok) {
      setError(feedbackFailureMessage(result));
      return;
    }
    const saved = feedbackOf(result.data);
    if (saved) {
      setEntries((old) => [...old, saved]);
    } else {
      void list.refetch();
    }
    setDraft("");
    notice("success", "已送出回饋，作者會收到通知");
  }

  return (
    <section
      ref={sectionRef}
      id="feedback"
      aria-labelledby={`${composerId}-title`}
      className={`flex min-h-0 scroll-mt-20 flex-col rounded-card ${
        mobile
          ? "border border-line bg-surface p-4 shadow-card"
          : "glass px-5 pt-4 pb-5"
      } ${className}`}
      data-teacher-feedback
    >
      <div className="flex shrink-0 items-start gap-2">
        <GraduationCap
          size={20}
          aria-hidden
          className="mt-0.5 shrink-0 text-brand-700"
        />
        <div className="min-w-0 flex-1">
          <h2
            id={`${composerId}-title`}
            className="font-bold text-base text-ink-900"
          >
            老師回饋
          </h2>
          <p className="flex items-center gap-1 text-ink-500 text-xs">
            <Lock size={11} aria-hidden />
            {access.isAuthor
              ? "只有你、這個 SIG 的指導老師和管理員看得到"
              : "只有作者、這個 SIG 的指導老師和管理員看得到"}
          </p>
        </div>
      </div>

      <div
        className={`custom-scrollbar mt-3 min-h-0 overflow-y-auto ${
          mobile ? "" : "max-h-[26vh]"
        }`}
      >
        {list.isPending ? (
          <p className="py-2 text-ink-500 text-sm">載入中…</p>
        ) : list.isError ? (
          <div role="alert" className="flex items-center gap-2 py-2 text-sm">
            <span className="text-ink-500">{list.error.message}</span>
            <button
              type="button"
              className="cursor-pointer font-semibold text-brand-700 hover:underline"
              onClick={() => void list.refetch()}
            >
              重試
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className="py-1 text-ink-500 text-sm">
            還沒有回饋。寫下你對這篇作品的建議，作者會收到通知。
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {entries.map((entry) => (
              <FeedbackEntry
                key={entry._id}
                entry={entry}
                canEdit={entry.author._id === access.userId}
                canDelete={entry.author._id === access.userId || access.isAdmin}
                onSaved={(saved) =>
                  setEntries((old) =>
                    old.map((item) => (item._id === saved._id ? saved : item)),
                  )
                }
                onRemoved={(id) =>
                  setEntries((old) => old.filter((item) => item._id !== id))
                }
                mobile={mobile}
              />
            ))}
          </ul>
        )}
      </div>

      {access.canWrite && (
        <form
          className="mt-3 flex shrink-0 flex-col gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label htmlFor={composerId} className="sr-only">
            寫給作者的回饋
          </label>
          <textarea
            id={composerId}
            value={draft}
            rows={mobile ? 4 : 3}
            disabled={sending}
            aria-describedby={counterId}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="寫給作者的回饋：做得好的地方、可以再加強的地方"
            className={textareaClass}
          />
          <div className="flex items-center gap-2">
            <Counter value={draft} id={counterId} />
            <span className="flex-1" />
            <button
              type="submit"
              className={`${primaryClass} ${mobile ? "h-10" : "h-9"}`}
              disabled={sending || draft.trim().length === 0}
            >
              {sending ? "送出中…" : "送出回饋"}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-danger-700 text-xs">
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
