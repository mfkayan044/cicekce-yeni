"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function YeniKuponPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/yonetim/kuponlar");
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/yonetim/kuponlar" className="btn btn-outline-secondary btn-sm flex items-center gap-1 rounded-lg">
              <i className="bx bx-left-arrow-alt text-lg"></i>
              <span>İptal</span>
            </Link>
            <h4 className="font-bold text-xl text-slate-800 m-0">Yeni Kupon Oluştur</h4>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary px-5 py-2 rounded-lg font-semibold shadow-md">
            Oluştur
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kupon Kodu *</label>
            <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm uppercase" placeholder="BAHAR2026" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">İndirim Miktarı / Yüzde *</label>
            <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="100 ₺ veya %10" value={discount} onChange={(e) => setDiscount(e.target.value)} required />
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
