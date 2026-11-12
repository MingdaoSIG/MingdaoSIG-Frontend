"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { isAdminPath } from "@/utils/useAdminAccess";
import { SiteBanner } from "./SiteBanner";
import { SuspensionBanner } from "./SuspensionBanner";

// What sits right under the header on every page except /admin: the
// suspension notice for a muted or banned user, then the site banner.
// Self-contained so the coming layout redesign can move it as one piece.
//
// - desktop: part of the sticky header row of the page grid
//   (app/device.tsx);
// - mobile: fixed under the fixed header.
// Its height is published as `--site-notices-h` on <html>: the mobile page
// area starts below it, and on desktop the side rail and the sticky side
// panels (`--shell-top`) clear it.

export const NOTICES_HEIGHT_VAR = "--site-notices-h";

export function SiteNotices({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const hidden = isAdminPath(pathname);

  useEffect(() => {
    const root = document.documentElement;
    const element = ref.current;
    if (!element) {
      return;
    }
    const update = () => {
      root.style.setProperty(
        NOTICES_HEIGHT_VAR,
        `${element.getBoundingClientRect().height}px`,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty(NOTICES_HEIGHT_VAR);
    };
  }, [mobile, hidden]);

  if (hidden) {
    return null;
  }

  return (
    <div
      ref={ref}
      data-reader-hide
      data-shell="notices"
      className={
        mobile
          ? "fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-[9998] flex flex-col"
          : "relative z-30 flex flex-col"
      }
    >
      <SuspensionBanner />
      <SiteBanner />
    </div>
  );
}
