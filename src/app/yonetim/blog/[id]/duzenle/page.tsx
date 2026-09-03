"use client";
import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenericFormPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => router.push("/yonetim/blog"), 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/yonetim/blog" className="btn btn-outline-secondary btn-sm flex items-center gap-1 rounded-lg">
              <i className="bx bx-left-arrow-alt text-lg"></i>
              <span>Geri / İptal</span>
            </Link>
            <h4 className="font-bold text-xl text-slate-800 m-0">Blog Yazısı Düzenle</h4>
          </div>
          <button onClick={handleSubmit} className="btn btn-primary px-5 py-2 rounded-lg font-semibold shadow-md">
            <i className="bx bx-check text-lg me-1"></i> Kaydet
          </button>
        </div>

        {saved && <div className="alert alert-success p-3 text-sm bg-[#F5EFE6] border border-amber-900/15">Kayıt başarıyla güncellendi!</div>}

        <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-4">
          
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Yazı Başlığı</label>
            <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Orkide Bakım Rehberi" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Özet</label>
            <input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Evde orkide sulama tavsiyeleri..." required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Görsel / Dosya Yükle</label>
            <input type="file" className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50" />
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
