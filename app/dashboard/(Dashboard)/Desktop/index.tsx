"use client";

// Styles
import styles from "./index.module.scss";

// Modules
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "chart.js/auto";


const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

const data = {
  labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
  datasets: [
    {
      label: "各 SIG 發文數量",
      data: [12, 19, 3, 5, 2, 3],
      backgroundColor: [
        "rgba(255, 99, 132, 0.2)",
        "rgba(54, 162, 235, 0.2)",
        "rgba(255, 206, 86, 0.2)",
        "rgba(75, 192, 192, 0.2)",
        "rgba(153, 102, 255, 0.2)",
        "rgba(255, 159, 64, 0.2)",
      ],
      borderColor: [
        "rgba(255, 99, 132, 1)",
        "rgba(54, 162, 235, 1)",
        "rgba(255, 206, 86, 1)",
        "rgba(75, 192, 192, 1)",
        "rgba(153, 102, 255, 1)",
        "rgba(255, 159, 64, 1)",
      ],
      borderWidth: 1,
    },
  ],
};

export default function Desktop() {
  const [userCount, setUserCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [postUserCount, setPostUserCount] = useState(0);
  const [validPostCount, setValidPostCount] = useState(0);

  const date = new Date().toISOString();

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
          <Bar data={data} />
        </div>
      </div>
    </div >
  );
}