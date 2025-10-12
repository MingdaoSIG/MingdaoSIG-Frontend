// app/layout.tsx

// Third-Party Package
import type { Metadata, Viewport } from "next";
import { GoogleTagManager } from "@next/third-parties/google";
import { Noto_Sans_TC } from "next/font/google";
import type { ReactNode } from "react";
import { config } from "md-editor-rt";

// Providers
import { Providers } from "./providers";

// Styles
import "@/app/styles/globals.css";
import "@/app/styles/variables.scss";

// Utils
import { Device } from "./device";

const noto = Noto_Sans_TC({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={noto.className}>
      <body>
        {/* GTM 必須放 body 內 */}
        <GoogleTagManager gtmId="GTM-NGM7R8S8" />
        <Providers>
          <Device>{children}</Device>
        </Providers>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL("https://sig.mingdao.edu"),
  title: "MDSIG 2.0",
  description:
    "MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!",
  applicationName: "MDSIG 2.0",
  authors: [{ name: "OnCloud, HACO, Lazp, Meru" }],
  keywords: ["MDSIG", "SIG", "MD", "Mingdao", "2.0", "MDSIG 2.0"],
  creator: "MDSIG Developer Team",
  publisher: "Mingdao High School",
  icons: [
    { rel: "icon", url: "https://sig.mingdao.edu.tw/favicon.ico" },
    { rel: "apple-touch-icon", url: "https://sig.mingdao.edu.tw/favicon.ico" },
  ],
  openGraph: {
    type: "website",
    url: "https://sig.mingdao.edu.tw",
    title: "MDSIG - 讓學習不再有時空的限制",
    description:
      "MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!",
    images: [{ url: "https://sig.mingdao.edu.tw/images/banner.png" }],
  },
  twitter: {
    title: "MDSIG - 讓學習不再有時空的限制",
    description:
      "MDSIG 分享平台讓學習不再有時空的限制，透過平台交流前瞻趨勢、時事議題，迸發更多學習火花。平台提供科技、醫療、財經管理、藝術人文及心理等社會時事的討論eg. AI、量子電腦、大歷史、新能源...，期待你(妳)的參與!",
    card: "summary_large_image",
    images: "https://sig.mingdao.edu.tw/images/banner.png",
  },
  other: {
    "twitter:url": "https://sig.mingdao.edu.tw",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFFFFF",
};

config({
  editorConfig: {
    languageUserDefined: {
      'en-US': {
        toolbarTips: {
          bold: 'bold',
          underline: 'underline',
          italic: 'italic',
          strikeThrough: 'strikeThrough',
          title: 'title',
          sub: 'subscript',
          sup: 'superscript',
          quote: 'quote',
          unorderedList: 'unordered list',
          orderedList: 'ordered list',
          codeRow: 'inline code',
          code: 'block-level code',
          link: 'link',
          image: 'image',
          table: 'table',
          mermaid: 'mermaid',
          katex: 'formula',
          revoke: 'revoke',
          next: 'undo revoke',
          save: 'save',
          prettier: 'prettier',
          pageFullscreen: 'fullscreen in page',
          fullscreen: 'fullscreen',
          preview: 'preview',
          previewOnly: 'previewOnly',
          htmlPreview: 'html preview',
          catalog: 'catalog',
          github: 'source code'
        },
        titleItem: {
          h1: 'Lv1 Heading',
          h2: 'Lv2 Heading',
          h3: 'Lv3 Heading',
          h4: 'Lv4 Heading',
          h5: 'Lv5 Heading',
          h6: 'Lv6 Heading'
        },
        imgTitleItem: {
          link: 'Add Img Link',
          upload: 'Upload Img',
          clip2upload: 'Clip Upload'
        },
        linkModalTips: {
          linkTitle: 'Add Link',
          imageTitle: 'Add Image',
          descLabel: 'Desc:',
          descLabelPlaceHolder: 'Enter a description...',
          urlLabel: 'Link:',
          urlLabelPlaceHolder: 'Enter a link...',
          buttonOK: 'OK'
        },
        clipModalTips: {
          title: 'Crop Image',
          buttonUpload: 'Upload'
        },
        copyCode: {
          text: 'Copy',
          successTips: 'Copied!',
          failTips: 'Copy failed!'
        },
        mermaid: {
          flow: 'flow',
          sequence: 'sequence',
          gantt: 'gantt',
          class: 'class',
          state: 'state',
          pie: 'pie',
          relationship: 'relationship',
          journey: 'journey'
        },
        katex: {
          inline: 'inline',
          block: 'block'
        },
        footer: {
          markdownTotal: 'Word Count',
          scrollAuto: 'Scroll Auto'
        }
      }
    }
  }
});
