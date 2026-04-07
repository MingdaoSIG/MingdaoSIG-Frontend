"use client";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import Desktop from "./(Data)/desktop";
// Components
import Mobile from "./(Data)/mobile";

export default function Info() {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
