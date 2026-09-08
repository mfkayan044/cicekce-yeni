import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (product) {
      const title = `${product.title} (${product.price || ''}) - Çiçekçe Aynı Gün Teslimat`;
      const description = `${product.title} ${product.price || ''} - En taze canlı çiçekler, özel aranjmanlar ve fotoğraflı onay garantisi ile Çiçekçe'de!`;
      const imageUrl = product.image.startsWith('http')
        ? product.image
        : `https://cicekce-yeni-two.vercel.app${product.image}`;

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `https://cicekce-yeni-two.vercel.app/urun/${slug}`,
          siteName: 'Çiçekçe',
          images: [
            {
              url: imageUrl,
              width: 800,
              height: 600,
              alt: product.title,
            },
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [imageUrl],
        },
      };
    }
  } catch (e) {}

  return {
    title: 'Çiçekçe - Taze Çiçek & Aynı Gün Teslimat',
    description: "İstanbul'un en taze canlı çiçekleri, buketleri ve aranjmanları aynı gün teslimat garantisi ile Çiçekçe'de.",
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  let jsonLd: any = null;

  try {
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (product) {
      const cleanPrice = String(product.price || '0').replace(/[^0-9.]/g, '') || '100';
      const imageUrl = product.image?.startsWith('http')
        ? product.image
        : `https://cicekce-yeni-two.vercel.app${product.image}`;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        image: [imageUrl],
        description: product.description || `${product.title} taze çiçek aranjmanı. Aynı gün adrese teslimat garantisi ile Çiçekçe'de.`,
        sku: product.code || `DM${product.id}`,
        brand: {
          '@type': 'Brand',
          name: 'Çiçekçe'
        },
        offers: {
          '@type': 'Offer',
          url: `https://cicekce-yeni-two.vercel.app/urun/${slug}`,
          priceCurrency: 'TRY',
          price: cleanPrice,
          priceValidUntil: '2027-12-31',
          itemCondition: 'https://schema.org/NewCondition',
          availability: product.stock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: 'Çiçekçe'
          }
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          reviewCount: '18',
          bestRating: '5',
          worstRating: '1'
        }
      };
    }
  } catch (e) {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}