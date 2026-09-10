"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Flower2, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function AdminAbonelikPage() {
  const [subData, setSubData] = useState<any>({
    badge: "🌿 Çiçekçe Taze Çiçek Aboneliği",
    title: "Evinize & Ofisinize Her Hafta Taze Çiçek Dokunuşu",
    subtitle: "Her hafta veya her ay kapınıza gelen taze, mevsimlik özel tasarım çiçeklerle yaşam alanlarınızı renklendirin.",
    packages: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetch("/api/abonelik")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.packages) setSubData(data);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/abonelik", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subData),
      });
      if (res.ok) {
        setToastMsg("✅ Çiçek abonelik detayları ve paketleri kaydedildi!");
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Kaydetme hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handlePackageChange = (idx: number, field: string, value: any) => {
    const updated = [...(subData.packages || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setSubData({ ...subData, packages: updated });
  };

  const handleAddPackage = () => {
    const updated = [
      ...(subData.packages || []),
      {
        id: Date.now().toString(),
        name: "Yeni Abonelik Paketi",
        price: "1.500 ₺",
        period: "Aylık",
        desc: "Paket detaylı açıklaması.",
        badge: "YENİ",
        features: ["Her Hafta Taze Çiçek", "Ücretsiz Teslimat"]
      }
    ];
    setSubData({ ...subData, packages: updated });
  };

  const handleDeletePackage = (idx: number) => {
    const updated = [...(subData.packages || [])];
    updated.splice(idx, 1);
    setSubData({ ...subData, packages: updated });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
              <Flower2 className="w-6 h-6 text-amber-900" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Çiçek Aboneliği Yönetimi</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                /abonelik sayfasındaki başlık, açıklama ve abonelik paket fiyatlarını yönetin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/abonelik"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
            >
              Sayfayı İncele ↗
            </a>
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
          <div className="space-y-6">
            {/* Main Header Settings */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">📌 Sayfa Üst Bilgileri</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Sayfa Rozeti / Etiketi</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    value={subData.badge || ""}
                    onChange={(e) => setSubData({ ...subData, badge: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Ana Başlık</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    value={subData.title || ""}
                    onChange={(e) => setSubData({ ...subData, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700">Alt Açıklama Metni</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  value={subData.subtitle || ""}
                  onChange={(e) => setSubData({ ...subData, subtitle: e.target.value })}
                />
              </div>
            </div>

            {/* Packages Grid Editing */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-sm font-black text-slate-900">📦 Abonelik Paketleri ({subData.packages?.length || 0})</h2>
                <button
                  onClick={handleAddPackage}
                  className="px-3.5 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-black hover:bg-emerald-100 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Paket Ekle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(subData.packages || []).map((pkg: any, idx: number) => (
                  <div key={pkg.id || idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-[10px] font-black uppercase text-slate-400">Paket #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700">Paket Adı</label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        value={pkg.name || ""}
                        onChange={(e) => handlePackageChange(idx, "name", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">Fiyat</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-700"
                          value={pkg.price || ""}
                          onChange={(e) => handlePackageChange(idx, "price", e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">Periyot</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                          value={pkg.period || ""}
                          onChange={(e) => handlePackageChange(idx, "period", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700">Açıklama</label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                        value={pkg.desc || ""}
                        onChange={(e) => handlePackageChange(idx, "desc", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-slate-700">Rozet / Etiket (Örn: POPÜLER)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        value={pkg.badge || ""}
                        onChange={(e) => handlePackageChange(idx, "badge", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
