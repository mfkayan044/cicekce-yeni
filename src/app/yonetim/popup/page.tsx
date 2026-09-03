"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function PopupYonetimiPage() {
  const [enabled, setEnabled] = useState(true);
  const [title, setTitle] = useState("İlk Siparişinize Özel 150 ₺ İndirim! 🎉");
  const [description, setDescription] = useState("İlk siparişinize özel 150 ₺ indirim kodu sizleri bekliyor. Hediye10 koduyla siparişinizi hemen oluşturabilirsiniz.");
  const [couponCode, setCouponCode] = useState("Hediye10");
  const [badgeText, setBadgeText] = useState("BİLGİLENDİRME");
  const [buttonText, setButtonText] = useState("Kodu Kopyala & Alışverişe Başla 🛍️");
  const [icon, setIcon] = useState("🎁");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetchPopupSettings();
  }, []);

  const fetchPopupSettings = async () => {
    try {
      const res = await fetch("/api/settings/popup");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.enabled === "boolean") setEnabled(data.enabled);
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.couponCode) setCouponCode(data.couponCode);
        if (data.badgeText) setBadgeText(data.badgeText);
        if (data.buttonText) setButtonText(data.buttonText);
        if (data.icon) setIcon(data.icon);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/popup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          title,
          description,
          couponCode,
          badgeText,
          buttonText,
          icon
        }),
      });

      if (res.ok) {
        setToastMsg("✅ Karşılama Popup / Kampanya Modal ayarları Supabase veritabanına kaydedildi!");
        setTimeout(() => setToastMsg(""), 4000);
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-5 text-center font-bold text-slate-600">Popup ayarları yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">🎁 MÜŞTERİ KARŞILAMA POPUP</div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Karşılama & İndirim Modal Yönetimi</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Siteye ilk kez giren ziyaretçilerin karşısına çıkan indirim ve duyuru modal penceresi ayarları.
            </p>
          </div>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl text-sm font-extrabold shadow-xs">
            {toastMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (8 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-black text-slate-900 text-base m-0">Popup Durumu (Modal Active)</h5>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="form-check-input w-6 h-6 cursor-pointer"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                  />
                  <span className={`text-xs font-extrabold ${enabled ? "text-emerald-700" : "text-slate-400"}`}>
                    {enabled ? "🟢 Popup Aktif (Ziyaretçilere Gösteriliyor)" : "⚪ Pasif (Gizlendi)"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Modal Üst Etiket (Badge Text)</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                    placeholder="BİLGİLENDİRME / SÜRPRİZ KAMPANYA"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Popup Ana Başlık (Modal Title) *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                    placeholder="İlk Siparişinize Özel 150 ₺ İndirim! 🎉"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Açıklama Metni (Description)</label>
                  <textarea
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50 focus:outline-none"
                    rows={3}
                    placeholder="Kampanya detayları..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Kupon Kodu (Coupon)</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-extrabold text-slate-900 bg-slate-50 focus:outline-none"
                      placeholder="Hediye10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">İkon / Emoji</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                      placeholder="🎁 veya 🌸"
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Buton Yazısı (Button Label)</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                    placeholder="Kodu Kopyala & Alışverişe Başla 🛍️"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-8 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:opacity-95 transition flex items-center gap-2"
              >
                <span>💾 {saving ? "Kaydediliyor..." : "Popup Ayarlarını Kaydet"}</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview Card (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center relative font-sans space-y-3">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">👁️ CANLI POPUP ÖNİZLEME</div>
              
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#2b2623] flex items-center justify-center mx-auto text-2xl shadow-xs">
                {icon || "🎁"}
              </div>

              <div className="text-[10px] font-black uppercase tracking-wider text-[#2b2623]">
                {badgeText || "BİLGİLENDİRME"}
              </div>

              <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                {title || "Modal Başlığı"}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                {description || "Modal açıklaması..."}
              </p>

              {couponCode && (
                <div className="bg-[#F5EFE6]/80 border-2 border-dashed border-[#2b2623] rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="text-left">
                    <div className="text-[9px] font-bold uppercase text-[#1a1918]">İndirim Kupon Kodunuz</div>
                    <div className="text-base font-black tracking-widest text-[#2b2623]">{couponCode}</div>
                  </div>
                  <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="px-3 py-1.5 rounded-xl text-[10px] font-black">
                    Kopyala
                  </span>
                </div>
              )}

              <button
                type="button"
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="w-full font-extrabold py-3 rounded-2xl shadow-xs text-xs"
              >
                {buttonText || "Kodu Kopyala"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
