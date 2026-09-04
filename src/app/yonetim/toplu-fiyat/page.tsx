"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState } from "react";
import { useStore, CategoryItem, Product } from "@/lib/store";

export default function TopluFiyatPage() {
  const { categories = [], products = [] } = useStore();
  const [selectedCategory, setSelectedCategory] = useState("Tüm Ürünler");
  const [changeType, setChangeType] = useState("percent");
  const [value, setValue] = useState("10");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const categoryList: string[] = Array.from(
    new Set([
      ...categories.map((c: CategoryItem) => c.name),
      ...products.map((p: Product) => p.category).filter(Boolean),
    ])
  ).filter(Boolean).sort((a, b) => a.localeCompare(b, "tr"));

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_price",
          category: selectedCategory,
          changeType,
          value,
        }),
      });

      if (res.ok) {
        const typeLabel = changeType === "percent" ? `%${value} Zam` : changeType === "percent_discount" ? `%${value} İndirim` : `${value} ₺ Zam`;
        setMsg(`"${selectedCategory}" için ${typeLabel} başarıyla uygulandı! Tüm ürün fiyatları veritabanında güncellendi.`);
        setTimeout(() => setMsg(""), 5000);
      } else {
        alert("Fiyatlar güncellenirken hata oluştu.");
      }
    } catch (e) {
      alert("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
            <span className="text-slate-400 fw-light">Çiçek Kataloğu /</span> Toplu Fiyat Güncelleme
          </h4>
          <p className="text-slate-500 text-sm">Kategori veya tüm ürünler bazında toplu yüzde zammı, indirimi veya sabit tutar güncellemelerini anında uygulayın.</p>
        </div>

        {msg && (
          <div className="alert alert-success text-sm flex items-center gap-2 p-3.5 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 rounded-xl font-bold">
            <span>✓</span>
            <span>{msg}</span>
          </div>
        )}

        <form onSubmit={handleApply} className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-5">
          <h5 className="font-extrabold text-slate-800 text-lg border-b pb-3">Toplu Fiyat İşlem Formu</h5>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Hedef Kategori</label>
              <select className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-semibold" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="Tüm Ürünler">Tüm Ürünler (Tüm Katalog)</option>
                {categoryList.map((catName) => (
                  <option key={catName} value={catName}>
                    {catName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">İşlem Türü</label>
              <select className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-semibold" value={changeType} onChange={(e) => setChangeType(e.target.value)}>
                <option value="percent">Yüzde (%) Artış / Zam</option>
                <option value="percent_discount">Yüzde (%) İndirim</option>
                <option value="fixed">Sabit Tutar (₺) Ekle</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Değer / Oran</label>
              <input type="number" className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none font-bold" value={value} onChange={(e) => setValue(e.target.value)} required />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t">
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-6 py-3 rounded-xl font-extrabold text-xs shadow-md hover:opacity-95 transition flex items-center gap-2"
            >
              <span>⚡ {loading ? "Güncelleniyor..." : "Fiyatları Toplu Güncelle"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
