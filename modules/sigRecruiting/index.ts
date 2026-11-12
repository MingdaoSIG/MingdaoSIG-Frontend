import { JOIN_QUESTIONS } from "@/app/[userID]/(User)/config/joinQuestions";
import type { Sig, SigJoinQuestion, SigRecruiting } from "@/interfaces/Sig";

// A SIG's join form and recruiting state (contract v4 §5.6). The API
// returns `joinQuestions` with the defaults filled in and `recruiting`
// with its defaults; these helpers apply the same defaults when a field
// is missing (an older backend, a cached SIG).

export const JOIN_QUESTIONS_MAX = 5;
export const JOIN_QUESTION_LABEL_MAX = 60;
export const JOIN_ANSWER_MAX = 500;
export const RECRUITING_MESSAGE_MAX = 200;

/** The three global questions, all required (as the form always was). */
export const DEFAULT_JOIN_QUESTIONS: SigJoinQuestion[] = JOIN_QUESTIONS.map(
  (question) => ({ label: question.label, required: true }),
);

/** Characters as the backend counts them (code points). */
export function textLength(value: string) {
  return Array.from(value).length;
}

export function joinQuestionsOf(
  sig: Pick<Sig, "joinQuestions"> | null | undefined,
): SigJoinQuestion[] {
  const own = Array.isArray(sig?.joinQuestions)
    ? sig.joinQuestions.filter(
        (question) =>
          question &&
          typeof question.label === "string" &&
          question.label.trim() !== "",
      )
    : [];
  const list = own.length > 0 ? own : DEFAULT_JOIN_QUESTIONS;
  return list.map((question) => ({
    label: question.label,
    required: Boolean(question.required),
  }));
}

/** The old form's hint for a default question, if it is one. */
export function placeholderFor(label: string) {
  return JOIN_QUESTIONS.find((question) => question.label === label)
    ?.placeholder;
}

export type RecruitingState = {
  open: boolean;
  message: string;
  until: Date | null;
};

export function recruitingOf(
  sig: Pick<Sig, "recruiting"> | null | undefined,
): RecruitingState {
  const recruiting: Partial<SigRecruiting> = sig?.recruiting ?? {};
  const until = recruiting.until ? new Date(recruiting.until) : null;
  return {
    open: recruiting.open !== false,
    message: typeof recruiting.message === "string" ? recruiting.message : "",
    until: until && !Number.isNaN(until.getTime()) ? until : null,
  };
}

/** Open, and not past `until`: the backend takes join requests. */
export function isRecruitingNow(
  sig: Pick<Sig, "recruiting"> | null | undefined,
  now: Date = new Date(),
) {
  const { open, until } = recruitingOf(sig);
  return open && (until === null || until > now);
}

/** 「2026/12/31 23:59」 in Taiwan time. */
export function formatUntil(date: Date) {
  return date.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
