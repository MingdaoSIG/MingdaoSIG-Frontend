"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCount } from "../format";
import { Button } from "./ui";

export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function Pagination({
  page,
  pageSize,
  total,
  unit,
  onPage,
  disabled = false,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** 篇 / 則 / 位 / 筆 */
  unit: string;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  const pages = pageCount(total, pageSize);
  const current = Math.min(page, pages);
  return (
    <nav
      aria-label="分頁"
      className="flex items-center justify-between gap-3 sm:justify-end"
    >
      <p className="text-ink-500 text-xs sm:text-sm" aria-live="polite">
        第 {current} / {pages} 頁 · 共 {formatCount(total)} {unit}
      </p>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          onClick={() => onPage(current - 1)}
          disabled={disabled || current <= 1}
          aria-label="上一頁"
        >
          <ChevronLeft aria-hidden className="size-4" />
          <span className="hidden sm:inline">上一頁</span>
        </Button>
        <Button
          size="sm"
          onClick={() => onPage(current + 1)}
          disabled={disabled || current >= pages}
          aria-label="下一頁"
        >
          <span className="hidden sm:inline">下一頁</span>
          <ChevronRight aria-hidden className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
