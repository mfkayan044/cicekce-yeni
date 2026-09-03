import { MetadataRoute } from "next";
import { initialDbData } from "@/lib/initial-db";
import { supabase } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.cicekce.com";
  const initial = initialDbData;

  let products = initial.products || [];
  let categories = initial.categories || [];
  let blogPosts = initial.blogPosts || [];

  // Attempt live fetch from Supabase
  try {
    const [pRes, cRes, bRes] = await Promise.all([
      supabase.from("site_settings").select("value").eq("id", "products").single(),
      supabase.from("site_settings").select("value").eq("id", "categories").single(),
      supabase.from("site_settings").select("value").eq("id", "blog").single(),
    ]);
    if (pRes.data && Array.isArray(pRes.data.value)) products = pRes.data.value;
    if (cRes.data && Array.isArray(cRes.data.value)) categories = cRes.data.value;
    if (bRes.data && Array.isArray(bRes.data.value)) blogPosts = bRes.data.value;
  } catch (e) {}

  const now = new Date();

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/siparis-takip`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Dynamic Product URLs
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((p: any) => p.slug)
    .map((p: any) => ({
      url: `${baseUrl}/urun/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  // Dynamic Category URLs
  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c: any) => c.slug)
    .map((c: any) => ({
      url: `${baseUrl}/kategori/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

  // Dynamic Blog URLs
  const blogRoutes: MetadataRoute.Sitemap = blogPosts
    .filter((b: any) => b.slug)
    .map((b: any) => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.65,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
