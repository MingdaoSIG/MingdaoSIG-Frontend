import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { HelpPage } from "../HelpPage";
import { StatsSection } from "./StatsSection";

export const metadata: Metadata = {
  title: `平台數據${SITE_TITLE_SUFFIX}`,
  description: "MDSIG 的使用者、貼文與各 SIG 的數據。",
};

export default function StatsPage() {
  return (
    <HelpPage
      title="平台數據"
      description="使用者、貼文，以及各 SIG 的貼文與成員。"
      wide
    >
      <StatsSection />
    </HelpPage>
  );
}
