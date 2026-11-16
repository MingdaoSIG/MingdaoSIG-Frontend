"use client";

import dynamic from "next/dynamic";
import useIsMobile from "@/utils/useIsMobile";
import { HelpCard } from "../HelpPage";

// chart.js loads only on this page (next/dynamic).
const DashboardPanel = dynamic(() => import("../dashboard/DashboardPanel"), {
  ssr: false,
  loading: () => (
    <div aria-hidden className="h-64 animate-pulse rounded-control bg-field" />
  ),
});

export function StatsSection() {
  const isMobile = useIsMobile();
  return (
    <HelpCard>
      <DashboardPanel mobile={isMobile} />
    </HelpCard>
  );
}
