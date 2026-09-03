"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import { useState } from "react";

export default function ManuelOdemelerPage() {
  const [links, setLinks] = useState([
    { id: "1", date: "29.08.2026 14:12", desc: "Özel Tasarım Çiçek Siparişi", amount: "4.100 ₺", payer: "Halil SERTKAYA", status: "Ödendi" },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    setLinks([...links, { id: Date.now().toString(), date: new Date().toLocaleString("tr-TR"), desc, amount: amount.includes("₺") ? amount : `${amount} ₺`, payer: "Müşteri", status: "Bekliyor" }]);
    setDesc("");
    setAmount("");
    setShowModal(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Teslimat & Kasa /</span> Manuel Ödemeler & Ödeme Linkleri
            </h4>
            <p className="text-slate-500 text-sm">Özel tutarlı müşteri siparişleri için SMS/WhatsApp ödeme linki oluşturun.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary shadow-sm flex items-center gap-2 px-4 py-2 rounded-lg font-semibold">
            <i className="bx bx-link text-lg"></i>
            <span>Yeni Ödeme Linki Oluştur</span>
          </button>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Açıklama / Ürün</th>
                  <th className="px-4 py-3">Tutar</th>
                  <th className="px-4 py-3">Ödeyen</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {links.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{l.desc}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{l.amount}</td>
                    <td className="px-4 py-3 text-slate-700">{l.payer}</td>
                    <td className="px-4 py-3"><span className="badge bg-[#F5EFE6] text-[#2b2623] border border-amber-900/15">{l.status}</span></td>
                    <td className="px-4 py-3 text-end">
                      <button onClick={() => setLinks(links.filter(x => x.id !== l.id))} className="btn btn-sm btn-light text-danger rounded-circle">
                        <i className="bx bx-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-lg text-slate-800">Ödeme Linki Oluştur</h5>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><i className="bx bx-x text-xl"></i></button>
              </div>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Açıklama</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Örn: Özel VIP Gül Buketi" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tutar (TL)</label>
                  <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Örn: 2500" required />
                </div>
                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light px-4 py-2 text-sm">İptal</button>
                  <button type="submit" className="btn btn-primary px-5 py-2 text-sm font-semibold">Link Üret</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
