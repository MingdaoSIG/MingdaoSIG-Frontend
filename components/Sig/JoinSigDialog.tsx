"use client";

import { CircleCheck, CircleSlash } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { JoinSigAPI } from "@/app/[userID]/(User)/apis/JoinSigAPI";
import { Modal } from "@/components/Modal";
import type { Sig, SigJoinQuestion } from "@/interfaces/Sig";
import { CustomStatus } from "@/modules/customStatusCode";
import {
  JOIN_ANSWER_MAX,
  joinQuestionsOf,
  placeholderFor,
  textLength,
} from "@/modules/sigRecruiting";
import { isSubmitEnter } from "@/utils/keyboard";
import { useUserAccount } from "@/utils/useUserAccount";

/** What the page should show after the dialog talked to the server. */
export type JoinOutcome = "pending" | "joined" | "closed";

type Done = {
  tone: "ok" | "closed";
  title: string;
  text: string;
  /** The SIG's own recruiting message, quoted. */
  detail?: string;
};

const fieldClass =
  "w-full resize-none rounded-control border bg-surface px-3 py-2 text-[16px] text-ink-800 leading-[1.7] placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-700/20 disabled:bg-field disabled:text-ink-500 sm:text-[15px]";

/**
 * The questions of a SIG's join form, with 必填／選填 and a counter. Used
 * by the join dialog, and read-only (`disabled`) as the preview in the
 * admin panel's 招生設定.
 */
