"use client";

// Third-Party Package
import React from "react";
import { SessionProvider } from "next-auth/react";

// Styles
import "@/app//globals.scss";
// Utils
import useIsMobile from "@/utils/useIsMobile";
// Desktop-Side Component
import ToolBarDesktop from "@/app/(Layout)/desktop/ToolBar";
import HeaderBarDesktop from "@/app/(Layout)/desktop/HeaderBar";
// Mobile-Side Component
import ToolBarMobile from "@/app/(Layout)/mobile/ToolBar";
import HeaderBarMobile from "@/app/(Layout)/mobile/HeaderBar";

export default function RootLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <SessionProvider>
      <html lang="en">
        <head>
          <title>MDSIG</title>
        </head>
        {isMobile ? (
          <body className="">
            <div className="wrapMobile">
              <HeaderBarMobile></HeaderBarMobile>
              <div></div>
              <div className="w-full h-full flex items-center justify-center">
                <ToolBarMobile></ToolBarMobile>
              </div>
            </div>
          </body>
        ) : (
          <body>
            <div className="wrap">
              <HeaderBarDesktop />
              {children}
              <ToolBarDesktop />
            </div>
          </body>
        )}
      </html>
    </SessionProvider>
  );
}
