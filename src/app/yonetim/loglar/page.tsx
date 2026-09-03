"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState } from "react";

interface LogEntry {
  id: string;
  date: string;
  user: string;
  action: string;
  ip: string;
}

const initialLogs: LogEntry[] = [
  { id: "1", date: "30.08.2026 14:50", user: "Demo Yönetici", action: "Sistem Ayarları Güncellendi (Ayarlar)", ip: "85.105.12.44" },
  { id: "2", date: "30.08.2026 14:15", user: "Demo Yönetici", action: "Ürün Fiyatı Değiştirildi (PRO-101)", ip: "85.105.12.44" },
  { id: "3", date: "30.08.2026 13:00", user: "Demo Yönetici", action: "Yönetici Paneline Giriş Yapıldı", ip: "85.105.12.44" },
];

export default function LoglarPage() {
  const [logs] = useState<LogEntry[]>(initialLogs);
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");

  const filteredLogs = logs.filter((l) => {
    const matchesQ = !q || l.action.toLowerCase().includes(q.toLowerCase()) || l.user.toLowerCase().includes(q.toLowerCase());
    return matchesQ;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
            <span className="text-slate-400 fw-light">Sistem Ayarları /</span> İşlem Logları (Audit Logs)
          </h4>
          <p className="text-slate-500 text-sm">Yöneticilerin admin paneli üzerinde gerçekleştirdiği tüm işlem ve erişim kayıtları.</p>
        </div>

        {/* Real Filter Form matching original site inputs `q`, `date`, `action`, `user` */}
        <div className="card border-0 shadow-sm rounded-xl p-4 bg-white">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              name="q"
              className="px-3 py-2 border rounded-lg text-sm outline-none flex-grow"
              placeholder="İşlem veya Kullanıcı ara..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <input
              type="date"
              name="date"
              className="px-3 py-2 border rounded-lg text-sm outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button type="button" onClick={() => { setQ(""); setDate(""); }} className="btn btn-light px-4 py-2 text-sm rounded-lg">
              Temizle
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Kullanıcı</th>
                  <th className="px-4 py-3">Gerçekleştirilen İşlem</th>
                  <th className="px-4 py-3">IP Adresi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{l.user}</td>
                    <td className="px-4 py-3 text-slate-700">{l.action}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
