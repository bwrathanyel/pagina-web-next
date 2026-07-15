import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";
const ES_PRODUCCION =
  process.env.VERCEL_ENV === "production" || process.env.CONTEXT === "production";

export default function robots(): MetadataRoute.Robots {
  if (!ES_PRODUCCION) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
