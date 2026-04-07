"use client";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import Desktop from "./(Info)/desktop";
// Components
import Mobile from "./(Info)/mobile";

export default function Info() {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
