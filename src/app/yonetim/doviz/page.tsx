"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function DovizPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [rates, setRates] = useState({
    USD: "36.45",
    EUR: "39.20",
    GBP: "46.10",
    RUB: "0.38",
  });
  const [autoSync, setAutoSync] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/currencies");
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          setRates({
            USD: String(data.rates.USD || "36.45"),
            EUR: String(data.rates.EUR || "39.20"),
            GBP: String(data.rates.GBP || "46.10"),
            RUB: String(data.rates.RUB || "0.38"),
          });
        }
        setAutoSync(Boolean(data.autoSyncTcmb));
        setLastUpdate(data.lastUpdate || "");
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoSyncTcmb: autoSync,
          rates: {
            USD: Number(rates.USD),
            EUR: Number(rates.EUR),
            GBP: Number(rates.GBP),
            RUB: Number(rates.RUB),
          },
        }),
      });

      if (res.ok) {
        setToastMsg("Döviz kurları ve çoklu para birimi ayarları başarıyla kaydedildi!");
        fetchRates();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Kurlar kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleTcmbSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tcmb_sync" }),
      });

      if (res.ok) {
        setToastMsg("TCMB (Merkez Bankası) anlık döviz kurları başarıyla çekildi ve güncellendi!");
        fetchRates();
        setTimeout(() => setToastMsg(""), 4000);
      }
    } catch (e) {
      alert("TCMB kurları çekilirken hata oluştu.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800 flex items-center gap-2">
              <i className="bx bx-dollar-circle text-emerald-600 text-3xl"></i>
              <span>Döviz Kurları & Çoklu Para Birimi Yönetimi</span>
            </h4>
            <p className="text-slate-500 text-sm">
              Yabancı turist ve yurt dışı müşterileriniz için canlı Merkez Bankası kurları ve sabit kur tanımları.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTcmbSync}
            disabled={syncing}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
          >
            <span>🔄 {syncing ? "Kurlar Çekiliyor..." : "TCMB Anlık Kuru Yenile"}</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Live Exchange Rate Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card border-0 shadow-sm rounded-2xl p-4 bg-white border-l-4 border-l-blue-500">
            <div className="text-xs font-bold text-slate-400 uppercase">Amerikan Doları (USD)</div>
            <div className="text-2xl font-black text-slate-800 mt-1">1 $ = {rates.USD} ₺</div>
          </div>

          <div className="card border-0 shadow-sm rounded-2xl p-4 bg-white border-l-4 border-l-indigo-500">
            <div className="text-xs font-bold text-slate-400 uppercase">Euro (EUR)</div>
            <div className="text-2xl font-black text-slate-800 mt-1">1 € = {rates.EUR} ₺</div>
          </div>

          <div className="card border-0 shadow-sm rounded-2xl p-4 bg-white border-l-4 border-l-purple-500">
            <div className="text-xs font-bold text-slate-400 uppercase">İngiliz Sterlini (GBP)</div>
            <div className="text-2xl font-black text-slate-800 mt-1">1 £ = {rates.GBP} ₺</div>
          </div>

          <div className="card border-0 shadow-sm rounded-2xl p-4 bg-white border-l-4 border-l-emerald-500">
            <div className="text-xs font-bold text-slate-400 uppercase">Rus Rublesi (RUB)</div>
            <div className="text-2xl font-black text-slate-800 mt-1">1 ₽ = {rates.RUB} ₺</div>
          </div>
        </div>

        {/* Currency Rates Settings Form */}
        <form onSubmit={handleSave} className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h5 className="font-extrabold text-slate-800 text-base m-0">Kur Ayarları ve Güncelleme</h5>
            {lastUpdate && <span className="text-xs text-slate-400">Son Güncelleme: {lastUpdate}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">USD (Amerikan Doları) Sabit Kur (₺) *</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                  value={rates.USD}
                  onChange={(e) => setRates({ ...rates, USD: e.target.value })}
                  required
                />
                <span className="absolute right-3 top-3 text-slate-400 text-xs font-bold">$</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">EUR (Euro) Sabit Kur (₺) *</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                  value={rates.EUR}
                  onChange={(e) => setRates({ ...rates, EUR: e.target.value })}
                  required
                />
                <span className="absolute right-3 top-3 text-slate-400 text-xs font-bold">€</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">GBP (İngiliz Sterlini) Sabit Kur (₺) *</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                  value={rates.GBP}
                  onChange={(e) => setRates({ ...rates, GBP: e.target.value })}
                  required
                />
                <span className="absolute right-3 top-3 text-slate-400 text-xs font-bold">£</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">RUB (Rus Rublesi) Sabit Kur (₺) *</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                  value={rates.RUB}
                  onChange={(e) => setRates({ ...rates, RUB: e.target.value })}
                  required
                />
                <span className="absolute right-3 top-3 text-slate-400 text-xs font-bold">₽</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-extrabold text-xs text-slate-800">TCMB Otomatik Güncelleme Modu</div>
              <div className="text-[11px] text-slate-500">Her gece saat 03:00'te Merkez Bankası kurlarını otomatik çeker.</div>
            </div>

            <div className="form-check form-switch m-0">
              <input
                className="form-check-input text-lg cursor-pointer"
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-6 py-3 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition"
            >
              <span>{loading ? "Kaydediliyor..." : "Kurları ve Ayarları Kaydet"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
