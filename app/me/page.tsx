import type { Metadata } from "next";
import { SITE_TITLE_SUFFIX } from "@/modules/site";
import MePage from "./MePage";

export const metadata: Metadata = {
  title: `個人專區${SITE_TITLE_SUFFIX}`,
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MePage />;
}
