// Styles
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";

// data
import data from "../config/data.json";

export default function Desktop() {
  const [ping, setPing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uptimeDisplay, setUptimeDisplay] = useState({
    frontend: "載入中...",
    backend: "載入中...",
  });
  const startTimeRef = useRef<number>(0);
  const backendStartTimeRef = useRef<number>(0);

  // Parse uptime string to milliseconds
  const parseUptime = (uptimeStr: string): number => {
    if (!uptimeStr || uptimeStr === "N/A") return 0;

    let totalMs = 0;
    const monthsMatch = uptimeStr.match(/(\d+)\s*month/);
    const daysMatch = uptimeStr.match(/(\d+)\s*day/);
    const hoursMatch = uptimeStr.match(/(\d+)\s*hour/);
    const minutesMatch = uptimeStr.match(/(\d+)\s*minute/);
    const secondsMatch = uptimeStr.match(/(\d+)\s*second/);

    if (monthsMatch)
      totalMs += parseInt(monthsMatch[1], 10) * 30 * 24 * 60 * 60 * 1000;
    if (daysMatch) totalMs += parseInt(daysMatch[1], 10) * 24 * 60 * 60 * 1000;
    if (hoursMatch) totalMs += parseInt(hoursMatch[1], 10) * 60 * 60 * 1000;
    if (minutesMatch) totalMs += parseInt(minutesMatch[1], 10) * 60 * 1000;
    if (secondsMatch) totalMs += parseInt(secondsMatch[1], 10) * 1000;

    return totalMs;
  };

  // Format milliseconds to readable time
  const formatUptime = (ms: number): string => {
    if (ms <= 0) return "未知";

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor((ms / (1000 * 60 * 60 * 24)) % 30);
    const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30));

    const parts = [];
    if (months > 0) parts.push(`${months} 月`);
    if (days > 0) parts.push(`${days} 天`);
    if (hours > 0) parts.push(`${hours} 時`);
    if (minutes > 0) parts.push(`${minutes} 分`);
    parts.push(`${seconds} 秒`);

    return parts.join(" ");
  };

  useEffect(() => {
    fetch("/ping")
      .then((res) => res.json())
      .then((data) => {
        setPing(data);

        // Calculate start times based on uptime
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
  }, [formatUptime, parseUptime]);

  // Real-time update interval
  useEffect(() => {
    if (loading) return;

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
  }, [loading, formatUptime]);

  return (
    <>
      <div className="w-[90vw] h-full mx-auto rounded-[1.2rem] overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Title Section */}
          <div className="bg-white/60 backdrop-blur rounded-[1.2rem] px-6 py-4 flex items-center flex-shrink-0">
            <h1 className="text-2xl font-medium text-[#003f47] whitespace-nowrap overflow-x-auto scrollbar-hide">
              MDSIG 平台資訊
            </h1>
          </div>

          {/* Content Section */}
          <div className="bg-white/60 backdrop-blur rounded-[1.2rem] p-6 overflow-y-auto scrollbar-hide flex-1 mt-4">
            <div className="space-y-1.5">
              {/* Links from data */}
              {data.map((item, index) => {
                return (
                  <Fragment key={index}>
                    <h2
                      className={`text-xl font-medium text-[#003f47] ${index === 0 ? "mb-1" : "mt-6 mb-1"}`}
                    >
                      {item.name}
                    </h2>
                    <div className="space-y-1">
                      {item.children.map((child, childIndex) => {
                        return (
                          <div key={childIndex}>
                            <Link
                              href={child.url}
                              target={
                                child.url.includes("http") ? "_blank" : "_self"
                              }
                              className="text-blue-500 hover:text-blue-600 text-base transition-colors"
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
                <h2 className="text-xl font-medium text-[#003f47] mb-3">
                  運行狀態
                </h2>

                <div className="space-y-2 text-base text-[#003f47]">
                  <p>
                    前端版本號：{ping && Object.keys(ping).length !== 0 && "v"}
                    {ping?.frontend?.currentVersion}
                  </p>
                  <p>
                    後端版本號：{ping && Object.keys(ping).length !== 0 && "v"}
                    {ping?.backend?.currentVersion}
                  </p>
                </div>

                <div className="space-y-2 text-base text-[#003f47] mt-4">
                  <p>前端運行時間：{uptimeDisplay.frontend}</p>
                  <p>後端運行時間：{uptimeDisplay.backend}</p>
                </div>

                <div className="mt-4 text-base text-[#003f47]">
                  <p>
                    訪問
                    <Link
                      href={"https://status.sig.school/"}
                      target="_blank"
                      className="text-blue-500 hover:text-blue-600 mx-1 transition-colors"
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
                  <p className="text-base text-[#003f47] mb-2">
                    <Link
                      href={"https://sig.mingdao.edu.tw/ping"}
                      target="_blank"
                      className="text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      前端
                    </Link>
                  </p>
                  <img
                    src="https://status.sig.school/api/badge/1/uptime?labelPrefix=前端+&style=for-the-badge"
                    alt="frontend-status"
                    className="h-auto w-full max-w-[13rem]"
                  />
                </div>

                <div>
                  <p className="text-base text-[#003f47] mb-2">
                    <Link
                      href={"https://sig-api.mingdao.edu.tw/ping"}
                      target="_blank"
                      className="text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      後端
                    </Link>
                  </p>
                  <img
                    src="https://status.sig.school/api/badge/8/uptime?labelPrefix=後端+&style=for-the-badge"
                    alt="backend-status"
                    className="h-auto w-full  max-w-[13rem]"
                  />
                </div>

                <div>
                  <p className="text-base text-[#003f47] mb-2">資料庫</p>
                  <img
                    src="https://status.sig.school/api/badge/6/uptime?labelPrefix=資料庫+&style=for-the-badge"
                    alt="database-status"
                    className="h-auto w-full max-w-[13rem]"
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

function _timeEn2Zh(time: string) {
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
