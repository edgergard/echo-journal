import type { MetadataRoute } from "next";

import { siteUrl } from "@/server/site-url";

/** Only the public pages. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return ["", "/sign-in", "/privacy", "/terms"].map((path) => ({
    url: `${base}${path}`,
  }));
}
