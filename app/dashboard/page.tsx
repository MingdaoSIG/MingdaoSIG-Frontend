"use client";

import Desktop from "@/app/dashboard/(Dashboard)/Desktop";

// Components
import Mobile from "@/app/dashboard/(Dashboard)/Mobile";
// Utils
import useIsMobile from "@/utils/useIsMobile";

export default function Dashboard() {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
