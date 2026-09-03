"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

interface FAQItem {
  id: string;
  q: string;
  a: string;
}

export default function SSSPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Modal / Add New Question State
  const [showModal, setShowModal] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/faqs");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setFaqs(data);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const saveFaqsToBackend = async (updatedFaqs: FAQItem[], msg: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFaqs),
      });

      if (res.ok) {
        setFaqs(updatedFaqs);
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
    if (!newQ.trim() || !newA.trim()) return;

    if (editingId) {
      const updated = faqs.map((item) => (item.id === editingId ? { ...item, q: newQ, a: newA } : item));
      saveFaqsToBackend(updated, "Soru ve cevap başarıyla güncellendi!");
    } else {
      const newItem: FAQItem = {
        id: String(Date.now()),
        q: newQ.trim(),
        a: newA.trim()
      };
      const updated = [...faqs, newItem];
      saveFaqsToBackend(updated, "Yeni SSS sorusu canlıya eklendi!");
    }

    setShowModal(false);
    setNewQ("");
    setNewA("");
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bu soruyu silmek istediğinize emin misiniz?")) return;
    const updated = faqs.filter((x) => x.id !== id);
    saveFaqsToBackend(updated, "Soru sistemden silindi.");
  };

  const startEdit = (item: FAQItem) => {
    setEditingId(item.id);
    setNewQ(item.q);
    setNewA(item.a);
    setShowModal(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Vitrin & İçerik /</span> Sıkça Sorulan Sorular - SSS (Supabase Canlı)
            </h4>
            <p className="text-slate-500 text-sm">
              Müşterilerin sipariş öncesi en çok merak ettiği soruları ve yanıtlarını yönetin. Anasayfada otomatik yayınlanır.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setNewQ("");
              setNewA("");
              setShowModal(true);
            }}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="shadow-sm flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs hover:opacity-95 transition"
          >
            <span>+ Yeni Soru Ekle</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm rounded-xl font-bold flex items-center gap-2 shadow-xs">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border">Sorular yükleniyor...</div>
        ) : (
          <div className="space-y-3">
            {faqs.map((item, idx) => (
              <div key={item.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#F5EFE6] text-[#2b2623] text-xs font-black px-2.5 py-0.5 rounded-md">
                      Soru #{idx + 1}
                    </span>
                    <h6 className="font-extrabold text-slate-800 text-base m-0">{item.q}</h6>
                  </div>
                  <p className="text-xs text-slate-600 m-0 leading-relaxed pt-1 whitespace-pre-line">{item.a}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="btn btn-sm btn-outline-secondary rounded-xl text-xs px-3 py-1.5 font-bold"
                  >
                    ✎ Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-sm btn-light text-danger rounded-xl text-xs px-3 py-1.5 font-bold"
                  >
                    🗑 Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Add / Edit */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between border-b pb-3">
                <h5 className="font-extrabold text-slate-800 text-base m-0">
                  {editingId ? "SSS Sorusu Düzenle" : "Yeni SSS Sorusu Ekle"}
                </h5>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 font-bold hover:text-slate-700">✕</button>
              </div>

              <form onSubmit={handleAddOrEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Soru Metni *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                    placeholder="Örn: Saat kaça kadar verilen siparişler aynı gün teslim edilir?"
                    value={newQ}
                    onChange={(e) => setNewQ(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cevap İçeriği *</label>
                  <textarea
                    rows={4}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623] leading-relaxed"
                    placeholder="Detaylı cevap açıklaması..."
                    value={newA}
                    onChange={(e) => setNewA(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl">İptal</button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-6 py-2 rounded-xl text-xs font-extrabold shadow-md hover:opacity-95 transition"
                  >
                    {saving ? "Kaydediliyor..." : (editingId ? "Değişiklikleri Kaydet" : "Soruyu Canlıya Ekle")}
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
