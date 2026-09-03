import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cicekce.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/yonetim/", "/api/", "/_next/", "/kurye"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
