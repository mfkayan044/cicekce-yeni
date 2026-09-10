"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { getStoredMember, clearStoredMember, MemberUser } from "@/lib/member-auth";
import { useStore } from "@/lib/store";
import { User, LogOut, Package, Headphones, Heart, ShoppingCart, Search, Menu, X, Sparkles, ChevronDown } from "lucide-react";

import { getInitialDbData } from "@/lib/server-settings";

const _hdrDb = getInitialDbData();

export default function StoreHeader({ onOpenAssistant }: { onOpenAssistant?: () => void }) {
  const { cart, favorites, products } = useStore();
  const [topbarData, setTopbarData] = useState<any>(_hdrDb.headerBant || null);
  const [dismissed, setDismissed] = useState(false);
  const [liveMenus, setLiveMenus] = useState<any[]>(_hdrDb.headerMenus ? _hdrDb.headerMenus.filter((m: any) => m.active !== false) : []);
  const [genSettings, setGenSettings] = useState<any>(_hdrDb.generalSettings || { logoMode: "text", logoUrl: "/logo.jpg" });
  const [member, setMember] = useState<MemberUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = searchQuery.trim().length >= 2
    ? (products || []).filter((p: any) =>
        p.stock !== false && (
          (p.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      ).slice(0, 5)
    : [];

  useEffect(() => {
    setMember(getStoredMember());
    const handler = () => setMember(getStoredMember());
    window.addEventListener("cicekce_auth_change", handler);
    return () => window.removeEventListener("cicekce_auth_change", handler);
  }, []);

  useEffect(() => {
    fetch("/api/settings/general")
      .then((res) => res.json())
      .then((data) => {
        if (data) setGenSettings((prev: any) => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/menus")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLiveMenus(data.filter((m: any) => m.active !== false));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/header-bant")
      .then((res) => res.json())
      .then((data) => setTopbarData(data))
      .catch(() => {});
  }, []);

  const isVisible = topbarData?.enabled !== false && !dismissed;

  return (
    <>
      {isVisible && (
        <div
          style={{ backgroundColor: topbarData?.bgColor || "#2b2623", color: topbarData?.textColor || "#ffffff" }}
          className="py-2 px-4 text-xs font-extrabold text-center relative z-50 flex items-center justify-center gap-3 transition shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{topbarData?.text || "Aynı Gün Adrese Teslimat! 1.500 ₺ Üzeri Ücretsiz Kargo | WhatsApp ile Hızlı Sipariş"}</span>
            {topbarData?.promoEnabled !== false && topbarData?.code && (
              <span className="hidden sm:inline-block bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold">
                Kupon: {topbarData.code} ({topbarData.amount || 100} ₺ İndirim)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Kapat"
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <header className="border-b sticky top-0 z-40 bg-white lg:static" style={{ "borderBottomColor": "rgba(203,213,225,.6)" }}>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
          <a href="/" className="shrink-0" aria-label="Anasayfa">
            <span className="h-10 lg:h-[54px] inline-flex items-center gap-3" role="img" aria-label="Çiçekçe">
              {genSettings?.logoMode === "image" && genSettings?.logoUrl ? (
                <img
                  src={genSettings.logoUrl}
                  alt="Çiçekçe Logo"
                  className="h-10 lg:h-12 w-auto object-contain rounded-xl shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <span style={{ fontFamily: "serif", fontWeight: "700", fontSize: "clamp(22px, 3.5vw, 32px)", letterSpacing: "0.05em", color: "#1a1918" }}>
                  ÇİÇEKÇE
                </span>
              )}
            </span>
          </a>

          {/* Desktop Search Bar with Live Instant Results */}
          <div className="hidden lg:block relative flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Çiçek, buket veya canlı ürün ara..."
                className="w-full py-2.5 pl-10 pr-4 bg-slate-50 border border-slate-200 focus:border-[#2b2623] focus:bg-white rounded-2xl text-xs font-bold text-slate-800 outline-none transition shadow-2xs"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold hover:text-slate-700">✕</button>
              )}
            </div>

            {/* Instant Search Dropdown Popup */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in space-y-1 p-2">
                <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Arama Sonuçları</div>
                {searchResults.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/urun/${item.slug}`}
                    onClick={() => setSearchQuery("")}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F5EFE6] transition group"
                  >
                    <img src={item.image} alt={item.title} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-[#2b2623] truncate">{item.title}</div>
                      <div className="text-[10px] text-amber-900 font-semibold">{item.category || "Çiçek"}</div>
                    </div>
                    <div className="text-xs font-extrabold text-[#2b2623] shrink-0">{item.price}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 lg:gap-2 ml-auto">
            <button id="searchOpen" type="button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Ara" className="lg:hidden shrink-0 flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-[#2b2623] text-slate-700 rounded-lg transition">
              <Search className="w-4 h-4" />
            </button>
            <button type="button" className="aio-open aio-hdr-btn hidden lg:flex shrink-0 items-center gap-2" aria-label="Sipariş Asistanı" onClick={onOpenAssistant}>
              <Headphones className="w-4 h-4" />
              <span className="whitespace-nowrap">Sipariş Asistanı</span>
            </button>
            <Link href="/siparis-takip" className="hidden lg:flex shrink-0 items-center gap-2 border border-slate-200 hover:border-[#2b2623] hover:text-[#2b2623] text-slate-700 font-semibold text-sm rounded-lg px-4 py-2.5 transition">
              <Package className="w-4 h-4" />
              <span className="whitespace-nowrap">Sipariş Takip</span>
            </Link>
            {member ? (
              <div id="userMenuWrap" className="relative hidden lg:block shrink-0">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 border border-slate-200 hover:border-[#2b2623] text-slate-800 font-extrabold text-xs rounded-xl px-3.5 py-2.5 transition bg-slate-50 shadow-2xs cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-700" />
                  <span>{member.name.split(" ")[0]}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in space-y-1">
                    <div className="px-3.5 py-1.5 border-b text-[11px] font-bold text-slate-400 truncate">
                      {member.email}
                    </div>
                    <Link
                      href="/hesabim"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hesabım & Profilim</span>
                    </Link>
                    <Link
                      href="/hesabim"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      <span>Siparişlerim</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        clearStoredMember();
                        setUserMenuOpen(false);
                        window.location.href = "/";
                      }}
                      className="w-full flex items-center gap-2 text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div id="userMenuWrap" className="relative hidden lg:block shrink-0">
                <Link
                  href="/giris-yap"
                  id="loginBtn"
                  className="flex items-center gap-2 border border-slate-200 hover:border-[#2b2623] hover:text-[#2b2623] text-slate-700 font-semibold text-sm rounded-lg px-4 py-2.5 transition"
                >
                  <User className="w-4 h-4" />
                  <span className="whitespace-nowrap">Üye Girişi</span>
                </Link>
              </div>
            )}
            <Link href="/favoriler" id="favBtn" aria-label="Favoriler" className="shrink-0 relative flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-brand text-slate-700 hover:text-red-500 rounded-lg transition">
              <Heart className="w-5 h-5" />
              <span suppressHydrationWarning className="fav-count absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {favorites ? favorites.length : 0}
              </span>
            </Link>
            <Link href="/sepet" id="cartBtn" aria-label="Sepet" className="shrink-0 relative flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-brand text-slate-700 hover:text-brand rounded-lg transition">
              <ShoppingCart className="w-5 h-5" />
              <span suppressHydrationWarning className="cart-count absolute -top-1.5 -right-1.5 bg-brand text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
                {cart ? cart.length : 0}
              </span>
            </Link>
            <button id="menuOpen" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Menü" className="lg:hidden shrink-0 flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-[#2b2623] text-slate-800 rounded-lg transition active:scale-95 bg-slate-50 cursor-pointer">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar with Live Instant Results */}
        {searchOpen && (
          <div className="lg:hidden px-4 pb-3 pt-1 border-t border-slate-100 animate-in slide-in-from-top duration-200 relative">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Çiçek, buket veya ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                autoFocus
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 text-xs font-bold px-1">✕</button>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 space-y-1 p-2">
                <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Arama Sonuçları</div>
                {searchResults.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/urun/${item.slug}`}
                    onClick={() => {
                      setSearchQuery("");
                      setSearchOpen(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F5EFE6] transition"
                  >
                    <img src={item.image} alt={item.title} className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                      <div className="text-[10px] text-amber-900 font-semibold">{item.category || "Çiçek"}</div>
                    </div>
                    <div className="text-xs font-extrabold text-[#2b2623] shrink-0">{item.price}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </header>
<nav id="mainNav" className="hidden lg:block border-b bg-white lg:sticky lg:top-0 z-40" style={{ "borderBottomColor": "rgba(203,213,225,.6)" }}>
<div className="max-w-[1400px] mx-auto px-4 lg:px-6 flex items-center">
<ul id="mainMenu" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-extrabold text-slate-800 overflow-x-auto py-2 scrollbar-none">
  {liveMenus.map((m: any) => (
    <li key={m.id} className="shrink-0">
      <Link
        href={m.url || "#"}
        className="px-3.5 py-2 rounded-xl text-slate-700 hover:text-[#2b2623] hover:bg-[#F5EFE6] transition whitespace-nowrap inline-block"
      >
        {m.title}
      </Link>
    </li>
  ))}
  <li className="shrink-0">
    <Link
      href="/abonelik"
      className="px-3.5 py-2 rounded-xl text-emerald-900 bg-emerald-50 border border-emerald-200 font-extrabold hover:bg-emerald-100 transition whitespace-nowrap inline-flex items-center gap-1 shadow-2xs"
    >
      <span>🌿 Çiçek Aboneliği</span>
    </Link>
  </li>
</ul>
</div>
</nav>

{/* FULL RESPONSIVE SLIDE-OVER MOBILE DRAWER MENU */}
{mobileMenuOpen && (
  <div className="fixed inset-0 z-50 flex lg:hidden">
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={() => setMobileMenuOpen(false)}
    />

    <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300">
      <div>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#2b2623] text-white">
          <span className="font-serif font-bold text-lg tracking-wider">ÇİÇEKÇE</span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition"
          >
            ✕
          </button>
        </div>

        <div className="p-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
          {member ? (
            <div>
              <div className="text-xs font-black text-slate-900">Hoş Geldiniz, {member.name}!</div>
              <div className="text-[10px] text-slate-500 font-bold">{member.email}</div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-black text-slate-900">Çiçekçe'ye Hoş Geldiniz!</div>
              <div className="text-[10px] text-slate-500 font-bold">Hızlı ve güvenli çiçek siparişi</div>
            </div>
          )}
          {member ? (
            <Link
              href="/hesabim"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 px-3 bg-[#2b2623] text-white text-[10px] font-black rounded-lg shadow-2xs"
            >
              Hesabım
            </Link>
          ) : (
            <Link
              href="/giris-yap"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 px-3 bg-[#2b2623] text-white text-[11px] font-black rounded-xl shadow-2xs"
            >
              Giriş Yap
            </Link>
          )}
        </div>

        <div className="p-4 space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Kategoriler</div>
          {liveMenus.map((m: any) => (
            <Link
              key={m.id}
              href={m.url || "#"}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-slate-100 transition"
            >
              <span>{m.title}</span>
              <span className="text-slate-400">›</span>
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Hızlı Erişim</div>
          <Link
            href="/siparis-takip"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <Package className="w-4 h-4 text-slate-600" />
            <span>Sipariş Takip</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              if (onOpenAssistant) onOpenAssistant();
            }}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 text-left"
          >
            <Headphones className="w-4 h-4 text-slate-600" />
            <span>Sipariş Asistanı</span>
          </button>
          <Link
            href="/favoriler"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <div className="flex items-center gap-2.5">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Favorilerim</span>
            </div>
            <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">
              {favorites ? favorites.length : 0}
            </span>
          </Link>
          <Link
            href="/sepet"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-4 h-4 text-slate-600" />
              <span>Sepetim</span>
            </div>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              {cart ? cart.length : 0}
            </span>
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
        {member ? (
          <button
            type="button"
            onClick={() => {
              clearStoredMember();
              setMobileMenuOpen(false);
              window.location.href = "/";
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-extrabold text-center hover:bg-red-100 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/giris-yap"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 bg-[#2b2623] text-white rounded-xl text-xs font-extrabold text-center shadow-xs"
            >
              Giriş Yap
            </Link>
            <Link
              href="/kayit-ol"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-extrabold text-center hover:bg-slate-100"
            >
              Kayıt Ol
            </Link>
          </div>
        )}
      </div>
    </div>
  </div>
)}
    </>
  );
}
