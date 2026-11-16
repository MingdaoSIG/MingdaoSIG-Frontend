import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { HelpCard, HelpPage } from "../HelpPage";
import { StatusPanel } from "../sections";

export const metadata: Metadata = {
  title: `運行狀態${SITE_TITLE_SUFFIX}`,
  description: "MDSIG 前端、後端與資料庫的版本與運行狀態。",
};

export default function StatusPage() {
  return (
    <HelpPage
      title="運行狀態"
      description="目前的版本、運行時間，以及前端、後端與資料庫的狀態。"
      wide
    >
      <HelpCard>
        <StatusPanel />
      </HelpCard>
    </HelpPage>
  );
}
