"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";
import { CheckCircle2, Save, Filter, Plus, X } from "lucide-react";

export default function AdminFiltersPage() {
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [newDesign, setNewDesign] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorDot, setNewColorDot] = useState("🔴");

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const res = await fetch("/api/filters");
      const data = await res.json();
      setFilterOptions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (targetOptions = filterOptions) => {
    if (!targetOptions) return;
    setSaving(true);
    try {
      const res = await fetch("/api/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targetOptions),
      });
      if (res.ok) {
        setToastMsg("✅ Filtre seçenekleri veritabanına kalıcı olarak kaydedildi! Ürün düzenleme ekranında anında aktifleşti.");
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

  // Item management helpers
  const addItem = (category: string, value: any) => {
    if (!value) return;
    const list = [...(filterOptions[category] || [])];
    list.push(value);
    const updated = { ...filterOptions, [category]: list };
    setFilterOptions(updated);
    handleSaveAll(updated);
  };

  const removeItem = (category: string, idx: number) => {
    const list = [...filterOptions[category]];
    list.splice(idx, 1);
    const updated = { ...filterOptions, [category]: list };
    setFilterOptions(updated);
    handleSaveAll(updated);
  };

  if (loading || !filterOptions) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-xs font-bold text-slate-500">
          Filtre seçenekleri yükleniyor...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans pb-12">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
              <Filter className="w-6 h-6 text-amber-900" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Filtre Özellikleri & Seçenek Yönetimi</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Ürün düzenleme ekranında çıkan Tasarım Tipi, Kime, Gönderim Amacı ve Renk filtrelerini yönetin
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSaveAll(filterOptions)}
            disabled={saving}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="px-5 py-2.5 rounded-2xl text-xs font-black hover:opacity-90 transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Kaydediliyor..." : "Tüm Filtreleri Kaydet"}</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION 1: Tasarım Tipi */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="font-black text-slate-900 text-sm border-b pb-3 flex items-center gap-2">
              <span>🎨</span> <span>1. Tasarım Tipi Filtreleri (Buket, Kutuda, Aranjman vb.)</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#2b2623]"
                placeholder="Yeni tasarım tipi (ör. Ayaklı Sepet)..."
                value={newDesign}
                onChange={(e) => setNewDesign(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDesign.trim()) {
                    addItem("designTypes", newDesign.trim());
                    setNewDesign("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newDesign.trim()) {
                    addItem("designTypes", newDesign.trim());
                    setNewDesign("");
                  }
                }}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-4 py-2.5 rounded-xl text-xs font-black hover:opacity-90 transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Ekle</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {filterOptions.designTypes?.map((item: string, idx: number) => (
                <span key={idx} className="bg-slate-100 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem("designTypes", idx)}
                    className="text-slate-400 hover:text-red-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SECTION 2: Kime */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="font-black text-slate-900 text-sm border-b pb-3 flex items-center gap-2">
              <span>👤</span> <span>2. Kime Filtreleri (Sevgiliye, Anneye, Eşe vb.)</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#2b2623]"
                placeholder="Yeni hedef kişi (ör. Öğretmene)..."
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newRecipient.trim()) {
                    addItem("recipients", newRecipient.trim());
                    setNewRecipient("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newRecipient.trim()) {
                    addItem("recipients", newRecipient.trim());
                    setNewRecipient("");
                  }
                }}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-4 py-2.5 rounded-xl text-xs font-black hover:opacity-90 transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Ekle</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {filterOptions.recipients?.map((item: string, idx: number) => (
                <span key={idx} className="bg-slate-100 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem("recipients", idx)}
                    className="text-slate-400 hover:text-red-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SECTION 3: Gönderim Amacı */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="font-black text-slate-900 text-sm border-b pb-3 flex items-center gap-2">
              <span>🎁</span> <span>3. Gönderim Amacı Filtreleri (Doğum Günü, Yıl Dönümü vb.)</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#2b2623]"
                placeholder="Yeni amaç (ör. Yeni Bebek, Açılış)..."
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newPurpose.trim()) {
                    addItem("purposes", newPurpose.trim());
                    setNewPurpose("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newPurpose.trim()) {
                    addItem("purposes", newPurpose.trim());
                    setNewPurpose("");
                  }
                }}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-4 py-2.5 rounded-xl text-xs font-black hover:opacity-90 transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Ekle</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {filterOptions.purposes?.map((item: string, idx: number) => (
                <span key={idx} className="bg-slate-100 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem("purposes", idx)}
                    className="text-slate-400 hover:text-red-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SECTION 4: Renk Filtreleri */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="font-black text-slate-900 text-sm border-b pb-3 flex items-center gap-2">
              <span>🌈</span> <span>4. Renk Filtreleri (Kırmızı 🔴, Beyaz ⚪ vb.)</span>
            </div>

            <div className="flex gap-2">
              <select
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                style={{ width: "90px" }}
                value={newColorDot}
                onChange={(e) => setNewColorDot(e.target.value)}
              >
                <option value="🔴">🔴 Kırmızı</option>
                <option value="⚪">⚪ Beyaz</option>
                <option value="🌸">🌸 Pembe</option>
                <option value="🟡">🟡 Sarı</option>
                <option value="🟠">🟠 Turuncu</option>
                <option value="🟣">🟣 Mor</option>
                <option value="🔵">🔵 Mavi</option>
                <option value="🟢">🟢 Yeşil</option>
                <option value="🎨">🎨 Karışık</option>
              </select>
              <input
                type="text"
                className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#2b2623]"
                placeholder="Renk adı (ör. Lila)..."
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newColorName.trim()) {
                    addItem("colors", { name: newColorName.trim(), dot: newColorDot });
                    setNewColorName("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (newColorName.trim()) {
                    addItem("colors", { name: newColorName.trim(), dot: newColorDot });
                    setNewColorName("");
                  }
                }}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-4 py-2.5 rounded-xl text-xs font-black hover:opacity-90 transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Ekle</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {filterOptions.colors?.map((item: any, idx: number) => (
                <span key={idx} className="bg-slate-100 text-slate-900 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2">
                  <span>{item.dot}</span>
                  <span>{item.name}</span>
                  <button
                    type="button"
                    onClick={() => removeItem("colors", idx)}
                    className="text-slate-400 hover:text-red-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
