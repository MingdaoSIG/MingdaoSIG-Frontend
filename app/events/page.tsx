import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import EventsPage from "./EventsPage";

export const metadata: Metadata = {
  title: `活動${SITE_TITLE_SUFFIX}`,
  description: "MDSIG 各 SIG 的近期活動與社課，線上報名、加到日曆。",
};

export default function Page() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <EventsPage />
    </Suspense>
  );
}
