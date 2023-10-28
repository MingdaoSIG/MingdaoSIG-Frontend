"use client";

// Infinity scroll
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Third-Party Package
import React from "react";
import { signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";

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
import Script from "next/script";

const queryClient = new QueryClient();

export default function RootLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        <meta name="author" content="OnCloud, HACO, Lazp, Meru" />
        <meta name="theme-color" content="#FFFFFF" />
        <meta
          name="description"
          content="MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!"
        />
        <meta
          name="copyright"
          content="Copyright (c) by OnCloud, HACO, Lazp, Meru"
        />

        <meta httpEquiv="content-Type" content="text/html; charset=utf-8" />
        <meta httpEquiv="content-language" content="zh-TW" />
        <meta httpEquiv="widow-target" content="_top" />

        {/* <!-- Twitter --> */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MDSIG - 讓學習不再有時空的限制" />
        <meta
          name="twitter:description"
          content="MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!"
        />
        <meta name="twitter:site" content="@" />
        <meta name="twitter:creator" content="@" />
        <meta name="twitter:image" content="https://i.imgur.com/tPYMyLP.png" />

        {/* <!-- Open Graph --> */}
        <meta property="og:url" content="https://sig.mingdao.edu.tw" />
        <meta property="og:title" content="MDSIG - 讓學習不再有時空的限制" />
        <meta property="og:type" content="website" />
        <meta
          property="og:description"
          content="MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!"
        />
        <meta property="og:image" content="https://i.imgur.com/tPYMyLP.png" />
      </Head>
      <Script
        async
        src="https://sig-analytics.lazco.dev/script.js"
        data-website-id="e034897b-bce7-4a20-b5e8-4c98ef67e30d"
      ></Script>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <html lang="en" onLoad={resetLocalStorage}>
            <head>
              <title>MDSIG</title>
            </head>
            {isMobile ? (
              <body className="">
                <div className="wrapMobile">
                  <HeaderBarMobile />
                  {children}
                  <ToolBarMobile />
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
        </QueryClientProvider>
      </SessionProvider>
    </>
  );
}

function resetLocalStorage() {
  if (localStorage.getItem("UserID")) {
    localStorage.clear();
    signOut();
  }
}
