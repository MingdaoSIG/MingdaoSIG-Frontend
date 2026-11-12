"use client";

import { useQuery } from "@tanstack/react-query";
import "chart.js/auto";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { TSigAnalytics } from "@/interfaces/Engagement";
import { ApiError, apiRequest } from "@/modules/api/client";
import { errorText, failureMessage } from "../api";
import { SelectFilter } from "../components/Filters";
import {
  Card,
  EmptyState,
  ErrorState,
  linkClass,
  SkeletonRows,
} from "../components/ui";
import { formatCount } from "../format";
import type { AdminSig } from "../types";
import { oneOf, useQueryState } from "../useQueryState";

// 數據: the SIG's numbers for its managers and admins (GET
// /sig/:id/analytics, cached 10 minutes by the backend): members and
// posts per month as bar charts, the top posts and authors of the period,
// and the events. Months are Asia/Taipei.

const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

const MONTHS = ["6", "12", "24"] as const;
const MONTH_OPTIONS = [
  { value: "6", label: "近 6 個月" },
  { value: "12", label: "近 12 個月" },
  { value: "24", label: "近 24 個月" },
];

const BAR_COLOR = "#0b5a83"; // brand-700
const GRID_COLOR = "rgba(17, 29, 41, 0.08)";
const AXIS_TEXT = "#586676"; // ink-500

function isAnalytics(value: unknown): value is TSigAnalytics {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as TSigAnalytics).members === "object" &&
    typeof (value as TSigAnalytics).posts === "object"
  );
}

async function fetchAnalytics(
  sigId: string,
  months: string,
  signal: AbortSignal,
) {
  const result = await apiRequest<TSigAnalytics>(
    `/sig/${encodeURIComponent(sigId)}/analytics`,
    { auth: true, query: { months }, signal },
  );
  if (!result.ok) {
    throw new ApiError({
      ...result,
      message: failureMessage(result, "你沒有權限查看這個 SIG 的數據"),
    });
  }
  if (!isAnalytics(result.data)) {
    throw new ApiError({
      ok: false,
      kind: "invalid-response",
      status: result.status,
      httpStatus: result.httpStatus,
      message: "伺服器暫時無法回應，請稍後再試",
      body: result.body,
    });
  }
  const data = result.data;
  return {
    members: {
      current: data.members.current ?? 0,
      byMonth: Array.isArray(data.members.byMonth) ? data.members.byMonth : [],
    },
    posts: {
      total: data.posts.total ?? 0,
      byMonth: Array.isArray(data.posts.byMonth) ? data.posts.byMonth : [],
    },
    topPosts: Array.isArray(data.topPosts) ? data.topPosts : [],
    topAuthors: Array.isArray(data.topAuthors) ? data.topAuthors : [],
    events: data.events ?? { upcoming: 0, past: 0, rsvps: 0 },
  } satisfies TSigAnalytics;
}

/** "2026-01" → "1 月", with the year on January and the first bar. */
function monthLabel(month: string, index: number) {
  const [year, value] = month.split("-");
  const number = Number(value);
  if (index === 0 || number === 1) {
    return `${year}/${number}`;
  }
  return `${number} 月`;
}

function MonthlyBars({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: { month: string; value: number }[];
}) {
  const labels = rows.map((row, index) => monthLabel(row.month, index));
  const values = rows.map((row) => row.value);
  const sum = values.reduce((total, value) => total + value, 0);
  return (
    <Card
      title={title}
      actions={
        <span className="text-ink-500 text-xs">
          合計 {formatCount(sum)} {unit}
        </span>
      }
    >
      <div className="h-56" data-chart={title}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: title,
                data: values,
                backgroundColor: BAR_COLOR,
                hoverBackgroundColor: "#094a6c",
                borderRadius: { topLeft: 4, topRight: 4 },
                borderSkipped: "bottom",
                maxBarThickness: 24,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                displayColors: false,
                callbacks: {
                  title: (items) => rows[items[0]?.dataIndex ?? 0]?.month ?? "",
                  label: (item) => `${formatCount(Number(item.raw))} ${unit}`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: AXIS_TEXT,
                  font: { size: 11 },
                  maxRotation: 0,
                  autoSkipPadding: 8,
                },
              },
              y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: GRID_COLOR },
                ticks: {
                  color: AXIS_TEXT,
                  font: { size: 11 },
                  precision: 0,
                },
              },
            },
          }}
        />
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">月份</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3 shadow-card">
      <p className="text-ink-500 text-xs">{label}</p>
      <p className="font-bold text-2xl text-ink-900 tabular-nums">
        {formatCount(value)}
      </p>
      {hint && <p className="text-ink-400 text-xs">{hint}</p>}
    </div>
  );
}

