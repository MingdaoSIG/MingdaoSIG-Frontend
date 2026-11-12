import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import ReportPage from "./ReportPage";

export const metadata: Metadata = {
  title: `回報問題${SITE_TITLE_SUFFIX}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportPage />
    </Suspense>
  );
}
