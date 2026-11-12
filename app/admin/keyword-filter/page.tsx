"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { toast } from "@/components/mobile/Toast";
import { CustomStatus } from "@/modules/customStatusCode";
import { errorText, failureMessage, useInvalidate } from "../(admin)/api";
import { PageHeader } from "../(admin)/components/AdminShell";
import {
  Button,
  Card,
  ErrorState,
  inputClass,
  linkClass,
  SkeletonRows,
} from "../(admin)/components/ui";
import { formatDateTime } from "../(admin)/format";
import {
  KEYWORD_MAX_LENGTH,
  KEYWORD_MAX_WORDS,
  moderationKeys,
  saveKeywordFilter,
  useKeywordFilter,
} from "../(admin)/moderationApi";

// 關鍵字過濾 (contract v4 §5.11): when a new or edited post (title, content,
// tags) or comment contains one of these words (any case), the site files a
// report from 「系統（關鍵字）」. Posting is never blocked, and the same
// content never gets a second open report.

/** Words typed or pasted: split on new lines and commas. */
function splitWords(value: string) {
  return value
    .split(/[\n,，、]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function sameWords(a: string[], b: string[]) {
  return a.length === b.length && a.every((word, index) => word === b[index]);
}

export default function AdminKeywordFilterPage() {
  const filter = useKeywordFilter();
  const invalidate = useInvalidate();
  const saved = filter.data?.words ?? [];
  const [words, setWords] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputId = useId();
  const savedKey = saved.join("\n");

  useEffect(() => {
    if (filter.data) {
      setWords(filter.data.words);
    }
  }, [savedKey, Boolean(filter.data)]);

  const lower = useMemo(
    () => new Set(words.map((word) => word.toLowerCase())),
    [words],
  );
  const changed = !sameWords(words, saved);
  const full = words.length >= KEYWORD_MAX_WORDS;

  const add = (text: string = input) => {
    const candidates = splitWords(text);
    if (candidates.length === 0) {
      setInputError("請輸入關鍵字");
      return;
    }
    const tooLong = candidates.filter(
      (word) => Array.from(word).length > KEYWORD_MAX_LENGTH,
    );
    const seen = new Set(lower);
    const fresh: string[] = [];
    let repeated = 0;
    for (const word of candidates) {
      if (Array.from(word).length > KEYWORD_MAX_LENGTH) {
        continue;
      }
      const key = word.toLowerCase();
      if (seen.has(key)) {
        repeated++;
        continue;
      }
      seen.add(key);
      fresh.push(word);
    }
    const room = KEYWORD_MAX_WORDS - words.length;
    const kept = fresh.slice(0, Math.max(0, room));
    const notes: string[] = [];
    if (tooLong.length > 0) {
      notes.push(
        `每個關鍵字最多 ${KEYWORD_MAX_LENGTH} 字（${tooLong.length} 個太長，沒有加入）`,
      );
    }
    if (repeated > 0) {
      notes.push(`${repeated} 個已經在清單裡`);
    }
    if (fresh.length > kept.length) {
      notes.push(
        `最多 ${KEYWORD_MAX_WORDS} 個，有 ${fresh.length - kept.length} 個沒有加入`,
      );
    }
    setInputError(notes.join("；"));
    if (kept.length > 0) {
      setWords((prev) => [...prev, ...kept]);
    }
    // Keep what could not be added, so it can be fixed.
    setInput(tooLong.join("，"));
  };

  const save = async () => {
    setBusy(true);
    setError("");
    const result = await saveKeywordFilter(words);
    setBusy(false);
    if (!result.ok) {
      setError(
        result.status === CustomStatus.INVALID_BODY
          ? `清單不符合規則：最多 ${KEYWORD_MAX_WORDS} 個，每個 1–${KEYWORD_MAX_LENGTH} 字`
          : failureMessage(result),
      );
      return;
    }
    toast.success("已儲存關鍵字");
    await invalidate(moderationKeys.keywordFilter);
  };

  return (
    <>
      <PageHeader
        title="關鍵字過濾"
        description={
          <>
            新貼文、編輯過的貼文（標題、內文、標籤）或留言含有清單中的字詞時（不分大小寫），會自動建立一筆檢舉，檢舉人顯示為「系統（關鍵字）」，到
            <Link href="/admin/reports" className={linkClass}>
              檢舉
            </Link>
            處理。不會阻擋發文。
          </>
        }
      />
      <Card>
        {filter.isPending ? (
          <SkeletonRows rows={4} />
        ) : filter.isError ? (
          <ErrorState
            message={errorText(filter.error)}
            onRetry={() => filter.refetch()}
          />
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={inputId}
                className="font-semibold text-ink-700 text-xs"
              >
                新增關鍵字
              </label>
              <div className="flex gap-2">
                <input
                  id={inputId}
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    setInputError("");
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      add();
                    }
                  }}
                  onPaste={(event) => {
                    // A pasted list (one per line) would lose its line
                    // breaks in a one-line field: add it at once instead.
                    const text = event.clipboardData.getData("text");
                    if (/[\n,，、]/.test(text)) {
                      event.preventDefault();
                      add(`${input}\n${text}`);
                    }
                  }}
                  placeholder="輸入後按 Enter；可一次貼上多個（換行或逗號分隔）"
                  disabled={full}
                  className={inputClass}
                  aria-invalid={Boolean(inputError) || undefined}
                  aria-describedby={`${inputId}-hint`}
                />
                <Button onClick={() => add()} disabled={full || !input.trim()}>
                  <Plus aria-hidden className="size-4" />
                  加入
                </Button>
              </div>
              <p id={`${inputId}-hint`} className="text-xs">
                {inputError ? (
                  <span className="text-warm-600">{inputError}</span>
                ) : (
                  <span className="text-ink-500">
                    每個 1–{KEYWORD_MAX_LENGTH} 字，最多 {KEYWORD_MAX_WORDS}{" "}
                    個；重複的字詞（不分大小寫）只會保留一個。
                  </span>
                )}
              </p>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <h2 className="font-semibold text-ink-900 text-sm">清單</h2>
              <span
                className={`text-xs tabular-nums ${full ? "text-warm-600" : "text-ink-500"}`}
              >
                {words.length} / {KEYWORD_MAX_WORDS}
              </span>
            </div>
            {words.length === 0 ? (
              <p className="mt-2 rounded-control bg-field px-3 py-4 text-center text-ink-500 text-sm">
                清單是空的，不會自動建立任何檢舉。
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {words.map((word) => (
                  <li
                    key={word}
                    className="inline-flex h-8 max-w-full items-center gap-0.5 rounded-control border border-line bg-field pr-0.5 pl-2.5 text-ink-800 text-sm"
                  >
                    <span className="truncate">{word}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setWords((prev) => prev.filter((item) => item !== word))
                      }
                      aria-label={`移除「${word}」`}
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-chip text-ink-500 hover:bg-ink-900/5 hover:text-danger-700"
                    >
                      <X aria-hidden className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {error && (
              <p role="alert" className="mt-3 text-danger-700 text-sm">
                {error}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-line border-t pt-3">
              <Button
                variant="primary"
                onClick={save}
                loading={busy}
                disabled={!changed}
              >
                儲存
              </Button>
              <Button
                onClick={() => {
                  setWords(saved);
                  setError("");
                }}
                disabled={!changed || busy}
              >
                還原
              </Button>
              <span className="text-ink-500 text-xs">
                {changed
                  ? "有尚未儲存的變更"
                  : filter.data?.updatedAt
                    ? `上次更新：${formatDateTime(filter.data.updatedAt)}`
                    : ""}
              </span>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
