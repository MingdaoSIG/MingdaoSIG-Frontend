// next.config.js
// @ts-check

const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
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
