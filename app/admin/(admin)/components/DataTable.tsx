"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import useIsMobile from "@/utils/useIsMobile";
import { EmptyState, ErrorState, SkeletonRows } from "./ui";

// A dense table on desktop, a list of cards on phones (one component, the
// same data). The primary cell is a real button that opens the drawer, so
// rows work from the keyboard; a click anywhere else on the row does too.

export type Column<T> = {
  key: string;
  header: ReactNode;
  /** Classes for both the header and the cells (width, alignment). */
  className?: string;
  cell: (row: T) => ReactNode;
  /** The cell that opens the row. */
  primary?: boolean;
  /** Left out while the drawer narrows the table. */
  optional?: boolean;
  sort?: { direction: "asc" | "desc" | null; onSort: () => void };
};

export type Selection = {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
};

const INTERACTIVE = "a, button, input, label, select, textarea";

export function DataTable<T>({
  caption,
  rows,
  rowKey,
  rowLabel,
  columns,
  card,
  cardActions,
  onOpen,
  rowHref,
  activeKey,
  selection,
  loading,
  fetching = false,
  error,
  onRetry,
  empty,
  compact = false,
}: {
  caption: string;
  rows: T[];
  rowKey: (row: T) => string;
  /** What a screen reader hears for the row's open button and checkbox. */
  rowLabel: (row: T) => string;
  columns: Column<T>[];
  /** The body of a phone card (no buttons inside; it is one button). */
  card: (row: T) => ReactNode;
  /** Buttons under a phone card, e.g. 同意 / 拒絕. */
  cardActions?: (row: T) => ReactNode;
  onOpen?: (row: T) => void;
  /** Rows that go to their own page are links instead. */
  rowHref?: (row: T) => string;
  activeKey?: string | null;
  selection?: Selection;
  loading: boolean;
  fetching?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty: ReactNode;
  /** The drawer is open beside the table: drop optional columns. */
  compact?: boolean;
}) {
  const isMobile = useIsMobile();
  const router = useRouter();

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  if (loading && rows.length === 0) {
    return <SkeletonRows />;
  }
  if (rows.length === 0) {
    return typeof empty === "string" ? <EmptyState title={empty} /> : empty;
  }

  const toggle = (key: string) => {
    if (!selection) {
      return;
    }
    const next = new Set(selection.selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    selection.onChange(next);
  };

  const progress = fetching && (
    <div
      aria-hidden
      className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-brand-700"
    />
  );

  if (isMobile) {
    return (
      <div className="relative" aria-busy={fetching || undefined}>
        {progress}
        <ul aria-label={caption} className="flex flex-col gap-2 p-2">
          {rows.map((row) => {
            const key = rowKey(row);
            const active = activeKey === key;
            const checked = selection?.selected.has(key) ?? false;
            return (
              <li
                key={key}
                className={`rounded-control border bg-surface ${
                  active || checked
                    ? "border-brand-700/40 bg-brand-50/60"
                    : "border-line"
                }`}
              >
                <div className="flex items-start gap-1">
                  {selection && (
                    <label className="flex shrink-0 cursor-pointer items-center self-stretch py-3 pl-3">
                      <span className="sr-only">選取 {rowLabel(row)}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(key)}
                        className="size-[1.125rem] cursor-pointer accent-brand-700"
                      />
                    </label>
                  )}
                  {rowHref ? (
                    <Link
                      href={rowHref(row)}
                      className="min-w-0 flex-1 px-3 py-2.5"
                    >
                      {card(row)}
                    </Link>
                  ) : onOpen ? (
                    <button
                      type="button"
                      onClick={() => onOpen(row)}
                      aria-label={`${rowLabel(row)}，查看詳細資料`}
                      className="min-w-0 flex-1 cursor-pointer px-3 py-2.5 text-left"
                    >
                      {card(row)}
                    </button>
                  ) : (
                    <div className="min-w-0 flex-1 px-3 py-2.5">
                      {card(row)}
                    </div>
                  )}
                </div>
                {cardActions && (
                  <div className="flex flex-wrap gap-2 px-3 pb-3">
                    {cardActions(row)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const shown = compact
    ? columns.filter((column) => !column.optional)
    : columns;
  const keys = rows.map(rowKey);
  const selectedHere = selection
    ? keys.filter((key) => selection.selected.has(key)).length
    : 0;

  return (
    <div className="relative overflow-x-auto" aria-busy={fetching || undefined}>
      {progress}
      <table className="w-full table-fixed border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {selection && (
              <th scope="col" className={`${HEAD} w-10 pr-0`}>
                <SelectAll
                  total={keys.length}
                  selected={selectedHere}
                  onChange={(all) => {
                    const next = new Set(selection.selected);
                    for (const key of keys) {
                      if (all) {
                        next.add(key);
                      } else {
                        next.delete(key);
                      }
                    }
                    selection.onChange(next);
                  }}
                />
              </th>
            )}
            {shown.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={
                  column.sort?.direction === "asc"
                    ? "ascending"
                    : column.sort?.direction === "desc"
                      ? "descending"
                      : undefined
                }
                className={`${HEAD} ${column.className ?? ""}`}
              >
                {column.sort ? (
                  <button
                    type="button"
                    onClick={column.sort.onSort}
                    className="-ml-1 inline-flex cursor-pointer items-center gap-1 rounded-chip px-1 py-0.5 hover:bg-line hover:text-ink-800"
                  >
                    {column.header}
                    {column.sort.direction === "asc" ? (
                      <ArrowUp aria-hidden className="size-3.5" />
                    ) : column.sort.direction === "desc" ? (
                      <ArrowDown aria-hidden className="size-3.5" />
                    ) : (
                      <ArrowUpDown
                        aria-hidden
                        className="size-3.5 opacity-50"
                      />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const active = activeKey === key;
            const checked = selection?.selected.has(key) ?? false;
            return (
              <tr
                key={key}
                aria-selected={selection ? checked : undefined}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest(INTERACTIVE)) {
                    return;
                  }
                  if (rowHref) {
                    router.push(rowHref(row));
                  } else {
                    onOpen?.(row);
                  }
                }}
                className={`border-line border-b last:border-b-0 ${
                  onOpen || rowHref ? "cursor-pointer" : ""
                } ${
                  active
                    ? "bg-brand-50"
                    : checked
                      ? "bg-brand-50/50"
                      : "hover:bg-field/70"
                }`}
              >
                {selection && (
                  <td className={`${CELL} pr-0`}>
                    <label className="flex cursor-pointer items-center">
                      <span className="sr-only">選取 {rowLabel(row)}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(key)}
                        className="size-4 cursor-pointer accent-brand-700"
                      />
                    </label>
                  </td>
                )}
                {shown.map((column) => (
                  <td
                    key={column.key}
                    className={`${CELL} ${column.className ?? ""}`}
                  >
                    {column.primary && rowHref ? (
                      <Link
                        href={rowHref(row)}
                        className="block w-full min-w-0 rounded-chip"
                      >
                        {column.cell(row)}
                      </Link>
                    ) : column.primary && onOpen ? (
                      <button
                        type="button"
                        onClick={() => onOpen(row)}
                        aria-label={`${rowLabel(row)}，查看詳細資料`}
                        aria-expanded={active}
                        className="block w-full min-w-0 cursor-pointer rounded-chip text-left"
                      >
                        {column.cell(row)}
                      </button>
                    ) : (
                      column.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const HEAD =
  "h-9 border-line-strong border-b bg-field px-3 text-left font-semibold text-ink-500 text-xs first:pl-4";
const CELL = "h-11 px-3 py-1.5 align-middle text-ink-700 first:pl-4";

function SelectAll({
  total,
  selected,
  onChange,
}: {
  total: number;
  selected: number;
  onChange: (all: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = selected > 0 && selected < total;
    }
  }, [selected, total]);
  return (
    <label className="flex cursor-pointer items-center">
      <span className="sr-only">選取這一頁全部</span>
      <input
        ref={ref}
        type="checkbox"
        checked={total > 0 && selected === total}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 cursor-pointer accent-brand-700"
      />
    </label>
  );
}

/** Truncated text with the full value as a tooltip. */
export function Truncate({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={`block truncate ${className}`} title={children}>
      {children}
    </span>
  );
}
