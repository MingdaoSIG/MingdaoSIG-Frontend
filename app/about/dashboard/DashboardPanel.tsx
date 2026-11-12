"use client";

import "chart.js/auto";
import { Bar } from "react-chartjs-2";
import { formatStat, useDashboardData } from "./useDashboardData";

// 平台數據 inside 關於 MDSIG. This module pulls in chart.js, so the page
// imports it with next/dynamic once the section comes near the screen.

function barOptions(title: string, mobile: boolean) {
  return {
    responsive: true,
    aspectRatio: mobile ? 1.4 : 2.6,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: "#111d29",
        font: { size: 15, weight: "bold" as const },
        padding: { bottom: 16 },
      },
    },
  };
}

export default function DashboardPanel({
  mobile = false,
}: {
  mobile?: boolean;
}) {
  const { stats, sigPosts, sigUsers, loading, error, retry } =
    useDashboardData();
  const items = [
    { label: "使用者", value: stats.users },
    { label: "平台按讚數", value: stats.likes },
    { label: "發文人數", value: stats.posters },
    { label: "有效貼文", value: stats.posts },
  ];

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line px-4 py-3 text-ink-700 text-sm"
        >
          <span>部分數據載入失敗：{error}</span>
          <button
            type="button"
            className="h-9 cursor-pointer rounded-control border border-line-strong bg-surface px-4 text-ink-800 hover:bg-field"
            onClick={retry}
          >
            重試
          </button>
        </div>
      )}
      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-busy={loading}
      >
        {items.map((stat) => (
          <div
            key={stat.label}
            className="rounded-control border border-line px-4 py-3"
          >
            <p className="text-ink-500 text-sm">{stat.label}</p>
            <p className="mt-1 font-bold text-2xl text-ink-900 tabular-nums">
              {formatStat(stat.value)}
            </p>
          </div>
        ))}
      </div>
      <div className="min-w-0">
        <Bar data={sigPosts} options={barOptions("各 SIG 發文數量", mobile)} />
      </div>
      <div className="min-w-0">
        <Bar data={sigUsers} options={barOptions("各 SIG 人員數量", mobile)} />
      </div>
    </div>
  );
}
