// Styles
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

// data
import data from "../config/data.json";

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

export default function Desktop() {
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
    <>
      <div className="mx-auto h-full w-[90vw] overflow-hidden rounded-[1.2rem]">
        <div className="flex h-full flex-col">
          {/* Title Section */}
          <div className="flex flex-shrink-0 items-center rounded-[1.2rem] bg-white/60 px-6 py-4 backdrop-blur">
            <h1 className="scrollbar-hide overflow-x-auto whitespace-nowrap font-medium text-2xl text-[#003f47]">
              MDSIG 平台資訊
            </h1>
          </div>

          {/* Content Section */}
          <div className="scrollbar-hide mt-4 flex-1 overflow-y-auto rounded-[1.2rem] bg-white/60 p-6 backdrop-blur">
            <div className="space-y-1.5">
              {/* Links from data */}
              {data.map((item, index) => {
                return (
                  <Fragment key={item.name}>
                    <h2
                      className={`font-medium text-[#003f47] text-xl ${index === 0 ? "mb-1" : "mt-6 mb-1"}`}
                    >
                      {item.name}
                    </h2>
                    <div className="space-y-1">
                      {item.children.map((child, _childIndex) => {
                        return (
                          <div key={child.name}>
                            <Link
                              href={child.url}
                              target={
                                child.url.includes("http") ? "_blank" : "_self"
                              }
                              className="text-base text-blue-500 transition-colors hover:text-blue-600"
                            >
                              {child.name}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </Fragment>
                );
              })}

              {/* Status Section */}
              <div className="mt-6">
                <h2 className="mb-3 font-medium text-[#003f47] text-xl">
                  運行狀態
                </h2>

                <div className="space-y-2 text-[#003f47] text-base">
                  <p>
                    前端版本號：{ping && Object.keys(ping).length !== 0 && "v"}
                    {ping?.frontend?.currentVersion}
                  </p>
                  <p>
                    後端版本號：{ping && Object.keys(ping).length !== 0 && "v"}
                    {ping?.backend?.currentVersion}
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-[#003f47] text-base">
                  <p>前端運行時間：{uptimeDisplay.frontend}</p>
                  <p>後端運行時間：{uptimeDisplay.backend}</p>
                </div>

                <div className="mt-4 text-[#003f47] text-base">
                  <p>
                    訪問
                    <Link
                      href={"https://status.sig.school/"}
                      target="_blank"
                      className="mx-1 text-blue-500 transition-colors hover:text-blue-600"
                    >
                      狀態頁面
                    </Link>
                    獲取更多詳細信息
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="mt-6 space-y-4">
                <div>
                  <p className="mb-2 text-[#003f47] text-base">
                    <Link
                      href={"https://sig.mingdao.edu.tw/ping"}
                      target="_blank"
                      className="text-blue-500 transition-colors hover:text-blue-600"
                    >
                      前端
                    </Link>
                  </p>
                  <Image
                    src="https://status.sig.school/api/badge/1/uptime?labelPrefix=前端+&style=for-the-badge"
                    alt="frontend-status"
                    width={208}
                    height={28}
                    className="h-auto w-full max-w-[13rem]"
                    unoptimized
                  />
                </div>

                <div>
                  <p className="mb-2 text-[#003f47] text-base">
                    <Link
                      href={"https://sig-api.mingdao.edu.tw/ping"}
                      target="_blank"
                      className="text-blue-500 transition-colors hover:text-blue-600"
                    >
                      後端
                    </Link>
                  </p>
                  <Image
                    src="https://status.sig.school/api/badge/8/uptime?labelPrefix=後端+&style=for-the-badge"
                    alt="backend-status"
                    width={208}
                    height={28}
                    className="h-auto w-full max-w-[13rem]"
                    unoptimized
                  />
                </div>

                <div>
                  <p className="mb-2 text-[#003f47] text-base">資料庫</p>
                  <Image
                    src="https://status.sig.school/api/badge/6/uptime?labelPrefix=資料庫+&style=for-the-badge"
                    alt="database-status"
                    width={208}
                    height={28}
                    className="h-auto w-full max-w-[13rem]"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
    </>
  );
}
