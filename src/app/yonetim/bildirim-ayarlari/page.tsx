"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function BildirimAyarlariPage() {
  const [notifyOrderMail, setNotifyOrderMail] = useState(true);
  const [notifyOrderWa, setNotifyOrderWa] = useState(true);
  const [recoveryWaEnabled, setRecoveryWaEnabled] = useState(true);
  const [recoveryMailEnabled, setRecoveryMailEnabled] = useState(true);
  const [minutes, setMinutes] = useState("15");
  const [maxTries, setMaxTries] = useState("2");
  const [couponPercent, setCouponPercent] = useState("10");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/notifications");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.notifyOrderMail === "boolean") setNotifyOrderMail(data.notifyOrderMail);
        if (typeof data.notifyOrderWa === "boolean") setNotifyOrderWa(data.notifyOrderWa);
        if (typeof data.recoveryWaEnabled === "boolean") setRecoveryWaEnabled(data.recoveryWaEnabled);
        if (typeof data.recoveryMailEnabled === "boolean") setRecoveryMailEnabled(data.recoveryMailEnabled);
        if (data.minutes) setMinutes(data.minutes);
        if (data.maxTries) setMaxTries(data.maxTries);
        if (data.couponPercent) setCouponPercent(data.couponPercent);
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
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyOrderMail,
          notifyOrderWa,
          recoveryWaEnabled,
          recoveryMailEnabled,
          minutes,
          maxTries,
          couponPercent
        }),
      });

      if (res.ok) {
        setToastMsg("✅ Sipariş & Yarım Kalan Sepet Otomasyon Ayarları Supabase veritabanına kaydedildi!");
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
        <div className="p-5 text-center font-bold text-slate-600">Bildirim ayarları yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">🔔 ANLIK UYARI & OTOMASYON</div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Sipariş & Yarım Kalan Sepet Bildirim Ayarları</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Yöneticilere gidecek anlık WhatsApp/E-posta sipariş uyarıları ve müşteri sepet kurtarma kuralları.
          </p>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl text-sm font-extrabold shadow-xs">
            {toastMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Yönetici Sipariş Uyarısı */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <h5 className="font-black text-slate-900 text-base border-b pb-3">
              📢 Mağaza Sahibi / Yönetici Anlık Sipariş Uyarısı
            </h5>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-2xl bg-slate-50">
                <div>
                  <h6 className="font-extrabold text-slate-900 text-xs sm:text-sm m-0">Yeni Siparişte E-Posta Bildirimi Al (notify_order_mail)</h6>
                  <p className="text-xs text-slate-500 m-0 font-medium">Yönetici e-posta adresinize anında yeni sipariş maili iletir.</p>
                </div>
                <input
                  type="checkbox"
                  className="form-check-input w-6 h-6 cursor-pointer"
                  checked={notifyOrderMail}
                  onChange={(e) => setNotifyOrderMail(e.target.checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-2xl bg-slate-50">
                <div>
                  <h6 className="font-extrabold text-slate-900 text-xs sm:text-sm m-0">Yeni Siparişte WhatsApp Uyarısı Al (notify_order_wa)</h6>
                  <p className="text-xs text-slate-500 m-0 font-medium">Yönetici WhatsApp numaranıza anında mesaj atar.</p>
                </div>
                <input
                  type="checkbox"
                  className="form-check-input w-6 h-6 cursor-pointer"
                  checked={notifyOrderWa}
                  onChange={(e) => setNotifyOrderWa(e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Yarım Kalan Sepet Otomasyonu (Cart Recovery) */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <h5 className="font-black text-slate-900 text-base border-b pb-3">
              🛒 Yarım Kalan Sepet Otomatik Müşteri Kurtarma (Cart Recovery)
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-2xl bg-slate-50">
                <span className="font-extrabold text-slate-800 text-xs">WhatsApp Takibi & Hatırlatma Yap</span>
                <input
                  type="checkbox"
                  className="form-check-input w-5 h-5 cursor-pointer"
                  checked={recoveryWaEnabled}
                  onChange={(e) => setRecoveryWaEnabled(e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between p-3.5 border border-slate-200 rounded-2xl bg-slate-50">
                <span className="font-extrabold text-slate-800 text-xs">E-Posta Takibi & Hatırlatma Yap</span>
                <input
                  type="checkbox"
                  className="form-check-input w-5 h-5 cursor-pointer"
                  checked={recoveryMailEnabled}
                  onChange={(e) => setRecoveryMailEnabled(e.target.checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Kaç Dakika Sonra Hatırlatılsın?</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Maksimum Gönderim Sayısı</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={maxTries}
                  onChange={(e) => setMaxTries(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Otomatik Kupon İndirimi (%)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-black text-emerald-700 bg-emerald-50 focus:outline-none"
                  value={couponPercent}
                  onChange={(e) => setCouponPercent(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:opacity-95 transition flex items-center gap-2"
            >
              <span>💾 {saving ? "Kaydediliyor..." : "Bildirim Ayarlarını Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
