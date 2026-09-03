"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

interface ChatLog {
  id: string;
  visitor: string;
  msgCount: number;
  lastMsg: string;
  status: string;
  orderNo?: string;
  date: string;
}

export default function AsistanKonusmalariPage() {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchChats = async () => {
    try {
      const res = await fetch("/api/assistant-chats");
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
    fetchChats();
    const interval = setInterval(fetchChats, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu asistan konuşma kaydını silmek istediğinize emin misiniz?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/assistant-chats?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== id));
      } else {
        alert("Silme işlemi başarısız.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Tüm asistan konuşma geçmişini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/assistant-chats?all=true`, { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        alert("Tüm asistan konuşmaları başarıyla temizlendi.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    }
  };

  const filtered = logs.filter(
    (l) =>
      l.visitor.toLowerCase().includes(search.toLowerCase()) ||
      l.lastMsg.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Sipariş Merkezi /</span> Asistan Konuşmaları
            </h4>
            <p className="text-slate-500 text-sm">
              AI Canlı Asistan chatbot üzerinden müşterilerle yapılan canlı diyalog kayıtları.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-xs px-3.5 py-2 flex items-center gap-1.5 transition"
              >
                <span>🗑️ Tümünü Temizle</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchChats}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="font-bold rounded-xl text-xs px-4 py-2 flex items-center gap-1.5 shadow-xs hover:opacity-95 transition"
            >
              <span>🔄 Canlı Listeyi Yenile</span>
            </button>
          </div>
        </div>

        {/* Auto Cleanup Notice Banner */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="text-base">⏱️</span>
            <span>
              <strong>Otomatik Temizlik Aktif:</strong> Veritabanı ve sunucu belleğinin şişmesini önlemek amacıyla 20 dakikadan eski asistan konuşmaları sistem tarafından otomatik olarak temizlenir.
            </span>
          </div>
        </div>

        <div className="card border-0 shadow-xs rounded-xl p-4 bg-white">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              className="w-full pl-4 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2b2623]"
              placeholder="Müşteri, mesaj veya ID ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card border-0 shadow-xs rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Konuşma / Ziyaretçi</th>
                  <th className="px-4 py-3">Mesaj Sayısı</th>
                  <th className="px-4 py-3">Son Mesaj Özeti</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3 text-end" style={{ width: "160px" }}>Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Asistan konuşmaları yükleniyor...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Henüz asistan konuşma kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-bold text-[#2b2623]">
                        <Link href={`/yonetim/asistan-konusmalari/${l.id}`} className="hover:underline flex items-center gap-2">
                          <span>🎧</span>
                          <span>{l.visitor}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{l.msgCount} mesaj</td>
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{l.lastMsg}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 px-2.5 py-1 rounded-full text-xs font-semibold">
                          {l.status} {l.orderNo && `(${l.orderNo})`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{l.date}</td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/yonetim/asistan-konusmalari/${l.id}`}
                            className="btn btn-sm btn-outline-secondary rounded-lg text-xs px-2.5 py-1 inline-flex items-center gap-1"
                          >
                            <span>Oku</span>
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === l.id}
                            onClick={() => handleDelete(l.id)}
                            className="btn btn-sm btn-outline-danger rounded-lg text-xs px-2 py-1 text-red-600 hover:bg-red-50"
                          >
                            <span>🗑️</span>
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
      </div>
    </AdminLayout>
  );
}
