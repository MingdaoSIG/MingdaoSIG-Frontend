"use client";

// Utils
import useIsMobile from "@/utils/useIsMobile";

// Components
import Mobile from "@/app/search/(Search)/Mobile";
import Desktop from "@/app/search/(Search)/Desktop";

export default function Dashboard() {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
