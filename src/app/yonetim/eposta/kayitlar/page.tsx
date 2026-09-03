"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState } from "react";

export default function EpostaKayitlarPage() {
  const [logs, setLogs] = useState([
    { id: 1, date: "30.08.2026 14:15", to: "tekekt@example.com", subject: "Siparişiniz Alındı - #DM12", status: "Gönderildi" },
    { id: 2, date: "29.08.2026 18:40", to: "halil@example.com", subject: "Ödeme Bekleniyor - #DM11", status: "Gönderildi" },
  ]);
  const [q, setQ] = useState("");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Sipariş Merkezi /</span> E-posta Gönderim Kayıtları
            </h4>
            <p className="text-slate-500 text-sm">Sunucu üzerinden iletilen tüm e-postaların canlı log dökümü.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLogs([])} className="btn btn-outline-danger btn-sm rounded-lg flex items-center gap-1 font-semibold">
              <i className="bx bx-trash"></i> Tümünü Temizle
            </button>
            <Link href="/yonetim/eposta" className="btn btn-outline-secondary btn-sm rounded-lg flex items-center gap-1">
              <i className="bx bx-left-arrow-alt"></i> Gönderim Ayarları
            </Link>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Alıcı E-posta</th>
                  <th className="px-4 py-3">E-posta Konusu</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 text-xs text-slate-500">{l.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{l.to}</td>
                    <td className="px-4 py-3 text-slate-600">{l.subject}</td>
                    <td className="px-4 py-3"><span className="badge bg-[#F5EFE6] text-[#2b2623]">✓ {l.status}</span></td>
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
