"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function KartNotlariPage() {
  const [activeCategory, setActiveCategory] = useState("Aşk & Romantik");
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [trNote, setTrNote] = useState("");
  const [enNote, setEnNote] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const categories = [
    "Aşk & Romantik",
    "Doğum Günü",
    "Özür",
    "Yeni Bebek",
    "Geçmiş Olsun",
    "Genel & Teşekkür"
  ];

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/card-notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trNote.trim()) return;

    try {
      const res = await fetch("/api/card-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: activeCategory,
          tr: trNote,
          en: enNote || trNote,
          status: "Aktif"
        }),
      });

      if (res.ok) {
        setTrNote("");
        setEnNote("");
        setShowModal(false);
        setToastMsg("Yeni kart notu Supabase veritabanına eklendi.");
        fetchNotes();
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      alert("Kart notu eklenirken hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kart notunu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/card-notes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes(notes.filter((x) => x.id !== id));
        setToastMsg("Kart notu silindi.");
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      alert("Silme işleminde hata oluştu.");
    }
  };

  const filtered = notes.filter((n) => n.category === activeCategory);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Teslimat & Kasa /</span> Kart Notları (Supabase Canlı)
            </h4>
            <p className="text-slate-500 text-sm">
              Çiçek üzerine eklenecek hazır kutlama ve tebrik mesaj şablonları. Tüm notlar canlı Supabase veritabanından çekilmektedir.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="font-extrabold rounded-xl text-xs px-4 py-3 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
          >
            <span>➕ Yeni Not Ekle</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b pb-3">
          {categories.map((cat) => {
            const catCount = notes.filter((n) => n.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  backgroundColor: activeCategory === cat ? "#2b2623" : "#f1f5f9",
                  color: activeCategory === cat ? "#ffffff" : "#0f172a",
                  borderColor: activeCategory === cat ? "#2b2623" : "#cbd5e1",
                  fontWeight: "800",
                }}
                className="px-4 py-2.5 rounded-xl text-xs border transition flex items-center gap-2 shadow-xs hover:opacity-95"
              >
                <span>{cat}</span>
                <span
                  style={{
                    backgroundColor: activeCategory === cat ? "rgba(255,255,255,0.25)" : "#e2e8f0",
                    color: activeCategory === cat ? "#ffffff" : "#1e293b",
                  }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-black"
                >
                  {catCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Türkçe Kart Notu ({filtered.length} Not)</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 text-xs">
                      Supabase kart notları yükleniyor...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 text-xs">
                      Bu kategoride henüz hazır kart notu bulunmamaktadır.
                    </td>
                  </tr>
                ) : (
                  filtered.map((n) => (
                    <tr key={n.id}>
                      <td className="px-4 py-3 font-semibold text-slate-800">"{n.tr}"</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-bold">{n.category}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#FAF6F0] text-[#2b2623] border border-amber-900/10">
                          {n.status || "Aktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          type="button"
                          onClick={() => handleDelete(n.id)}
                          className="btn btn-xs btn-outline-danger font-bold rounded-lg"
                        >
                          🗑️ Sil
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
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-extrabold text-base text-slate-800">Yeni Kart Notu Ekle ({activeCategory})</h5>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kart Notu Metni *</label>
                  <textarea
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#2b2623]"
                    rows={4}
                    value={trNote}
                    onChange={(e) => setTrNote(e.target.value)}
                    placeholder="Kart üzerine yazılacak duygusal metin..."
                    required
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light px-4 py-2.5 text-xs font-bold rounded-xl">
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:opacity-95"
                  >
                    Supabase'e Kaydet
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
