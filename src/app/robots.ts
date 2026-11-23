import type { MetadataRoute } from "next";

import { siteUrl } from "@/server/site-url";

/** Public pages are indexable; the private journal and the API are not. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sign-in", "/privacy", "/terms"],
      disallow: ["/journal", "/week", "/settings", "/api", "/auth"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
