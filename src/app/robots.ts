import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/yonetim/', '/api/'],
    },
    sitemap: 'https://cicekce-yeni-two.vercel.app/sitemap.xml',
  };
}
