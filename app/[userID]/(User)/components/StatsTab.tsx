"use client";

import "chart.js/auto";

import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { TAuthorStats } from "@/interfaces/Reading";
import { ApiError, apiRequest, getErrorMessage } from "@/modules/api/client";

// 「我的數據」 on your own profile (contract v4 §4.2): totals, views per day
// as a line chart, and every post with its numbers.

const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

type SortKey = "viewsInRange" | "views" | "likes" | "comments" | "createdAt";

function num(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalise(data: unknown): TAuthorStats {
  const raw = (data ?? {}) as Partial<TAuthorStats>;
  const totals = (raw.totals ?? {}) as Partial<TAuthorStats["totals"]>;
  return {
    totals: {
      posts: num(totals.posts),
      views: num(totals.views),
      likes: num(totals.likes),
      comments: num(totals.comments),
    },
    daily: Array.isArray(raw.daily)
      ? raw.daily
          .filter((d) => d && typeof d.date === "string")
          .map((d) => ({ date: d.date, views: num(d.views) }))
      : [],
    posts: Array.isArray(raw.posts)
      ? raw.posts
          .filter((p) => p && typeof p._id === "string")
          .map((p) => ({
            ...p,
            title: typeof p.title === "string" ? p.title : "",
            views: num(p.views),
            likes: num(p.likes),
            comments: num(p.comments),
            viewsInRange: num(p.viewsInRange),
          }))
      : [],
  };
}

/** YYYY-MM-DD in Asia/Taipei (the backend's day boundary). */
function taipeiDate(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

/** Every day of the range, oldest first, zero where the backend has none. */
function fillDays(daily: TAuthorStats["daily"], days: number) {
  const counts = new Map(daily.map((d) => [d.date, d.views]));
  const out: { date: string; views: number }[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const date = taipeiDate(new Date(now - i * 86400000));
    out.push({ date, views: counts.get(date) ?? 0 });
  }
  return out;
}

/** Chart colours: the design tokens (canvas cannot read CSS variables). */
const CHART = {
  line: "#0b5a83", // brand-700
  fill: "rgba(11, 90, 131, 0.14)",
  text: "#586676", // ink-500
  grid: "rgba(17, 29, 41, 0.1)", // line
  surface: "#ffffff",
  tooltip: "#111d29", // ink-900
};

function useAuthorStats(days: Range, enabled: boolean) {
  return useQuery({
    queryKey: ["authorStats", days],
    queryFn: async ({ signal }) => {
      const result = await apiRequest<unknown>("/user/me/stats", {
        auth: true,
        query: { days },
        signal,
      });
      if (!result.ok) {
        throw new ApiError(result);
      }
      return normalise(result.data);
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

function Kpi({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3 shadow-card">
      <p className="text-ink-500 text-xs">{label}</p>
      <p className="mt-0.5 font-bold text-2xl text-ink-900 tabular-nums">
        {value === undefined ? (
          <span className="inline-block h-7 w-12 animate-pulse rounded-chip bg-field align-middle" />
        ) : (
          value.toLocaleString("zh-TW")
        )}
      </p>
    </div>
  );
}

function ViewsChart({
  daily,
  days,
  mobile,
}: {
  daily: TAuthorStats["daily"];
  days: number;
  mobile: boolean;
}) {
  const points = useMemo(() => fillDays(daily, days), [daily, days]);
  const total = points.reduce((sum, p) => sum + p.views, 0);

  return (
    <figure className="m-0 rounded-card border border-line bg-surface p-4 shadow-card">
      <figcaption className="mb-2 flex items-baseline justify-between gap-2">
        <span className="font-semibold text-ink-900 text-sm">每日瀏覽</span>
        <span className="text-ink-500 text-xs">
          近 {days} 天共 {total.toLocaleString("zh-TW")} 次
        </span>
      </figcaption>
      <div className={mobile ? "h-48" : "h-60"}>
        <Line
          aria-label={`近 ${days} 天每日瀏覽次數折線圖，共 ${total} 次`}
          role="img"
          data={{
            labels: points.map((p) => p.date.slice(5).replace("-", "/")),
            datasets: [
              {
                label: "瀏覽",
                data: points.map((p) => p.views),
                borderColor: CHART.line,
                backgroundColor: CHART.fill,
                pointBackgroundColor: CHART.surface,
                pointBorderColor: CHART.line,
                pointRadius: days > 30 ? 0 : 2.5,
                pointHoverRadius: 4,
                borderWidth: 2,
                tension: 0.3,
                fill: true,
              },
            ],
          }}
          options={{
            maintainAspectRatio: false,
            responsive: true,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: CHART.tooltip,
                titleColor: CHART.surface,
                bodyColor: CHART.surface,
                displayColors: false,
                callbacks: {
                  label: (item) => `${item.formattedValue} 次瀏覽`,
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  color: CHART.text,
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: mobile ? 5 : 8,
                },
                grid: { display: false },
                border: { color: CHART.grid },
              },
              y: {
                beginAtZero: true,
                ticks: { color: CHART.text, precision: 0 },
                grid: { color: CHART.grid },
                border: { display: false },
              },
            },
          }}
        />
      </div>
    </figure>
  );
}

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "createdAt", label: "發布日期", numeric: false },
  { key: "viewsInRange", label: "期間瀏覽", numeric: true },
  { key: "views", label: "總瀏覽", numeric: true },
  { key: "likes", label: "讚", numeric: true },
  { key: "comments", label: "留言", numeric: true },
];

function formatDate(value: string | undefined) {
  const date = new Date(value ?? "");
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("zh-TW");
}

function PostTable({
  posts,
  days,
  mobile,
}: {
  posts: TAuthorStats["posts"];
  days: number;
  mobile: boolean;
}) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({
    key: "viewsInRange",
    desc: true,
  });
  const sorted = useMemo(() => {
    const list = posts.slice();
    list.sort((a, b) => {
      const x =
        sort.key === "createdAt"
          ? new Date(a.createdAt ?? 0).getTime()
          : a[sort.key];
      const y =
        sort.key === "createdAt"
          ? new Date(b.createdAt ?? 0).getTime()
          : b[sort.key];
      return sort.desc ? y - x : x - y;
    });
    return list;
  }, [posts, sort]);

  if (posts.length === 0) {
    return (
      <p className="rounded-card border border-line bg-surface p-6 text-center text-ink-500 text-sm shadow-card">
        還沒有貼文。發布第一篇後，這裡會顯示每篇的瀏覽、讚和留言。
      </p>
    );
  }

  if (mobile) {
    return (
      <ul className="flex flex-col gap-2">
        {sorted.map((post) => (
          <li
            key={post._id}
            className="rounded-card border border-line bg-surface p-3 shadow-card"
          >
            <Link
              href={`/post/${post._id}`}
              className="line-clamp-2 font-semibold text-ink-900 text-sm"
            >
              {post.title || "（無標題）"}
            </Link>
            <p className="mt-1 text-ink-500 text-xs">
              {formatDate(post.createdAt)}
            </p>
            <dl className="mt-2 grid grid-cols-4 gap-1 text-center">
              {COLUMNS.filter((c) => c.numeric).map((column) => (
                <div key={column.key} className="rounded-chip bg-field py-1">
                  <dt className="text-[11px] text-ink-500">{column.label}</dt>
                  <dd className="font-semibold text-ink-900 text-sm tabular-nums">
                    {(post[column.key] as number).toLocaleString("zh-TW")}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <table className="w-full table-fixed border-collapse text-sm">
        <caption className="sr-only">
          每篇貼文的數據（期間瀏覽為近 {days} 天）
        </caption>
        <thead>
          <tr className="border-line border-b bg-field text-left text-ink-500 text-xs">
            <th scope="col" className="px-4 py-2.5 font-semibold">
              標題
            </th>
            {COLUMNS.map((column) => {
              const active = sort.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    active ? (sort.desc ? "descending" : "ascending") : "none"
                  }
                  className={`px-3 py-1.5 font-semibold ${
                    column.numeric ? "w-24 text-right" : "w-32"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSort((current) => ({
                        key: column.key,
                        desc: current.key === column.key ? !current.desc : true,
                      }))
                    }
                    className={`inline-flex h-7 cursor-pointer items-center gap-1 rounded-chip px-1 hover:text-ink-900 ${
                      active ? "text-ink-900" : ""
                    }`}
                  >
                    {column.label}
                    {active &&
                      (sort.desc ? (
                        <ArrowDown aria-hidden className="size-3" />
                      ) : (
                        <ArrowUp aria-hidden className="size-3" />
                      ))}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((post) => (
            <tr
              key={post._id}
              className="border-line border-t first:border-t-0"
            >
              <td className="max-w-0 px-4 py-2.5">
                <Link
                  href={`/post/${post._id}`}
                  className="block truncate font-medium text-ink-900 hover:text-brand-700 hover:underline"
                >
                  {post.title || "（無標題）"}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-ink-500">
                {formatDate(post.createdAt)}
              </td>
              {COLUMNS.filter((c) => c.numeric).map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-2.5 text-right tabular-nums ${
                    column.key === "viewsInRange"
                      ? "font-semibold text-ink-900"
                      : "text-ink-700"
                  }`}
                >
                  {(post[column.key] as number).toLocaleString("zh-TW")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StatsTab({ mobile = false }: { mobile?: boolean }) {
  const [days, setDays] = useState<Range>(30);
  const stats = useAuthorStats(days, true);
  const data = stats.data;

  return (
    <div className="flex flex-col gap-3" data-stats>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-base text-ink-900">我的數據</h2>
        <fieldset className="m-0 flex gap-0.5 rounded-control border border-line bg-surface p-0.5 shadow-card">
          <legend className="sr-only">期間</legend>
          {RANGES.map((range) => (
            <label
              key={range}
              className={`flex cursor-pointer items-center rounded-[6px] px-3 font-semibold text-[13px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-700 ${
                mobile ? "h-10" : "h-8"
              } ${
                days === range
                  ? "bg-brand-700 text-white"
                  : "text-ink-700 hover:bg-field"
              }`}
            >
              <input
                type="radio"
                name="stats-range"
                value={range}
                checked={days === range}
                onChange={() => setDays(range)}
                className="sr-only"
              />
              近 {range} 天
            </label>
          ))}
        </fieldset>
      </div>

      {stats.isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-6 text-ink-700 text-sm shadow-card"
        >
          <p>數據載入失敗：{getErrorMessage(stats.error)}</p>
          <button
            type="button"
            className="h-9 cursor-pointer rounded-control border border-line-strong bg-surface px-4 font-semibold text-ink-800 hover:bg-field"
            onClick={() => stats.refetch()}
          >
            重試
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            <Kpi label="貼文" value={data?.totals.posts} />
            <Kpi label="總瀏覽" value={data?.totals.views} />
            <Kpi label="總讚數" value={data?.totals.likes} />
            <Kpi label="總留言" value={data?.totals.comments} />
          </div>
          {data ? (
            <>
              <ViewsChart daily={data.daily} days={days} mobile={mobile} />
              <PostTable posts={data.posts} days={days} mobile={mobile} />
            </>
          ) : (
            <div className="h-60 animate-pulse rounded-card border border-line bg-surface shadow-card" />
          )}
        </>
      )}
    </div>
  );
}
