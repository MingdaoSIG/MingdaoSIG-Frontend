import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import ExplorePage from "./ExplorePage";

export const metadata: Metadata = {
  title: `探索${SITE_TITLE_SUFFIX}`,
  description: "搜尋 MDSIG 的貼文、SIG 與標籤，找到你有興趣的 SIG。",
};

export default function Page() {
  return <ExplorePage />;
}
