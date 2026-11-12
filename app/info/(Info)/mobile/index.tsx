import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import data from "../config/data.json";
import styles from "./index.module.scss";

interface PingEndpoint {
  currentVersion?: string;
  uptime?: string;
}

interface PingData {
  frontend?: PingEndpoint;
  backend?: PingEndpoint;
}

function parseUptime(uptimeStr: string): number {
  if (!uptimeStr || uptimeStr === "N/A") {
    return 0;
  }

  let totalMs = 0;
  const monthsMatch = uptimeStr.match(/(\d+)\s*month/);
  const daysMatch = uptimeStr.match(/(\d+)\s*day/);
  const hoursMatch = uptimeStr.match(/(\d+)\s*hour/);
  const minutesMatch = uptimeStr.match(/(\d+)\s*minute/);
  const secondsMatch = uptimeStr.match(/(\d+)\s*second/);

  if (monthsMatch) {
    totalMs += parseInt(monthsMatch[1], 10) * 30 * 24 * 60 * 60 * 1000;
  }
  if (daysMatch) {
    totalMs += parseInt(daysMatch[1], 10) * 24 * 60 * 60 * 1000;
  }
  if (hoursMatch) {
    totalMs += parseInt(hoursMatch[1], 10) * 60 * 60 * 1000;
  }
  if (minutesMatch) {
    totalMs += parseInt(minutesMatch[1], 10) * 60 * 1000;
  }
  if (secondsMatch) {
    totalMs += parseInt(secondsMatch[1], 10) * 1000;
  }

  return totalMs;
}

function formatUptime(ms: number): string {
  if (ms <= 0) {
    return "未知";
  }

  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor((ms / (1000 * 60 * 60 * 24)) % 30);
  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30));

  const parts = [];
  if (months > 0) {
    parts.push(`${months} 月`);
  }
  if (days > 0) {
    parts.push(`${days} 天`);
  }
  if (hours > 0) {
    parts.push(`${hours} 時`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} 分`);
  }
  parts.push(`${seconds} 秒`);

  return parts.join(" ");
}

export default function Mobile() {
  const [ping, setPing] = useState<PingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uptimeDisplay, setUptimeDisplay] = useState({
    frontend: "載入中...",
    backend: "載入中...",
  });
  const startTimeRef = useRef<number>(0);
  const backendStartTimeRef = useRef<number>(0);

  useEffect(() => {
    fetch("/ping")
      .then((res) => res.json())
      .then((data) => {
        setPing(data);

        const now = Date.now();
        const frontendUptime = parseUptime(data?.frontend?.uptime);
        const backendUptime = parseUptime(data?.backend?.uptime);

        startTimeRef.current = now - frontendUptime;
        backendStartTimeRef.current = now - backendUptime;

        setUptimeDisplay({
          frontend: formatUptime(frontendUptime),
          backend: formatUptime(backendUptime),
        });

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();

      if (startTimeRef.current > 0) {
        const frontendElapsed = now - startTimeRef.current;
        setUptimeDisplay((prev) => ({
          ...prev,
          frontend: formatUptime(frontendElapsed),
        }));
      }

      if (backendStartTimeRef.current > 0) {
        const backendElapsed = now - backendStartTimeRef.current;
        setUptimeDisplay((prev) => ({
          ...prev,
          backend: formatUptime(backendElapsed),
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div className={styles.mobileView}>
      <div className={styles.wrapper}>
        <div className={styles.title}>
          <h1>MDSIG 平台資訊</h1>
        </div>
        <div className={styles.content}>
          <div>
            {data.map((item, index) => (
              <Fragment key={item.name}>
                <h2 className={index === 0 ? styles.links : styles.links2}>
                  {item.name}
                </h2>
                <ul className={styles.linkList}>
                  {item.children.map((child) => (
                    <li key={child.name}>
                      <Link
                        href={child.url}
                        target={child.url.includes("http") ? "_blank" : "_self"}
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Fragment>
            ))}
            <h2 className={styles.links2}>運行狀態</h2>
            {loading ? (
              <p>載入中...</p>
            ) : (
              <>
                <p>
                  前端版本號：
                  {ping?.frontend?.currentVersion
                    ? `v${ping.frontend.currentVersion}`
                    : "未知"}
                </p>
                <p>
                  後端版本號：
                  {ping?.backend?.currentVersion &&
                  ping.backend.currentVersion !== "N/A"
                    ? `v${ping.backend.currentVersion}`
                    : "未知"}
                </p>
                <br />
                <p>前端運行時間：{uptimeDisplay.frontend}</p>
                <p>後端運行時間：{uptimeDisplay.backend}</p>
              </>
            )}
            <br />
            <p>
              <Link href={"https://status.sig.school/"} target="_blank">
                前往狀態頁面查看詳細資訊
              </Link>
            </p>
            <p className={styles.endText}>
              <Link href={"https://sig.mingdao.edu.tw/ping"} target="_blank">
                前端
              </Link>
            </p>
            <Image
              src="https://status.sig.school/api/badge/1/uptime?labelPrefix=前端+&style=for-the-badge"
              alt="前端運行狀態"
              width={208}
              height={28}
              className={styles.statusImg}
              unoptimized
            />
            <p className={styles.endText}>
              <Link
                href={"https://sig-api.mingdao.edu.tw/ping"}
                target="_blank"
              >
                後端
              </Link>
            </p>
            <Image
              src="https://status.sig.school/api/badge/8/uptime?labelPrefix=後端+&style=for-the-badge"
              alt="後端運行狀態"
              width={208}
              height={28}
              className={styles.statusImg}
              unoptimized
            />
            <p className={styles.endText}>資料庫</p>
            <Image
              src="https://status.sig.school/api/badge/6/uptime?labelPrefix=資料庫+&style=for-the-badge"
              alt="資料庫運行狀態"
              width={208}
              height={28}
              className={styles.statusImg}
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}
