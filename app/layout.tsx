"use client";

import "@/app//globals.scss";
import React from "react";
import ToolBar from "@/app/(Layout)/ToolBar";
import HeaderBar from "@/app/(Layout)/desktop/HeaderBar";
import { SessionProvider } from "next-auth/react";
import useIsMobile from "./utils/useIsMobile";

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
            <div className="wrap">123 讚啦</div>
          </body>
        ) : (
          <body>
            <div className="wrap">
              <HeaderBar />
              {children}
              <ToolBar />
            </div>
          </body>
        )}
      </html>
    </SessionProvider>
  );
}
