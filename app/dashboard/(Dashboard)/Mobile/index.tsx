"use client";

import dynamic from "next/dynamic";
import "chart.js/auto";

import { PageTitle } from "@/components/mobile/PageTitle";
import { formatStat, useDashboardData } from "../useDashboardData";
// Styles
import styles from "./index.module.scss";

const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

const sigPostBarOption = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: "各 SIG 發文數量",
    },
  },
};

const sigUserBarOption = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: "各 SIG 人員數量",
    },
  },
};

export default function Mobile() {
  const { stats, sigPosts, sigUsers, loading, error, retry } =
    useDashboardData();

  const rows = [
    [
      { label: "使用者", value: stats.users },
      { label: "平台按讚數", value: stats.likes },
    ],
    [
      { label: "發文人數", value: stats.posters },
      { label: "有效貼文", value: stats.posts },
    ],
  ];

  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <PageTitle title="平台數據" />
        {error && (
          <div
            role="alert"
            className="mt-2 flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-2 text-ink-700 text-sm shadow-card"
          >
            <span>部分數據載入失敗</span>
            <button
              type="button"
              className="h-10 rounded-control border border-line-strong bg-surface px-4 text-ink-800"
              onClick={retry}
            >
              重試
            </button>
          </div>
        )}
        {rows.map((row) => (
          <div
            key={row[0].label}
            className={styles.statics}
            aria-busy={loading}
          >
            {row.map((item) => (
              <div key={item.label} className={styles.staticsItem}>
                <div className={styles.itemWrapper}>
                  <div className={styles.itemFlex}>
                    <h2>{item.label}</h2>
                    <p>{formatStat(item.value)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        <div className={styles.sigChart}>
          <div className={styles.chartScroll}>
            <Bar
              className={styles.chartBar}
              data={sigPosts}
              options={sigPostBarOption}
            />
            <Bar
              className={styles.chartBar}
              data={sigUsers}
              options={sigUserBarOption}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
