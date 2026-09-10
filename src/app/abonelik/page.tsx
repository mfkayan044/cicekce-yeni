"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useState, useEffect } from "react";
import { Flower2, Check, Sparkles, Calendar, ShieldCheck, HeartHandshake, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SubscriptionPage() {
  const [subData, setSubData] = useState<any>({
    badge: "🌿 Çiçekçe Taze Çiçek Aboneliği",
    title: "Evinize & Ofisinize Her Hafta Taze Çiçek Dokunuşu",
    subtitle: "Her hafta veya her ay kapınıza gelen taze, mevsimlik özel tasarım çiçeklerle yaşam alanlarınızı renklendirin.",
    packages: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/abonelik")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.packages) setSubData(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <main className="max-w-6xl mx-auto px-4 py-10 space-y-12">
          {/* BANNER */}
          <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm text-center space-y-4 relative overflow-hidden">
            <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="inline-block text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
              {subData.badge || "🌿 Çiçekçe Taze Çiçek Aboneliği"}
            </span>
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight max-w-3xl mx-auto">
              {subData.title || "Evinize & Ofisinize Her Hafta Taze Çiçek Dokunuşu"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {subData.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <Flower2 className="w-4 h-4 text-amber-500" />
                <span>%100 Taze Çiçek Garantisi</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>Esnek Teslimat Günü</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>Taahhütsüz & Kolay İptal</span>
              </div>
            </div>
          </div>

          {/* PACKAGES GRID */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-900">Abonelik Paketleri</h2>
              <p className="text-xs text-slate-500">İhtiyacınıza en uygun paketi seçin, çiçeğiniz otomatik gelsin</p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-extrabold text-slate-400">Yükleniyor...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {(subData.packages || []).map((pkg: any) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6 relative hover:shadow-md transition"
                  >
                    {pkg.badge && (
                      <span
                        style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                        className="absolute -top-3 right-6 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
                      >
                        {pkg.badge}
                      </span>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-900">{pkg.name}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{pkg.desc}</p>
                      </div>

                      <div className="flex items-baseline gap-1 py-2 border-y border-slate-100">
                        <span className="text-3xl font-black text-slate-900">{pkg.price}</span>
                        <span className="text-xs font-extrabold text-slate-400">/ {pkg.period}</span>
                      </div>

                      <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                        {(pkg.features || []).map((feat: string, fIdx: number) => (
                          <li key={fIdx} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <a
                      href="https://wa.me/905321112233?text=Merhaba,%20Çiçekçe%20Abonelik%20paketleri%20hakkında%20bilgi%20almak%20istiyorum."
                      target="_blank"
                      rel="noreferrer"
                      style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                      className="w-full py-3.5 rounded-2xl text-xs font-black text-center hover:opacity-95 transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <span>Abonelik Başlat</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <StoreFooter />
    </div>
  );
}
