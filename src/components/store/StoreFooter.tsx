"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { getInitialDbData } from "@/lib/server-settings";

const _footerDb = getInitialDbData();

export default function StoreFooter() {
  const [footerData, setFooterData] = useState<any>(_footerDb.footer || null);

  useEffect(() => {
    fetch("/api/footer")
      .then((res) => res.json())
      .then((data) => setFooterData(data))
      .catch(() => {});
  }, []);

  const corporateLinks = footerData?.corporateLinks || [
    { title: "Hakkımızda", url: "/hakkimizda" },
    { title: "Aydınlatma Metni ve Gizlilik Politikası", url: "/aydinlatma-metni-ve-gizlilik-politikasi" },
    { title: "Kişisel Verilerin Korunması", url: "/kisisel-verilerin-korunmasi" },
    { title: "Çerez Politikası", url: "/cerez-politikasi" },
    { title: "Ön Bilgilendirme Formu", url: "/on-bilgilendirme-formu" },
    { title: "İptal ve İade", url: "/iptal-ve-iade" },
    { title: "İletişim", url: "/iletisim" },
    { title: "Çiçek Rehberi & Blog", url: "/blog" },
    { title: "Sitemap", url: "/sitemap.xml" },
  ];

  const serviceDistricts = footerData?.serviceDistricts || [
    { title: "Konyaaltı Çiçekçi", url: "/konyaalti-cicekci" },
    { title: "Muratpaşa Çiçekçi", url: "/muratpasa-cicekci" },
    { title: "Aksu Çiçekçi", url: "/aksu-cicekci" },
    { title: "Kepez Çiçekçi", url: "/kepez-cicekci" },
    { title: "Döşemealtı Çiçekçi", url: "/dosemealti-cicekci" },
    { title: "Kemer Çiçekçi", url: "/kemer-cicekci" },
    { title: "Manavgat Çiçekçi", url: "/manavgat-cicekci" },
    { title: "Alanya Çiçekçi", url: "/alanya-cicekci" },
  ];

  const halfCorp = Math.ceil(corporateLinks.length / 2);
  const corp1 = corporateLinks.slice(0, halfCorp);
  const corp2 = corporateLinks.slice(halfCorp);

  const thirdDist = Math.ceil(serviceDistricts.length / 3);
  const dist1 = serviceDistricts.slice(0, thirdDist);
  const dist2 = serviceDistricts.slice(thirdDist, thirdDist * 2);
  const dist3 = serviceDistricts.slice(thirdDist * 2);

  return (
    <footer className="bg-white border-t border-slate-200 mt-16 pt-12 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Kurumsal 1 */}
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm mb-4">Kurumsal</h4>
            <ul className="space-y-2.5 text-xs text-slate-500">
              {corp1.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:text-[#2b2623] transition">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Müşteri Hizmetleri */}
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm mb-4">Müşteri Hizmetleri</h4>
            <ul className="space-y-2.5 text-xs text-slate-500">
              {corp2.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:text-[#2b2623] transition">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hizmet Bölgeleri 1 */}
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm mb-4">Hizmet Bölgeleri</h4>
            <ul className="space-y-2.5 text-xs text-slate-500">
              {dist1.map((dist: any, idx: number) => (
                <li key={idx}>
                  <Link href={dist.url} className="hover:text-[#2b2623] transition">
                    {dist.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hizmet Bölgeleri 2 */}
          {dist2.length > 0 && (
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-4">Hizmet Bölgeleri</h4>
              <ul className="space-y-2.5 text-xs text-slate-500">
                {dist2.map((dist: any, idx: number) => (
                  <li key={idx}>
                    <Link href={dist.url} className="hover:text-[#2b2623] transition">
                      {dist.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hizmet Bölgeleri 3 */}
          {dist3.length > 0 && (
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-4">Hizmet Bölgeleri</h4>
              <ul className="space-y-2.5 text-xs text-slate-500">
                {dist3.map((dist: any, idx: number) => (
                  <li key={idx}>
                    <Link href={dist.url} className="hover:text-[#2b2623] transition">
                      {dist.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Contact Info Row */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            <div className="font-extrabold text-slate-900 text-sm mb-1 flex items-center gap-2"><img src="/logo.jpg" alt="Çiçekçe Logo" className="w-8 h-8 rounded-full border border-amber-900/10 shadow-xs" /> <span>Çiçekçe (www.cicekce.com)</span></div>
            <div>{footerData?.address || "Demo Mahallesi, Demo Caddesi No: 1, Muratpaşa, Antalya 07000"}</div>
            <div>{footerData?.workingHours || "Her gün 09:00 - 21:00"}</div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`tel:${footerData?.phone || "+90 555 000 00 00"}`}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-[#2b2623] transition"
            >
              📞 {footerData?.phone || "+90 555 000 00 00"}
            </a>
            <a
              href={`https://wa.me/${footerData?.whatsapp || "905550000000"}`}
              style={{ backgroundColor: "#25D366", color: "#ffffff" }}
              className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-[11px] text-slate-400 border-t border-slate-100 pt-4">
          © 2026 Çiçekçe (www.cicekce.com). Tüm Hakları Saklıdır.
        </div>
      </div>
    </footer>
  );
}
