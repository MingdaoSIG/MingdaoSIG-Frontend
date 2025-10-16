// Styles
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
    <><div className="w-[90vw] h-full mx-auto rounded-[1.2rem] overflow-hidden">
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
                  <h2 className={`text-xl font-medium text-[#003f47] ${index === 0 ? "mb-1" : "mt-6 mb-1"}`}>
                    {item.name}
                  </h2>
                  <div className="space-y-1">
                    {item.children.map((child, childIndex) => {
                      return (
                        <div key={childIndex}>
                          <Link
                            href={child.url}
                            target={child.url.includes("http") ? "_blank" : "_self"}
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
                  {ping?.Frontend?.currentVersion}
                </p>
                <p>
                  後端版本號：{ping && Object.keys(ping).length !== 0 && "v"}
                  {ping?.Backend?.currentVersion}
                </p>
              </div>

              <div className="space-y-2 text-base text-[#003f47] mt-4">
                <p>前端運行時間：{timeEn2Zh(ping?.Frontend?.uptime)}</p>
                <p>後端運行時間：{timeEn2Zh(ping?.Backend?.uptime)}</p>
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
                  className="h-auto w-full max-w-[13rem]" />
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
                  className="h-auto w-full  max-w-[13rem]" />
              </div>

              <div>
                <p className="text-base text-[#003f47] mb-2">資料庫</p>
                <img
                  src="https://status.sig.school/api/badge/6/uptime?labelPrefix=資料庫+&style=for-the-badge"
                  alt="database-status"
                  className="h-auto w-full max-w-[13rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div><style jsx>{`
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style></>
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