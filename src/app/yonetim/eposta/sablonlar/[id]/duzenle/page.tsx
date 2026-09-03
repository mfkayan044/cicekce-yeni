"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, use } from "react";

export default function EpostaSablonDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [subject, setSubject] = useState("Siparişiniz Alındı - #{SIPARIS_NO}");

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <Link href="/yonetim/eposta/sablonlar" className="btn btn-outline-secondary btn-sm">Geri</Link>
          <h4 className="font-bold text-xl text-slate-800 m-0">E-posta Şablonu Düzenle (ID: {id})</h4>
          <button className="btn btn-primary px-4 py-2 text-sm font-semibold">Kaydet</button>
        </div>
        <form className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">E-posta Konusu</label>
            <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
