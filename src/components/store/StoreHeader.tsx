"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { getStoredMember, clearStoredMember, MemberUser } from "@/lib/member-auth";

import { getInitialDbData } from "@/lib/server-settings";

const _hdrDb = getInitialDbData();

export default function StoreHeader({ onOpenAssistant }: { onOpenAssistant?: () => void }) {
  const [topbarData, setTopbarData] = useState<any>(_hdrDb.headerBant || null);
  const [dismissed, setDismissed] = useState(false);
  const [liveMenus, setLiveMenus] = useState<any[]>(_hdrDb.headerMenus ? _hdrDb.headerMenus.filter((m: any) => m.active !== false) : []);
  const [genSettings, setGenSettings] = useState<any>(_hdrDb.generalSettings || { logoMode: "text", logoUrl: "/logo.jpg" });
  const [member, setMember] = useState<MemberUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
<button id="searchOpen" aria-label="Ara" className="lg:hidden shrink-0 flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-brand text-slate-700 rounded-lg transition">
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
<button id="favBtn" aria-label="Favoriler" className="shrink-0 relative flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-brand text-slate-700 hover:text-red-500 rounded-lg transition">
<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
<span className="fav-count absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">0</span>
</button>
<Link href="/sepet" id="cartBtn" aria-label="Sepet" className="shrink-0 relative flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-brand text-slate-700 hover:text-brand rounded-lg transition">
<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
<span className="cart-count absolute -top-1.5 -right-1.5 bg-brand text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">0</span>
</Link>
<button id="menuOpen" aria-label="Menü" className="lg:hidden shrink-0 flex items-center justify-center w-8 h-8 lg:w-11 lg:h-11 border border-slate-200 hover:border-brand text-slate-700 rounded-lg transition">
<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
</button>
</div>
</div>
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
    </>
  );
}
