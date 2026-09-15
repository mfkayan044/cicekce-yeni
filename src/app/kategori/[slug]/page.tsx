"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import QuickOrderModal, { QuickOrderProduct } from "@/components/store/QuickOrderModal";
import { useStore, Product } from "@/lib/store";
import { use, useState, useEffect } from "react";
import { ArrowUpDown, Flame, ArrowDownAZ, ArrowUpZA, Sparkles, Percent } from "lucide-react";

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

  const [gridColsClass, setGridColsClass] = useState<string>("grid product-catalog-grid cols-mob-2 cols-desk-4 gap-4 sm:gap-6");
  const [sortBy, setSortBy] = useState<string>("suggested");

  useEffect(() => {
    fetch("/api/settings/general")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          const mob = String(data.mobileCols || data.grid_cols_mobile || "2");
          const desk = String(data.desktopCols || data.grid_cols_desktop || "4");
          setGridColsClass(`grid product-catalog-grid cols-mob-${mob} cols-desk-${desk} gap-4 sm:gap-6`);
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

  const parsePriceNum = (val?: string | number): number => {
    if (!val) return 0;
    if (typeof val === "number") return val;
    const cl = String(val).replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "");
    return parseFloat(cl) || 0;
  };

  // ULTRA-SMART MATCHING (Categories + Filter Purpose + Recipient + Color + Design Type)
  const baseProducts = products.filter((p: Product) => {
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
    const purps = (p as any).purposes || [(p as any).purpose];
    if (Array.isArray(purps) && purps.filter(Boolean).some((pr: string) => {
      const pSlug = normalizeSlug(pr);
      return pSlug === targetSlug || targetSlug.includes(pSlug) || pSlug.includes(targetSlug);
    })) {
      return true;
    }

    // 5. Check Recipient (Kime e.g. "Sevgiliye", "Anneye")
    const recs = (p as any).recipients || [(p as any).recipient];
    if (Array.isArray(recs) && recs.filter(Boolean).some((r: string) => normalizeSlug(r) === targetSlug)) {
      return true;
    }

    // 6. Check Color (Renk e.g. "Kırmızı", "Beyaz")
    const cols = (p as any).colors || [(p as any).color];
    if (Array.isArray(cols) && cols.filter(Boolean).some((c: string) => normalizeSlug(c) === targetSlug)) {
      return true;
    }

    // 7. Check Design Type (Tasarım Tipi e.g. "Buket", "Aranjman")
    const dTypes = (p as any).designTypes || [(p as any).designType];
    if (Array.isArray(dTypes) && dTypes.filter(Boolean).some((dt: string) => normalizeSlug(dt) === targetSlug)) {
      return true;
    }

    return false;
  });

  // SORTING ENGINE
  const sortedProducts = [...baseProducts].sort((a: Product, b: Product) => {
    if (sortBy === "price_asc") {
      return parsePriceNum(a.price) - parsePriceNum(b.price);
    }
    if (sortBy === "price_desc") {
      return parsePriceNum(b.price) - parsePriceNum(a.price);
    }
    if (sortBy === "bestsellers") {
      const scoreA = ((a as any).salesCount || 0) * 10 + (a.featured ? 5 : 0);
      const scoreB = ((b as any).salesCount || 0) * 10 + (b.featured ? 5 : 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return String(b.id).localeCompare(String(a.id));
    }
    if (sortBy === "newest") {
      return String(b.id).localeCompare(String(a.id));
    }
    if (sortBy === "discount") {
      const discA = parsePriceNum(a.discount || 0);
      const discB = parsePriceNum(b.discount || 0);
      return discB - discA;
    }
    // "suggested" default: featured first, then standard order
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  const handleAddToCart = (prod: QuickOrderProduct) => {
    if (!cartItemIds.includes(prod.id)) {
      setCartItemIds([...cartItemIds, prod.id]);
    }
    const fullProd = products.find((p: any) => String(p.id) === String(prod.id));
    if (fullProd) {
      setSingleCartItem(fullProd, 1);
    } else {
      setSingleCartItem({
        id: String(prod.id),
        slug: prod.slug || String(prod.id),
        title: prod.title,
        price: prod.price,
        image: prod.image,
        code: prod.code || "",
        category: categoryName,
        categorySlug: targetSlug,
        stock: true,
        featured: true
      }, 1);
    }
  };

  const handleRemoveFromCart = (id: string | number) => {
    setCartItemIds(cartItemIds.filter((cartId) => cartId !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <div className="bg-white border-b py-6 sm:py-8 shadow-xs">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{categoryName}</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Taze ve canlı {categoryName} koleksiyonu ({sortedProducts.length} ürün listeleniyor)
                </p>
              </div>

              {/* Desktop Sort Dropdown */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sırala:</span>
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-[#2b2623] cursor-pointer shadow-2xs"
                >
                  <option value="suggested">🌟 Önerilen Sıralama</option>
                  <option value="bestsellers">🔥 Çok Satanlar</option>
                  <option value="price_asc">💰 Fiyat: Düşükten Yükseğe</option>
                  <option value="price_desc">💎 Fiyat: Yüksekten Düşüğe</option>
                  <option value="newest">✨ En Yeniler</option>
                  <option value="discount">🏷️ İndirim Oranına Göre</option>
                </select>
              </div>
            </div>

            {/* Mobile & Desktop Horizontal Sorting Pill Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSortBy("suggested")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  sortBy === "suggested"
                    ? "bg-[#2b2623] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Önerilen</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy("bestsellers")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  sortBy === "bestsellers"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Çok Satanlar</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy("price_asc")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  sortBy === "price_asc"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                <span>En Düşük Fiyat</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy("price_desc")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  sortBy === "price_desc"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ArrowUpZA className="w-3.5 h-3.5" />
                <span>En Yüksek Fiyat</span>
              </button>

              <button
                type="button"
                onClick={() => setSortBy("discount")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  sortBy === "discount"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Fırsat & İndirim</span>
              </button>
            </div>
          </div>
        </div>

        <section className="py-8 max-w-[1400px] mx-auto px-4 lg:px-6">
          {sortedProducts.length > 0 ? (
            <div className={gridColsClass}>
              {sortedProducts.map((product: Product) => (
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
                  onQuickOrder={() => {
                    setSingleCartItem(product, 1);
                    window.location.href = "/odeme";
                  }}
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
