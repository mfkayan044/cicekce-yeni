import { MetadataRoute } from 'next';
import { sql } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cicekce.com';

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/siparis-takip`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  try {
    const categories = await sql`SELECT slug FROM categories`;
    if (categories && categories.length > 0) {
      categories.forEach((c: any) => {
        if (c.slug) {
          routes.push({
            url: `${baseUrl}/kategori/${c.slug}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
          });
        }
      });
    }
  } catch (e) {
    const defaultCats = ['cicekler', 'buketler', 'guller', 'orkideler', 'kutuda-cicekler', 'icimden-geldi', 'sevgililer-icin'];
    defaultCats.forEach((slug) => {
      routes.push({
        url: `${baseUrl}/kategori/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });
  }

  try {
    const products = await sql`SELECT slug, created_at FROM products`;
    if (products && products.length > 0) {
      products.forEach((p: any) => {
        if (p.slug) {
          routes.push({
            url: `${baseUrl}/urun/${p.slug}`,
            lastModified: p.created_at ? new Date(p.created_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
          });
        }
      });
    }
  } catch (e) {}

  return routes;
}
