"use client";

import {
  ArrowDown,
  ArrowUp,
  Plus,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { JoinQuestionFields } from "@/components/Sig/JoinSigDialog";
import { RecruitingStatus } from "@/components/Sig/RecruitingStatus";
import type { SigJoinQuestion, SigRecruiting } from "@/interfaces/Sig";
import {
  DEFAULT_JOIN_QUESTIONS,
  JOIN_QUESTION_LABEL_MAX,
  JOIN_QUESTIONS_MAX,
  joinQuestionsOf,
  RECRUITING_MESSAGE_MAX,
  recruitingOf,
  textLength,
} from "@/modules/sigRecruiting";
import { errorText, failureMessage, send, useInvalidate } from "../api";
import {
  Button,
  Card,
  ErrorState,
  Field,
  inputClass,
  SkeletonRows,
  textareaClass,
} from "../components/ui";
import { sigAdminKeys, useRefreshSigs, useSigSettings } from "../sigAdminApi";
import type { AdminSig } from "../types";

// 招生設定 (contract v4 §5.6), for the SIG's leaders, 指導老師 and admins:
// whether the SIG takes join requests (with a message and an optional
// closing time) and the questions of its join form (1 to 5, each
// required or optional). Saved with one POST /sig/:id. The preview on
// the right is the SIG page's own components.

type Draft = { key: string; label: string; required: boolean };

let keySeq = 0;
const nextKey = () => {
  keySeq += 1;
  return `q${keySeq}`;
};

function toDrafts(questions: SigJoinQuestion[]): Draft[] {
  return questions.map((q) => ({ ...q, key: nextKey() }));
}

function sameQuestions(a: SigJoinQuestion[], b: SigJoinQuestion[]) {
  return (
    a.length === b.length &&
    a.every(
      (q, i) =>
        q.label.trim() === b[i].label.trim() && q.required === b[i].required,
    )
  );
}

/** ISO → the value of an <input type="datetime-local"> (local time). */
function toLocalInput(date: Date | null) {
  if (!date) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function RecruitingTab({ sig }: { sig: AdminSig }) {
  const settings = useSigSettings(sig._id);
  // One array per response, so the form only resets when the data does.
  const questions = useMemo(
    () => (settings.data ? joinQuestionsOf(settings.data) : []),
    [settings.data],
  );

  if (settings.isError) {
    return (
      <Card>
        <ErrorState
          message={errorText(settings.error)}
          onRetry={() => settings.refetch()}
        />
      </Card>
    );
  }
  if (!settings.data) {
    return (
      <Card padded={false}>
        <SkeletonRows rows={5} />
      </Card>
    );
  }
  return (
    <RecruitingForm
      sig={sig}
      questions={questions}
      recruiting={settings.data.recruiting}
    />
  );
}

function RecruitingForm({
  sig,
  questions: savedQuestions,
  recruiting: savedRecruiting,
}: {
  sig: AdminSig;
  questions: SigJoinQuestion[];
  recruiting: SigRecruiting | undefined;
}) {
  const ids = { open: useId(), message: useId(), until: useId() };
  const invalidate = useInvalidate();
  const refresh = useRefreshSigs();
  const saved = useMemo(
    () => recruitingOf({ recruiting: savedRecruiting }),
    [savedRecruiting],
  );
  const [open, setOpen] = useState(saved.open);
  const [message, setMessage] = useState(saved.message);
  const [until, setUntil] = useState(toLocalInput(saved.until));
  const [drafts, setDrafts] = useState<Draft[]>(() => toDrafts(savedQuestions));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const labelRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const focusKey = useRef<string | null>(null);

  const reset = () => {
    setOpen(saved.open);
    setMessage(saved.message);
    setUntil(toLocalInput(saved.until));
    setDrafts(toDrafts(savedQuestions));
    setSubmitted(false);
    setError("");
  };

  // Saved values changed (after a save, another tab): start over.
  useEffect(reset, [saved, savedQuestions]);

  useEffect(() => {
    if (focusKey.current) {
      labelRefs.current.get(focusKey.current)?.focus();
      focusKey.current = null;
    }
  }, [drafts]);

  const untilDate = until ? new Date(until) : null;
  const untilValid = !untilDate || !Number.isNaN(untilDate.getTime());
  const untilPast = Boolean(
    untilDate && untilValid && untilDate.getTime() <= Date.now(),
  );
  const questions = drafts.map(({ label, required }) => ({
    label: label.trim(),
    required,
  }));
  const labelProblems = drafts.map((draft) => {
    const length = textLength(draft.label.trim());
    if (length === 0) {
      return "請輸入題目";
    }
    if (length > JOIN_QUESTION_LABEL_MAX) {
      return `最多 ${JOIN_QUESTION_LABEL_MAX} 字`;
    }
    return "";
  });
  const messageTooLong = textLength(message.trim()) > RECRUITING_MESSAGE_MAX;
  const invalid = labelProblems.some(Boolean) || messageTooLong || !untilValid;
  const usesDefaults = sameQuestions(questions, DEFAULT_JOIN_QUESTIONS);

  const recruitingChanged =
    open !== saved.open ||
    message.trim() !== saved.message ||
    until !== toLocalInput(saved.until);
  const questionsChanged = !sameQuestions(questions, savedQuestions);
  const dirty = recruitingChanged || questionsChanged;

  const draftRecruiting: SigRecruiting = {
    open,
    message: message.trim(),
    until: untilDate && untilValid ? untilDate.toISOString() : null,
  };

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts((prev) =>
      prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );
  const move = (index: number, by: number) =>
    setDrafts((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(index + by, 0, item);
      return next;
    });
  const add = () => {
    const key = nextKey();
    focusKey.current = key;
    setDrafts((prev) => [...prev, { key, label: "", required: false }]);
  };

  const save = async () => {
    setSubmitted(true);
    if (!dirty || invalid) {
      return;
    }
    const body: Record<string, unknown> = {};
    if (recruitingChanged) {
      body.recruiting = draftRecruiting;
    }
    if (questionsChanged) {
      // The defaults are stored as "none": the SIG follows them if the
      // global questions ever change.
      body.joinQuestions = usesDefaults ? null : questions;
    }
    setSaving(true);
    setError("");
    const result = await send(`/sig/${sig._id}`, { body });
    setSaving(false);
    if (!result.ok) {
      const text = failureMessage(
        result,
        "只有這個 SIG 的幹部、指導老師或管理員可以修改招生設定",
      );
      setError(text);
      toast.error(text);
      return;
    }
    toast.success("已儲存招生設定");
    setSubmitted(false);
    await Promise.all([
      invalidate(sigAdminKeys.sigSettings(sig._id)),
      refresh(sig._id),
    ]);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="flex min-w-0 flex-col gap-4"
      >
        <Card title="招生狀態">
          <div className="flex max-w-2xl flex-col gap-4">
            <label
              htmlFor={ids.open}
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id={ids.open}
                type="checkbox"
                role="switch"
                aria-checked={open}
                checked={open}
                onChange={(event) => setOpen(event.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-700/40 ${
                  open ? "bg-ok-700" : "bg-ink-400"
                }`}
              >
                <span
                  className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                    open ? "translate-x-[1.125rem]" : "translate-x-0.5"
                  }`}
                />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink-900 text-sm">
                  {open ? "招生中：開放申請加入" : "暫停招生：不接受新的申請"}
                </span>
                <span className="block text-ink-500 text-xs">
                  暫停時，已送出的申請仍然可以審核。
                </span>
              </span>
            </label>

            <Field
              label="招生說明（選填）"
              htmlFor={ids.message}
              hint={
                <span className="flex justify-between gap-2">
                  <span>顯示在 SIG 頁面上，例如招生對象、社課時間</span>
                  <span
                    className={`tabular-nums ${messageTooLong ? "text-danger-700" : ""}`}
                  >
                    {textLength(message.trim())} / {RECRUITING_MESSAGE_MAX}
                  </span>
                </span>
              }
            >
              <textarea
                id={ids.message}
                value={message}
                rows={3}
                aria-invalid={messageTooLong || undefined}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="例如：歡迎對程式有興趣的同學，每週三第 7–8 節社課"
                className={textareaClass}
              />
            </Field>

            <Field
              label="收件截止（選填）"
              htmlFor={ids.until}
              hint={
                untilPast ? (
                  <span className="text-warm-600">
                    這個時間已經過了，儲存後等於暫停招生
                  </span>
                ) : (
                  "時間到了就自動停止收件；留空表示不限"
                )
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-60 max-w-full">
                  <input
                    id={ids.until}
                    type="datetime-local"
                    value={until}
                    onChange={(event) => setUntil(event.target.value)}
                    className={inputClass}
                  />
                </div>
                {until && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setUntil("")}
                  >
                    清除
                  </Button>
                )}
              </div>
            </Field>
          </div>
        </Card>

        <Card
          title="申請題目"
          actions={
            !usesDefaults && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDrafts(toDrafts(DEFAULT_JOIN_QUESTIONS))}
              >
                <RotateCcw aria-hidden className="size-3.5" />
                改回預設題目
              </Button>
            )
          }
        >
          <p className="mb-3 text-ink-500 text-sm">
            {usesDefaults
              ? "目前使用全站預設的三題。"
              : "這個 SIG 使用自訂的題目。"}
            每題最多 {JOIN_QUESTION_LABEL_MAX} 字，最多 {JOIN_QUESTIONS_MAX}{" "}
            題；申請人每題最多回答 500 字。
          </p>
          <ol className="flex flex-col gap-2">
            {drafts.map((draft, index) => {
              const problem = submitted ? labelProblems[index] : "";
              const inputId = `${ids.open}-q-${draft.key}`;
              return (
                <li
                  key={draft.key}
                  className="flex flex-col gap-2 rounded-control border border-line bg-surface p-3 sm:flex-row sm:items-start"
                >
                  <span className="hidden h-9 w-6 shrink-0 items-center font-semibold text-ink-400 text-sm tabular-nums sm:flex">
                    {index + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <label htmlFor={inputId} className="sr-only">
                      第 {index + 1} 題
                    </label>
                    <input
                      id={inputId}
                      ref={(element) => {
                        if (element) {
                          labelRefs.current.set(draft.key, element);
                        } else {
                          labelRefs.current.delete(draft.key);
                        }
                      }}
                      value={draft.label}
                      placeholder={`第 ${index + 1} 題，例如：你做過哪些相關的作品？`}
                      aria-invalid={problem ? true : undefined}
                      onChange={(event) =>
                        update(draft.key, { label: event.target.value })
                      }
                      className={inputClass}
                    />
                    {problem && (
                      <p className="mt-1 text-danger-700 text-xs">{problem}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <label className="mr-1 flex h-9 cursor-pointer items-center gap-1.5 text-ink-700 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.required}
                        onChange={(event) =>
                          update(draft.key, { required: event.target.checked })
                        }
                        className="size-4 cursor-pointer accent-brand-700"
                      />
                      必填
                    </label>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`第 ${index + 1} 題上移`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp aria-hidden className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`第 ${index + 1} 題下移`}
                      disabled={index === drafts.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown aria-hidden className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`刪除第 ${index + 1} 題`}
                      disabled={drafts.length <= 1}
                      onClick={() =>
                        setDrafts((prev) =>
                          prev.filter((item) => item.key !== draft.key),
                        )
                      }
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={add}
              disabled={drafts.length >= JOIN_QUESTIONS_MAX}
            >
              <Plus aria-hidden className="size-3.5" />
              新增題目
            </Button>
            {drafts.length >= JOIN_QUESTIONS_MAX && (
              <span className="text-ink-500 text-xs">
                最多 {JOIN_QUESTIONS_MAX} 題
              </span>
            )}
          </div>
        </Card>

        {error && (
          <p
            role="alert"
            className="flex items-center gap-2 text-danger-700 text-sm"
          >
            <TriangleAlert aria-hidden className="size-4 shrink-0" />
            {error}
          </p>
        )}
        {submitted && invalid && !error && (
          <p role="alert" className="text-danger-700 text-sm">
            有欄位需要修正，請看上面標示紅字的地方。
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={!dirty}
          >
            儲存招生設定
          </Button>
          <Button onClick={reset} disabled={!dirty || saving}>
            取消
          </Button>
        </div>
      </form>

      <aside aria-label="預覽" className="flex min-w-0 flex-col gap-3">
        <p className="font-semibold text-ink-500 text-xs">
          預覽：訪客在 SIG 頁面上看到的樣子
        </p>
        <RecruitingStatus recruiting={draftRecruiting} variant="card" />
        <Card title="申請表">
          <JoinQuestionFields
            questions={questions.map((q, i) => ({
              ...q,
              label: q.label || `第 ${i + 1} 題`,
            }))}
            values={[]}
            disabled
          />
        </Card>
      </aside>
    </div>
  );
}
