"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import { useState } from "react";

export default function DillerPage() {
  const [langs, setLangs] = useState([
    { code: "TR", name: "Türkçe (Ana Dil)", flag: "🇹🇷", active: true, default: true },
    { code: "EN", name: "İngilizce (English)", flag: "🇬🇧", active: true, default: false },
    { code: "DE", name: "Almanca (Deutsch)", flag: "🇩🇪", active: true, default: false },
    { code: "RU", name: "Rusça (Русский)", flag: "🇷🇺", active: true, default: false },
  ]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
            <span className="text-slate-400 fw-light">Sistem Ayarları /</span> Dil Yönetimi
          </h4>
          <p className="text-slate-500 text-sm">Çoklu dil desteği, varsayılan para birimleri ve çeviri ayarları.</p>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Bayrak</th>
                  <th className="px-4 py-3">Dil Adı</th>
                  <th className="px-4 py-3">Dil Kodu</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {langs.map((l) => (
                  <tr key={l.code}>
                    <td className="px-4 py-3 text-2xl">{l.flag}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{l.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${l.default ? "bg-primary text-white" : "bg-[#F5EFE6] text-[#2b2623]"}`}>
                        {l.default ? "Varsayılan" : "Aktif"}
                      </span>
                    </td>
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
