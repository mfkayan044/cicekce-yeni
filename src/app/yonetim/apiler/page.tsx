"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function ApilerPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    googlePlaceId: "",
    googleApiKey: "",
    whatsappPhoneId: "",
    whatsappToken: "",
    smsProvider: "netgsm",
    smsUser: "",
    smsPassword: "",
    smsHeader: "CICEKCE",
    mapsApiKey: "",
    iyzicoApiKey: "",
    iyzicoSecret: "",
  });

  useEffect(() => {
    async function loadApis() {
      try {
        const res = await fetch("/api/settings/apis");
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({ ...prev, ...data }));
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    loadApis();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings/apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      alert("API ayarları kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">🔌 SİSTEM ENTEGRASYONLARI</div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900">API Entegrasyon Anahtarları</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Toplu SMS, WhatsApp Business API, Google Yorumları ve Ödeme Sanal POS anahtarlarınızı bağlayın.
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl text-sm font-extrabold shadow-xs flex items-center gap-2">
            <span>✓</span> <span>Tüm API entegrasyon anahtarları başarıyla veritabanına kaydedildi ve aktifleştirildi!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Toplu SMS API (Netgsm / İletimerkezi / Mutlucell) */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
                📱
              </div>
              <div>
                <h5 className="font-black text-slate-900 text-base m-0">Toplu SMS Başlıklı Gönderim API (Netgsm / İletimerkezi)</h5>
                <p className="text-xs text-slate-400 m-0">Toplu müşteri duyuruları ve kampanya SMS'leri göndermek için kullanılır.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMS Servis Sağlayıcısı</label>
                <select
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={form.smsProvider}
                  onChange={(e) => setForm({ ...form, smsProvider: e.target.value })}
                >
                  <option value="netgsm">Netgsm SMS API</option>
                  <option value="iletimerkezi">İletimerkezi SMS API</option>
                  <option value="mutlucell">Mutlucell SMS API</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMS Gönderici Başlığı (Header)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="CICEKCE"
                  value={form.smsHeader}
                  onChange={(e) => setForm({ ...form, smsHeader: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">API Kullanıcı Adı / Abone No *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="850300XXXX veya Abone Kullanıcı Adınız"
                  value={form.smsUser}
                  onChange={(e) => setForm({ ...form, smsUser: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">API Şifresi / Key *</label>
                <input
                  type="password"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="••••••••••••"
                  value={form.smsPassword}
                  onChange={(e) => setForm({ ...form, smsPassword: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Card 2: WhatsApp Cloud API */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                💬
              </div>
              <div>
                <h5 className="font-black text-slate-900 text-base m-0">WhatsApp Business API (Meta Cloud / Twilio)</h5>
                <p className="text-xs text-slate-400 m-0">Müşterilere otomatik duyuru, sipariş onay ve kurye takip mesajları gönderimi.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="105928374650192"
                  value={form.whatsappPhoneId}
                  onChange={(e) => setForm({ ...form, whatsappPhoneId: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">WhatsApp System Access Token</label>
                <input
                  type="password"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="EAAGz..."
                  value={form.whatsappToken}
                  onChange={(e) => setForm({ ...form, whatsappToken: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Google Places API */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
                🌐
              </div>
              <div>
                <h5 className="font-black text-slate-900 text-base m-0">Google Places & Yorumlar API</h5>
                <p className="text-xs text-slate-400 m-0">Google İşletme haritalarınızdaki canlı müşteri yorumlarını çekmek için kullanılır.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Google Place ID</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="ChIJN1t_rCQuXBUR..."
                  value={form.googlePlaceId}
                  onChange={(e) => setForm({ ...form, googlePlaceId: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Google Places API Key</label>
                <input
                  type="password"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="AIzaSyD-..."
                  value={form.googleApiKey}
                  onChange={(e) => setForm({ ...form, googleApiKey: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:opacity-95 transition flex items-center gap-2"
            >
              <span>💾 {loading ? "Kaydediliyor..." : "Tüm API Anahtarlarını Kaydet ve Aktif Et"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
