"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EkstraDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tr" | "en" | "de" | "ru">("tr");

  const [order, setOrder] = useState(1);
  const [active, setActive] = useState(true);
  const [image, setImage] = useState("https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp");
  const [price, setPrice] = useState("1000");

  const [names, setNames] = useState({
    tr: "Kutu Çikolata",
    en: "Boxed Chocolate",
    de: "Schokoladenbox",
    ru: "Коробка шоколада"
  });

  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await fetch("/api/extras");
        if (res.ok) {
          const list = await res.json();
          const found = list.find((item: any) => String(item.id) === String(id));
          if (found) {
            setOrder(found.order || 1);
            setActive(found.active !== undefined ? found.active : true);
            setImage(found.image || image);
            setPrice(found.price || "1000");
            setNames(found.names || { tr: found.name || "Kutu Çikolata", en: "", de: "", ru: "" });
          }
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch("/api/extras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          order: Number(order),
          active,
          image,
          price,
          names,
        }),
      });

      setToastMsg("Ek ürün başarıyla kaydedildi!");
      setTimeout(() => {
        router.push("/yonetim/ekstralar");
      }, 1000);
    } catch (e) {
      alert("Kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-500">Ek ürün bilgileri yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Bar matching target screenshot */}
        <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
          <h3 className="font-extrabold text-2xl text-slate-900 m-0">Ek Ürün Düzenle</h3>
          <Link
            href="/yonetim/ekstralar"
            className="btn btn-light btn-sm font-bold rounded-lg border text-slate-600 px-4 py-1.5 flex items-center gap-1"
          >
            <span>← Geri</span>
          </Link>
        </div>

        {toastMsg && (
          <div className="p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Main Card Form matching target screenshot EXACTLY */}
        <div className="card border-0 shadow-sm rounded-2xl p-6 lg:p-8 bg-white space-y-6">
          {/* Top Form Controls: Görsel, Sıra, Durum */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Görsel Upload Field */}
            <div className="md:col-span-6 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Görsel</label>
              <div className="flex items-center gap-3">
                <img
                  src={image}
                  alt="Önizleme"
                  className="w-16 h-16 rounded-xl object-cover border bg-slate-50 shrink-0 shadow-xs"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <label
                      style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                      className="cursor-pointer font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs hover:opacity-95 transition shrink-0"
                    >
                      <span>Dosya Seç</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <span className="text-xs text-slate-500 px-3 truncate">Dosya seçilmedi</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    JPG, PNG, WEBP veya SVG. Kare (1:1) görsel önerilir.
                  </div>
                </div>
              </div>
            </div>

            {/* Sıra Input */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Sıra</label>
              <input
                type="number"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623] font-semibold"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>

            {/* Durum Toggle Switch */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Durum</label>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`w-12 h-6 rounded-full transition relative p-1 ${
                    active ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition transform ${
                      active ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-sm font-extrabold text-slate-800">{active ? "Aktif" : "Pasif"}</span>
              </div>
            </div>
          </div>

          {/* Multi-language Tabs matching target screenshot: Türkçe, İngilizce, Almanca, Rusça */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-6 border-b border-slate-200 pb-3 mb-6">
              {[
                { key: "tr", label: "Türkçe" },
                { key: "en", label: "İngilizce" },
                { key: "de", label: "Almanca" },
                { key: "ru", label: "Rusça" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as any)}
                  className={`text-sm font-extrabold pb-3 transition relative ${
                    activeTab === t.key ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <span>{t.label}</span>
                  {activeTab === t.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Language Content Form Fields */}
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ad *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 font-semibold"
                  value={names[activeTab] || ""}
                  onChange={(e) => setNames({ ...names, [activeTab]: e.target.value })}
                  placeholder="Ek ürün ismi..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fiyat *</label>
                <div className="relative w-48">
                  <input
                    type="text"
                    className="w-full p-3 pr-8 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 font-bold"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <span className="absolute right-3 top-3 text-slate-500 font-bold text-sm">₺</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  Taban (TL) fiyat. Diğer diller boş bırakılırsa bu fiyattan kura göre otomatik çevrilir.
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Kaydet matching target screenshot */}
          <div className="pt-4 border-t">
            <button
              type="button"
              onClick={handleSave}
              style={{ backgroundColor: "#5b5bd6", color: "#ffffff" }}
              className="px-6 py-2.5 rounded-xl font-extrabold text-sm shadow-md hover:opacity-95 transition flex items-center gap-2"
            >
              <span>💾 Kaydet</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
