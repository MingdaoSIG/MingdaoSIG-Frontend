import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import MyReportsPage from "./MyReportsPage";

export const metadata: Metadata = {
  title: `我的回報${SITE_TITLE_SUFFIX}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MyReportsPage />
    </Suspense>
  );
}