export function JoinQuestionFields({
  questions,
  values,
  errors = [],
  onChange,
  onSubmitEnter,
  disabled = false,
  fieldRefs,
}: {
  questions: SigJoinQuestion[];
  values: string[];
  errors?: string[];
  onChange?: (index: number, value: string) => void;
  /** Enter in a field (not Shift+Enter, not while picking IME candidates). */
  onSubmitEnter?: (index: number) => void;
  disabled?: boolean;
  fieldRefs?: React.RefObject<(HTMLTextAreaElement | null)[]>;
}) {
  const baseId = useId();
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question, index) => {
        const id = `${baseId}-${index}`;
        const value = values[index] ?? "";
        const error = errors[index];
        const length = textLength(value);
        return (
          <div key={id} className="flex flex-col gap-1.5">
            <label
              htmlFor={id}
              className="flex items-baseline gap-2 font-semibold text-ink-900 text-sm"
            >
              <span className="min-w-0 break-words">{question.label}</span>
              <span
                className={`shrink-0 font-normal text-xs ${
                  question.required ? "text-danger-700" : "text-ink-500"
                }`}
              >
                {question.required ? "必填" : "選填"}
              </span>
            </label>
            <textarea
              id={id}
              ref={(element) => {
                if (fieldRefs?.current) {
                  fieldRefs.current[index] = element;
                }
              }}
              value={value}
              rows={3}
              disabled={disabled}
              required={question.required}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${id}-hint`}
              placeholder={placeholderFor(question.label)}
              onChange={(event) => onChange?.(index, event.target.value)}
              onKeyDown={(event) => {
                if (onSubmitEnter && isSubmitEnter(event)) {
                  event.preventDefault();
                  onSubmitEnter(index);
                }
              }}
              className={`${fieldClass} ${
                error
                  ? "border-danger-700 focus:border-danger-700"
                  : "border-line-strong focus:border-brand-700/50"
              }`}
            />
            <p
              id={`${id}-hint`}
              className="flex justify-between gap-2 text-xs"
              aria-live="polite"
            >
              <span className="text-danger-700">{error}</span>
              {!disabled && (
                <span
                  className={`tabular-nums ${
                    length > JOIN_ANSWER_MAX
                      ? "text-danger-700"
                      : "text-ink-500"
                  }`}
                >
                  {length}/{JOIN_ANSWER_MAX}
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 「申請加入 SIG」: the SIG's own questions (contract v4 §5.6, 1 to 5,
 * each required or optional; the three global ones when it has none).
 * Sends `POST /sig/:id/join` with `{ answers: [{ question, answer }] }`.
 * A SIG that stopped recruiting meanwhile answers 403/4040: the dialog
 * says so and the page shows 暫停招生 (`onOutcome("closed")`).
 *
 * Self-contained for the SIG page redesign: give it the SIG as
 * `GET /sig/@:customId` returns it.
 */
export function JoinSigDialog({
  sig,
  open,
  onClose,
  onOutcome,
}: {
  sig: Pick<Sig, "_id" | "name" | "joinQuestions" | "recruiting">;
  open: boolean;
  onClose: () => void;
  /** After the server answered: applied, already a member, or closed. */
  onOutcome?: (outcome: JoinOutcome) => void;
}) {
  const { token } = useUserAccount();
  const questions = joinQuestionsOf(sig);
  const [values, setValues] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [problem, setProblem] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const fieldRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Each opening starts with an empty form.
  useEffect(() => {
    if (open) {
      setValues(questions.map(() => ""));
      setErrors([]);
      setProblem("");
      setSending(false);
      setDone(null);
    }
  }, [open, sig._id]);

  const change = (index: number, value: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (errors[index]) {
      setErrors((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
    }
  };

  const submit = async () => {
    if (sending || done || !token) {
      return;
    }
    const answers = questions.map((question, index) => ({
      question: question.label,
      answer: (values[index] ?? "").trim(),
    }));
    const found = answers.map((item, index) => {
      if (questions[index].required && item.answer === "") {
        return "請回答這一題";
      }
      if (textLength(item.answer) > JOIN_ANSWER_MAX) {
        return `最多 ${JOIN_ANSWER_MAX} 字`;
      }
      return "";
    });
    setErrors(found);
    const first = found.findIndex(Boolean);
    if (first >= 0) {
      fieldRefs.current[first]?.focus();
      return;
    }

    setSending(true);
    setProblem("");
    const result = await JoinSigAPI({ sig: sig._id, answers }, token);
    setSending(false);
    if (result.ok) {
      setDone({
        tone: "ok",
        title: "已送出申請",
        text: `請等待 ${sig.name} 的幹部審核，結果會通知你。`,
      });
      onOutcome?.("pending");
      return;
    }
    switch (result.status) {
      case CustomStatus.NOT_RECRUITING: {
        const message = sig.recruiting?.message?.trim();
        setDone({
          tone: "closed",
          title: "目前暫停招生",
          text: `${sig.name} 目前暫停招生，這次的申請沒有送出。之後重新開放時就能申請。`,
          detail: message || undefined,
        });
        onOutcome?.("closed");
        return;
      }
      case CustomStatus.ALREADY_APPLIED:
        setDone({
          tone: "ok",
          title: "你已經申請過了",
          text: "請等待幹部審核，結果會通知你。",
        });
        onOutcome?.("pending");
        return;
      case CustomStatus.ALREADY_JOINED:
        setDone({
          tone: "ok",
          title: "你已經是成員了",
          text: `你已經加入 ${sig.name}。`,
        });
        onOutcome?.("joined");
        return;
      case CustomStatus.INVALID_CONTENT_LENGTH:
        setProblem(`每題最多 ${JOIN_ANSWER_MAX} 字`);
        return;
      case CustomStatus.INVALID_BODY:
        setProblem("有必填的題目還沒回答，或題目剛被修改過，請重新整理後再試");
        return;
      default:
        setProblem(`申請失敗：${result.message}`);
    }
  };

  const buttonBase =
    "h-10 cursor-pointer rounded-control px-4 font-semibold text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={done ? done.title : `申請加入 ${sig.name}`}
      busy={sending}
      footer={
        done ? (
          <button
            type="button"
            onClick={onClose}
            className={`${buttonBase} bg-brand-700 px-5 text-white hover:bg-brand-800`}
          >
            好
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className={`${buttonBase} border border-line-strong bg-surface text-ink-700 hover:bg-field`}
            >
              取消
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className={`${buttonBase} bg-brand-700 px-5 text-white hover:bg-brand-800`}
            >
              {sending ? "送出中…" : "送出申請"}
            </button>
          </>
        )
      }
    >
      {done ? (
        <output className="flex items-start gap-3 py-2">
          {done.tone === "ok" ? (
            <CircleCheck
              aria-hidden
              className="mt-0.5 size-6 shrink-0 text-ok-700"
            />
          ) : (
            <CircleSlash
              aria-hidden
              className="mt-0.5 size-6 shrink-0 text-ink-500"
            />
          )}
          <div className="min-w-0">
            <p className="text-ink-700 text-sm leading-relaxed">{done.text}</p>
            {done.detail && (
              <p className="mt-2 whitespace-pre-wrap break-words border-line-strong border-l-[3px] pl-3 text-ink-500 text-sm leading-relaxed">
                {done.detail}
              </p>
            )}
          </div>
        </output>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <p className="mb-4 text-ink-500 text-sm">
            回答下面的問題，幹部審核後會通知你結果。
          </p>
          <JoinQuestionFields
            questions={questions}
            values={values}
            errors={errors}
            onChange={change}
            onSubmitEnter={(index) => {
              // Enter moves on to the next question, and sends on the last.
              const next = fieldRefs.current[index + 1];
              if (next) {
                next.focus();
              } else {
                void submit();
              }
            }}
            disabled={sending}
            fieldRefs={fieldRefs}
          />
          {problem && (
            <p
              role="alert"
              className="mt-4 rounded-control bg-danger-700/8 px-3 py-2 text-danger-700 text-sm"
            >
              {problem}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}
