"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, use } from "react";
import { useRouter } from "next/navigation";

export default function KategoriDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const [name, setName] = useState(id === "2" ? "Buketler" : "Aranjmanlar");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => router.push("/yonetim/kategoriler"), 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/yonetim/kategoriler" className="btn btn-outline-secondary btn-sm flex items-center gap-1 rounded-lg">
              <i className="bx bx-left-arrow-alt text-lg"></i>
              <span>Geri</span>
            </Link>
            <h4 className="font-bold text-xl text-slate-800 m-0">Kategori Düzenle (ID: {id})</h4>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary px-5 py-2 rounded-lg font-semibold shadow-md">
            Güncelle
          </button>
        </div>

        {saved && <div className="alert alert-success p-3 text-sm bg-[#F5EFE6] border border-amber-900/15">Kategori güncellendi!</div>}

        <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Kategori Adı</label>
            <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