export function AnalyticsTab({ sig }: { sig: AdminSig }) {
  const { get, set } = useQueryState();
  const months = oneOf(get("months"), MONTHS, "12");
  const analytics = useQuery({
    queryKey: ["admin", "sig-analytics", sig._id, months],
    queryFn: ({ signal }) => fetchAnalytics(sig._id, months, signal),
    staleTime: 5 * 60 * 1000,
  });
  const data = analytics.data;
  const range = MONTH_OPTIONS.find((option) => option.value === months)?.label;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-ink-500 text-sm">
          依台灣時間逐月統計；排行只計算{range}發表的貼文。
        </p>
        <SelectFilter
          label="期間"
          value={months}
          options={MONTH_OPTIONS}
          onChange={(next) =>
            set({ months: next === "12" ? null : next }, { replace: true })
          }
          className="w-40"
        />
      </div>

      {analytics.isError ? (
        <Card>
          <ErrorState
            message={errorText(analytics.error)}
            onRetry={() => void analytics.refetch()}
          />
        </Card>
      ) : !data ? (
        <Card padded={false}>
          <SkeletonRows rows={6} />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="目前成員" value={data.members.current} />
            <Stat label="貼文總數" value={data.posts.total} hint="全部期間" />
            <Stat label="即將舉行的活動" value={data.events.upcoming} />
            <Stat label="已結束的活動" value={data.events.past} />
            <div className="col-span-2 lg:col-span-1">
              <Stat label="活動報名人次" value={data.events.rsvps} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <MonthlyBars
              title="每月新成員"
              unit="人"
              rows={data.members.byMonth.map((row) => ({
                month: row.month,
                value: row.joined,
              }))}
            />
            <MonthlyBars
              title="每月貼文"
              unit="篇"
              rows={data.posts.byMonth.map((row) => ({
                month: row.month,
                value: row.count,
              }))}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card title="熱門貼文" padded={false}>
              {data.topPosts.length === 0 ? (
                <EmptyState title={`${range}沒有新貼文`} />
              ) : (
                <table className="w-full table-fixed border-collapse text-sm">
                  <thead>
                    <tr className="border-line-strong border-y bg-field text-left text-ink-500 text-xs">
                      <th scope="col" className="h-9 px-4 font-semibold">
                        貼文
                      </th>
                      <th
                        scope="col"
                        className="h-9 w-14 px-2 text-right font-semibold"
                      >
                        讚
                      </th>
                      <th
                        scope="col"
                        className="h-9 w-14 px-2 text-right font-semibold"
                      >
                        留言
                      </th>
                      <th
                        scope="col"
                        className="h-9 w-16 px-4 text-right font-semibold"
                      >
                        瀏覽
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPosts.map((post) => (
                      <tr
                        key={post._id}
                        className="border-line border-b last:border-b-0"
                      >
                        <td className="h-11 px-4">
                          <Link
                            href={`/post/${post._id}`}
                            target="_blank"
                            className={`${linkClass} block truncate`}
                            title={post.title}
                          >
                            {post.title || "（無標題）"}
                          </Link>
                        </td>
                        <td className="px-2 text-right tabular-nums">
                          {formatCount(post.likes)}
                        </td>
                        <td className="px-2 text-right tabular-nums">
                          {formatCount(post.comments)}
                        </td>
                        <td className="px-4 text-right tabular-nums">
                          {formatCount(post.views)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
            <Card title="發文最多的成員" padded={false}>
              {data.topAuthors.length === 0 ? (
                <EmptyState title={`${range}沒有新貼文`} />
              ) : (
                <ol className="divide-y divide-line border-line border-t">
                  {data.topAuthors.map((author, index) => (
                    <li
                      key={author.user._id}
                      className="flex h-11 items-center gap-3 px-4 text-sm"
                    >
                      <span className="w-4 text-ink-400 text-xs tabular-nums">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {author.user.customId ? (
                          <Link
                            href={`/@${author.user.customId}`}
                            target="_blank"
                            className={linkClass}
                          >
                            {author.user.name || `@${author.user.customId}`}
                          </Link>
                        ) : (
                          author.user.name || "已刪除的使用者"
                        )}
                      </span>
                      <span className="shrink-0 text-ink-700 tabular-nums">
                        {formatCount(author.posts)} 篇
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
