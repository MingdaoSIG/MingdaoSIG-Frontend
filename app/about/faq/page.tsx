import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { FaqPage } from "./FaqPage";

export const metadata: Metadata = {
  title: `常見問題${SITE_TITLE_SUFFIX}`,
  description: "MDSIG 常見問題：登入、發文、SIG、活動與通知。",
};

export default function Page() {
  return <FaqPage />;
}
