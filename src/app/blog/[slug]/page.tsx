"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import QuickOrderModal, { QuickOrderProduct } from "@/components/store/QuickOrderModal";
import { useStore, Product } from "@/lib/store";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { getInitialDbData } from "@/lib/server-settings";

const _pageDb = getInitialDbData();
const _initialBlogs = _pageDb.blogs || [];

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { products, setSingleCartItem } = useStore();
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<QuickOrderProduct | null>(null);

  const initialPost = _initialBlogs.find((b: any) => b.slug === slug) || null;
  const [post, setPost] = useState<any>(initialPost);

  useEffect(() => {
    fetch(`/api/blog?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setPost(data);
      })
      .catch(() => {});
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
        <StoreHeader />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500 font-bold">
          Blog yazısı bulunamadı veya yükleniyor...
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        {/* Article Hero */}
        <div className="bg-white border-b py-10 shadow-xs">
          <div className="max-w-4xl mx-auto px-4 space-y-4">
            <nav className="text-xs text-slate-500 flex items-center gap-1.5">
              <Link href="/" className="hover:text-[#2b2623] transition">Anasayfa</Link>
              <span>›</span>
              <Link href="/blog" className="hover:text-[#2b2623] transition">Blog</Link>
              <span>›</span>
              <span className="font-bold text-slate-800 truncate">{post.title}</span>
            </nav>

            <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="inline-block text-xs font-black px-3 py-1 rounded-full">
              {post.category || "Çiçek Rehberi"}
            </span>

            <h1 className="text-2xl lg:text-4xl font-black text-slate-900 leading-tight">
              {post.title}
            </h1>

            <div className="text-xs text-slate-500 font-semibold flex items-center gap-4">
              <span>📅 {post.date}</span>
              <span>•</span>
              <span>👁️ {post.views || 1} Okunma</span>
            </div>
          </div>
        </div>

        {/* Article Body */}
        <main className="max-w-4xl mx-auto px-4 py-10 space-y-12">
          <div className="bg-white rounded-3xl p-6 lg:p-12 border border-slate-200/80 shadow-sm space-y-6">
            {post.image && (
              <img
                src={post.image}
                alt={post.title}
                className="w-full max-h-[450px] object-cover rounded-2xl shadow-xs"
              />
            )}

            <div className="text-slate-700 leading-relaxed whitespace-pre-line text-sm sm:text-base space-y-4">
              {post.content}
            </div>
          </div>

          {/* Related Products Grid (Conversion Booster) */}
          {products.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className="text-xl font-extrabold text-slate-900">
                  🌸 Sipariş Edebileceğiniz Öne Çıkan Taze Çiçekler
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.slice(0, 4).map((product: Product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    slug={product.slug}
                    title={product.title}
                    price={product.price}
                    oldPrice={product.oldPrice}
                    discount={product.discount}
                    image={product.image}
                    code={product.code}
                    onQuickOrder={(prod) => setSelectedQuickProduct(prod)}
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <StoreFooter />

      {/* Quick Order Modal */}
      <QuickOrderModal
        product={selectedQuickProduct}
        onClose={() => setSelectedQuickProduct(null)}
        onAddToCart={(prod) => {
          setSingleCartItem({
            id: String(prod.id),
            slug: String(prod.id),
            title: prod.title,
            price: prod.price,
            image: prod.image,
            code: prod.code || "",
            stock: true,
            featured: true,
            category: "Çiçek",
            categorySlug: "cicek"
          });
        }}
      />
    </div>
  );
}
