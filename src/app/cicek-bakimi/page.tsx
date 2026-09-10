"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useState, useEffect } from "react";
import { Flower2, Droplets, Sun, Scissors, HeartHandshake, Sparkles, CheckCircle2, Info } from "lucide-react";

export default function FlowerCarePage() {
  const [activeTab, setActiveTab] = useState<"buket" | "orkide" | "saksi">("buket");
  const [careData, setCareData] = useState<any>({
    badge: "🌸 Çiçekçe Canlı Çiçek Bakım Rehberi",
    title: "Çiçeklerinizin Ömrünü Uzatacak Altın İpuçları",
    subtitle: "Tebrikler! Sevdiklerinizden veya kendinize hediye aldığınız taze çiçeklerinizin haftalarca canlı ve taze kalması için ihtiyacınız olan bakım rehberi.",
    tips: {
      buket: [
        {
          id: "b1",
          title: "1. Açılı Sap Kesimi Yapın",
          desc: "Çiçeklerinizi vazoya yerleştirmeden önce sap uçlarını keskin bir bıçak veya makasla 45 derece açıyla 2 cm kadar kesin. Bu işlem çiçeklerin suyu emme yüzeyini maksimuma çıkarır.",
          icon: "Scissors",
          color: "amber"
        },
        {
          id: "b2",
          title: "2. Suyu 2 Günde Bir Yenileyin",
          desc: "Vazodaki suyu 2 günde bir taze soğuk su ile değiştirin. Suyu yenilerken vazo içini iyice yıkayın ve sap uçlarını tekrar 1 cm kadar çapraz kesin.",
          icon: "Droplets",
          color: "blue"
        },
        {
          id: "b3",
          title: "3. Doğrudan Güneşten Koruyun",
          desc: "Çiçeklerinizi doğrudan yakıcı güneş ışığı, klima esintisi veya kalorifer peteği yanına koymayın. Serin ve aydınlık ortamlar çiçeğin ömrünü iki katına çıkarır.",
          icon: "Sun",
          color: "yellow"
        },
        {
          id: "b4",
          title: "4. Alt Yaprakları Temizleyin",
          desc: "Vazo suyu seviyesinin altında kalan yaprakları temizleyin. Suda kalan yapraklar çürüyerek suda bakteri üremesine ve çiçeklerin erken solmasına sebep olur.",
          icon: "CheckCircle2",
          color: "emerald"
        }
      ],
      orkide: [
        {
          id: "o1",
          title: "Daldırma Usulü Sulama",
          desc: "Orkideleri haftada 1 kez saksısıyla birlikte oda sıcaklığındaki su dolu kaba 10-15 dakika daldırarak sulayın. Suyun süzülmesini bekleyip şeffaf saksısına koyun.",
          icon: "Droplets",
          color: "purple"
        },
        {
          id: "o2",
          title: "Şeffaf Saksı & Kök Işığı",
          desc: "Orkide kökleri fotosentez yapar. Bu nedenle orkidenin şeffaf iç saksısını çıkarmayın. Kökler yeşil ise su ihtiyacı yoktur, griye dönünce sulayın.",
          icon: "Sun",
          color: "amber"
        }
      ],
      saksi: [
        {
          id: "s1",
          title: "Toprak Nem Kontrolü",
          desc: "Saksı çiçeklerinizi sulamadan önce parmağınızı 2 cm toprağa batırarak kontrol edin. Toprak nemli ise sulamayı erteleyin, kuru ise bolca sulayın.",
          icon: "Droplets",
          color: "emerald"
        },
        {
          id: "s2",
          title: "Yaprak Tozunu Alın",
          desc: "Büyük yapraklı saksı bitkilerinin yapraklarını nemli bir bezle silerek tozunu alın. Bu işlem bitkinin daha rahat nefes almasını sağlar.",
          icon: "Sun",
          color: "yellow"
        }
      ]
    }
  });

  useEffect(() => {
    fetch("/api/cicek-bakimi")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.tips) setCareData(data);
      })
      .catch((e) => console.error("Flower care load error:", e));
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Scissors":
        return <Scissors className="w-6 h-6" />;
      case "Droplets":
        return <Droplets className="w-6 h-6" />;
      case "Sun":
        return <Sun className="w-6 h-6" />;
      case "Sparkles":
        return <Sparkles className="w-6 h-6" />;
      case "CheckCircle2":
        return <CheckCircle2 className="w-6 h-6" />;
      default:
        return <Info className="w-6 h-6" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "amber":
        return "bg-amber-50 text-amber-900";
      case "blue":
        return "bg-blue-50 text-blue-900";
      case "yellow":
        return "bg-yellow-50 text-yellow-900";
      case "purple":
        return "bg-purple-50 text-purple-900";
      case "emerald":
        return "bg-emerald-50 text-emerald-900";
      default:
        return "bg-slate-100 text-slate-900";
    }
  };

  const currentTips = careData?.tips?.[activeTab] || [];

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* BANNER */}
          <div className="bg-white rounded-3xl p-6 lg:p-10 border border-slate-200 shadow-sm text-center space-y-3">
            <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="inline-block text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
              {careData.badge || "🌸 Çiçekçe Canlı Çiçek Bakım Rehberi"}
            </span>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900">
              {careData.title || "Çiçeklerinizin Ömrünü Uzatacak Altın İpuçları"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              {careData.subtitle}
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

          {/* TIPS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
            {currentTips.map((tip: any, idx: number) => (
              <div key={tip.id || idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className={`w-12 h-12 rounded-2xl ${getColorClasses(tip.color)} flex items-center justify-center font-black`}>
                  {getIcon(tip.icon)}
                </div>
                <h3 className="text-lg font-black text-slate-900">{tip.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>

      <StoreFooter />
    </div>
  );
}
