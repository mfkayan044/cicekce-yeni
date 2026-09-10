"use client";

import { useState, useEffect } from "react";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Flower2, Save, Plus, Trash2, CheckCircle, Sparkles, HeartHandshake, Scissors, Droplets, Sun, Info } from "lucide-react";

export default function AdminFlowerCarePage() {
  const [activeTab, setActiveTab] = useState<"buket" | "orkide" | "saksi">("buket");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [careData, setCareData] = useState<any>({
    badge: "🌸 Çiçekçe Canlı Çiçek Bakım Rehberi",
    title: "Çiçeklerinizin Ömrünü Uzatacak Altın İpuçları",
    subtitle: "Tebrikler! Sevdiklerinizden veya kendinize hediye aldığınız taze çiçeklerinizin haftalarca canlı ve taze kalması için ihtiyacınız olan bakım rehberi.",
    tips: {
      buket: [],
      orkide: [],
      saksi: []
    }
  });

  useEffect(() => {
    fetch("/api/cicek-bakimi")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.tips) {
          setCareData(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/cicek-bakimi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(careData),
      });
      if (res.ok) {
        setSuccessMsg("Çiçek bakım rehberi içeriği başarıyla güncellendi!");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (e) {
      alert("Hata oluştu!");
    } finally {
      setSaving(false);
    }
  };

  const handleTipChange = (cat: "buket" | "orkide" | "saksi", idx: number, field: string, value: string) => {
    const updatedTips = { ...careData.tips };
    if (!updatedTips[cat]) updatedTips[cat] = [];
    updatedTips[cat][idx] = { ...updatedTips[cat][idx], [field]: value };
    setCareData({ ...careData, tips: updatedTips });
  };

  const handleAddTip = (cat: "buket" | "orkide" | "saksi") => {
    const updatedTips = { ...careData.tips };
    if (!updatedTips[cat]) updatedTips[cat] = [];
    updatedTips[cat].push({
      id: Date.now().toString(),
      title: "Yeni Bakım İpucu",
      desc: "İpucu açıklamasını buraya yazın.",
      icon: "Droplets",
      color: "emerald"
    });
    setCareData({ ...careData, tips: updatedTips });
  };

  const handleDeleteTip = (cat: "buket" | "orkide" | "saksi", idx: number) => {
    const updatedTips = { ...careData.tips };
    if (updatedTips[cat]) {
      updatedTips[cat].splice(idx, 1);
      setCareData({ ...careData, tips: updatedTips });
    }
  };

  return (
    <div className="layout-wrapper layout-content-navbar min-h-screen bg-slate-50 flex">
      <AdminSidebar />

      <div className="layout-page flex-1 flex flex-col min-w-0">
        <AdminNavbar />

        <div className="content-wrapper p-6 flex-1 max-w-6xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
                <Flower2 className="w-6 h-6 text-amber-900" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">Çiçek Bakım Rehberi Yönetimi</h1>
                <p className="text-xs text-slate-500 font-medium">
                  /cicek-bakimi sayfasındaki bakım önerilerini, başlıkları ve tavsiyeleri güncelleyin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/cicek-bakimi"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <span>Sayfayı İncele ↗</span>
              </a>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-5 py-2.5 rounded-xl text-xs font-black hover:opacity-90 transition flex items-center gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-xs font-extrabold text-slate-500">Yükleniyor...</div>
          ) : (
            <div className="space-y-6">
              {/* BANNER SETTINGS */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span>📌 Üst Banner Ayarları</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Banner Rozeti / Etiketi</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      value={careData.badge || ""}
                      onChange={(e) => setCareData({ ...careData, badge: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Ana Başlık</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      value={careData.title || ""}
                      onChange={(e) => setCareData({ ...careData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Alt Açıklama Metni</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    value={careData.subtitle || ""}
                    onChange={(e) => setCareData({ ...careData, subtitle: e.target.value })}
                  />
                </div>
              </div>

              {/* TABS SELECTOR */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-sm font-black text-slate-900">🌿 Kategoriye Özel Bakım İpuçları</h2>
                  <button
                    onClick={() => handleAddTip(activeTab)}
                    className="px-3.5 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-black hover:bg-emerald-100 transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni İpucu Ekle</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("buket")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                      activeTab === "buket"
                        ? "bg-[#2b2623] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Flower2 className="w-4 h-4 text-amber-400" />
                    <span>Vazo & Buket ({careData?.tips?.buket?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("orkide")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                      activeTab === "orkide"
                        ? "bg-[#2b2623] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Orkide ({careData?.tips?.orkide?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("saksi")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                      activeTab === "saksi"
                        ? "bg-[#2b2623] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <HeartHandshake className="w-4 h-4 text-emerald-400" />
                    <span>Saksı Bitkileri ({careData?.tips?.saksi?.length || 0})</span>
                  </button>
                </div>

                {/* TIPS CARDS EDITING */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {(careData?.tips?.[activeTab] || []).map((tip: any, idx: number) => (
                    <div key={tip.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          İpucu #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTip(activeTab, idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">İpucu Başlığı</label>
                        <input
                          type="text"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          value={tip.title || ""}
                          onChange={(e) => handleTipChange(activeTab, idx, "title", e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">Açıklama Metni</label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                          value={tip.desc || ""}
                          onChange={(e) => handleTipChange(activeTab, idx, "desc", e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700">İkon</label>
                          <select
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            value={tip.icon || "Droplets"}
                            onChange={(e) => handleTipChange(activeTab, idx, "icon", e.target.value)}
                          >
                            <option value="Scissors">Scissors ✂️</option>
                            <option value="Droplets">Droplets 💧</option>
                            <option value="Sun">Sun ☀️</option>
                            <option value="Sparkles">Sparkles ✨</option>
                            <option value="CheckCircle2">Check 🌿</option>
                            <option value="Info">Info ℹ️</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700">Renk Teması</label>
                          <select
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            value={tip.color || "emerald"}
                            onChange={(e) => handleTipChange(activeTab, idx, "color", e.target.value)}
                          >
                            <option value="amber">Amber (Turuncu)</option>
                            <option value="blue">Mavi</option>
                            <option value="yellow">Sarı</option>
                            <option value="purple">Mor</option>
                            <option value="emerald">Yeşil</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
