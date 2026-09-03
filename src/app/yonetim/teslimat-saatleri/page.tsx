"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

interface Slot {
  id: string;
  order: number;
  range: string;
  fee: string;
  active: boolean;
}

export default function TeslimatSaatleriPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [range, setRange] = useState("");
  const [fee, setFee] = useState("0 ₺");
  const [toastMsg, setToastMsg] = useState("");

  const fetchSlots = async () => {
    try {
      const res = await fetch("/api/delivery-slots");
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!range.trim()) return;

    try {
      const res = await fetch("/api/delivery-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ range, fee: fee || "0 ₺", active: true }),
      });

      if (res.ok) {
        setToastMsg("Yeni teslimat saat aralığı eklendi ve tüm ürün sayfalarında aktifleşti!");
        setRange("");
        setFee("0 ₺");
        setShowModal(false);
        fetchSlots();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu teslimat saatini silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/delivery-slots?id=${id}`, { method: "DELETE" });
      setSlots(slots.filter((s) => s.id !== id));
      setToastMsg("Teslimat saati silindi.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Teslimat & Kasa /</span> Teslimat Saatleri
            </h4>
            <p className="text-slate-500 text-sm">
              Müşterilerin sipariş tamamlarken seçeceği canlı teslimat zaman aralıkları.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
          >
            <i className="bx bx-plus text-lg"></i>
            <span>Yeni Saat Aralığı Ekle</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Sıra</th>
                  <th className="px-4 py-3">Saat Aralığı</th>
                  <th className="px-4 py-3">Ek Kurye Ücreti</th>
                  <th className="px-4 py-3">Durum</th>
                  <th style={{ width: "120px" }} className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Teslimat saatleri yükleniyor...
                    </td>
                  </tr>
                ) : (
                  slots.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-bold text-slate-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-extrabold text-slate-800">{s.range}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{s.fee}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-emerald-100 text-[#1a1918] border border-emerald-300 font-bold text-xs px-3 py-1 rounded-full">
                          ✓ Aktif Slot
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          onClick={() => handleDelete(s.id)}
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
                <h5 className="font-bold text-lg text-slate-800">Yeni Saat Aralığı Ekle</h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Saat Aralığı Tanımı *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    placeholder="Örn: 15:00 - 17:00"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ek Kurye Ücreti (₺)</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="Örn: 0 ₺ veya 50 ₺ Ek Ücret"
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
                    Kaydet ve Yayınla
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
