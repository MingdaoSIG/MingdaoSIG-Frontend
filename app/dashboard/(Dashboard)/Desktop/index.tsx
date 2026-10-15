"use client";

import dynamic from "next/dynamic";

// Modules
import { useEffect, useState } from "react";
import "chart.js/auto";

// Configs
import {
  sigDefaultBorderColors,
  sigDefaultColors,
} from "@/app/dashboard/(Dashboard)/config/sigDefaultColors";
import { DocCard, DocPage } from "@/components/desktop/DocPage";

type SigCountItem = {
  name: string;
  count: number;
};

type ChartData = {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
};

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
  const [userCount, setUserCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [postUserCount, setPostUserCount] = useState(0);
  const [validPostCount, setValidPostCount] = useState(0);

  // Sig Posts Count
  const [sigPostCount, setSigPostCount] = useState<SigCountItem[]>([]);
  const [sigPostCountLabel, setSigPostCountLabel] = useState<string[]>([]);
  const [sigPostCountData, setSigPostCountData] = useState<number[]>([]);
  const [sigPostCountColor, setSigPostCountColor] = useState<string[]>([]);
  const [sigPostCountBorderColor, setSigPostCountBorderColor] = useState<
    string[]
  >([]);

  // Sig User Count
  const [sigUserCount, setSigUserCount] = useState<SigCountItem[]>([]);
  const [sigUserCountLabel, setSigUserCountLabel] = useState<string[]>([]);
  const [sigUserCountData, setSigUserCountData] = useState<number[]>([]);
  const [sigUserCountColor, setSigUserCountColor] = useState<string[]>([]);
  const [sigUserCountBorderColor, setSigUserCountBorderColor] = useState<
    string[]
  >([]);

  const [sigPostCountFinalData, setSigPostCountFinalData] = useState<ChartData>(
    {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1,
        },
      ],
    },
  );

  const [sigUserCountFinalData, setSigUserCountFinalData] = useState<ChartData>(
    {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1,
        },
      ],
    },
  );

  const [date] = useState(() => new Date().toISOString());

  // Sig Posts Count Start
  useEffect(() => {
    if (sigPostCount.length === 0) {
      return;
    }
    for (const sig of sigPostCount) {
      setSigPostCountLabel((prev: string[]) => [...prev, sig.name]);
      setSigPostCountData((prev: number[]) => [...prev, sig.count]);
      setSigPostCountColor((prev: string[]) => [
        ...prev,
        sigDefaultColors[sig.name],
      ]);
      setSigPostCountBorderColor((prev: string[]) => [
        ...prev,
        sigDefaultBorderColors[sig.name],
      ]);
    }
  }, [sigPostCount]);

  useEffect(() => {
    if (sigPostCountFinalData.labels.length !== 0) {
      return;
    }
    setSigPostCountFinalData({
      labels: sigPostCountLabel,
      datasets: [
        {
          data: sigPostCountData,
          backgroundColor: sigPostCountColor,
          borderColor: sigPostCountBorderColor,
          borderWidth: 1,
        },
      ],
    });
  }, [
    sigPostCountBorderColor,
    sigPostCountColor,
    sigPostCountData,
    sigPostCountFinalData.labels,
    sigPostCountLabel,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/information/post/sig?date=${date}`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => {
        setSigPostCount(data.data.content);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch sig post count:", error);
        }
      });

    return () => controller.abort();
  }, [date]);
  // Sig Posts Count End

  // Sig Users Count Start
  useEffect(() => {
    if (sigUserCount.length === 0) {
      return;
    }
    for (const sig of sigUserCount) {
      setSigUserCountLabel((prev: string[]) => [...prev, sig.name]);
      setSigUserCountData((prev: number[]) => [...prev, sig.count]);
      setSigUserCountColor((prev: string[]) => [
        ...prev,
        sigDefaultColors[sig.name],
      ]);
      setSigUserCountBorderColor((prev: string[]) => [
        ...prev,
        sigDefaultBorderColors[sig.name],
      ]);
    }
  }, [sigUserCount]);

  useEffect(() => {
    if (sigUserCountFinalData.labels.length !== 0) {
      return;
    }
    setSigUserCountFinalData({
      labels: sigUserCountLabel,
      datasets: [
        {
          data: sigUserCountData,
          backgroundColor: sigUserCountColor,
          borderColor: sigUserCountBorderColor,
          borderWidth: 1,
        },
      ],
    });
  }, [
    sigUserCountBorderColor,
    sigUserCountColor,
    sigUserCountData,
    sigUserCountFinalData.labels,
    sigUserCountLabel,
  ]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/information/user/sig?date=${date}`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => {
        setSigUserCount(data.data.content);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch sig user count:", error);
        }
      });

    return () => controller.abort();
  }, [date]);
  // Sig Users Count End

  useEffect(() => {
    const controllers: AbortController[] = [];

    if (userCount === 0) {
      const controller = new AbortController();
      controllers.push(controller);
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/information/user?date=${date}`,
        {
          signal: controller.signal,
        },
      )
        .then((res) => res.json())
        .then((data) => {
          setUserCount(data.data.content);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Failed to fetch user count:", error);
          }
        });
    }

    if (likeCount === 0) {
      const controller = new AbortController();
      controllers.push(controller);
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/information/like?date=${date}`,
        {
          signal: controller.signal,
        },
      )
        .then((res) => res.json())
        .then((data) => {
          setLikeCount(data.data.content);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Failed to fetch like count:", error);
          }
        });
    }

    if (postUserCount === 0) {
      const controller = new AbortController();
      controllers.push(controller);
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/information/user/posted?date=${date}`,
        { signal: controller.signal },
      )
        .then((res) => res.json())
        .then((data) => {
          setPostUserCount(data.data.content);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Failed to fetch post user count:", error);
          }
        });
    }

    if (validPostCount === 0) {
      const controller = new AbortController();
      controllers.push(controller);
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/information/post?date=${date}`,
        {
          signal: controller.signal,
        },
      )
        .then((res) => res.json())
        .then((data) => {
          setValidPostCount(data.data.content);
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Failed to fetch valid post count:", error);
          }
        });
    }

    return () => {
      for (const controller of controllers) {
        controller.abort();
      }
    };
  }, [validPostCount, userCount, postUserCount, likeCount, date]);

  const stats = [
    { label: "使用者", value: userCount },
    { label: "平台按讚數", value: likeCount },
    { label: "發文人數", value: postUserCount },
    { label: "有效貼文", value: validPostCount },
  ];

  return (
    <DocPage title="平台數據" description="MDSIG 使用狀況總覽">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-card border border-line bg-surface px-6 py-5 shadow-card"
          >
            <p className="text-ink-500 text-sm">{stat.label}</p>
            <p className="mt-1 font-bold text-3xl text-ink-900 tabular-nums">
              {(stat.value || 0).toLocaleString("zh-TW")}
            </p>
          </div>
        ))}
      </div>
      <DocCard>
        <Bar data={sigPostCountFinalData} options={sigPostBarOption} />
      </DocCard>
      <DocCard>
        <Bar data={sigUserCountFinalData} options={sigUserBarOption} />
      </DocCard>
    </DocPage>
  );
}
