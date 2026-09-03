"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface MenuItem {
  title: string;
  href?: string;
  icon?: string;
  badge?: string;
  subItems?: { title: string; href: string }[];
}

interface MenuGroup {
  header?: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    items: [
      {
        title: "Panel",
        href: "/yonetim",
        icon: "bx bx-home-smile",
      },
    ],
  },
  {
    header: "Sipariş Merkezi",
    items: [
      { title: "Siparişler", href: "/yonetim/siparisler", icon: "bx bx-cart" },
      { title: "Yarım Kalan Siparişler", href: "/yonetim/yarim-siparisler", icon: "bx bx-time-five" },
      { title: "Asistan Konuşmaları", href: "/yonetim/asistan-konusmalari", icon: "bx bx-bot" },
      { title: "Üyeler", href: "/yonetim/uyeler", icon: "bx bx-user" },
      { title: "WhatsApp Tıklamaları", href: "/yonetim/whatsapp-tiklamalari", icon: "bx bxl-whatsapp" },
      { title: "Raporlar", href: "/yonetim/rapor", icon: "bx bx-bar-chart-alt-2" },
    ],
  },
  {
    header: "Çiçek Kataloğu",
    items: [
      { title: "Ürünler", href: "/yonetim/urunler", icon: "bx bx-package" },
      { title: "Kategoriler", href: "/yonetim/kategoriler", icon: "bx bx-category" },
      { title: "Vitrin", href: "/yonetim/vitrin", icon: "bx bx-store" },
      { title: "Ek Ürünler", href: "/yonetim/ekstralar", icon: "bx bx-gift" },
      { title: "Toplu Fiyat Güncelle", href: "/yonetim/toplu-fiyat", icon: "bx bx-purchase-tag" },
      { title: "Kupon Yönetimi", href: "/yonetim/kuponlar", icon: "bx bx-purchase-tag-alt" },
      { title: "301 Yönlendirmeler", href: "/yonetim/yonlendirmeler", icon: "bx bx-git-repo-forked" },
      { title: "Çiçek Yorumları", href: "/yonetim/yorumlar", icon: "bx bx-star" },
      { title: "Google Yorumları", href: "/yonetim/yorumlar/google", icon: "bx bxl-google" },
      { title: "Döviz Kurları", href: "/yonetim/doviz", icon: "bx bx-dollar-circle" },
    ],
  },
  {
    header: "Teslimat & Kasa",
    items: [
      { title: "Teslimat Saatleri", href: "/yonetim/teslimat-saatleri", icon: "bx bx-time" },
      { title: "Teslimat Bölgeleri", href: "/yonetim/bolgeler", icon: "bx bx-map-pin" },
      { title: "Ödeme Yöntemleri", href: "/yonetim/odeme-yontemleri", icon: "bx bx-credit-card" },
      { title: "Manuel Ödemeler", href: "/yonetim/manuel-odemeler", icon: "bx bx-link" },
      { title: "Kart Notları", href: "/yonetim/kart-notlari", icon: "bx bx-message-square-detail" },
    ],
  },
  {
    header: "Vitrin & İçerik",
    items: [
      {
        title: "Anasayfa",
        icon: "bx bx-home-alt",
        subItems: [
          { title: "Hero Slider", href: "/yonetim/vitrin" },
          { title: "Promo Kutuları", href: "/yonetim/vitrin" },
          { title: "Header Bant", href: "/yonetim/header-bant" },
          { title: "SEO Ayarları", href: "/yonetim/icerik?scope=home_seo" },
          { title: "Sıkça Sorulan Sorular", href: "/yonetim/sss?scope=home" },
        ],
      },
      {
        title: "Menü & Footer",
        icon: "bx bx-menu",
        subItems: [
          { title: "Ana Menü", href: "/yonetim/menu" },
          { title: "Footer Linkleri", href: "/yonetim/footer" },
        ],
      },
      { title: "Sayfa Yönetimi", href: "/yonetim/sayfalar", icon: "bx bx-file" },
      { title: "Blog", href: "/yonetim/blog", icon: "bx bx-news" },
      { title: "Kurye Canlı Takip", href: "/yonetim/kuryeler", icon: "bx bx-map-pin" },
      { title: "Bölgesel Sayfalar", href: "/yonetim/bolgesel-sayfalar", icon: "bx bx-map-alt" },
      { title: "Ürün Teslimat & İade", href: "/yonetim/teslimat-iade", icon: "bx bx-package" },
    ],
  },
  {
    header: "İletişim Merkezi",
    items: [
      { title: "Toplu Mesaj", href: "/yonetim/toplu-mesaj", icon: "bx bx-broadcast" },
      { title: "WhatsApp Bağlantısı", href: "/yonetim/whatsapp", icon: "bx bxl-whatsapp" },
      { title: "WhatsApp Şablonları", href: "/yonetim/whatsapp/sablonlar", icon: "bx bx-message-square-dots" },
      { title: "Mail Şablonları", href: "/yonetim/eposta/sablonlar", icon: "bx bx-envelope" },
      {
        title: "E-posta (SMTP)",
        icon: "bx bx-server",
        subItems: [
          { title: "SMTP Ayarları", href: "/yonetim/eposta" },
          { title: "Gönderim Kayıtları", href: "/yonetim/eposta/kayitlar" },
        ],
      },
      { title: "Bildirim Ayarları", href: "/yonetim/bildirim-ayarlari", icon: "bx bx-bell" },
      
    ],
  },
  {
    header: "Dil & Para Birimi",
    items: [
      { title: "Diller & Çeviriler", href: "/yonetim/diller", icon: "bx bx-globe" },
    ],
  },
  {
    header: "Yönetim",
    items: [
      { title: "Genel Ayarlar", href: "/yonetim/ayarlar", icon: "bx bx-cog" },
      { title: "Harita API", href: "/yonetim/harita-api", icon: "bx bx-map-alt" },
      { title: "Önbellek", href: "/yonetim/onbellek", icon: "bx bx-rocket" },
      { title: "Cron Yönetimi", href: "/yonetim/cron", icon: "bx bx-time-five" },
      { title: "APİ Entegrasyonları", href: "/yonetim/apiler", icon: "bx bx-code-alt" },
      { title: "İşlem Logları", href: "/yonetim/loglar", icon: "bx bx-history" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    Anasayfa: true,
    "Menü & Footer": false,
    "E-posta (SMTP)": false,
  });

  const toggleDropdown = (title: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside id="layout-menu" className="layout-menu menu-vertical menu bg-menu-theme sticky top-0 h-screen flex flex-col shrink-0 shadow-sm border-r border-slate-200/80 z-20">
      <div className="app-brand demo shrink-0">
        <Link href="/yonetim" className="app-brand-link flex items-center gap-2">
          <img src="/logo.jpg" alt="Çiçekçe Logo" className="w-9 h-9 object-contain rounded-xl border border-amber-900/10 shadow-xs" />
          <span className="app-brand-text demo menu-text fw-bold ms-1 text-slate-900 font-serif tracking-wider text-xl">ÇİÇEKÇE</span>
        </Link>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-2 overflow-y-auto flex-1 custom-scrollbar">
        {menuGroups.map((group, gIdx) => (
          <div key={gIdx}>
            {group.header && (
              <li className="menu-header small text-uppercase my-1.5">
                <span className="menu-header-text text-[11px] text-slate-400 font-bold px-4">{group.header}</span>
              </li>
            )}
            {group.items.map((item, iIdx) => {
              if (item.subItems) {
                const isOpen = openDropdowns[item.title] || false;
                const isSubActive = item.subItems.some((s) => s.href === pathname);
                return (
                  <li key={iIdx} className={`menu-item ${isOpen || isSubActive ? "active open" : ""}`}>
                    <button
                      type="button"
                      onClick={() => toggleDropdown(item.title)}
                      className="menu-link menu-toggle w-full text-left bg-transparent border-0 flex items-center justify-between py-2"
                    >
                      <div className="flex items-center">
                        {item.icon && <i className={`menu-icon tf-icons ${item.icon}`}></i>}
                        <div className="text-xs font-semibold">{item.title}</div>
                      </div>
                    </button>
                    {isOpen && (
                      <ul className="menu-sub pl-6">
                        {item.subItems.map((sub, sIdx) => {
                          const active = pathname === sub.href;
                          return (
                            <li key={sIdx} className={`menu-item ${active ? "active" : ""}`}>
                              <Link href={sub.href} className="menu-link py-1.5">
                                <div className="text-xs">{sub.title}</div>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const isActive = pathname === item.href;
              return (
                <li key={iIdx} className={`menu-item ${isActive ? "active" : ""}`}>
                  <Link href={item.href || "#"} className="menu-link py-2">
                    {item.icon && <i className={`menu-icon tf-icons ${item.icon}`}></i>}
                    <div className="text-xs font-semibold">{item.title}</div>
                  </Link>
                </li>
              );
            })}
          </div>
        ))}
      </ul>

      {/* SIDEBAR BOTTOM ADMIN FOOTER */}
      <div className="p-3 border-t bg-slate-50/80 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sistem Çevrimiçi</span>
          </span>
          <span className="text-slate-400 font-mono">v2.4</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white border text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs text-center"
          >
            <span>🏪 Mağaza</span>
          </a>
          <button
            type="button"
            onClick={async () => {
              try {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/yonetim/giris";
              } catch (e) {
                window.location.href = "/yonetim/giris";
              }
            }}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition shadow-2xs text-center"
          >
            <span>🚪 Çıkış</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
