"use client";

// Third-Party Package
import type { ReactNode } from "react";
import HeaderBarDesktop from "@/app/(Layout)/desktop/HeaderBar";
// Desktop-Side Component
import ToolBarDesktop from "@/app/(Layout)/desktop/ToolBar";
import HeaderBarMobile from "@/app/(Layout)/mobile/HeaderBar";
// Mobile-Side Component
import ToolBarMobile from "@/app/(Layout)/mobile/ToolBar";
import { PageTransition } from "@/components/mobile/PageTransition";
import { ToastProvider } from "@/components/mobile/Toast";
import { SiteNotices } from "@/components/SiteBanner/SiteNotices";
import { useHydrated } from "@/utils/useHydrated";

// Utils
import useIsMobile from "@/utils/useIsMobile";

export function Device({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const isMobile = useIsMobile();

  // The server cannot know the screen width. Rendering a guess made phones
  // mount the desktop tree first (and fetch everything twice) before
  // switching. Render nothing until the width is known: the body fades in
  // over 1s anyway, so this costs no visible flash and no hydration mismatch.
  if (!hydrated) {
    return null;
  }

  // The site banner and the suspension notice sit under the header
  // (components/SiteBanner/SiteNotices). On desktop they share the header's
  // grid row; on phones they are fixed under the fixed header and the page
  // area starts below them.
  return isMobile ? (
    <div className="wrapMobile">
      <HeaderBarMobile />
      <SiteNotices mobile />
      <div className="absolute inset-x-0 top-[var(--site-notices-h,0px)] bottom-0">
        <PageTransition>{children}</PageTransition>
      </div>
      <ToolBarMobile />
      <ToastProvider />
    </div>
  ) : (
    <div className="wrap">
      <div className="flex min-w-0 flex-col">
        <HeaderBarDesktop />
        <SiteNotices />
      </div>
      {children}
      <ToolBarDesktop />
    </div>
  );
}
