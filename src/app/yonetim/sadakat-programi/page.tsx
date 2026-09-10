"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Award, Save, CheckCircle2, ShieldCheck, Coins, Percent } from "lucide-react";

export default function AdminSadakatPage() {
  const [enabled, setEnabled] = useState(true);
  const [earnRate, setEarnRate] = useState(5);
  const [maxRedeemRate, setMaxRedeemRate] = useState(25);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings/loyalty")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.enabled === "boolean") setEnabled(data.enabled);
        if (data.earnRate !== undefined) setEarnRate(data.earnRate);
        if (data.maxRedeemRate !== undefined) setMaxRedeemRate(data.maxRedeemRate);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, earnRate, maxRedeemRate }),
      });
      if (res.ok) {
        setToastMsg("✅ ÇiçekPuan sadakat programı kuralları kaydedildi!");
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Kaydetme hatası.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
              <Award className="w-6 h-6 text-amber-900" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900">ÇiçekPuan Sadakat & İndirim Sistemi</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Müşterilerin siparişlerinden puan kazanmasını ve ödemede üst limit kurallarıyla harcamasını yönetin
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="px-5 py-2.5 rounded-2xl text-xs font-black hover:opacity-90 transition flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs font-extrabold text-slate-400">Yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Rules Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex justify-between items-center border-b pb-4">
                  <h2 className="font-black text-slate-900 text-sm m-0">Sadakat Programı Durumu</h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-5 h-5 cursor-pointer"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                    />
                    <span className={`text-xs font-extrabold ${enabled ? "text-emerald-700" : "text-slate-400"}`}>
                      {enabled ? "🟢 Aktif (ÇiçekPuan Sistemi Çalışıyor)" : "⚪ Pasif"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 block">Siparişten Puan Kazanım Oranı (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                        value={earnRate}
                        onChange={(e) => setEarnRate(Number(e.target.value))}
                      />
                      <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Müşterinin tamamladığı her sipariş tutarının belirlenen yüzdesi kadar ÇiçekPuan bakiyesine eklenir. (1 Puan = 1 ₺)
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      Tek Siparişte Kullanılabilecek Maksimum Puan İndirimi Üst Sınırı (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-amber-900"
                        value={maxRedeemRate}
                        onChange={(e) => setMaxRedeemRate(Number(e.target.value))}
                      />
                      <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                    <p className="text-[11px] text-amber-900 font-extrabold">
                      KURAL: Müşterinin hesabında ne kadar puan olursa olsun, bir siparişte en fazla sepet tutarının bu yüzdesi kadar indirim yapılabilir. Müşteri ürünün %100'ünü bedava alamaz.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Summary Info */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 font-sans">
                <div className="text-xs font-black text-slate-400 uppercase tracking-wider">💡 ÖRNEK HESAPLAMA MATRİSİ</div>

                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Müşterinin 1.500 ÇiçekPuanı Var</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                    <div className="flex justify-between">
                      <span>Sipariş Sepet Tutarı:</span>
                      <span className="font-bold text-slate-900">1.000 ₺</span>
                    </div>
                    <div className="flex justify-between text-amber-900 font-bold">
                      <span>Maksimum İndirim Sınırı (%{maxRedeemRate}):</span>
                      <span>250 ₺</span>
                    </div>
                    <div className="flex justify-between text-emerald-800 font-black border-t border-amber-200/60 pt-1.5">
                      <span>Müşterinin Ödeyeceği Net Tutar:</span>
                      <span>750 ₺</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 italic">
                    * Kalan 1.250 Puan müşterinin hesabında kalır ve sonraki siparişlerinde kullanılabilir.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
