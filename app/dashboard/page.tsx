"use client";

// Utils
import useIsMobile from "@/utils/useIsMobile";

// Components
import Mobile from "@/app/dashboard/(Dashboard)/Mobile";
import Desktop from "@/app/dashboard/(Dashboard)/Desktop";

export default function Dashboard() {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
