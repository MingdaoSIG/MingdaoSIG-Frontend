"use client";

// Third-Party Package
import { Fragment, ReactNode } from "react";

// Desktop-Side Component
import ToolBarDesktop from "@/app/(Layout)/desktop/ToolBar";
import HeaderBarDesktop from "@/app/(Layout)/desktop/HeaderBar";

// Mobile-Side Component
import ToolBarMobile from "@/app/(Layout)/mobile/ToolBar";
import HeaderBarMobile from "@/app/(Layout)/mobile/HeaderBar";

// Utils
import useIsMobile from "@/utils/useIsMobile";


export function Device({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <Fragment>
      {
        isMobile ? (
          <div className="wrapMobile" >
            <HeaderBarMobile />
            {children}
            <ToolBarMobile />
          </div >
        ) : (
          <div className="wrap">
            <HeaderBarDesktop />
            {children}
            <ToolBarDesktop />
          </div>
        )
      }
    </Fragment>

  );
}