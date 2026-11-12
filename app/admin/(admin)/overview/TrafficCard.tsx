"use client";

import "chart.js/auto";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import useIsMobile from "@/utils/useIsMobile";
import { errorText } from "../api";
import { Card, ErrorState, SkeletonRows } from "../components/ui";
import { formatCount } from "../format";
import { type Traffic, type TrafficRange, useTraffic } from "../moderationApi";

// 網站流量 on the admin overview (contract v4 §5.10): page views and
// visitors per day from Umami, the totals, and the top pages and
// referrers. Admins only. The whole card is left out while the backend
// has no Umami connection (503).

const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

const RANGES: { value: TrafficRange; label: string; days: number }[] = [
  { value: "7d", label: "7 天", days: 7 },
  { value: "30d", label: "30 天", days: 30 },
  { value: "90d", label: "90 天", days: 90 },
];

/**
 * Series colours: a brand blue and the warm token, checked for colour
 * blindness and contrast on white (the dataviz validator). Visitors is
 * also dashed, so the two never rely on colour alone.
 */
const CHART = {
  views: "#0b6aa0",
  visitors: "#b9620f",
  text: "#586676", // ink-500
  grid: "rgba(17, 29, 41, 0.1)", // line
  surface: "#ffffff",
  tooltip: "#111d29", // ink-900
};

/** MM/DD from YYYY-MM-DD. */
function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return month && day ? `${month}/${day}` : date;
}

/** A site path from Umami, as a link when it is one of ours. */
function PagePath({ path }: { path: string }) {
  const safe = path.startsWith("/") && !path.startsWith("//");
  return safe ? (
    <Link
      href={path}
      target="_blank"
      className="block truncate text-ink-800 hover:text-brand-700"
      title={path}
    >
      {path}
    </Link>
  ) : (
    <span className="block truncate text-ink-800" title={path}>
      {path || "—"}
    </span>
  );
}

