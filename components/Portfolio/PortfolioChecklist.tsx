"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { TPortfolio } from "@/interfaces/Engagement";
import type { PortfolioSections } from "./PortfolioDocument";

// The left column of /portfolio (v3 7B): what goes into the document.
// Each change shows in the A4 preview at once. 文章 is a group: its box
// selects all or none, and the list below picks single posts.

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
}

function Row({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
  indeterminate = false,
  mobile,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  mobile: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const hintId = useId();
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-control px-2 transition-colors hover:bg-field ${
        mobile ? "py-2.5" : "py-2"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={hint ? hintId : undefined}
        className="mt-0.5 size-[1.125rem] shrink-0 cursor-pointer accent-brand-700 disabled:cursor-not-allowed"
      />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink-900 text-sm">
          {label}
        </span>
        {hint && (
          <span id={hintId} className="block text-ink-500 text-xs leading-5">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}

export function PortfolioChecklist({
  portfolio,
  sections,
  onSections,
  selected,
  onSelected,
  includeFeedback,
  onIncludeFeedback,
  mobile = false,
}: {
  portfolio: TPortfolio;
  sections: PortfolioSections;
  onSections: (next: PortfolioSections) => void;
  selected: Set<string>;
  onSelected: (next: Set<string>) => void;
  includeFeedback: boolean;
  onIncludeFeedback: (next: boolean) => void;
  mobile?: boolean;
}) {
  const [postsOpen, setPostsOpen] = useState(true);
  const listId = useId();
  const total = portfolio.posts.length;
  const chosen = portfolio.posts.filter((post) => selected.has(post._id));
  const feedbackTotal = portfolio.posts.reduce(
    (sum, post) => sum + post.feedback.length,
    0,
  );

  function togglePost(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelected(next);
  }

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-0.5"
      data-portfolio-checklist
    >
      <legend className="mb-1 px-2 font-semibold text-ink-500 text-xs">
        收錄內容
      </legend>
      <Row
        label="基本資料"
        hint="大頭貼、班級、身分與帳號"
        checked={sections.profile}
        onChange={(profile) => onSections({ ...sections, profile })}
        mobile={mobile}
      />
      <Row
        label="SIG 與幹部經歷"
        hint={
          portfolio.sigs.length > 0
            ? `${portfolio.sigs.length} 個 SIG`
            : "尚未加入任何 SIG"
        }
        checked={sections.sigs}
        onChange={(sigs) => onSections({ ...sections, sigs })}
        mobile={mobile}
      />
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
          <Row
            label={`文章（${chosen.length}／${total}）`}
            hint={total === 0 ? "還沒有發表過貼文" : undefined}
            checked={total > 0 && chosen.length === total}
            indeterminate={chosen.length > 0 && chosen.length < total}
            disabled={total === 0}
            onChange={(all) =>
              onSelected(
                new Set(all ? portfolio.posts.map((post) => post._id) : []),
              )
            }
            mobile={mobile}
          />
        </div>
        {total > 0 && (
          <button
            type="button"
            aria-expanded={postsOpen}
            aria-controls={listId}
            aria-label={postsOpen ? "收起文章清單" : "展開文章清單"}
            onClick={() => setPostsOpen((open) => !open)}
            className={`flex shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-500 hover:bg-field ${
              mobile ? "size-11" : "size-9"
            }`}
          >
            <ChevronDown
              aria-hidden
              className={`size-4 transition-transform ${
                postsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>
      {total > 0 && postsOpen && (
        <ul
          id={listId}
          aria-label="要收錄的文章"
          className={`ml-7 flex flex-col border-line border-l pl-2 ${
            mobile ? "" : "custom-scrollbar max-h-[18rem] overflow-y-auto"
          }`}
        >
          {portfolio.posts.map((post) => (
            <li key={post._id}>
              <label
                className={`flex cursor-pointer items-start gap-2.5 rounded-control px-2 hover:bg-field ${
                  mobile ? "py-2" : "py-1.5"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(post._id)}
                  onChange={() => togglePost(post._id)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand-700"
                />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 break-words text-ink-800 text-sm leading-5">
                    {post.title || "（無標題）"}
                  </span>
                  <span className="block truncate text-ink-500 text-xs">
                    {[post.sig.name, formatDate(post.createdAt)]
                      .filter(Boolean)
                      .join("・")}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <Row
        label="老師回饋"
        hint={
          feedbackTotal > 0
            ? `${feedbackTotal} 則，放在各篇文章下面`
            : "你的貼文目前還沒有老師回饋"
        }
        checked={includeFeedback}
        onChange={onIncludeFeedback}
        mobile={mobile}
      />
      <Row
        label="數據"
        hint="讚、留言與瀏覽次數"
        checked={sections.stats}
        onChange={(stats) => onSections({ ...sections, stats })}
        mobile={mobile}
      />
    </fieldset>
  );
}
