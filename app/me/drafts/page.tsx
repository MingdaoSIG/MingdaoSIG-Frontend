import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import DraftsPage from "./DraftsPage";

export const metadata: Metadata = {
  title: `草稿${SITE_TITLE_SUFFIX}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DraftsPage />;
}
