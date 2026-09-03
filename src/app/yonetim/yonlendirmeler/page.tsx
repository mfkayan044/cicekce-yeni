"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

interface RedirectItem {
  id: string;
  source: string;
  target: string;
  type: string;
  clicks: number;
  active: boolean;
}

export default function YonlendirmelerPage() {
  const [items, setItems] = useState<RedirectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [src, setSrc] = useState("");
  const [tgt, setTgt] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const fetchRedirects = async () => {
    try {
      const res = await fetch("/api/redirects");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!src || !tgt) return;

    try {
      const res = await fetch("/api/redirects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: src.startsWith("/") ? src : `/${src}`,
          target: tgt.startsWith("/") ? tgt : `/${tgt}`,
          type: "301 Kalıcı",
          clicks: 0,
          active: true,
        }),
      });

      if (res.ok) {
        setToastMsg("301 URL Yönlendirmesi aktifleşti!");
        setSrc("");
        setTgt("");
        setShowModal(false);
        fetchRedirects();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu 301 yönlendirmesini silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/redirects?id=${id}`, { method: "DELETE" });
      setItems(items.filter((x) => x.id !== id));
      setToastMsg("Yönlendirme silindi.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Çiçek Kataloğu /</span> 301 Yönlendirmeler (SEO)
            </h4>
            <p className="text-slate-500 text-sm">
              Eski URL'leri yenilerine kalıcı olarak yönlendirin (SEO URL Migration & Link Yönetimi).
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
          >
            <span>➕ Yeni Yönlendirme Ekle</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Eski Kaynak URL</th>
                  <th className="px-4 py-3">Yeni Hedef URL</th>
                  <th className="px-4 py-3">Yönlendirme Tipi</th>
                  <th className="px-4 py-3">Tıklanma</th>
                  <th style={{ width: "120px" }} className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Yönlendirmeler yükleniyor...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Henüz 301 yönlendirme kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{it.source}</td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#2b2623]">{it.target}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-1 rounded-full text-xs font-bold">
                          {it.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">{it.clicks} tık</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleDelete(it.id)}
                          className="btn btn-sm btn-outline-danger rounded-lg text-xs px-2.5 py-1"
                        >
                          <span>🗑️ Sil</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-lg text-slate-800">301 URL Yönlendirmesi Ekle</h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Eski URL (Kaynak) *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-[#2b2623]"
                    value={src}
                    onChange={(e) => setSrc(e.target.value)}
                    placeholder="/eski-cicek-kategorisi"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Yeni URL (Hedef) *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-[#2b2623]"
                    value={tgt}
                    onChange={(e) => setTgt(e.target.value)}
                    placeholder="/kategori/buketler"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light px-4 py-2 text-sm font-bold">
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition"
                  >
                    Kaydet ve Aktif Et
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
