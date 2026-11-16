import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import { HelpCard, HelpPage } from "../HelpPage";
import { ChangelogList } from "../sections";

export const metadata: Metadata = {
  title: `更新紀錄${SITE_TITLE_SUFFIX}`,
  description: "MDSIG 每個版本的新功能、優化與修復。",
};

export default function ChangelogPage() {
  return (
    <HelpPage title="更新紀錄" description="每個版本的新功能、優化與修復。">
      <HelpCard>
        <ChangelogList />
      </HelpCard>
    </HelpPage>
  );
}
