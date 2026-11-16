import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { ReportSection } from "./ReportSection";

export const metadata: Metadata = {
  title: `回報問題${SITE_TITLE_SUFFIX}`,
  description: "回報 MDSIG 的錯誤、提出建議或帳號問題，並查看處理進度。",
};

export default function Page() {
  return <ReportSection />;
}
