"use client";

import type { ReactNode } from "react";
import HeaderBarDesktop from "@/app/(Layout)/desktop/HeaderBar";
import SideRail from "@/app/(Layout)/desktop/SideRail";
import HeaderBarMobile from "@/app/(Layout)/mobile/HeaderBar";
import ToolBarMobile from "@/app/(Layout)/mobile/ToolBar";
import { PageTransition } from "@/components/mobile/PageTransition";
import { ToastProvider } from "@/components/mobile/Toast";
import { SiteNotices } from "@/components/SiteBanner/SiteNotices";
import { useAdminChrome } from "@/utils/useAdminAccess";
import { useHydrated } from "@/utils/useHydrated";
import useIsMobile from "@/utils/useIsMobile";
import { useTrackSigVisits } from "@/utils/useMySigs";

export function Device({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const isMobile = useIsMobile();
  const { hideDock } = useAdminChrome();
  // Visiting a SIG page clears its new-post dot in the side rail.
  useTrackSigVisits();

  // The server cannot know the screen width. Rendering a guess made phones
  // mount the desktop tree first (and fetch everything twice) before
  // switching. Render nothing until the width is known: the body fades in
  // over 1s anyway, so this costs no visible flash and no hydration mismatch.
  if (!hydrated) {
    return null;
  }

  // The site banner and the suspension notice sit under the header
  // (components/SiteBanner/SiteNotices). On desktop they share the header's
  // grid row, above the side rail; on phones they are fixed under the
  // fixed header and the page area starts below them, above the tab bar.
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
    <div className="wrap" data-rail={hideDock ? undefined : ""}>
      <div data-shell="top" className="flex min-w-0 flex-col">
        <HeaderBarDesktop />
        <SiteNotices />
      </div>
      <SideRail />
      {children}
    </div>
  );
}
