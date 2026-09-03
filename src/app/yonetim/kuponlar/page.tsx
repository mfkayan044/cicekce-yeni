"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

interface Coupon {
  id: string;
  code: string;
  discount: string;
  minCart: string;
  usage: string;
  active: boolean;
}

export default function KuponlarPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [minCart, setMinCart] = useState("500 ₺");
  const [toastMsg, setToastMsg] = useState("");

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          discount: discount || "100 ₺",
          minCart,
          usage: "0 / 100",
          active: true,
        }),
      });

      if (res.ok) {
        setToastMsg("Yeni indirim kuponu başarıyla oluşturuldu ve alışverişe açıldı!");
        setCode("");
        setDiscount("");
        setShowModal(false);
        fetchCoupons();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu kuponu silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/coupons?id=${id}`, { method: "DELETE" });
      setCoupons(coupons.filter((c) => c.id !== id));
      setToastMsg("Kupon silindi.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Çiçek Kataloğu /</span> Kupon Yönetimi
            </h4>
            <p className="text-slate-500 text-sm">
              Müşterilerin ödeme sayfasında kullanabileceği canlı indirim kodları ve promosyonlar.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
          >
            <span>➕ Yeni Kupon Oluştur</span>
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
                  <th className="px-4 py-3">Kupon Kodu</th>
                  <th className="px-4 py-3">İndirim Miktarı</th>
                  <th className="px-4 py-3">Min. Sepet Tutarı</th>
                  <th className="px-4 py-3">Kullanım Adedi</th>
                  <th className="px-4 py-3">Durum</th>
                  <th style={{ width: "120px" }} className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Kuponlar yükleniyor...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Henüz kupon kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-extrabold text-[#2b2623]">
                        <span className="bg-[#F5EFE6] border border-amber-900/15 px-2.5 py-1 rounded-lg">
                          🎟️ {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">{c.discount}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{c.minCart}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">{c.usage}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-emerald-100 text-[#1a1918] border border-emerald-300 px-2.5 py-1 rounded-full text-xs font-bold">
                          Aktif
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleDelete(c.id)}
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
                <h5 className="font-bold text-lg text-slate-800">Yeni İndirim Kuponu</h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kupon Kodu *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold uppercase outline-none focus:border-[#2b2623]"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Örn: HEDIYE10 veya BAHAR20"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İndirim Miktarı / Yüzdesi *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Örn: 150 ₺ veya %15"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Sepet Tutarı</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none"
                    value={minCart}
                    onChange={(e) => setMinCart(e.target.value)}
                    placeholder="500 ₺"
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
                    Oluştur ve Yayına Al
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
