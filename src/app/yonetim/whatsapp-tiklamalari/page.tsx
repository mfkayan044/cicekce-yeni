"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

interface ClickLog {
  id: number;
  date: string;
  type: string;
  product: string;
  button: string;
  page: string;
  ip: string;
  device: string;
  lang: string;
}

export default function WhatsAppTiklamalariPage() {
  const [logs, setLogs] = useState<ClickLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tur, setTur] = useState("HEPSI");
  const [buton, setButon] = useState("HEPSI");
  const [deleteModal, setDeleteModal] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/whatsapp-clicks");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteItem = async (id: number) => {
    try {
      await fetch(`/api/whatsapp-clicks?id=${id}`, { method: "DELETE" });
      setLogs(logs.filter((x) => x.id !== id));
      setToastMsg("Tıklama kaydı silindi.");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {}
  };

  const handleDeleteOld = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/whatsapp-clicks?id=all", { method: "DELETE" });
      setLogs([]);
      setDeleteModal(false);
      setToastMsg("WhatsApp tıklama kayıtları temizlendi!");
      setTimeout(() => setToastMsg(""), 4000);
    } catch (e) {}
  };

  const filteredLogs = logs.filter((l) => {
    const matchesQ = !q || l.product.toLowerCase().includes(q.toLowerCase()) || l.ip.includes(q) || l.button.toLowerCase().includes(q.toLowerCase());
    const matchesTur = tur === "HEPSI" || l.type === tur;
    const matchesButon = buton === "HEPSI" || l.button === buton;
    return matchesQ && matchesTur && matchesButon;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Sipariş Merkezi /</span> WhatsApp Tıklamaları
            </h4>
            <p className="text-slate-500 text-sm">Sitedeki WhatsApp düğmelerine tıklayan müşterilerin canlı log kaydı ve analizi.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteModal(true)}
              className="btn btn-outline-danger btn-sm rounded-lg flex items-center gap-1 font-semibold"
            >
              <span>Eski Kayıtları Sil</span>
            </button>
            <button
              type="button"
              onClick={fetchLogs}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="btn btn-sm rounded-lg flex items-center gap-1 font-semibold"
            >
              <span>🔄 Canlı Yenile</span>
            </button>
          </div>
        </div>

        {toastMsg && (
          <div className="alert alert-success p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm flex items-center gap-2 rounded-lg">
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Filter Form */}
        <div className="card border-0 shadow-sm rounded-xl p-5 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Arama Kriteri</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                placeholder="Ürün, IP veya Buton ara..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Tür</label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                value={tur}
                onChange={(e) => setTur(e.target.value)}
              >
                <option value="HEPSI">Tümü</option>
                <option value="Ürün Sayfası">Ürün Sayfası</option>
                <option value="Anasayfa">Anasayfa</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Buton Türü</label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                value={buton}
                onChange={(e) => setButon(e.target.value)}
              >
                <option value="HEPSI">Tümü</option>
                <option value="WhatsApp İle Sipariş Ver">WhatsApp İle Sipariş Ver</option>
                <option value="Hızlı WhatsApp Destek">Hızlı WhatsApp Destek</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Tür</th>
                  <th className="px-4 py-3">İlgilenilen Ürün</th>
                  <th className="px-4 py-3">Buton Metni</th>
                  <th className="px-4 py-3">Cihaz & IP</th>
                  <th className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Tıklama kayıtları yükleniyor...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Henüz WhatsApp tıklama kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id}>
                      <td className="px-4 py-3 text-xs text-slate-500">{l.date}</td>
                      <td className="px-4 py-3"><span className="badge bg-green-50 text-green-700 border border-green-200">{l.type}</span></td>
                      <td className="px-4 py-3 font-bold text-slate-800">{l.product}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-[#1a1918]">{l.button}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{l.device} ({l.ip})</td>
                      <td className="px-4 py-3 text-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(l.id)}
                          className="btn btn-sm btn-light text-danger rounded-circle w-8 h-8 inline-flex items-center justify-center"
                        >
                          <span>🗑️</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Old Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-lg text-slate-800">Eski Kayıtları Temizle</h5>
                <button type="button" onClick={() => setDeleteModal(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                  ✕
                </button>
              </div>
              <form onSubmit={handleDeleteOld} className="space-y-4">
                <p className="text-xs text-slate-600">Tüm eski WhatsApp tıklama log kayıtları veritabanından silinecektir.</p>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setDeleteModal(false)} className="btn btn-light px-4 py-2 text-sm">İptal</button>
                  <button type="submit" className="btn btn-danger px-5 py-2 text-sm font-semibold">Tümünü Sil</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
