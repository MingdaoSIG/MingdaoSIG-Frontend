/** @type {import('next').NextConfig} */
const path = require("path");
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!isServer) {
      config.output.filename = "static/chunks/[name].js";
      config.output.chunkFilename = "static/chunks/[name].js";
    }
    return config;
  },
};

module.exports = nextConfig;
