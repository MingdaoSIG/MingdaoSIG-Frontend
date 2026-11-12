import type { MetadataRoute } from "next";

import { SITE_URL } from "@/modules/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/new", "/post/*/edit"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
