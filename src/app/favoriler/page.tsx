"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import { useStore, Product } from "@/lib/store";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useStore();
  const favoriteProducts: Product[] = favorites || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <div className="bg-white border-b py-8 shadow-xs">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                <span>❤️</span>
                <span>Favorilerim</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Beğendiğiniz ve daha sonra incelemek üzere kaydettiğiniz özel çiçekler.
              </p>
            </div>

            {favoriteProducts.length > 0 && (
              <button
                type="button"
                onClick={clearFavorites}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition"
              >
                Favorileri Temizle
              </button>
            )}
          </div>
        </div>

        <section className="py-10 max-w-[1400px] mx-auto px-4 lg:px-6">
          {favoriteProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {favoriteProducts.map((product: Product) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
              <div className="text-6xl">❤️</div>
              <h3 className="text-2xl font-bold text-slate-900">Favori Listeniz Henüz Boş</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ürün kartlarının üzerindeki kalp butonuna tıklayarak beğendiğiniz çiçekleri buraya ekleyebilirsiniz.
              </p>
              <Link
                href="/"
                className="inline-block bg-[#2b2623] text-white font-bold px-6 py-3 rounded-xl shadow transition text-sm hover:opacity-95"
              >
                Çiçek Koleksiyonunu İncele
              </Link>
            </div>
          )}
        </section>
      </div>

      <StoreFooter />
    </div>
  );
}
