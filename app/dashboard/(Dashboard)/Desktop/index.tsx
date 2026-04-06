"use client";

import dynamic from "next/dynamic";

// Modules
import { useEffect, useRef, useState } from "react";
// Styles
import styles from "./index.module.scss";
import "chart.js/auto";

// Configs
import {
  sigDefaultBorderColors,
  sigDefaultColors,
} from "@/app/dashboard/(Dashboard)/config/sigDefaultColors";

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

export default function Desktop() {
  const [userCount, setUserCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [postUserCount, setPostUserCount] = useState(0);
  const [validPostCount, setValidPostCount] = useState(0);

  // Sig Posts Count
  const [sigPostCount, setSigPostCount] = useState<any>([]);
  const [sigPostCountLabel, setSigPostCountLabel] = useState<any>([]);
  const [sigPostCountData, setSigPostCountData] = useState<any>([]);
  const [sigPostCountColor, setSigPostCountColor] = useState<any>([]);
  const [sigPostCountBorderColor, setSigPostCountBorderColor] = useState<any>(
    [],
  );

  // Sig User Count
  const [sigUserCount, setSigUserCount] = useState<any>([]);
  const [sigUserCountLabel, setSigUserCountLabel] = useState<any>([]);
  const [sigUserCountData, setSigUserCountData] = useState<any>([]);
  const [sigUserCountColor, setSigUserCountColor] = useState<any>([]);
  const [sigUserCountBorderColor, setSigUserCountBorderColor] = useState<any>(
    [],
  );

  const [sigPostCountFinalData, setSigPostCountFinalData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  } as any);

  const [sigUserCountFinalData, setSigUserCountFinalData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  } as any);

  const date = new Date().toISOString();

  // Sig Posts Count Start
  useEffect(() => {
    if (sigPostCount.length === 0) return;
    sigPostCount.forEach((sig: any) => {
      setSigPostCountLabel((prev: any) => [...prev, sig.name]);
      setSigPostCountData((prev: any) => [...prev, sig.count]);
      setSigPostCountColor((prev: any) => [
        ...prev,
        sigDefaultColors[sig.name],
      ]);
      setSigPostCountBorderColor((prev: any) => [
        ...prev,
        sigDefaultBorderColors[sig.name],
      ]);
    });
  }, [sigPostCount]);

  useEffect(() => {
    if (sigPostCountFinalData.labels.length !== 0) return;
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
  }, []);
  // Sig Posts Count End

  // Sig Users Count Start
  useEffect(() => {
    if (sigUserCount.length === 0) return;
    sigUserCount.forEach((sig: any) => {
      setSigUserCountLabel((prev: any) => [...prev, sig.name]);
      setSigUserCountData((prev: any) => [...prev, sig.count]);
      setSigUserCountColor((prev: any) => [
        ...prev,
        sigDefaultColors[sig.name],
      ]);
      setSigUserCountBorderColor((prev: any) => [
        ...prev,
        sigDefaultBorderColors[sig.name],
      ]);
    });
  }, [sigUserCount]);

  useEffect(() => {
    if (sigUserCountFinalData.labels.length !== 0) return;
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
  }, []);
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
      controllers.forEach((controller) => controller.abort());
    };
  }, []);

  return (
    <div>
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
            <br />
            <br />
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
