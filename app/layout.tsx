"use client";

import "@/app//globals.scss";
import React from "react";
import ToolBar from "@/app/(Layout)/ToolBar";
import HeaderBar from "@/app/(Layout)/HeaderBar";
import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <html lang="en">
        <head>
          <title>MDSIG</title>
        </head>
        <body className="select-none max-sm:hidden">
          <div className="wrap">
            <HeaderBar />
            {children}
            <ToolBar />
          </div>
        </body>
      </html>
    </SessionProvider>
  );
}