export function TrafficCard() {
  const [range, setRange] = useState<TrafficRange>("30d");
  const traffic = useTraffic(range, true);
  const isMobile = useIsMobile();

  // 503: Umami is not set up, so there is nothing to show.
  if (traffic.isSuccess && traffic.data === null) {
    return null;
  }

  const days = RANGES.find((item) => item.value === range)?.days ?? 30;

  return (
    <Card
      title="網站流量"
      padded={false}
      className="mt-4"
      actions={
        <fieldset className="mr-4 flex rounded-control border border-line bg-field p-0.5 lg:mr-5">
          <legend className="sr-only">期間</legend>
          {RANGES.map((item) => (
            <label
              key={item.value}
              className={`cursor-pointer rounded-[6px] px-2.5 py-1 text-xs transition-colors ${
                range === item.value
                  ? "bg-surface font-semibold text-ink-900 shadow-card"
                  : "text-ink-500 hover:text-ink-800"
              }`}
            >
              <input
                type="radio"
                name="traffic-range"
                value={item.value}
                checked={range === item.value}
                onChange={() => setRange(item.value)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </fieldset>
      }
    >
      {traffic.isPending ? (
        <SkeletonRows rows={5} />
      ) : traffic.isError ? (
        <ErrorState
          message={errorText(traffic.error)}
          onRetry={() => traffic.refetch()}
        />
      ) : traffic.data ? (
        <TrafficBody
          data={traffic.data}
          days={days}
          mobile={isMobile}
          fetching={traffic.isFetching}
        />
      ) : null}
    </Card>
  );
}

function TrafficBody({
  data,
  days,
  mobile,
  fetching,
}: {
  data: Traffic;
  days: number;
  mobile: boolean;
  fetching: boolean;
}) {
  const totals = [
    { label: "瀏覽次數", value: data.pageviews },
    { label: "訪客", value: data.visitors },
    { label: "造訪", value: data.visits },
  ];
  const series = useMemo(
    () => [...data.series].sort((a, b) => a.date.localeCompare(b.date)),
    [data.series],
  );

  return (
    <div
      className={`px-4 pb-4 transition-opacity lg:px-5 lg:pb-5 ${fetching ? "opacity-60" : ""}`}
      aria-busy={fetching || undefined}
    >
      <dl className="grid grid-cols-3 gap-3">
        {totals.map((item) => (
          <div key={item.label} className="rounded-control bg-field px-3 py-2">
            <dt className="text-ink-500 text-xs">{item.label}</dt>
            <dd className="mt-0.5 font-bold text-ink-900 text-xl tabular-nums">
              {formatCount(item.value)}
            </dd>
          </div>
        ))}
      </dl>

      <figure className="m-0 mt-4">
        <figcaption className="sr-only">
          近 {days} 天每日瀏覽次數與訪客數
        </figcaption>
        {series.length === 0 ? (
          <p className="py-8 text-center text-ink-500 text-sm">
            這段期間沒有流量資料
          </p>
        ) : (
          <div className={mobile ? "h-52" : "h-64"}>
            <Line
              aria-label={`近 ${days} 天每日瀏覽次數與訪客折線圖，共 ${data.pageviews} 次瀏覽、${data.visitors} 位訪客`}
              role="img"
              data={{
                labels: series.map((point) => shortDate(point.date)),
                datasets: [
                  {
                    label: "瀏覽次數",
                    data: series.map((point) => point.pageviews),
                    borderColor: CHART.views,
                    backgroundColor: CHART.views,
                    pointBackgroundColor: CHART.surface,
                    pointBorderColor: CHART.views,
                    pointRadius: days > 30 ? 0 : 2.5,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    tension: 0.3,
                  },
                  {
                    label: "訪客",
                    data: series.map((point) => point.visitors),
                    borderColor: CHART.visitors,
                    backgroundColor: CHART.visitors,
                    pointBackgroundColor: CHART.surface,
                    pointBorderColor: CHART.visitors,
                    pointRadius: days > 30 ? 0 : 2.5,
                    pointHoverRadius: 4,
                    borderWidth: 2,
                    borderDash: [5, 4],
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                interaction: { mode: "index", intersect: false },
                plugins: {
                  legend: {
                    position: "top",
                    align: "end",
                    labels: {
                      color: CHART.text,
                      boxWidth: 18,
                      boxHeight: 2,
                      usePointStyle: false,
                    },
                  },
                  tooltip: {
                    backgroundColor: CHART.tooltip,
                    titleColor: CHART.surface,
                    bodyColor: CHART.surface,
                    callbacks: {
                      label: (item) =>
                        ` ${item.dataset.label}：${item.formattedValue}`,
                    },
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      color: CHART.text,
                      maxRotation: 0,
                      autoSkip: true,
                      maxTicksLimit: mobile ? 5 : 10,
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
        )}
      </figure>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <TopList
          title="熱門頁面"
          unit="次瀏覽"
          rows={data.topPages.map((page) => ({
            key: page.path,
            label: <PagePath path={page.path} />,
            value: page.views,
          }))}
        />
        <TopList
          title="主要來源"
          unit="次造訪"
          rows={data.topReferrers.map((item) => ({
            key: item.referrer || "(direct)",
            label: (
              <span
                className="block truncate text-ink-800"
                title={item.referrer}
              >
                {item.referrer || "直接造訪"}
              </span>
            ),
            value: item.visits,
          }))}
        />
      </div>
    </div>
  );
}

function TopList({
  title,
  unit,
  rows,
}: {
  title: string;
  unit: string;
  rows: { key: string; label: React.ReactNode; value: number }[];
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <section>
      <h3 className="mb-1.5 font-semibold text-ink-700 text-xs">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-ink-500 text-sm">沒有資料</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {rows.slice(0, 10).map((row) => (
            <li
              key={row.key}
              className="relative flex items-center gap-3 overflow-hidden rounded-chip px-2 py-1 text-sm"
            >
              {/* A quiet bar behind the row: share of the top row. */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-chip bg-brand-50"
                style={{ width: `${(row.value / max) * 100}%` }}
              />
              <span className="relative min-w-0 flex-1">{row.label}</span>
              <span className="relative shrink-0 text-ink-700 tabular-nums">
                {formatCount(row.value)}
                <span className="sr-only"> {unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
