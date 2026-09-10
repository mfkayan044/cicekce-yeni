"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useState } from "react";
import { Flower2, Droplets, Sun, Scissors, HeartHandshake, Sparkles, CheckCircle2 } from "lucide-react";

export default function FlowerCarePage() {
  const [activeTab, setActiveTab] = useState<"buket" | "orkide" | "saksi">("buket");

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* BANNER */}
          <div className="bg-white rounded-3xl p-6 lg:p-10 border border-slate-200 shadow-sm text-center space-y-3">
            <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="inline-block text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
              🌸 Çiçekçe Canlı Çiçek Bakım Rehberi
            </span>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900">
              Çiçeklerinizin Ömrünü Uzatacak Altın İpuçları
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Tebrikler! Sevdiklerinizden veya kendinize hediye aldığınız taze çiçeklerinizin haftalarca canlı ve taze kalması için ihtiyacınız olan bakım rehberi.
            </p>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setActiveTab("buket")}
              className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "buket"
                  ? "bg-[#2b2623] text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Flower2 className="w-4 h-4 text-amber-400" />
              <span>Vazo & Buket Çiçekleri</span>
            </button>

            <button
              onClick={() => setActiveTab("orkide")}
              className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "orkide"
                  ? "bg-[#2b2623] text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Orkide Bakımı</span>
            </button>

            <button
              onClick={() => setActiveTab("saksi")}
              className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "saksi"
                  ? "bg-[#2b2623] text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>Saksı & Ev Bitkileri</span>
            </button>
          </div>

          {/* TAB 1: VAZO & BUKET ÇİÇEKLERİ */}
          {activeTab === "buket" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
                  <Scissors className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">1. Açılı Sap Kesimi Yapın</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Çiçeklerinizi vazoya yerleştirmeden önce sap uçlarını keskin bir bıçak veya makasla 45 derece açıyla 2 cm kadar kesin. Bu işlem çiçeklerin suyu emme yüzeyini maksimuma çıkarır.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-black">
                  <Droplets className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">2. Suyu 2 Günde Bir Yenileyin</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Vazodaki suyu 2 günde bir taze soğuk su ile değiştirin. Suyu yenilerken vazo içini iyice yıkayın ve sap uçlarını tekrar 1 cm kadar çapraz kesin.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-900 flex items-center justify-center font-black">
                  <Sun className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">3. Doğrudan Güneşten Koruyun</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Çiçeklerinizi doğrudan yakıcı güneş ışığı, klima esintisi veya kalorifer peteği yanına koymayın. Serin ve aydınlık ortamlar çiçeğin ömrünü iki katına çıkarır.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-black">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">4. Alt Yaprakları Temizleyin</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Vazo suyu seviyesinin altında kalan yaprakları temizleyin. Suda kalan yapraklar çürüyerek suda bakteri üremesine ve çiçeklerin erken solmasına sebep olur.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ORKİDE BAKIMI */}
          {activeTab === "orkide" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-900 flex items-center justify-center font-black">
                  <Droplets className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Daldırma Usulü Sulama</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Orkideleri haftada 1 kez saksısıyla birlikte oda sıcaklığındaki su dolu kaba 10-15 dakika daldırarak sulayın. Suyun süzülmesini bekleyip şeffaf saksısına koyun.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
                  <Sun className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Şeffaf Saksı & Kök Işığı</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Orkide kökleri fotosentez yapar. Bu nedenle orkidenin şeffaf iç saksısını çıkarmayın. Kökler yeşil ise su ihtiyacı yoktur, griye dönünce sulayın.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SAKSI BİTKİLERİ */}
          {activeTab === "saksi" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-black">
                  <Droplets className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Toprak Nem Kontrolü</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Saksı çiçeklerinizi sulamadan önce parmağınızı 2 cm toprağa batırarak kontrol edin. Toprak nemli ise sulamayı erteleyin, kuru ise bolca sulayın.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-yellow-50 text-yellow-900 flex items-center justify-center font-black">
                  <Sun className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Yaprak Tozunu Alın</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Büyük yapraklı saksı bitkilerinin yapraklarını nemli bir bezle silerek tozunu alın. Bu işlem bitkinin daha rahat nefes almasını sağlar.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <StoreFooter />
    </div>
  );
}
