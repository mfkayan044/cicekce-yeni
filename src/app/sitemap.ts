import { MetadataRoute } from 'next';
import { sql } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cicekce-yeni-two.vercel.app';

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/kategori/cicekler`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/kategori/buketler`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/kategori/guller`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/kategori/orkideler`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/kategori/kutuda-cicekler`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/siparis-takip`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

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
