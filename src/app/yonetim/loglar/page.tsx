"use client";

import { useState, useEffect } from "react";
import AdminNavbar from "@/components/layout/AdminNavbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { History, Search, Trash2, RefreshCw, ShieldCheck, Filter } from "lucide-react";

export default function LoglarPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/loglar");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClearLogs = async () => {
    if (!confirm("Tüm işlem kayıtlarını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch("/api/loglar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      if (res.ok) {
        setLogs([]);
        setToastMsg("Tüm işlem logları temizlendi!");
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Loglar silinirken hata oluştu.");
    }
  };

  const filteredLogs = logs.filter((l) => {
    const term = q.toLowerCase();
    const matchesQ =
      !q ||
      (l.action || "").toLowerCase().includes(term) ||
      (l.user || "").toLowerCase().includes(term) ||
      (l.ip || "").includes(term);
    const matchesDate = !date || (l.date || "").includes(date);
    return matchesQ && matchesDate;
  });

  return (
    <div className="layout-wrapper layout-content-navbar min-h-screen bg-slate-50 flex">
      <AdminSidebar />

      <div className="layout-page flex-1 flex flex-col min-w-0">
        <AdminNavbar />

        <div className="content-wrapper p-6 flex-1 max-w-6xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black">
                <History className="w-6 h-6 text-amber-900" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">İşlem & Güvenlik Logları (Audit Logs)</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Yöneticilerin panel üzerinde gerçekleştirdiği işlem ve güvenlik erişim kayıtları
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchLogs}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yenile</span>
              </button>
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-black rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Logları Temizle</span>
              </button>
            </div>
          </div>

          {toastMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-[#2b2623]"
                placeholder="İşlem detayı, kullanıcı adı veya IP adresi ara..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button
                onClick={() => { setQ(""); setDate(""); }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Filtreyi Temizle
              </button>
            </div>
          </div>

          {/* Log Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-extrabold text-slate-400">Loglar yükleniyor...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-xs font-bold text-slate-500">
                Aradığınız kriterlere uygun işlem kaydı bulunamadı.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Tarih / Saat</th>
                      <th className="px-5 py-3.5">Kullanıcı</th>
                      <th className="px-5 py-3.5">İşlem Detayı</th>
                      <th className="px-5 py-3.5">IP Adresi</th>
                      <th className="px-5 py-3.5 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">{log.date}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">{log.user || "Admin"}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{log.action}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">{log.ip || "127.0.0.1"}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                              log.status === "Hata"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {log.status || "Başarılı"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
