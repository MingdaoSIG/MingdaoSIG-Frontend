// Third-Party Package
import React from "react";

// Providers
import { Providers } from "./providers";

// Styles
import "@/app/styles/globals.scss";

// Utils
import Script from "next/script";
import { Metadata } from "next";
import { Device } from "./device";

export default function RootLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {


  return (
    <>
      <Script
        async
        src="https://sig-analytics.lazco.dev/script.js"
        data-website-id="e034897b-bce7-4a20-b5e8-4c98ef67e30d"
      ></Script>
      <html lang="en">
        <body>
          <Providers>
            <Device>
              {children}
            </Device>
          </Providers>
        </body>
      </html>
    </>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL("https://sig.mingdao.edu"),
  title: "MDSIG 2.0",
  description: "MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!",
  applicationName: "MDSIG 2.0",
  authors: [{ name: "OnCloud, HACO, Lazp, Meru" }],
  keywords: ["MDSIG", "SIG", "MD", "Mingdao", "2.0", "MDSIG 2.0"],
  themeColor: "#FFFFFF",
  creator: "MDSIG Developer Team",
  publisher: "Mingdao High School",
  viewport: {
    width: "device-width",
    initialScale: 1
  },
  icons: [{ rel: "icon", url: "https://sig.mingdao.edu.tw/favicon.ico" }, { rel: "apple-touch-icon", url: "https://sig.mingdao.edu.tw/favicon.ico" }],
  openGraph: {
    type: "website",
    url: "https://sig.mingdao.edu.tw",
    title: "MDSIG - 讓學習不再有時空的限制",
    description: "MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!",
    images: [{
      url: "https://sig.mingdao.edu.tw/images/banner.png",
    }],
  },
  twitter: {
    title: "MDSIG - 讓學習不再有時空的限制",
    description: "MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!",
    card: "summary_large_image",
    images: "https://sig.mingdao.edu.tw/images/banner.png"
  },
  other: {
    "twitter:url": "https://sig.mingdao.edu.tw"
  }
};