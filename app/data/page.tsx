"use client";

// Utils
import useIsMobile from "@/utils/useIsMobile";

// Components
import Mobile from "./(Data)/mobile";
import Desktop from "./(Data)/desktop";

export default function Info() {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
