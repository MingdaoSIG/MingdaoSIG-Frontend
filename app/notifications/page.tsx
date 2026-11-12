import type { Metadata } from "next";
import { Suspense } from "react";

import { SITE_TITLE_SUFFIX } from "@/modules/site";

import NotificationsPage from "./NotificationsPage";

export const metadata: Metadata = {
  title: `通知${SITE_TITLE_SUFFIX}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <NotificationsPage />
    </Suspense>
  );
}
