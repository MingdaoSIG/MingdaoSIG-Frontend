"use client";

import dynamic from "next/dynamic";

// Modules
import { useEffect, useState } from "react";
// Styles
import styles from "./index.module.scss";
import "chart.js/auto";

// Configs
import {
  sigDefaultBorderColors,
  sigDefaultColors,
} from "@/app/dashboard/(Dashboard)/config/sigDefaultColors";

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

  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className={styles.statics}>
          <div className={styles.staticsItem}>
            <div className={styles.itemWrapper}>
              <div className={styles.itemFlex}>
                <h1>使用者</h1>
                <p>{userCount || 0}</p>
              </div>
            </div>
          </div>
          <div className={styles.staticsItem}>
            <div className={styles.itemWrapper}>
              <div className={styles.itemFlex}>
                <h1>平台按讚數</h1>
                <p>{likeCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.statics}>
          <div className={styles.staticsItem}>
            <div className={styles.itemWrapper}>
              <div className={styles.itemFlex}>
                <h1>發文人數</h1>
                <p>{postUserCount || 0}</p>
              </div>
            </div>
          </div>
          <div className={styles.staticsItem}>
            <div className={styles.itemWrapper}>
              <div className={styles.itemFlex}>
                <h1>有效貼文</h1>
                <p>{validPostCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.sigChart}>
          <div className={styles.chartScroll}>
            <Bar
              className={styles.chartBar}
              data={sigPostCountFinalData}
              options={sigPostBarOption}
            />
            <Bar
              className={styles.chartBar}
              data={sigUserCountFinalData}
              options={sigUserBarOption}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
