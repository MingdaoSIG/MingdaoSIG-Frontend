"use client";

// Third-Party Package
import React from "react";
import { signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

// Styles
import "@/app/styles/globals.scss";

// Desktop-Side Component
import ToolBarDesktop from "@/app/(Layout)/desktop/ToolBar";
import HeaderBarDesktop from "@/app/(Layout)/desktop/HeaderBar";

// Mobile-Side Component
import ToolBarMobile from "@/app/(Layout)/mobile/ToolBar";
import HeaderBarMobile from "@/app/(Layout)/mobile/HeaderBar";

// Utils
import useIsMobile from "@/utils/useIsMobile";

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
      <html lang="en" onLoad={resetLocalStorage}>
        <head>
          <title>MDSIG</title>
        </head>
        {isMobile ? (
          <body className="">
            <div className="wrapMobile">
              <HeaderBarMobile></HeaderBarMobile>
              {children}
              <div className="toolbarWrap">
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

function resetLocalStorage() {
  if (localStorage.getItem("UserID")) {
    localStorage.clear();
    signOut();
  }
}
