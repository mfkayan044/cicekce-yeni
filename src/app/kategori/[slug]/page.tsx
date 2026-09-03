"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import QuickOrderModal, { QuickOrderProduct } from "@/components/store/QuickOrderModal";
import { useStore, Product } from "@/lib/store";
import { use, useState, useEffect } from "react";

function normalizeSlug(str: string) {
  if (!str) return "";
  return str
    .toString()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SLUG_TO_TURKISH_TITLE: Record<string, string> = {
  "yil-donumu": "Yıl Dönümü Çiçekleri",
  "gecmis-olsun": "Geçmiş Olsun Çiçekleri",
  "dogum-gunu": "Doğum Günü Çiçekleri",
  "ozur-cicekleri": "Özür Çiçekleri",
  "ozur": "Özür Çiçekleri",
  "sevgililer-gunu": "Sevgililer Günü Çiçekleri",
  "sevgililer-icin": "Sevgililer İçin Çiçekler",
  "saksi-cicekleri": "Saksı Çiçekleri",
  "saksi-cicegi": "Saksı Çiçekleri",
  "mevsim-cicekleri": "Mevsim Çiçekleri",
  "acilis-cicekleri": "Açılış Çiçekleri",
  "ev-hediyesi": "Ev Hediyesi Çiçekleri",
  "dugun-nisan": "Düğün & Nişan Çiçekleri",
  "kutuda-cicekler": "Kutuda Çiçekler",
  "guller": "Güller",
  "buketler": "Buketler",
  "aranjmanlar": "Aranjmanlar",
  "gerbera": "Gerbera Çiçekleri",
  "celenk": "Çelenkler",
  "ferfore": "Ferfore Çiçekler",
  "sepet-aranjman": "Sepet Aranjmanlar",
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams.slug;
  const targetSlug = normalizeSlug(rawSlug);

  const { products, setSingleCartItem } = useStore();
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<QuickOrderProduct | null>(null);
  const [cartItemIds, setCartItemIds] = useState<(string | number)[]>([]);

  const [gridColsClass, setGridColsClass] = useState<string>("grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6");

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

  // Proper Turkish Page Title
  const categoryName =
    SLUG_TO_TURKISH_TITLE[targetSlug] ||
    rawSlug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // ULTRA-SMART MATCHING (Categories + Filter Purpose + Recipient + Color + Design Type)
  const filteredProducts = products.filter((p: Product) => {
    // 1. Must be Active (stock !== false)
    if (p.stock === false) return false;

    if (targetSlug === "tum-cicekler" || targetSlug === "cicekler") return true;

    // 2. Check main category slug & category name match
    const mainCatSlug = normalizeSlug(p.categorySlug || "");
    const mainCatNameSlug = normalizeSlug(p.category || "");
    if (mainCatSlug === targetSlug || mainCatNameSlug === targetSlug) return true;

    // 3. Check selectedCategorySlugs array
    const selSlugs = (p as any).selectedCategorySlugs;
    if (Array.isArray(selSlugs) && selSlugs.length > 0) {
      if (selSlugs.some((s: string) => normalizeSlug(s) === targetSlug)) return true;
    }

    // 4. Check Filter Purpose (Gönderim Amacı e.g. "Yıl Dönümü", "Geçmiş Olsun", "Doğum Günü")
    if ((p as any).purpose) {
      const purposeSlug = normalizeSlug((p as any).purpose);
      if (purposeSlug === targetSlug || targetSlug.includes(purposeSlug) || purposeSlug.includes(targetSlug)) {
        return true;
      }
    }

    // 5. Check Recipient (Kime e.g. "Sevgiliye", "Anneye")
    if ((p as any).recipient) {
      if (normalizeSlug((p as any).recipient) === targetSlug) return true;
    }

    // 6. Check Color (Renk e.g. "Kırmızı", "Beyaz")
    if ((p as any).color) {
      if (normalizeSlug((p as any).color) === targetSlug) return true;
    }

    // 7. Check Design Type (Tasarım Tipi e.g. "Buket", "Aranjman")
    if ((p as any).designType) {
      if (normalizeSlug((p as any).designType) === targetSlug) return true;
    }

    return false;
  });

  const handleAddToCart = (product: QuickOrderProduct) => {
    if (!cartItemIds.includes(product.id)) {
      setCartItemIds([...cartItemIds, product.id]);
    }
    setSingleCartItem({
      id: String(product.id),
      slug: String(product.id),
      title: product.title,
      price: product.price,
      image: product.image,
      code: product.code || "",
      category: "Kategori",
      categorySlug: "kategori",
      stock: true,
      featured: true
    }, 1);
  };

  const handleRemoveFromCart = (id: string | number) => {
    setCartItemIds(cartItemIds.filter((cartId) => cartId !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <div className="bg-white border-b py-8 shadow-xs">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <h1 className="text-3xl font-black text-slate-900">{categoryName}</h1>
            <p className="text-xs text-slate-500 mt-1">Taze ve canlı {categoryName} koleksiyonu.</p>
          </div>
        </div>

        <section className="py-10 max-w-[1400px] mx-auto px-4 lg:px-6">
          {filteredProducts.length > 0 ? (
            <div className={gridColsClass}>
              {filteredProducts.map((product: Product) => (
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
                  isInCart={cartItemIds.includes(product.id)}
                  onQuickOrder={() => { window.location.href = "/odeme"; }}
                  onRemoveFromCart={(id) => handleRemoveFromCart(id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border space-y-3">
              <div className="text-5xl">🌸</div>
              <h4 className="font-bold text-slate-800 text-lg">Bu kategoride henüz ürün bulunmuyor</h4>
              <p className="text-xs text-slate-500">Admin panelinden bu kategoriye ürün seçerek ekleyebilirsiniz.</p>
            </div>
          )}
        </section>
      </div>

      <StoreFooter />

      <QuickOrderModal
        product={selectedQuickProduct}
        onClose={() => setSelectedQuickProduct(null)}
        onAddToCart={(prod) => handleAddToCart(prod)}
      />
    </div>
  );
}
