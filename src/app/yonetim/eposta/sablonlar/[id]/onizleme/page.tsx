"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";

export default function EpostaSablonOnizlemePage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <Link href="/yonetim/eposta/sablonlar" className="btn btn-outline-secondary btn-sm">Geri</Link>
          <h4 className="font-bold text-xl text-slate-800 m-0">HTML E-posta Şablon Önizlemesi</h4>
        </div>
        <div className="card border-0 shadow-sm rounded-xl p-6 bg-white">
          <div className="p-4 border rounded-lg bg-slate-50 text-slate-800">
            <h3 className="font-bold text-xl text-primary">Demo Çiçekçilik</h3>
            <p className="mt-2 text-sm">Sayın Müşterimiz, 101 Kırmızı Gül Buketi siparişiniz başarıyla alınmıştır!</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
