import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { StartPage } from "./StartPage";

export const metadata: Metadata = {
  title: `說明中心${SITE_TITLE_SUFFIX}`,
  description:
    "MDSIG 說明中心：使用教學、常見問題、回報問題、平台規範、更新紀錄、平台數據與運行狀態。",
};

export default function Page() {
  return <StartPage />;
}
