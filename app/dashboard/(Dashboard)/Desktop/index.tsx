"use client";

import dynamic from "next/dynamic";
import "chart.js/auto";

import { DocCard, DocPage } from "@/components/desktop/DocPage";
import { formatStat, useDashboardData } from "../useDashboardData";

const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

const sigPostBarOption = {
  responsive: true,
  aspectRatio: 3,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: "各 SIG 發文數量",
      color: "#111d29",
      font: { size: 15, weight: "bold" as const },
      padding: { bottom: 16 },
    },
  },
};

const sigUserBarOption = {
  responsive: true,
  aspectRatio: 3,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: "各 SIG 人員數量",
      color: "#111d29",
      font: { size: 15, weight: "bold" as const },
      padding: { bottom: 16 },
    },
  },
};

export default function Desktop() {
  const { stats, sigPosts, sigUsers, loading, error, retry } =
    useDashboardData();

  const items = [
    { label: "使用者", value: stats.users },
    { label: "平台按讚數", value: stats.likes },
    { label: "發文人數", value: stats.posters },
    { label: "有效貼文", value: stats.posts },
  ];

  return (
    <DocPage title="平台數據" description="MDSIG 使用狀況總覽">
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-5 py-3 text-ink-700 text-sm shadow-card"
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
      <div className="grid grid-cols-4 gap-4" aria-busy={loading}>
        {items.map((stat) => (
          <div
            key={stat.label}
            className="rounded-card border border-line bg-surface px-6 py-5 shadow-card"
          >
            <p className="text-ink-500 text-sm">{stat.label}</p>
            <p className="mt-1 font-bold text-3xl text-ink-900 tabular-nums">
              {formatStat(stat.value)}
            </p>
          </div>
        ))}
      </div>
      <DocCard>
        <Bar data={sigPosts} options={sigPostBarOption} />
      </DocCard>
      <DocCard>
        <Bar data={sigUsers} options={sigUserBarOption} />
      </DocCard>
    </DocPage>
  );
}
