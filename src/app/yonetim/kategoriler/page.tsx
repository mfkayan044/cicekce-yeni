"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useStore, CategoryItem } from "@/lib/store";
import { useState } from "react";

export default function AdminCategoriesPage() {
  const { categories, updateCategory, deleteCategory } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; image: string }>({ name: "", image: "" });
  const [toastMsg, setToastMsg] = useState("");

  const handleEditClick = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, image: cat.image });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditForm((prev) => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = (id: string) => {
    updateCategory(id, editForm);
    setEditingId(null);
    setToastMsg("Kategori hikaye görseli güncellendi ve mağazada yayına alındı!");
    setTimeout(() => setToastMsg(""), 3000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Çiçek Kataloğu /</span> Kategoriler & Story Bar
            </h4>
            <p className="text-slate-500 text-sm">
              Mağaza ana sayfasındaki üst yuvarlak hikaye (story) halkalarını ve kategori görsellerini yönetin.
            </p>
          </div>
          <Link
            href="/yonetim/kategoriler/yeni"
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
          >
            <span>➕ Yeni Kategori Ekle</span>
          </Link>
        </div>

        {toastMsg && (
          <div className="p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Table */}
        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th style={{ width: "120px" }} className="px-4 py-3">Story Görseli</th>
                  <th className="px-4 py-3">Kategori Adı</th>
                  <th className="px-4 py-3">URL Bağlantısı</th>
                  <th style={{ width: "160px" }} className="px-4 py-3 text-end">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat: CategoryItem) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      {editingId === cat.id ? (
                        <div className="space-y-2">
                          <img
                            src={editForm.image || "https://demo.procicek.com.tr/kategoriler/buketler.webp"}
                            alt=""
                            className="w-12 h-12 rounded-full border border-emerald-500 object-cover p-0.5"
                          />
                          <label style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="cursor-pointer text-[10px] font-extrabold px-2 py-1 rounded-lg block text-center shadow-xs">
                            <span>📁 Cihazdan Görsel Yükle</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                          </label>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-12 h-12 rounded-full border-2 border-emerald-600 object-cover shadow-xs p-0.5"
                          />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-800">
                      {editingId === cat.id ? (
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#2b2623]"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">{cat.name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Story Bar'da Aktif</div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      /kategori/{cat.slug}
                    </td>

                    <td className="px-4 py-3 text-end">
                      {editingId === cat.id ? (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                            className="btn btn-sm rounded-lg text-xs font-bold px-3 py-1"
                            onClick={() => handleSaveEdit(cat.id)}
                          >
                            Kaydet
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light rounded-lg text-xs font-bold px-2.5 py-1"
                            onClick={() => setEditingId(null)}
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-lg text-xs px-2.5 py-1 flex items-center gap-1 font-bold"
                            onClick={() => handleEditClick(cat)}
                          >
                            <span>📷 Düzenle / Görsel Değiştir</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-lg text-xs px-2.5 py-1"
                            onClick={() => {
                              if (confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) {
                                deleteCategory(cat.id);
                              }
                            }}
                          >
                            <span>🗑️</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
