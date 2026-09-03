"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  order: number;
  active: boolean;
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [order, setOrder] = useState(1);
  const [active, setActive] = useState(true);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/menus");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data.sort((a: MenuItem, b: MenuItem) => (a.order || 0) - (b.order || 0)));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const saveMenusToBackend = async (updatedItems: MenuItem[], msg: string) => {
    setSaving(true);
    try {
      const sorted = [...updatedItems].sort((a, b) => (a.order || 0) - (b.order || 0));
      const res = await fetch("/api/menus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sorted),
      });

      if (res.ok) {
        setItems(sorted);
        setToastMsg(msg);
        setTimeout(() => setToastMsg(""), 3500);
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://") && !formattedUrl.startsWith("/")) {
      formattedUrl = "/" + formattedUrl;
    }

    if (editingId) {
      const updated = items.map((item) =>
        item.id === editingId ? { ...item, title: title.trim(), url: formattedUrl, order: Number(order), active } : item
      );
      saveMenusToBackend(updated, "Menü başlığı başarıyla güncellendi!");
    } else {
      const newItem: MenuItem = {
        id: String(Date.now()),
        title: title.trim(),
        url: formattedUrl,
        order: Number(order) || items.length + 1,
        active
      };
      const updated = [...items, newItem];
      saveMenusToBackend(updated, "Yeni menü başlığı eklendi!");
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bu menü başlığını silmek istediğinize emin misiniz?")) return;
    const updated = items.filter((x) => x.id !== id);
    saveMenusToBackend(updated, "Menü başlığı silindi.");
  };

  const toggleActive = (id: string) => {
    const updated = items.map((item) => (item.id === id ? { ...item, active: !item.active } : item));
    saveMenusToBackend(updated, "Menü durumu değiştirildi.");
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setUrl(item.url);
    setOrder(item.order || 1);
    setActive(item.active !== false);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setUrl("");
    setOrder(items.length + 1);
    setActive(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Site Tasarımı /</span> Header Ana Menü Yapılandırması (Supabase Canlı)
            </h4>
            <p className="text-slate-500 text-sm">
              Mağaza başlığının hemen altında yer alan yatay menü linklerini yönetin. Sıralamayı ve link hedeflerini özelleştirebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="shadow-sm flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs hover:opacity-95 transition"
          >
            <span>+ Yeni Menü Başlığı Ekle</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm rounded-xl font-bold flex items-center gap-2 shadow-xs">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border">Menüler yükleniyor...</div>
        ) : (
          <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b">
                  <tr>
                    <th className="px-5 py-3.5 w-16">Sıra</th>
                    <th className="px-5 py-3.5">Menü Başlığı</th>
                    <th className="px-5 py-3.5">Hedef Link (URL)</th>
                    <th className="px-5 py-3.5 w-24">Durum</th>
                    <th className="px-5 py-3.5 text-end w-36">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-black text-slate-700">{m.order}</td>
                      <td className="px-5 py-4 font-extrabold text-slate-900">{m.title}</td>
                      <td className="px-5 py-4 text-emerald-700 font-mono text-xs">{m.url}</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggleActive(m.id)}
                          style={{
                            backgroundColor: m.active !== false ? "#F5EFE6" : "#f1f5f9",
                            color: m.active !== false ? "#2b2623" : "#64748b"
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-2xs border border-amber-900/10 cursor-pointer"
                        >
                          {m.active !== false ? "✓ Aktif" : "✕ Pasif"}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-end">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(m)}
                            className="btn btn-sm btn-outline-secondary rounded-xl text-xs px-3 py-1 font-bold"
                          >
                            ✎ Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m.id)}
                            className="btn btn-sm btn-light text-danger rounded-xl text-xs px-2.5 py-1 font-bold"
                          >
                            🗑 Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal for Add / Edit */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h5 className="font-extrabold text-slate-800 text-base m-0">
                  {editingId ? "Menü Başlığı Düzenle" : "Yeni Menü Başlığı Ekle"}
                </h5>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 font-bold hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleAddOrEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Menü Başlığı *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                    placeholder="Örn: Gül Buketleri veya ⚡ İndirimliler"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hedef Link (URL) *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#2b2623]"
                    placeholder="Örn: /kategori/buketler veya /urun/gül-buketi"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Sıralama (Order)</label>
                    <input
                      type="number"
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                      value={order}
                      onChange={(e) => setOrder(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Durum</label>
                    <select
                      className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold bg-white"
                      value={active ? "true" : "false"}
                      onChange={(e) => setActive(e.target.value === "true")}
                    >
                      <option value="true">Aktif (Göster)</option>
                      <option value="false">Pasif (Gizle)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">İptal</button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-6 py-2 rounded-xl text-xs font-extrabold shadow-md hover:opacity-95 transition"
                  >
                    {saving ? "Kaydediliyor..." : (editingId ? "Güncelle" : "Menüye Ekle")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
