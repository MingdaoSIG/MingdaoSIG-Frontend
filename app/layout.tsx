"use client";

// Third-Party Package
import React from "react";
import { SessionProvider } from "next-auth/react";

// Styles
import "@/app//globals.scss";
// Utils
import useIsMobile from "@/utils/useIsMobile";
// Desktop-Side Component
import ToolBar from "@/app/(Layout)/ToolBar";
import HeaderBarDesktop from "@/app/(Layout)/desktop/HeaderBar";
// Mobile-Side Component
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
            <div className="wrap">
              <HeaderBarMobile></HeaderBarMobile>
            </div>
          </body>
        ) : (
          <body>
            <div className="wrap">
              <HeaderBarDesktop />
              {children}
              <ToolBar />
            </div>
          </body>
        )}
      </html>
    </SessionProvider>
  );
}
