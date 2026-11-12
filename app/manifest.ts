import type { MetadataRoute } from "next";

// Web app manifest (api-contract-v4 §2.4), served at /manifest.webmanifest.
// The icons are generated from public/images/logo.svg and
// logo_mobile_v2.svg; the maskable one keeps the logo inside the safe zone.

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MDSIG",
    short_name: "MDSIG",
    description: "明道中學 SIG 分享平台：讓學習不再有時空的限制。",
    lang: "zh-Hant-TW",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#0b5a83",
    background_color: "#e9eef3",
    icons: [
      {
        src: "/icons/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
