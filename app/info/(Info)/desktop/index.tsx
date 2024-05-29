// Styles
import styles from "./index.module.scss";

// Modules
import Link from "next/link";
import { Fragment, useState, useEffect } from "react";

// data
import data from "../config/data.json";

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
          <h1>MDSIG 平台資訊</h1>
        </div>
        <div className={styles.content}>
          <div>
            {
              data.map((item, index) => {
                return (
                  <Fragment key={index}>
                    <h1 className={(index === 0 ? styles.links : styles.links2)}>{item.name}</h1>
                    {
                      item.children.map((child, childIndex) => {
                        return (
                          <Fragment key={childIndex}>
                            <Link href={child.url} target={(child.url.includes("http")) ? "_blank" : "_self"}>{child.name}</Link>
                            <br />
                          </Fragment>
                        );
                      })
                    }
                  </Fragment>
                );
              })
            }
            <h1 className={styles.links2}>運行狀態</h1>
            <p>前端版本號： {(ping && Object.keys(ping).length !== 0) && "v"}{ping?.Frontend?.currentVersion}</p>
            <p>後端版本號： {(ping && Object.keys(ping).length !== 0) && "v"}{ping?.Backend?.currentVersion}</p>
            <br />
            <p>前端運行時間：{ping?.Frontend?.uptime.replace("days,", "天").replace("hours,", "時").replace("minutes,", "分").replace("seconds", "秒")}</p>
            <p>後端運行時間：{ping?.Backend?.uptime.replace("days,", "天").replace("hours,", "時").replace("minutes,", "分").replace("seconds", "秒")}</p>
            <br />
            <p>訪問<Link href={"https://sig-uptime.lazco.dev/status/main"} target="_blank">狀態頁面</Link>獲取更多詳細信息</p>
            <p className={styles.endText}><Link href={"https://sig.mingdao.edu.tw/ping"} target="_blank">前端</Link></p>
            <img src="https://sig-uptime.lazco.dev/api/badge/15/uptime?labelPrefix=前端+&style=for-the-badge" alt="frontend-status" className={styles.statusImg} />
            <p className={styles.endText}><Link href={"https://sig-api.mingdao.edu.tw/ping"} target="_blank">後端</Link></p>
            <img src="https://sig-uptime.lazco.dev/api/badge/5/uptime?labelPrefix=後端+&style=for-the-badge" alt="backend-status" className={styles.statusImg} />
          </div>
        </div>
      </div>
    </div>
  );
}