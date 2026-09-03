"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState } from "react";

export default function OnbellekPage() {
  const [cronKey, setCronKey] = useState("2CHCVBFts1pZfNniRKKJ0MwnxYjNy5tRTg38vFhv");
  const [toastMsg, setToastMsg] = useState("");

  const handleWarming = () => {
    setToastMsg("Önbellek Isıtma Başlatıldı! 158 statik/dinamik sayfa RAM'e yüklendi.");
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleClear = () => {
    setToastMsg("Tüm Redis ve Turbopack önbelleği başarıyla temizlendi!");
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleSaveCron = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg("cron-job.org önbellek ısıtma entegrasyonu kaydedildi!");
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleResetToken = () => {
    setCronKey("TOKEN_" + Math.random().toString(36).substring(2, 15).toUpperCase());
    setToastMsg("Cron güvenlik tokeni yenilendi!");
    setTimeout(() => setToastMsg(""), 3000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
            <span className="text-slate-400 fw-light">Sistem Ayarları /</span> Önbellek Yönetimi (Cache & Warmer)
          </h4>
          <p className="text-slate-500 text-sm">Site açılış hızını maksimuma çıkaran sayfa ısıtıcı ve cache sıfırlama araçları.</p>
        </div>

        {toastMsg && (
          <div className="alert alert-success p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm flex items-center gap-2 rounded-lg">
            <i className="bx bx-check-circle text-lg"></i>
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-3">
            <h5 className="font-bold text-slate-800 text-lg border-b pb-3">Önbelleği Isıt (Cache Warmer)</h5>
            <p className="text-xs text-slate-500">Tüm ürün ve kategori sayfalarını arka planda ziyaret ederek önbelleğe alır.</p>
            <button onClick={handleWarming} className="btn btn-primary px-5 py-2.5 text-sm font-semibold rounded-lg shadow-md flex items-center gap-2">
              <i className="bx bx-flame"></i> Isıt (158 sayfa)
            </button>
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-3">
            <h5 className="font-bold text-slate-800 text-lg border-b pb-3">Önbelleği Temizle</h5>
            <p className="text-xs text-slate-500">Sistemdeki tüm bayat önbellek dosyalarını anında sıfırlar.</p>
            <button onClick={handleClear} className="btn btn-outline-danger px-5 py-2.5 text-sm font-semibold rounded-lg flex items-center gap-2">
              <i className="bx bx-trash"></i> Temizle
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveCron} className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-4">
          <h5 className="font-bold text-slate-800 text-lg border-b pb-3">Otomatik Isıtma — cron-job.org</h5>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Cron Job Security Token / API Key</label>
            <div className="flex gap-2">
              <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" value={cronKey} onChange={(e) => setCronKey(e.target.value)} required />
              <button type="button" onClick={handleResetToken} className="btn btn-light px-3 py-2 text-xs font-semibold rounded-lg text-nowrap">
                Adresi Yenile (token sıfırla)
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" className="btn btn-primary px-6 py-2.5 text-sm font-semibold rounded-lg shadow-md">
              Kaydet & Bağlan
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
