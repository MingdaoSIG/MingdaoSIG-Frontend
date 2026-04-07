"use client";

// Utils
import useIsMobile from "@/utils/useIsMobile";
import Desktop from "./(Changelog)/desktop";
import Mobile from "./(Changelog)/mobile";

export default function ChangelogPage() {
  const isMobile = useIsMobile();

  return isMobile ? <Mobile /> : <Desktop />;
}
