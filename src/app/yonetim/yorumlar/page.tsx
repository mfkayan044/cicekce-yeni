"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Review {
  id: string;
  product: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  status: string;
}

export default function YorumlarPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Form State for New Review
  const [product, setProduct] = useState("");
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const fetchReviewsAndProducts = async () => {
    try {
      const [resRev, resProd] = await Promise.all([
        fetch("/api/reviews"),
        fetch("/api/products"),
      ]);

      if (resRev.ok) {
        const revData = await resRev.json();
        setReviews(revData);
      }

      if (resProd.ok) {
        const prodData = await resProd.json();
        setProductList(prodData);
        if (prodData.length > 0 && !product) {
          setProduct(prodData[0].title);
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsAndProducts();
  }, []);

  const handleToggleStatus = async (review: Review) => {
    const newStatus = review.status === "Onaylandı" ? "Onay Bekliyor" : "Onaylandı";
    const updated = { ...review, status: newStatus };
    setReviews(reviews.map((r) => (r.id === review.id ? updated : r)));

    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setToastMsg(`Yorum durumu "${newStatus}" olarak değiştirildi.`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      setReviews(reviews.filter((r) => r.id !== id));
      setToastMsg("Yorum silindi.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !text.trim()) return;

    try {
      const selectedProdTitle = product || (productList.length > 0 ? productList[0].title : "35 adet Krizantem Buketi");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: selectedProdTitle,
          author,
          rating: Number(rating),
          text,
          status: "Onaylandı",
        }),
      });

      if (res.ok) {
        setToastMsg("Yeni müşteri yorumu başarıyla eklendi ve ilgili ürünün sayfasında yayınlandı!");
        setAuthor("");
        setText("");
        setShowModal(false);
        fetchReviewsAndProducts();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {}
  };

  const renderStars = (starCount: number) => {
    return "⭐".repeat(starCount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Çiçek Kataloğu /</span> Çiçek Yorumları
            </h4>
            <p className="text-slate-500 text-sm">
              Müşterilerin sipariş sonrası ürünlerinize bıraktığı yıldızlı puan ve yorum yönetimi.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
            >
              <span>➕ Manuel Yorum Ekle</span>
            </button>
            <Link
              href="/yonetim/yorumlar/google"
              className="btn btn-outline-primary shadow-sm flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs"
            >
              <i className="bx bxl-google text-lg"></i>
              <span>Google Yorumlarına Git</span>
            </Link>
          </div>
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
                  <th className="px-4 py-3">Ürün</th>
                  <th className="px-4 py-3">Müşteri</th>
                  <th className="px-4 py-3">Puan</th>
                  <th className="px-4 py-3">Yorum Metni</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Durum</th>
                  <th style={{ width: "160px" }} className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      Yorumlar yükleniyor...
                    </td>
                  </tr>
                ) : reviews.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      Henüz yorum kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-extrabold text-slate-900">{r.product}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{r.author}</td>
                      <td className="px-4 py-3 text-xs">{renderStars(r.rating)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{r.text}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{r.date}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(r)}
                          className={`badge border px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                            r.status === "Onaylandı"
                              ? "bg-emerald-100 text-[#1a1918] border-emerald-300"
                              : "bg-amber-100 text-amber-800 border-amber-300"
                          }`}
                        >
                          {r.status === "Onaylandı" ? "✓ Onaylandı" : "⏳ Onay Bekliyor"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(r)}
                            className="btn btn-sm btn-outline-secondary rounded-lg text-xs px-2 py-1 font-bold"
                          >
                            {r.status === "Onaylandı" ? "Beklemeye Al" : "Onayla"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            className="btn btn-sm btn-outline-danger rounded-lg text-xs px-2 py-1"
                          >
                            <span>🗑️ Sil</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Adding New Review with Product Select Dropdown */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-lg text-slate-800">Manuel Yorum Ekle</h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Yorum Yapılacak Ürün *</label>
                  <select
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                  >
                    {productList.map((p: any) => (
                      <option key={p.id} value={p.title}>
                        {p.title} ({p.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Müşteri Adı Soyadı *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Örn: Ayşe Yılmaz"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Yıldız Puanı (1-5)</label>
                  <select
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Yıldız - Mükemmel)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Yıldız - Çok İyi)</option>
                    <option value={3}>⭐⭐⭐ (3 Yıldız - Orta)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Yorum Metni *</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Müşteri görüşü veya tecrübesi..."
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
                    Kaydet ve Onayla
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
