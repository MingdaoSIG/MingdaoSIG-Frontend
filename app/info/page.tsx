"use client";

// Utils
import useIsMobile from "@/utils/useIsMobile";

// Components
import Mobile from "./(Info)/mobile";
import Desktop from "./(Info)/desktop";

export default function Info() {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
