"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import WelcomeDiscountModal from "@/components/store/WelcomeDiscountModal";
import OrderAssistantModal from "@/components/store/OrderAssistantModal";
import AdTracker from "@/components/store/AdTracker";
import RedirectTracker from "@/components/store/RedirectTracker";
import GoogleReviewsSection from "@/components/store/GoogleReviewsSection";
import ProductCard from "@/components/store/ProductCard";
import QuickOrderModal, { QuickOrderProduct } from "@/components/store/QuickOrderModal";
import { useStore, Product, CategoryItem } from "@/lib/store";
import React, { useState, useEffect } from "react";

function formatLink(url?: string): string {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return "/" + url;
}

import { getInitialDbData } from "@/lib/server-settings";

const _pageDb = getInitialDbData();

const initialHeroData = _pageDb.hero || {
  sliders: [
    {
      id: 1,
      title: "35 Kırmızı Gül Buketi",
      price: "5.500 ₺",
      discountBadge: "%10 İndirim",
      image: "https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp",
      link: "/urun/35-kirmizi-gul-buketi-13981"
    }
  ]
};

export default function CustomerHomePage() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { products, categories, setSingleCartItem } = useStore();
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<QuickOrderProduct | null>(null);
  const [cartItemIds, setCartItemIds] = useState<(string | number)[]>([]);
  const [heroData, setHeroData] = useState<any>(_pageDb.hero || initialHeroData);
  const [seoData, setSeoData] = useState<any>(_pageDb.homeSeo || null);
  const [liveFaqs, setLiveFaqs] = useState<any[]>(_pageDb.faqs || []);
  const _initialMob = String(_pageDb.generalSettings?.mobileCols || _pageDb.generalSettings?.grid_cols_mobile || "2");
  const _initialDesk = String(_pageDb.generalSettings?.desktopCols || _pageDb.generalSettings?.grid_cols_desktop || "4");
  const [gridColsClass, setGridColsClass] = useState<string>(
    `grid product-catalog-grid cols-mob-${_initialMob} cols-desk-${_initialDesk} gap-4 sm:gap-6`
  );

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
  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    (_pageDb.whatsappSettings?.notifyNumber || "905539729773").replace(/[^0-9]/g, "")
  );

  useEffect(() => {
    fetch("/api/settings/whatsapp")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.notifyNumber) {
          const cleaned = String(data.notifyNumber).replace(/[^0-9]/g, "");
          if (cleaned) setWhatsappNumber(cleaned);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/faqs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLiveFaqs(data);
        }
      })
      .catch(() => {});
  }, []);


  useEffect(() => {
    fetch("/api/seo")
      .then((res) => res.json())
      .then((data) => setSeoData(data))
      .catch(() => {});
  }, []);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => res.json())
      .then((data) => setHeroData(data))
      .catch(() => {});
  }, []);

  const sliders = Array.isArray(heroData?.sliders)
    ? heroData.sliders
    : Array.isArray(heroData)
    ? heroData
    : [];

  // Auto-rotate hero slider every 3.5 seconds
  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % sliders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [sliders.length]);

  const currentSlide = sliders[currentSlideIndex] || sliders[0] || {};

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
      category: "Vitrin",
      categorySlug: "vitrin",
      stock: true,
      featured: true
    }, 1);
  };

  const handleRemoveFromCart = (id: string | number) => {
    setCartItemIds(cartItemIds.filter((cartId) => cartId !== id));
  };

  // Vitrin Grid Filtering
  const vitrinProducts = products.filter((p: Product) => p.stock !== false && p.featured !== false);

  const promoCards = Array.isArray(heroData?.promoCards) ? heroData.promoCards : [];
  const horizontalBanners = Array.isArray(heroData?.horizontalBanners) ? heroData.horizontalBanners : [];

  return (
    <div className="bg-[#FAF6F0] min-h-screen">
      <StoreHeader onOpenAssistant={() => setIsAssistantOpen(true)} />
      <AdTracker />
      <RedirectTracker />

      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
        {/* Story Category Circles */}
        <section className="hidden lg:block pt-2 pb-6">
          <div className="flex items-start gap-4 overflow-x-auto py-2 scrollbar-none">
            {categories.map((cat: CategoryItem) => (
              <a
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                className="group shrink-0 flex flex-col items-center gap-2 w-24"
              >
                <div className="w-20 h-20 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 to-[#2b2623] group-hover:scale-105 transition shadow-sm">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full bg-white p-0.5"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 text-center line-clamp-1 group-hover:text-[#2b2623] transition">
                  {cat.name}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Hero Grid Section with Dynamic 4-Slide Slider */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Big Carousel Slider */}
              <div className="relative rounded-2xl overflow-hidden min-h-[380px] bg-slate-900 border border-slate-200 shadow-sm flex flex-col items-center justify-between p-6 text-center group">
                {currentSlide?.discountBadge && (
                  <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="absolute top-4 left-4 z-20 text-xs font-extrabold px-3 py-1 rounded-lg shadow-md">
                    {currentSlide.discountBadge}
                  </span>
                )}

                {/* Slide Image - FIX: Only render img if src is non-empty string */}
                {currentSlide?.image ? (
                  <img
                    key={currentSlide.image}
                    src={currentSlide.image}
                    alt={currentSlide.title || "Slayt Görseli"}
                    className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-700 animate-in fade-in"
                  />
                ) : null}
                
                {/* Product Info Box Overlay */}
                {currentSlide?.title && (
                  <div className="relative z-10 mt-2 bg-white/80 backdrop-blur-md rounded-2xl p-4 max-w-xs shadow-md border border-white/50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Özel Koleksiyon</span>
                    <h2 className="text-xl font-extrabold text-slate-800">{currentSlide.title}</h2>
                    {currentSlide.price && (
                      <div style={{ color: "#2b2623" }} className="text-2xl font-black mt-1">{currentSlide.price}</div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                {currentSlide?.link && (
                  <a
                    href={formatLink(currentSlide.link)}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="relative z-10 hover:opacity-95 text-xs font-extrabold tracking-wider uppercase px-8 py-3.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 mb-2"
                  >
                    ALIŞVERİŞE BAŞLA
                  </a>
                )}

                {/* Left/Right Slider Nav Arrows */}
                {sliders.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + sliders.length) % sliders.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md text-slate-800 font-bold shadow-md hover:bg-white transition flex items-center justify-center"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % sliders.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md text-slate-800 font-bold shadow-md hover:bg-white transition flex items-center justify-center"
                    >
                      ›
                    </button>

                    {/* Slider Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                      {sliders.map((_: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlideIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentSlideIndex ? "bg-white w-5" : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Right 4 Promo Cards */}
              <div className="grid grid-cols-2 grid-rows-2 gap-4">
                {promoCards.map((promo: any, idx: number) => (
                  <a
                    key={idx}
                    href={formatLink(promo.link)}
                    className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition aspect-[4/3] bg-slate-100"
                  >
                    {promo.image && (
                      <img
                        src={promo.image}
                        alt={promo.title || "Promo Kartı"}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    )}
                  </a>
                ))}
              </div>
            </div>
        </section>

        {/* 3 Horizontal Banners */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {horizontalBanners.map((banner: any, idx: number) => (
            <a
              key={idx}
              href={formatLink(banner.link)}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition aspect-[16/9] bg-slate-100"
            >
              {banner.image && (
                <img
                  src={banner.image}
                  alt={banner.title || "Banner"}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              )}
            </a>
          ))}
        </section>

        {/* Vitrin Product Grid Section */}
        <section className="mb-14">
          <div className="mb-6">
            <h1 className="text-xl lg:text-2xl font-extrabold text-slate-800 leading-tight">
              {seoData?.h1Title || "Çiçekçe ile Aynı Gün Taze Çiçek Siparişi"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {seoData?.h1Subtitle || "Sizler için özenle seçtiğimiz taze çiçekler, buketler ve aranjmanlar; hepsi aynı gün adrese teslimata hazır."}
            </p>
          </div>

          <div className={gridColsClass}>
            {vitrinProducts.map((p: Product) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                title={p.title}
                price={p.price}
                oldPrice={p.oldPrice}
                discount={p.discount}
                image={p.image}
                code={p.code}
                isInCart={cartItemIds.includes(p.id)}
                onQuickOrder={() => { window.location.href = "/odeme"; }}
                onRemoveFromCart={(id) => handleRemoveFromCart(id)}
              />
            ))}
          </div>
        </section>

                {/* SEO Article Block */}
        {seoData?.seoArticle && (
          <section className="mb-10 bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Çiçekçe Hızlı & Taze Çiçek Gönderimi</h3>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {seoData.seoArticle}
            </p>
          </section>
        )}

        {/* SSS Accordion Section */}
        <section className="mb-14 bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sıkça Sorulan Sorular</h3>
          <div className="space-y-3">
            {(liveFaqs || []).map((faq: any, idx: number) => (
              <details key={faq.id || idx} className="group border border-slate-200 rounded-2xl p-4 transition open:bg-slate-50/50">
                <summary className="font-semibold text-xs sm:text-sm text-slate-800 cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="text-slate-400 group-open:rotate-180 transition">▼</span>
                </summary>
                <div className="mt-3 text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>
        <GoogleReviewsSection />
      </main>

      <WelcomeDiscountModal />
      <OrderAssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      
      {/* FLOATING ACTION BUTTONS (WhatsApp + Sipariş Asistanı) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        {/* Floating WhatsApp Button */}
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: "#25D366", color: "#ffffff" }}
          className="px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition duration-300 font-extrabold text-xs"
          title="WhatsApp ile Sipariş"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001l-1.42 5.187 5.306-1.391c1.464.798 3.114 1.218 4.77 1.219h.004c5.504 0 9.987-4.478 9.989-9.985 0-2.667-1.037-5.175-2.924-7.062-1.886-1.887-4.394-2.923-7.068-2.923zm5.836 14.161c-.244.688-1.42 1.314-1.957 1.397-.487.075-1.12.106-1.801-.112-.413-.131-.944-.306-1.637-.607-2.909-1.263-4.802-4.204-4.949-4.399-.146-.197-1.192-1.587-1.192-3.027 0-1.44.754-2.146 1.022-2.438.268-.293.585-.366.78-.366.195 0 .39.002.56.01.181.008.423-.069.662.505.244.585.83 2.023.903 2.17.073.146.122.317.024.512-.097.195-.146.317-.293.488-.146.171-.307.382-.439.512-.146.146-.298.307-.128.599.171.293.758 1.25 1.626 2.023 1.117.994 2.06 1.303 2.353 1.45.293.146.463.122.634-.073.171-.195.731-.853.926-1.146.195-.293.39-.244.658-.146.268.098 1.706.805 2.00 1.00.293.195.488.293.56.415.073.122.073.707-.171 1.395z"/>
          </svg>
          <span className="hidden sm:inline">WhatsApp İletişim</span>
        </a>

        {/* Floating Sipariş Asistanı Button */}
        <button
          onClick={() => setIsAssistantOpen(true)}
          style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
          className="px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition duration-300 font-extrabold text-xs"
          title="Sipariş Asistanı"
        >
          <span className="text-lg">🎧</span>
          <span className="hidden sm:inline">Sipariş Asistanı</span>
        </button>
      </div>
      <StoreFooter />

      {/* Quick Order Modal */}
      <QuickOrderModal
        product={selectedQuickProduct}
        onClose={() => setSelectedQuickProduct(null)}
        onAddToCart={(prod) => handleAddToCart(prod)}
      />
    </div>
  );
}
