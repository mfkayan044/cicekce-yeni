"use client";

import { useEffect, useState } from "react";

import { getInitialDbData } from "@/lib/server-settings";

const _reviewsDb = getInitialDbData();
const _initialGoogleReviews = Array.isArray(_reviewsDb.reviews)
  ? _reviewsDb.reviews.filter((r: any) => r.isGoogle || r.source === "Google Maps")
  : [];

export default function GoogleReviewsSection() {
  const [reviews, setReviews] = useState<any[]>(_initialGoogleReviews);

  const fetchGoogleReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        const googleOnly = data.filter((r: any) => r.isGoogle || r.source === "Google Maps");
        setReviews(googleOnly);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchGoogleReviews();
  }, []);

  // DO NOT RENDER ANYTHING IF THERE ARE NO REAL REVIEWS ADDED YET
  if (reviews.length === 0) {
    return (
      <section className="my-14 bg-slate-900 rounded-3xl p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            G
          </div>
          <div>
            <h3 className="text-xl font-black text-white m-0">Çiçekce - Google Haritalar Profili</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Google Haritalar üzerindeki dükkan profilimiz ve müşteri değerlendirmelerimiz.
            </p>
          </div>
        </div>

        <a
          href="https://share.google/ktlM8FeGrjNtk5PdT"
          target="_blank"
          rel="noopener noreferrer"
          style={{ backgroundColor: "#ffffff", color: "#1e293b" }}
          className="font-black text-xs px-5 py-3 rounded-2xl shadow-md hover:bg-slate-100 transition shrink-0 border border-slate-200"
        >
          <span>📍 Çiçekce Google Haritalar Profilini İncele ↗</span>
        </a>
      </section>
    );
  }

  return (
    <section className="my-14 bg-slate-900 rounded-3xl p-8 lg:p-12 text-white shadow-xl relative overflow-hidden border border-slate-800">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-blue-600 font-black text-3xl flex items-center justify-center shadow-md shrink-0">
              G
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-2xl font-black text-white m-0">Çiçekce - Google Haritalar Müşteri Yorumları</h3>
                <span className="bg-[#2b2623] text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  ✓ Doğrulanmış İşletme
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Google Haritalar <b>"Çiçekce"</b> profilimizdeki gerçek müşterilerimizin canlı değerlendirmeleri.
              </p>
            </div>
          </div>

          <a
            href="https://share.google/ktlM8FeGrjNtk5PdT"
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: "#ffffff", color: "#1e293b" }}
            className="font-black text-xs px-5 py-3 rounded-2xl shadow-md hover:bg-slate-100 transition shrink-0 flex items-center gap-2 border border-slate-200"
          >
            <span>📍 Çiçekce Google Profilini Gör (4.9 ★★★★★)</span>
          </a>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((r, idx) => {
            const initials = (r.author || "Google Müşterisi").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div
                key={r.id || idx}
                className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-600 transition shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {initials || "G"}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{r.author}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{r.date}</div>
                      </div>
                    </div>
                    <div className="text-amber-400 text-xs font-bold">{"⭐".repeat(r.rating || 5)}</div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-normal italic">"{r.text}"</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Çiçekce Google Müşterisi</span>
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                    <span>✓</span> <span>Google Harita Doğrulanmış</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
