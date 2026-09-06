"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { getStoredMember, clearStoredMember, MemberUser } from "@/lib/member-auth";
import { useStore } from "@/lib/store";

import { getInitialDbData } from "@/lib/server-settings";

const _hdrDb = getInitialDbData();

export default function StoreHeader({ onOpenAssistant }: { onOpenAssistant?: () => void }) {
  const { cart, favorites } = useStore();
  const [topbarData, setTopbarData] = useState<any>(_hdrDb.headerBant || null);
  const [dismissed, setDismissed] = useState(false);
  const [liveMenus, setLiveMenus] = useState<any[]>(_hdrDb.headerMenus ? _hdrDb.headerMenus.filter((m: any) => m.active !== false) : []);
  const [genSettings, setGenSettings] = useState<any>(_hdrDb.generalSettings || { logoMode: "text", logoUrl: "/logo.jpg" });
  const [member, setMember] = useState<MemberUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
            <span>{topbarData?.text || "🌸 Aynı Gün Adrese Teslimat! 1.500 ₺ Üzeri Ücretsiz Kargo | 💬 WhatsApp ile Hızlı Sipariş"}</span>
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
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-75 hover:opacity-100 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      <header className="border-b sticky top-0 z-40 bg-white lg:static" style={{ "borderBottomColor": "rgba(203,213,225,.6)" }}>
<div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4 flex items-center gap-2 lg:gap-6">
<a href="/" className="shrink-0" aria-label="Anasayfa">
<span className="h-10 lg:h-[54px] inline-flex items-center gap-3" role="img" aria-label="Çiçekçe">
  {genSettings?.logoMode === "image" && genSettings?.logoUrl ? (
    <img
      src={genSettings.logoUrl}
      alt="Çiçekçe Logo"
      className="h-10 lg:h-12 w-auto object-contain rounded-xl shadow-xs"
      onError={(e) => {
        // Fallback to text logo if image fails to load
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
<div className="flex items-center gap-1.5 lg:gap-2 ml-auto">
<button id="searchOpen" type="button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Ara" className="lg:hidden shrink-0 flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-[#2b2623] text-slate-700 rounded-lg transition">
<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
</button>
<button type="button" className="aio-open aio-hdr-btn hidden lg:flex shrink-0 items-center gap-2" aria-label="Sipariş Asistanı" onClick={onOpenAssistant}>
<svg className="aio-ico" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-5a9 9 0 0 1 18 0v5a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
<path d="M21 16v2a4 4 0 0 1-4 4h-5" />
</svg>
<span className="whitespace-nowrap">Sipariş Asistanı</span>
</button>
<Link href="/siparis-takip" className="hidden lg:flex shrink-0 items-center gap-2 border border-slate-200 hover:border-[#2b2623] hover:text-[#2b2623] text-slate-700 font-semibold text-sm rounded-lg px-4 py-2.5 transition">
<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width={15} height={13} rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2" /><circle cx="18.5" cy="18.5" r="2" /></svg>
<span className="whitespace-nowrap">Sipariş Takip</span>
</Link>
{member ? (
  <div id="userMenuWrap" className="relative hidden lg:block shrink-0">
    <button
      type="button"
      onClick={() => setUserMenuOpen(!userMenuOpen)}
      className="flex items-center gap-1.5 border border-slate-200 hover:border-[#2b2623] text-slate-800 font-extrabold text-xs rounded-xl px-3.5 py-2.5 transition bg-slate-50 shadow-2xs"
    >
      <span>👤 {member.name.split(" ")[0]}</span>
      <span className="text-[9px] text-slate-400">▼</span>
    </button>
    {userMenuOpen && (
      <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in space-y-1">
        <div className="px-3.5 py-1.5 border-b text-[11px] font-bold text-slate-400 truncate">
          {member.email}
        </div>
        <Link
          href="/hesabim"
          onClick={() => setUserMenuOpen(false)}
          className="block px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          🌸 Hesabım & Profilim
        </Link>
        <Link
          href="/hesabim"
          onClick={() => setUserMenuOpen(false)}
          className="block px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900"
        >
          📦 Siparişlerim
        </Link>
        <button
          type="button"
          onClick={() => {
            clearStoredMember();
            setUserMenuOpen(false);
            window.location.href = "/";
          }}
          className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
        >
          🚪 Çıkış Yap
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
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
      <span className="whitespace-nowrap">Üye Girişi</span>
    </Link>
  </div>
)}
<Link href="/favoriler" id="favBtn" aria-label="Favoriler" className="shrink-0 relative flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-brand text-slate-700 hover:text-red-500 rounded-lg transition">
<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
<span className="fav-count absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
  {favorites ? favorites.length : 0}
</span>
</Link>
<Link href="/sepet" id="cartBtn" aria-label="Sepet" className="shrink-0 relative flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-brand text-slate-700 hover:text-brand rounded-lg transition">
<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
<span className="cart-count absolute -top-1.5 -right-1.5 bg-brand text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
  {cart ? cart.length : 0}
</span>
</Link>
<button id="menuOpen" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Menü" className="lg:hidden shrink-0 flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-[#2b2623] text-slate-800 rounded-lg transition active:scale-95 bg-slate-50">
<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
</button>
</div>
</div>

{searchOpen && (
  <div className="lg:hidden px-4 pb-3 pt-1 border-t border-slate-100 animate-in slide-in-from-top duration-200">
    <form onSubmit={(e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        window.location.href = `/kategori/all?q=${encodeURIComponent(searchQuery.trim())}`;
      }
    }} className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Çiçek, buket veya ürün ara..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full py-2 px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
        autoFocus
      />
      <button type="submit" className="py-2 px-4 bg-[#2b2623] text-white font-extrabold text-xs rounded-xl shadow-xs shrink-0">
        Ara
      </button>
    </form>
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
            <span>📦</span>
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
            <span>🎧</span>
            <span>Sipariş Asistanı</span>
          </button>
          <Link
            href="/favoriler"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100"
          >
            <div className="flex items-center gap-2.5">
              <span>❤️</span>
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
              <span>🛒</span>
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
            className="w-full py-2 px-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-extrabold text-center hover:bg-red-100 transition"
          >
            🚪 Çıkış Yap
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
