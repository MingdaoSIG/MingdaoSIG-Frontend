// next.config.js
// @ts-check

const path = require("node:path");

// Hosts whose images go through next/image (/_next/image). Anything else
// is rejected, so the optimizer cannot be used as an open image proxy.
// Images inside post content are plain <img> tags and are not affected.
const apiOrigins = [
  "https://sig-api.mingdao.edu.tw",
  "https://api.sig.school",
  "https://api-beta.sig.school",
  process.env.NEXT_PUBLIC_API_URL,
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
  },

  images: {
    remotePatterns: [
      // Post covers and SIG avatars
      ...apiOrigins
        .filter((origin) => origin)
        .map((origin) => new URL("/image/**", origin)),
      // Google account avatars (/a/, /a-/ and the default /-XdUIqdMkCWA/)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // One existing post cover links to a Tenor GIF
      {
        protocol: "https",
        hostname: "media.tenor.com",
        pathname: "/**",
      },
    ],
  },

  // The admin panel was reorganised (v3): old bookmarks land on the new
  // home of each page. Temporary, so the old paths stay free to reuse.
  async redirects() {
    const moved = [
      ["/admin/post", "/admin/posts"],
      ["/admin/post-query", "/admin/exports"],
      ["/admin/sig-members", "/admin/exports"],
      ["/admin/sig-leader", "/admin/sigs"],
      ["/admin/sig-advisor", "/admin/sigs"],
      ["/admin/sig-leader/:sigId", "/admin/sigs/:sigId?tab=staff"],
      ["/admin/sig-advisor/:sigId", "/admin/sigs/:sigId?tab=staff"],
      ["/admin/sig-members/:sigId", "/admin/sigs/:sigId?tab=members"],
    ];
    // The user-side redesign (2026): 資訊 / Dashboard / 更新紀錄 merged into
    // 關於 MDSIG (one section each), and the /data SIG lookup into 探索.
    const merged = [
      ["/info", "/about#info"],
      ["/dashboard", "/about#dashboard"],
      ["/changelog", "/about#changelog"],
      ["/data", "/explore"],
    ];
    return [...moved, ...merged].map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },

  async headers() {
    return [
      {
        // Pages, RSC payloads and route handlers must not be cached, so a
        // deploy shows up right away. Leave out hashed build assets
        // (/_next/static, served as immutable), optimized images (they set
        // their own TTL) and files from public/ (served with an ETag, so
        // the browser revalidates instead of downloading them again).
        source:
          "/((?!_next/static/|_next/image|images/|icons/|badges/|videos/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  // next dev writes a managed block into AGENTS.md when it detects an AI
  // agent. This repo keeps AGENTS.md by hand, so leave it alone.
  agentRules: false,

  turbopack: {
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".json"],
  },
};

module.exports = nextConfig;
