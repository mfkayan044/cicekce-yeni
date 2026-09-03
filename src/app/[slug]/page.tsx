"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import QuickOrderModal, { QuickOrderProduct } from "@/components/store/QuickOrderModal";
import { useStore, Product } from "@/lib/store";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getInitialDbData } from "@/lib/server-settings";

const _pageDb = getInitialDbData();
const _initialPages = _pageDb.pages || {};

export default function DynamicCmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams.slug;
  const slug = rawSlug.startsWith("/") ? rawSlug.slice(1) : rawSlug;

  const { products, setSingleCartItem } = useStore();
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<QuickOrderProduct | null>(null);
  const _initialMob = _pageDb.generalSettings?.mobileCols || "2";
  const _initialDesk = _pageDb.generalSettings?.desktopCols || "4";
  let _dInit = "lg:grid-cols-4";
  if (_initialDesk === "3") _dInit = "lg:grid-cols-3";
  if (_initialDesk === "4") _dInit = "lg:grid-cols-4";
  if (_initialDesk === "5") _dInit = "lg:grid-cols-5";
  if (_initialDesk === "6") _dInit = "lg:grid-cols-6";
  const [gridColsClass, setGridColsClass] = useState<string>(
    `grid ${_initialMob === "1" ? "grid-cols-1" : "grid-cols-2"} ${_dInit} gap-4 sm:gap-6`
  );

  useEffect(() => {
    fetch("/api/settings/general")
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.mobileCols || data.desktopCols)) {
          const mob = data.mobileCols || "2";
          const desk = data.desktopCols || "4";
          let dClass = "lg:grid-cols-4";
          if (desk === "3") dClass = "lg:grid-cols-3";
          if (desk === "4") dClass = "lg:grid-cols-4";
          if (desk === "5") dClass = "lg:grid-cols-5";
          if (desk === "6") dClass = "lg:grid-cols-6";
          setGridColsClass(`grid ${mob === "1" ? "grid-cols-1" : "grid-cols-2"} ${dClass} gap-4 sm:gap-6`);
        }
      })
      .catch(() => {});
  }, []);

  const initialData = _initialPages[slug] || null;
  const [pageData, setPageData] = useState<{ title?: string; content?: string } | null>(initialData);

  useEffect(() => {
    fetch(`/api/pages?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.title || data.content)) {
          setPageData(data);
        }
      })
      .catch(() => {});
  }, [slug]);

  const defaultTitle = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const title = pageData?.title || defaultTitle;
  const content = pageData?.content || "";

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        {/* Page Header Container with H1 Title + Bilgilendirme Metni Directly Below */}
        <div className="bg-white border-b py-8 shadow-xs">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 space-y-4">
            <nav className="text-xs text-slate-500 flex items-center gap-1.5">
              <Link href="/" className="hover:text-[#2b2623] transition">Anasayfa</Link>
              <span>›</span>
              <span className="font-bold text-slate-800">{title}</span>
            </nav>

            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900">{title}</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                🌸 {title} için özenle hazırlanan taze çiçekler aynı gün kurye ile adrese teslim edilir.
              </p>
            </div>

            {/* Bilgilendirme / Detay Metni (Doğrudan Ana Başlığın Altında) */}
            {content && (
              <div className="mt-4 pt-4 border-t border-slate-100 text-slate-700 whitespace-pre-line text-sm sm:text-base leading-relaxed max-w-5xl">
                {content}
              </div>
            )}
          </div>
        </div>

        <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8 space-y-10">
          {/* Product Grid Section */}
          {products.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {title} - Öne Çıkan Taze Çiçekler
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  {products.length} Çeşit Çiçek Bulundu
                </span>
              </div>

              <div className={gridColsClass}>
                {products.map((product: Product) => (
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
