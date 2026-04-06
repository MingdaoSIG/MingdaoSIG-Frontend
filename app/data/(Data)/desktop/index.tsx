// Styles

// Modules
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
// data
import data from "../config/data.json";
import styles from "./index.module.scss";

export default function Desktop() {
  const [ping, setPing] = useState<any>({});

  useEffect(() => {
    fetch("/ping")
      .then((res) => res.json())
      .then((data) => {
        setPing(data);
      });
  }, []);

  return (
    <div>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 資料查詢系統</h1>
        </div>
        <div className={styles.content}></div>
      </div>
    </div>
  );
}
