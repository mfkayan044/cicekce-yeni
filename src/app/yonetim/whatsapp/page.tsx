"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function WhatsAppPage() {
  const [provider, setProvider] = useState("wasender");
  const [baseUrl, setBaseUrl] = useState("https://api.wasender.com/v1");
  const [personalToken, setPersonalToken] = useState("");
  const [token, setToken] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [notifyNumber, setNotifyNumber] = useState("905550000000");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/whatsapp");
      if (res.ok) {
        const data = await res.json();
        if (data.provider) setProvider(data.provider);
        if (data.baseUrl) setBaseUrl(data.baseUrl);
        if (data.personalToken) setPersonalToken(data.personalToken);
        if (data.token) setToken(data.token);
        if (typeof data.notifyEnabled === "boolean") setNotifyEnabled(data.notifyEnabled);
        if (data.notifyNumber) setNotifyNumber(data.notifyNumber);
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
      const res = await fetch("/api/settings/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          baseUrl,
          personalToken,
          token,
          notifyEnabled,
          notifyNumber
        }),
      });

      if (res.ok) {
        setToastMsg("✅ WhatsApp mağaza bildirim hattı ve API ayarları Supabase veritabanına başarıyla kaydedildi!");
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
        <div className="p-5 text-center font-bold text-slate-600">WhatsApp ayarları yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">💬 OTOMATİK BİLDİRİM HATTI</div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">WhatsApp Mağaza Bildirim Hattı & Bot Bağlantısı</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Siteden yeni sipariş geldiğinde mağaza sahibinin telefonuna anlık WhatsApp bildirimi gönderen hat ayarları.
            </p>
          </div>
          <Link
            href="/yonetim/whatsapp/sablonlar"
            className="btn btn-outline-primary font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xs"
          >
            <span>💬 WhatsApp Şablonları &rarr;</span>
          </Link>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl text-sm font-extrabold shadow-xs">
            {toastMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Otomatik Sipariş Bildirim Hattı */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <h5 className="font-black text-slate-900 text-base border-b pb-3 flex items-center justify-between">
              <span>🔔 Mağaza Sahibi Yeni Sipariş Bildirim Hattı</span>
              <span className={`badge ${notifyEnabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"} text-xs px-3 py-1 font-bold`}>
                {notifyEnabled ? "🟢 Bildirimler Aktif" : "⚪ Kapalı"}
              </span>
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Yeni Sipariş Anlık Bildirim Durumu</label>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    className="form-check-input w-6 h-6 cursor-pointer"
                    checked={notifyEnabled}
                    onChange={(e) => setNotifyEnabled(e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-800">Yeni sipariş düştüğünde WhatsApp ile bana haber ver</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Bildirim Gönderilecek WhatsApp Numarası *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="905550000000 (Ülke kodu ile)"
                  value={notifyNumber}
                  onChange={(e) => setNotifyNumber(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: WhatsApp Bot API Provider */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <h5 className="font-black text-slate-900 text-base border-b pb-3">
              🔌 WhatsApp Bot API Sağlayıcısı (WaSender / OpenWA)
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Servis Sağlayıcısı</label>
                <select
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  <option value="wasender">WaSender Cloud API (Önerilen Bulut Servisi)</option>
                  <option value="openwa">OpenWA Local Node Server</option>
                  <option value="meta">Meta Official WhatsApp Business Cloud</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">WaSender Base API URL</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Personal Access Token</label>
                <input
                  type="password"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="was_pers_••••••••"
                  value={personalToken}
                  onChange={(e) => setPersonalToken(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Session Token</label>
                <input
                  type="password"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="was_tok_••••••••"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:opacity-95 transition flex items-center gap-2"
            >
              <span>💾 {saving ? "Kaydediliyor..." : "WhatsApp Bildirim Ayarlarını Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
