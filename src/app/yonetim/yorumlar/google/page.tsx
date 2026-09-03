"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

interface GoogleReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export default function GoogleYorumlariPage() {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const fetchGoogleReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        const googleOnly = data.filter((r: any) => r.isGoogle || r.source === "Google Maps");
        setReviews(googleOnly);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleReviews();
  }, []);

  const handleAddRealGoogleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !text.trim()) return;

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: "Çiçekce Google İşletme Yorumu",
          author,
          rating: Number(rating),
          text,
          status: "Onaylandı",
          isGoogle: true,
          source: "Google Maps",
        }),
      });

      if (res.ok) {
        setToastMsg("Çiçekce Google yorumu eklendi ve ana sayfada yayınlandı!");
        setAuthor("");
        setText("");
        setShowModal(false);
        fetchGoogleReviews();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu Google yorumunu silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      setReviews(reviews.filter((r) => r.id !== id));
      setToastMsg("Yorum silindi.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800 flex items-center gap-2">
              <i className="bx bxl-google text-blue-600 text-3xl"></i>
              <span>Çiçekce - Google Harita Yorumları Yönetimi</span>
            </h4>
            <p className="text-slate-500 text-sm">
              Çiçekce Google Haritalar profilinizdeki (<code className="text-blue-600 font-bold">https://share.google/ktlM8FeGrjNtk5PdT</code>) gerçek müşteri yorumlarını yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#4285F4", color: "#ffffff" }}
            className="font-bold rounded-xl text-xs px-5 py-3 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
          >
            <span>➕ Çiçekce İşletmemin Gerçek Yorumunu Ekle</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
          <div className="font-extrabold flex items-center gap-2 text-sm">
            <span>📍</span> <span>Bağlı İşletme Profiliniz: Çiçekce</span>
          </div>
          <p className="text-blue-800">
            Sahte / jenerik yorumlar tamamen temizlenmiştir. Çiçekce Google Haritalar sayfanızdaki gerçek müşteri isimlerini ve yorum metinlerini yukarıdaki yeşil <b>"➕ Çiçekce İşletmemin Gerçek Yorumunu Ekle"</b> butonuna basarak eklediğinizde sitenizde yayınlanacaktır.
          </p>
          <a
            href="https://share.google/ktlM8FeGrjNtk5PdT"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-blue-600 font-bold hover:underline pt-1"
          >
            Çiçekce Google Harita Sayfanızı Açmak İçin Tıklayın ↗
          </a>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="p-4 border-b bg-slate-50/50 flex justify-between items-center">
            <h5 className="font-extrabold text-slate-800 text-sm m-0 flex items-center gap-2">
              <span>Çiçekce Yayınlanan Gerçek Google Yorumları ({reviews.length})</span>
            </h5>
            <span className="badge bg-blue-100 text-blue-800 border border-blue-300 font-bold text-xs px-3 py-1 rounded-full">
              ✓ Çiçekce Google Profil Kaydı
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Müşteri Adı</th>
                  <th className="px-4 py-3">Puan</th>
                  <th className="px-4 py-3">Google Yorum Metni</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th style={{ width: "120px" }} className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Yorumlar yükleniyor...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Henüz Çiçekce işletmenize ait bir Google yorumu eklenmedi. Yukarıdaki "➕ Çiçekce İşletmemin Gerçek Yorumunu Ekle" butonuna basarak Google Haritanızdaki gerçek müşteri yorumlarınızı ekleyebilirsiniz.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-extrabold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          {(r.author || "G").slice(0, 2).toUpperCase()}
                        </div>
                        <span>{r.author}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-amber-400">{"⭐".repeat(r.rating || 5)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-md">"{r.text}"</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{r.date}</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleDelete(r.id)}
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-lg text-slate-800">Çiçekce Gerçek Google Yorumu Ekle</h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddRealGoogleReview} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Google Müşterisinin Adı Soyadı *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500"
                    placeholder="Örn: Ayşe Yılmaz"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Verdiği Yıldız Puanı</label>
                  <select
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Yıldız)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Yıldız)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Çiçekce Google Sayfanızdaki Yorum Metni *</label>
                  <textarea
                    rows={4}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                    placeholder="Çiçekce Google Haritanızda müşterinizin yazdığı gerçek yorum metnini kopyalayıp yapıştırın..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light px-4 py-2 text-sm font-bold">
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#4285F4", color: "#ffffff" }}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition"
                  >
                    Kaydet ve Sitede Yayınla
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
