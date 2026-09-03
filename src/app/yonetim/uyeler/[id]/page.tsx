"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { use } from "react";

export default function UyeDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/yonetim/uyeler" className="btn btn-outline-secondary btn-sm flex items-center gap-1 rounded-lg">
              <i className="bx bx-left-arrow-alt text-lg"></i>
              <span>Geri</span>
            </Link>
            <h4 className="font-bold text-xl text-slate-800 m-0">Üye Profil Kartı (ID: {id})</h4>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-4 max-w-2xl">
          <div className="flex items-center gap-4 border-b pb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-2xl">
              U
            </div>
            <div>
              <h5 className="font-bold text-lg text-slate-800">Demo Üye Kullanıcı #{id}</h5>
              <p className="text-sm text-slate-500">uye{id}@example.com</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="text-slate-500">Telefon:</span>
              <span className="font-semibold">+90 555 123 45 67</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-slate-500">Toplam Sipariş:</span>
              <span className="font-bold text-primary">3 Sipariş</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Hesap Durumu:</span>
              <span className="badge bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15">Aktif Üye</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
