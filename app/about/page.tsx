import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import AboutPage from "./AboutPage";

export const metadata: Metadata = {
  title: `關於 MDSIG${SITE_TITLE_SUFFIX}`,
  description:
    "MDSIG 平台資訊：常用連結、平台數據、更新紀錄、運行狀態與聯絡方式。",
};

export default function Page() {
  return <AboutPage />;
}
