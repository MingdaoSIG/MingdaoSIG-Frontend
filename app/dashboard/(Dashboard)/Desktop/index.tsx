"use client";

// Styles
import styles from "./index.module.scss";

// Modules
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "chart.js/auto";

// Configs
import { sigDefaultColors, sigDefaultBorderColors } from "@/app/dashboard/(Dashboard)/config/sigDefaultColors";


const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

const options = {
  responsive: true,
  plugins: {
    legend: {
      display: false,

    },
    title: {
      display: true,
      text: "各 SIG 發文數量"
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
  const [sigPostCountBorderColor, setSigPostCountBorderColor] = useState<any>([]);

  const [sigPostCountFinalData, setSigPostCountFinalData] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
    }]
  } as any);

  const date = new Date().toISOString();

  useEffect(() => {
    if (sigPostCount.length === 0) return;
    sigPostCount.forEach((sig: any) => {
      setSigPostCountLabel((prev: any) => [...prev, sig.name]);
      setSigPostCountData((prev: any) => [...prev, sig.count]);
      setSigPostCountColor((prev: any) => [...prev, sigDefaultColors[sig.name]]);
      setSigPostCountBorderColor((prev: any) => [...prev, sigDefaultBorderColors[sig.name]]);
    });

    setSigPostCountFinalData({
      labels: sigPostCountLabel,
      datasets: [{
        data: sigPostCountData,
        backgroundColor: sigPostCountColor,
        borderColor: sigPostCountBorderColor,
        borderWidth: 1,
      }]
    });
  }, [sigPostCount]);


  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/post/sig?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setSigPostCount(data.data.content);
      });
  }, []);

  useEffect(() => {
    if (userCount === 0) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/user?date=${date}`)
        .then((res) => res.json())
        .then((data) => {
          setUserCount(data.data.content);
        });
    }

    if (likeCount === 0) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/like?date=${date}`)
        .then((res) => res.json())
        .then((data) => {
          setLikeCount(data.data.content);
        });
    }

    if (postUserCount === 0) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/user/posted?date=${date}`)
        .then((res) => res.json())
        .then((data) => {
          setPostUserCount(data.data.content);
        });
    }

    if (validPostCount === 0) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/information/post?date=${date}`)
        .then((res) => res.json())
        .then((data) => {
          setValidPostCount(data.data.content);
        });
    }

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
          <Bar data={sigPostCountFinalData} options={options} />
        </div>
      </div>
    </div >
  );
}