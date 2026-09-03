"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import ProductCard from "@/components/store/ProductCard";
import QuickOrderModal, { QuickOrderProduct } from "@/components/store/QuickOrderModal";
import AddressSelectionModal from "@/components/store/AddressSelectionModal";
import { useStore, Product } from "@/lib/store";
import { useState, use, useEffect } from "react";
import Link from "next/link";

interface TimeSlot {
  id?: string;
  slot?: string;
  range?: string;
  startHour?: number;
  endHour?: number;
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const { products, addToCart, setSingleCartItem, clearCart } = useStore();

  const targetProduct = products.find((p: Product) => p.slug === slug) || products[0];
  if (!targetProduct) {
    return (
      <div className="bg-[#FAF6F0] min-h-screen font-sans">
        <StoreHeader />
        <div className="max-w-[1400px] mx-auto px-4 py-20 text-center text-slate-500 font-bold">
          Ürün bulunamadı veya yükleniyor...
        </div>
        <StoreFooter />
      </div>
    );
  }
  const product: Product = targetProduct;

  const [selectedAddress, setSelectedAddress] = useState<string>("Lütfen Teslimat Adresinizi Seçiniz");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalWarning, setAddressModalWarning] = useState(false);
  const [showAddressWarningModal, setShowAddressWarningModal] = useState(false);

  useEffect(() => {
    // Ensure default is ALWAYS "Lütfen Teslimat Adresinizi Seçiniz" unless explicitly chosen
    if (typeof window !== "undefined") {
      try { localStorage.removeItem("pro_flower_delivery_address"); } catch (e) {}
    }
    setSelectedAddress("Lütfen Teslimat Adresinizi Seçiniz");
  }, []);

  const [selectedDate, setSelectedDate] = useState("Bugün");
  const [selectedTime, setSelectedTime] = useState("");
  const [activeTab, setActiveTab] = useState<"desc" | "delivery">("desc");
  const [selectedQuickProduct, setSelectedQuickProduct] = useState<QuickOrderProduct | null>(null);
  const [cartItemIds, setCartItemIds] = useState<(string | number)[]>([]);
  const [isFav, setIsFav] = useState(false);

  // Live Dynamic Delivery Slots State
  const [liveDeliverySlots, setLiveDeliverySlots] = useState<any[]>([]);

  const fetchLiveDeliverySlots = async () => {
    try {
      const res = await fetch("/api/delivery-slots");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setLiveDeliverySlots(data);
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveDeliverySlots();
  }, []);

  // Live Customer Reviews State
  const [liveReviews, setLiveReviews] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewToast, setReviewToast] = useState("");

  const fetchLiveReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        const approved = data.filter((r: any) => {
          if (r.status !== "Onaylandı") return false;
          if (!r.product) return false;
          const pName = r.product.toLowerCase().trim();
          const targetTitle = product.title.toLowerCase().trim();
          return pName === targetTitle || targetTitle.includes(pName) || pName.includes(targetTitle);
        });
        setLiveReviews(approved);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveReviews();
  }, []);

  const handleUserSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewText.trim()) return;

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.title,
          author: newReviewAuthor,
          rating: Number(newReviewRating),
          text: newReviewText,
          status: "Onaylandı"
        })
      });

      if (res.ok) {
        setReviewToast("Değerlendirmeniz alındı ve yayına alındı! Teşekkür ederiz.");
        setNewReviewAuthor("");
        setNewReviewText("");
        setShowReviewModal(false);
        fetchLiveReviews();
        setTimeout(() => setReviewToast(""), 4000);
      }
    } catch (e) {}
  };

  // Mouse Hover Zoom Magnifier State
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Dynamic 5-day delivery date generator based on actual system date
  const generateDeliveryDates = () => {
    const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Aralık"];
    const days = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const result = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayNum = d.getDate();
      const monthName = months[d.getMonth()];
      const dayName = days[d.getDay()];

      let label = `${dayName}`;
      if (i === 0) label = "Bugün";
      else if (i === 1) label = "Yarın";

      result.push({
        label,
        date: `${dayNum} ${monthName}`,
        fullDate: d.toISOString().split("T")[0]
      });
    }

    return result;
  };

  const dates = generateDeliveryDates();

  // Check if time slot is valid for current clock time (order must be placed BEFORE slot start time)
  const isTimeAvailable = (slotObj: any) => {
    if (selectedDate !== "Bugün") return true; // Future dates always available

    const rangeStr = slotObj.range || slotObj.slot || "";
    const match = rangeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!match) return true;

    const startH = parseInt(match[1], 10);
    const startM = parseInt(match[2], 10);
    const startTotalMinutes = startH * 60 + startM;

    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    // The slot must be ordered BEFORE its starting minute (e.g. for 15:00 slot, latest order time is 14:59)
    return currentTotalMinutes < startTotalMinutes;
  };

  // Auto-select first available valid time slot on date change
  useEffect(() => {
    const validSlots = liveDeliverySlots.filter(isTimeAvailable);
    if (validSlots.length > 0) {
      const cleanFirst = (validSlots[0].range || validSlots[0].slot || "").split("(")[0].trim();
      if (!selectedTime || !validSlots.some((s) => (s.range || s.slot || "").includes(selectedTime))) {
        setSelectedTime(cleanFirst);
      }
    } else {
      setSelectedTime("");
    }
  }, [selectedDate, liveDeliverySlots]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Related products fallback list
  const activeProducts = products.filter((p: Product) => p.id !== product.id && p.stock !== false);
  const relatedProducts = activeProducts.length > 0 ? activeProducts.slice(0, 4) : [
    { id: "101", slug: "35-adet-krizantem-buketi-101", title: "35 adet Krizantem Buketi", price: "2.400 ₺", oldPrice: "2.640 ₺", discount: "%10", image: "https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp", code: "DM50", stock: true, featured: true },
    { id: "102", slug: "7-kirmizi-gul-ve-papatyalar-102", title: "7 Kırmızı Gül ve Papatyalar", price: "2.500 ₺", oldPrice: "2.750 ₺", discount: "%10", image: "https://demo.procicek.com.tr/urunler/7-kirmizi-gul-ve-beyaz-bicme-179-v2.webp", code: "DM45", stock: true, featured: true },
    { id: "103", slug: "9-pembe-gul-ve-krizantem-103", title: "9 Pembe Gül ve Krizantem", price: "2.200 ₺", oldPrice: "2.420 ₺", discount: "%10", image: "https://demo.procicek.com.tr/urunler/fanusta-papatya-ve-3-gul-264-v2.webp", code: "DM40", stock: true, featured: true },
    { id: "104", slug: "beyaz-krizantem-ve-beyaz-guller-104", title: "Beyaz Krizantem Ve Beyaz Güller", price: "2.300 ₺", oldPrice: "2.530 ₺", discount: "%10", image: "https://demo.procicek.com.tr/urunler/vazoda-kirmizi-11-gul-7-v2.webp", code: "DM35", stock: true, featured: true },
  ];

  const handleOrderSubmit = () => {
    if (!selectedAddress || selectedAddress.includes("Lütfen")) {
      setAddressModalWarning(true);
      setShowAddressModal(true);
      return;
    }

    if (!selectedTime) {
      alert("Lütfen geçerli bir teslimat saati seçiniz.");
      return;
    }

    if (typeof window !== "undefined") {
      const selectedDateObj = dates.find((d) => d.label === selectedDate);
      const dateText = selectedDateObj ? `${selectedDateObj.date} 2026` : selectedDate;
      localStorage.setItem("pro_flower_delivery_date", dateText);
      localStorage.setItem("pro_flower_delivery_time", selectedTime);
      localStorage.setItem("pro_flower_delivery_address", selectedAddress);
    }

    setSingleCartItem(product, 1, []);
    window.location.href = "/odeme";
  };

    const handleWhatsAppOrder = () => {
    try {
      fetch("/api/whatsapp-clicks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Ürün Sayfası",
          product: product.title,
          button: "WhatsApp İle Sipariş Ver",
          page: `/urun/${product.slug}`,
          device: "Masaüstü (Chrome)"
        })
      });
    } catch (e) {}
    if (!selectedAddress || selectedAddress.includes("Lütfen")) {
      setAddressModalWarning(true);
      setShowAddressModal(true);
      return;
    }
    const message = encodeURIComponent(`Merhaba, ${product.title} (${product.price}) siparişi vermek istiyorum. Adres: ${selectedAddress}, Teslimat Tarihi: ${selectedDate}, Saati: ${selectedTime || "Belirtilmedi"}`);
    window.open(`https://wa.me/905550000000?text=${message}`, "_blank");
  };



  return (
    <div className="bg-[#FAF6F0] min-h-screen font-sans">
      <StoreHeader />

      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#2b2623] transition">Anasayfa</Link>
          <span>›</span>
          <Link href={`/kategori/${product.categorySlug || "buketler"}`} className="hover:text-[#2b2623] transition">
            {product.category || "Buketler"}
          </Link>
          <span>›</span>
          <span className="font-bold text-slate-800 line-clamp-1">{product.title}</span>
        </nav>

        {/* TOP SECTION: Side-by-Side Product Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-start">
          {/* Left Column: Product Image with Mouse Hover Zoom */}
          <div className="w-full">
            <div
              className="product-detail-image-box relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm cursor-zoom-in aspect-[4/3] max-h-[500px]"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={handleMouseMove}
            >
              {/* Code Badge (Top Left) */}
              <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="absolute top-4 left-4 z-10 text-xs font-black px-3 py-1 rounded-lg shadow-sm">
                {product.code || `DM${product.id}`}
              </span>

              {/* Product Image with Cursor Following Magnifier */}
              <img
                src={product.image}
                alt={product.title}
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transform: isHovered ? "scale(2.2)" : "scale(1)",
                }}
                className="w-full h-full object-cover transition-transform duration-150 ease-out"
              />

              {/* Hover Lens Badge */}
              {isHovered && (
                <span className="absolute bottom-4 left-4 z-10 bg-slate-900/80 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-xl backdrop-blur-md pointer-events-none shadow-md flex items-center gap-1.5">
                  <span>🔍</span> <span>Büyüteç Aktif (%220)</span>
                </span>
              )}

              {/* Favorite Heart Button (Bottom Right) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFav(!isFav);
                }}
                className="absolute bottom-4 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-md transition"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? "#ef4444" : "none"} stroke={isFav ? "#ef4444" : "currentColor"} strokeWidth="2">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column: Checkout Form */}
          <div className="w-full flex flex-col justify-between">
            <div>
              {/* Header Title & Rating */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 leading-tight">
                    {product.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex text-amber-400 text-sm">★★★★☆</div>
                    <span className="text-xs font-bold text-slate-700">4,8</span>
                    <span className="text-xs text-slate-400">· 5 değerlendirme</span>
                  </div>
                </div>

                {/* Price Header Box (Top Right) */}
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1.5 mb-1">
                    {product.oldPrice && (
                      <span className="text-xs line-through text-slate-400 font-semibold">
                        {String(product.oldPrice)}
                      </span>
                    )}
                    <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                      {product.discount || "%10"}
                    </span>
                  </div>
                  <div style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="text-xl font-black px-4 py-2 rounded-xl shadow-sm inline-block">
                    {String(product.price)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">KDV Dahil</div>
                </div>
              </div>

              {/* 1. Teslimat Bölgesi */}
              <div className="mt-6 mb-5">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <span>📍</span> <span>Teslimat Bölgesi</span>
                </label>
                <div
                  onClick={() => setShowAddressModal(true)}
                  className="border border-slate-200 rounded-2xl p-3 flex items-center justify-between bg-white hover:border-[#2b2623] transition shadow-xs cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#F5EFE6] text-[#2b2623] flex items-center justify-center font-bold">
                      📍
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Teslimat Adresi (Değiştir)</div>
                      <div className="text-xs font-bold text-slate-800">{selectedAddress}</div>
                    </div>
                  </div>
                  <button type="button" className="text-xs font-bold text-[#2b2623] bg-[#F5EFE6] px-2 py-1 rounded-lg">Değiştir ✎</button>
                </div>
              </div>

              {/* 2. Teslimat Tarihi */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <span>📅</span> <span>Teslimat Tarihi</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {dates.map((item) => {
                    const isSelected = selectedDate === item.label;
                  

  return (
                      <button
                        key={item.date}
                        type="button"
                        onClick={() => setSelectedDate(item.label)}
                        style={
                          isSelected
                            ? { borderColor: "#2b2623", color: "#2b2623", backgroundColor: "#f0fdf4" }
                            : { borderColor: "#e2e8f0", color: "#475569", backgroundColor: "#ffffff" }
                        }
                        className={`py-2 px-1 rounded-xl border text-center transition ${
                          isSelected ? "font-extrabold ring-2 ring-[#2b2623]/20 shadow-xs" : "hover:border-slate-300"
                        }`}
                      >
                        <div className="text-[10px] font-medium opacity-80">{item.label}</div>
                        <div className="text-xs font-bold">{item.date}</div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="py-2 px-1 rounded-xl border border-slate-200 bg-white text-slate-600 text-center hover:border-slate-300 transition flex flex-col items-center justify-center"
                  >
                    <span className="text-[10px]">📅</span>
                    <span className="text-[10px] font-bold">Tarih Seç</span>
                  </button>
                </div>
              </div>

              {/* 3. Teslimat Saati (DYNAMIC ACCORDING TO CLOCK TIME) */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>🕒</span> <span>Teslimat Saati</span>
                  </span>
                  {selectedDate === "Bugün" && (
                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      ⚡ Anlık Saat Uyarlamalı
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {liveDeliverySlots.map((slotObj, idx) => {
                    const cleanSlot = (slotObj.range || slotObj.slot || "").split("(")[0].trim();
                    const available = isTimeAvailable(slotObj);
                    const isSelected = selectedTime === cleanSlot;

                  

  return (
                      <button
                        key={slotObj.id || idx}
                        type="button"
                        disabled={!available}
                        onClick={() => {
                          if (available) {
                            setSelectedTime(cleanSlot);
                            try { localStorage.setItem("pro_flower_delivery_time", cleanSlot); } catch (e) {}
                          }
                        }}
                        style={
                          !available
                            ? { backgroundColor: "#f1f5f9", color: "#94a3b8", borderColor: "#e2e8f0" }
                            : isSelected
                            ? { borderColor: "#2b2623", color: "#2b2623", backgroundColor: "#f0fdf4" }
                            : { borderColor: "#e2e8f0", color: "#475569", backgroundColor: "#ffffff" }
                        }
                        className={`py-2.5 px-1.5 rounded-xl border text-center transition text-xs relative ${
                          !available
                            ? "cursor-not-allowed line-through opacity-60"
                            : isSelected
                            ? "font-extrabold ring-2 ring-[#2b2623]/20 shadow-xs cursor-pointer"
                            : "hover:border-slate-300 cursor-pointer"
                        }`}
                      >
                        {cleanSlot}
                        {!available && selectedDate === "Bugün" && (
                          <span className="block text-[8px] no-underline font-extrabold text-red-500">
                            Süresi Geçti
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!selectedTime && selectedDate === "Bugün" && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-bold flex items-center gap-1">
                    <span>⚠️</span> <span>Bugün için teslimat saatleri doldu. Lütfen teslimat tarihini Yarın olarak seçiniz.</span>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleOrderSubmit}
                  disabled={!selectedTime}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className={`w-full font-bold py-3.5 px-4 rounded-2xl shadow-md transition text-sm flex items-center justify-center gap-2 ${
                    !selectedTime ? "opacity-50 cursor-not-allowed" : "hover:opacity-95"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                  </svg>
                  <span>Sipariş Ver</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                  className="w-full font-bold py-3.5 px-4 rounded-2xl shadow-md hover:opacity-95 transition text-sm flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.146 4.188 4.29-1.125z" />
                  </svg>
                  <span>WhatsApp ile Sipariş Ver</span>
                </button>
              </div>

              {/* Informational Banners */}
              <div className="space-y-3">
                {/* Yellow Timer Box */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1.5">
                    <span>🕒</span>
                    <span>21:00 saatine kadar teslimat için son sipariş saati 20:00</span>
                  </div>
                  <div className="w-full bg-amber-200/80 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-amber-500 h-full w-3/4 rounded-full"></div>
                  </div>
                  <div className="text-[11px] opacity-90">
                    Aynı gün teslimat seçeneği canlı saat durumuna göre otomatik aktifleşmektedir.
                  </div>
                </div>

                {/* Green Camera Box */}
                <div className="bg-[#F5EFE6]/80 border border-amber-900/15/80 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
                  <div className="text-xl shrink-0">📷</div>
                  <div>
                    <div className="font-extrabold mb-0.5">Görsel Onayı ile Kontrol Sizde!</div>
                    <div className="text-[11px] opacity-90">
                      Siparişiniz teslimattan önce size gösterilir, onayınızı aldıktan sonra yola çıkar.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Description & Tabs */}
        <section className="mb-14 bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-6 border-b border-slate-200 pb-3 mb-6">
            <button
              onClick={() => setActiveTab("desc")}
              className={`text-sm font-extrabold pb-3 transition relative ${
                activeTab === "desc" ? "text-[#2b2623]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span>Ürün Açıklaması</span>
              {activeTab === "desc" && (
                <span style={{ backgroundColor: "#2b2623" }} className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("delivery")}
              className={`text-sm font-extrabold pb-3 transition relative ${
                activeTab === "delivery" ? "text-[#2b2623]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span>Teslimat & İade</span>
              {activeTab === "delivery" && (
                <span style={{ backgroundColor: "#2b2623" }} className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"></span>
              )}
            </button>
          </div>

          {activeTab === "desc" ? (
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl space-y-3">
              <p>{product.description || "Zarif ve taze çiçek aranjmanlarımız, sevdiklerinize unutulmaz bir jest yapmanız için özenle tasarlanmıştır."}</p>
              <p>Aynı gün taze teslimat garantisi ve kuryeye verilmeden önce fotoğraflı onay ayrıcalığı ile siparişinizi güvenle oluşturabilirsiniz.</p>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl space-y-2">
              <p>• <b>Teslimat Süresi:</b> Antalya içi aynı gün teslimat. Saat 20:00'ye kadar verilen siparişler bugün teslim edilir.</p>
              <p>• <b>İade & Değişim:</b> Canlı çiçek siparişleriniz teslimat anında kontrol edilir, herhangi bir memnuniyetsizlikte anında yenisi ile değiştirilir.</p>
            </div>
          )}
        </section>

        {/* CUSTOMER REVIEWS SECTION - STRICTLY PRODUCT SPECIFIC */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">
                Müşteri Değerlendirmeleri ({liveReviews.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Bu çiçek için müşterilerimizin yazdığı gerçek deneyimler</p>
            </div>
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm hover:opacity-95 transition flex items-center gap-1.5"
            >
              <span>✍️ Değerlendirme Yap</span>
            </button>
          </div>

          {reviewToast && (
            <div className="mb-4 p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 rounded-xl text-xs font-bold">
              ✓ {reviewToast}
            </div>
          )}

          {liveReviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3">
              <div className="text-3xl">🌸</div>
              <div className="font-extrabold text-slate-800 text-sm">
                Henüz bu çiçek için yapılmış bir değerlendirme bulunmuyor.
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Sipariş tecrübenizi veya görüşlerinizi paylaşarak ilk değerlendirmeyi yapan siz olun!
              </p>
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:opacity-95 transition inline-flex items-center gap-1.5"
              >
                <span>✍️ İlk Değerlendirmeyi Sen Yap</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {liveReviews.map((rev) => {
                const initials = (rev.author || "Müşteri").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              

  return (
                  <div key={rev.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#2b2623] font-bold text-xs flex items-center justify-center">
                            {initials || "MŞ"}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{rev.author}</div>
                            <div className="text-[10px] text-slate-400">{rev.date}</div>
                          </div>
                        </div>
                        <div className="text-amber-400 text-xs">{"⭐".repeat(rev.rating || 5)}</div>
                      </div>
                      <p className="text-xs text-slate-600 italic">"{rev.text}"</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* User Submit Review Modal */}
          {showReviewModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h5 className="font-bold text-lg text-slate-800">Ürünü Değerlendir</h5>
                  <button onClick={() => setShowReviewModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold">✕</button>
                </div>
                <form onSubmit={handleUserSubmitReview} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Adınız Soyadınız *</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
                      placeholder="Örn: Ayşe Yılmaz"
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Puanınız</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 Yıldız)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 Yıldız)</option>
                      <option value={3}>⭐⭐⭐ (3 Yıldız)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Yorumunuz *</label>
                    <textarea
                      rows={3}
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
                      placeholder="Çiçek tazeliği, teslimat hızı ve deneyiminiz..."
                      value={newReviewText}
                      onChange={(e) => setNewReviewText(e.target.value)}
                      required
                    />
                  </div>
                  <div className="pt-2 flex justify-end gap-2 border-t">
                    <button type="button" onClick={() => setShowReviewModal(false)} className="btn btn-light px-4 py-2 text-sm font-bold">İptal</button>
                    <button
                      type="submit"
                      style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition"
                    >
                      Değerlendirmeyi Gönder
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* SIMILAR PRODUCTS SECTION */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-slate-800">Benzer Ürünler</h3>
            <Link href="/kategori/cicekler" className="text-xs font-bold text-[#2b2623] hover:underline">
              Tümünü Gör →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p: Product) => (
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
                onQuickOrder={(prod) => setSelectedQuickProduct(prod)}
                onRemoveFromCart={(id) => setCartItemIds(cartItemIds.filter((cId) => cId !== id))}
              />
            ))}
          </div>
        </section>
      </main>

      <StoreFooter />

      {/* Quick Order Modal */}
      <AddressSelectionModal
        isOpen={showAddressModal}
        warningBanner={addressModalWarning}
        onClose={() => {
          setShowAddressModal(false);
          setAddressModalWarning(false);
        }}
        onSelectAddress={(newAddr) => setSelectedAddress(newAddr)}
      />
      <QuickOrderModal
        product={selectedQuickProduct}
        onClose={() => setSelectedQuickProduct(null)}
        onAddToCart={(prod) => setSingleCartItem(product, 1, [])}
      />
    </div>
  );
}
