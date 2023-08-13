import "./globals.scss";
import React from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>{title}</title>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
