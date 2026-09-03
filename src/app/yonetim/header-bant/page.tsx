"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function HeaderBantPage() {
  const [enabled, setEnabled] = useState(true);
  const [text, setText] = useState("🌸 Aynı Gün Adrese Teslimat! 1.500 ₺ Üzeri Ücretsiz Kargo | 💬 WhatsApp ile Hızlı Sipariş");
  const [promoEnabled, setPromoEnabled] = useState(true);
  const [amount, setAmount] = useState("100");
  const [code, setCode] = useState("HOSGELDIN100");
  const [bgColor, setBgColor] = useState("#2b2623");
  const [textColor, setTextColor] = useState("#ffffff");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchBantSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/header-bant");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setEnabled(data.enabled !== false);
          setText(data.text || "🌸 Aynı Gün Adrese Teslimat! 1.500 ₺ Üzeri Ücretsiz Kargo | 💬 WhatsApp ile Hızlı Sipariş");
          setPromoEnabled(data.promoEnabled !== false);
          setAmount(data.amount || "100");
          setCode(data.code || "HOSGELDIN100");
          setBgColor(data.bgColor || "#2b2623");
          setTextColor(data.textColor || "#ffffff");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBantSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        enabled,
        text,
        promoEnabled,
        amount,
        code,
        bgColor,
        textColor
      };

      const res = await fetch("/api/header-bant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToastMsg("Header duyuru bandı ayarları Supabase veritabanına başarıyla kaydedildi!");
        setTimeout(() => setToastMsg(""), 3500);
      } else {
        alert("Kaydetme sırasında bir hata oluştu.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
            <span className="text-slate-400 fw-light">Site Tasarımı /</span> Header Üst Duyuru Bandı (Supabase Canlı)
          </h4>
          <p className="text-slate-500 text-sm">
            Web sitesinin en üstünde yer alan duyuru, indirim kuponu ve kampanya bandını yönetin. Buradan yapılan tüm değişiklikler mağaza başlığına anında yansır.
          </p>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm rounded-xl font-bold flex items-center gap-2 shadow-xs">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Live Preview Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Canlı Önizleme (Mağazada Gözükecek Şekil)</label>
          {enabled ? (
            <div
              style={{ backgroundColor: bgColor, color: textColor }}
              className="py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-between shadow-xs transition"
            >
              <div className="flex items-center gap-2 truncate">
                <span>{text}</span>
                {promoEnabled && (
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-bold">
                    Kupon: {code} ({amount} ₺ İndirim)
                  </span>
                )}
              </div>
              <span className="text-[10px] opacity-75">✕ Kapat</span>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 text-slate-400 text-xs rounded-xl font-bold text-center border border-dashed">
              🚫 Duyuru bandı şu an pasif durumda (Mağazada gizlenmiş).
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border">Ayarlar yükleniyor...</div>
        ) : (
          <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h5 className="font-extrabold text-slate-800 text-base m-0">Üst Duyuru Bandını Göster / Aktif Et</h5>
                <p className="text-xs text-slate-500 m-0">Sitenin en üstündeki şerit duyuruyu açar veya kapatır.</p>
              </div>
              <input
                type="checkbox"
                className="form-check-input w-6 h-6 cursor-pointer"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Duyuru & Kampanya Metni *</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Örn: 🌸 Aynı Gün Adrese Teslimat! 1.500 ₺ Üzeri Ücretsiz Kargo"
                required
              />
            </div>

            <div className="flex items-center justify-between border-b border-t pt-4 pb-4">
              <div>
                <h5 className="font-extrabold text-slate-800 text-base m-0">Promosyon Kodu Rozetini Göster</h5>
                <p className="text-xs text-slate-500 m-0">Duyuru metninin yanında kupon kodu rozeti görüntüler.</p>
              </div>
              <input
                type="checkbox"
                className="form-check-input w-6 h-6 cursor-pointer"
                checked={promoEnabled}
                onChange={(e) => setPromoEnabled(e.target.checked)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">İndirim Miktarı (₺)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Promosyon Kupon Kodu</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm uppercase font-extrabold text-[#2b2623]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="HOSGELDIN100"
                />
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="border-t pt-4 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Duyuru Bandı Arka Plan Rengi</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: "Koyu Kömür", bg: "#2b2623", text: "#ffffff" },
                  { name: "Sıcak Şampanya", bg: "#F5EFE6", text: "#2b2623" },
                  { name: "Pudra Rose", bg: "#c88a85", text: "#ffffff" },
                  { name: "Botanik Yeşil", bg: "#2d4a22", text: "#ffffff" },
                  { name: "Gece Mavisi", bg: "#0f172a", text: "#ffffff" },
                ].map((color) => (
                  <button
                    key={color.bg}
                    type="button"
                    onClick={() => {
                      setBgColor(color.bg);
                      setTextColor(color.text);
                    }}
                    style={{ backgroundColor: color.bg, color: color.text }}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition shadow-xs ${
                      bgColor === color.bg ? "ring-2 ring-slate-900 ring-offset-2 scale-105" : "border-slate-200 opacity-90"
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-8 py-3 rounded-xl text-xs font-extrabold shadow-md hover:opacity-95 transition"
              >
                {saving ? "Kaydediliyor..." : "Ayarları Supabase'e Kaydet"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
