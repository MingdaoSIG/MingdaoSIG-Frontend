"use client";

// Third-Party Package
import { Fragment, type ReactNode } from "react";
import HeaderBarDesktop from "@/app/(Layout)/desktop/HeaderBar";
// Desktop-Side Component
import ToolBarDesktop from "@/app/(Layout)/desktop/ToolBar";
import HeaderBarMobile from "@/app/(Layout)/mobile/HeaderBar";
// Mobile-Side Component
import ToolBarMobile from "@/app/(Layout)/mobile/ToolBar";

// Utils
import useIsMobile from "@/utils/useIsMobile";

export function Device({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <Fragment>
      {isMobile ? (
        <div className="wrapMobile">
          <HeaderBarMobile />
          {children}
          <ToolBarMobile />
        </div>
      ) : (
        <div className="wrap">
          <HeaderBarDesktop />
          {children}
          <ToolBarDesktop />
        </div>
      )}
    </Fragment>
  );
}
