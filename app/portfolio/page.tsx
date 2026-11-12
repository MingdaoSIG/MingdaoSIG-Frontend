import type { Metadata } from "next";

import { SITE_TITLE_SUFFIX } from "@/modules/site";

import PortfolioPage from "./PortfolioPage";

export const metadata: Metadata = {
  title: `學習歷程${SITE_TITLE_SUFFIX}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PortfolioPage />;
}
