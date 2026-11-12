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

  return isMobile ? (
    <div className="wrapMobile">
      <HeaderBarMobile />
      <PageTransition>{children}</PageTransition>
      <ToolBarMobile />
      <ToastProvider />
    </div>
  ) : (
    <div className="wrap">
      <HeaderBarDesktop />
      {children}
      <ToolBarDesktop />
    </div>
  );
}
