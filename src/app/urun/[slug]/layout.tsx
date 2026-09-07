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

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}