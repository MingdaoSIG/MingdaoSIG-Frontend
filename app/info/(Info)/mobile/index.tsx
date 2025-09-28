// Styles
import styles from "./index.module.scss";

// Modules
import Link from "next/link";
import { Fragment, useState, useEffect } from "react";

// data
import data from "../config/data.json";

export default function Mobile() {
  const [ping, setPing] = useState<any>({});

  useEffect(() => {
    fetch("/ping")
      .then((res) => res.json())
      .then((data) => {
        setPing(data);
      });
  }, []);

  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 平台資訊</h1>
        </div>
        <div className={styles.content}>
          <div>
            {data.map((item, index) => {
              return (
                <Fragment key={index}>
                  <h1 className={index === 0 ? styles.links : styles.links2}>
                    {item.name}
                  </h1>
                  {item.children.map((child, childIndex) => {
                    return (
                      <Fragment key={childIndex}>
                        <Link
                          href={child.url}
                          target={
                            child.url.includes("http") ? "_blank" : "_self"
                          }
                          key={childIndex}
                        >
                          {child.name}
                        </Link>
                        <br />
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })}
            <h1 className={styles.links2}>運行狀態</h1>
            <p>
              前端版本號： {ping && Object.keys(ping).length !== 0 && "v"}
              {ping?.Frontend?.currentVersion}
            </p>
            <p>
              後端版本號： {ping && Object.keys(ping).length !== 0 && "v"}
              {ping?.Backend?.currentVersion}
            </p>
            <br />
            <p>前端運行時間：{timeEn2Zh(ping?.Frontend?.uptime)}</p>
            <p>後端運行時間：{timeEn2Zh(ping?.Backend?.uptime)}</p>
            <br />
            <p>
              訪問
              <Link href={"https://status.sig.school/"} target="_blank">
                狀態頁面
              </Link>
              獲取更多詳細信息
            </p>
            <p className={styles.endText}>
              <Link href={"https://sig.mingdao.edu.tw/ping"} target="_blank">
                前端
              </Link>
            </p>
            <img
              src="https://status.sig.school/api/badge/1/uptime?labelPrefix=前端+&style=for-the-badge"
              alt="frontend-status"
              className={styles.statusImg}
            />
            <p className={styles.endText}>
              <Link
                href={"https://sig-api.mingdao.edu.tw/ping"}
                target="_blank"
              >
                後端
              </Link>
            </p>
            <img
              src="https://status.sig.school/api/badge/8/uptime?labelPrefix=後端+&style=for-the-badge"
              alt="backend-status"
              className={styles.statusImg}
            />
            <p className={styles.endText}>資料庫</p>
            <img
              src="https://status.sig.school/api/badge/6/uptime?labelPrefix=資料庫+&style=for-the-badge"
              alt="backend-status"
              className={styles.statusImg}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function timeEn2Zh(time: string) {
  return time
    ?.replace("month,", "月")
    .replace("months,", "月")
    .replace("days,", "天")
    .replace("hours,", "時")
    .replace("minutes,", "分")
    .replace("seconds", "秒")
    .replace("day,", "天")
    .replace("hour,", "時")
    .replace("minute,", "分")
    .replace("second", "秒")
    .replace("month", "月")
    .replace("months", "月")
    .replace("days", "天")
    .replace("hours", "時")
    .replace("minutes", "分")
    .replace("day", "天")
    .replace("hour", "時")
    .replace("minute", "分");
}
