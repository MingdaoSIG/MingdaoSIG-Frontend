import type { Metadata } from "next";
import { Suspense } from "react";

import { SITE_TITLE_SUFFIX } from "@/modules/site";

import SearchPage from "./SearchPage";

export const metadata: Metadata = {
  title: `搜尋${SITE_TITLE_SUFFIX}`,
  robots: { index: false, follow: true },
};

export default function Page() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <SearchPage />
    </Suspense>
  );
}
