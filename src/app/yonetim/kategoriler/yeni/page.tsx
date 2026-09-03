"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function YeniKategoriPage() {
  const router = useRouter();
  const { addCategory } = useStore();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("https://demo.procicek.com.tr/kategoriler/buketler.webp");
  const [saved, setSaved] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    addCategory({
      name,
      slug: finalSlug,
      image: image || "https://demo.procicek.com.tr/kategoriler/buketler.webp",
    });

    setSaved(true);
    setTimeout(() => router.push("/yonetim/kategoriler"), 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-xs">
          <div className="flex items-center gap-3">
            <Link href="/yonetim/kategoriler" className="btn btn-outline-secondary btn-sm flex items-center gap-1 rounded-lg">
              <span>← İptal</span>
            </Link>
            <h4 className="font-bold text-xl text-slate-800 m-0">Yeni Kategori & Story Ekle</h4>
          </div>
          <button
            onClick={handleSubmit}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="px-5 py-2 rounded-xl font-bold text-xs shadow-xs hover:opacity-95 transition"
          >
            Kaydet
          </button>
        </div>

        {saved && (
          <div className="alert alert-success p-3 text-xs font-bold bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 rounded-xl">
            ✓ Yeni kategori başarıyla eklendi! Mağaza story halkalarına yansıtılıyor...
          </div>
        )}

        <form onSubmit={handleSubmit} className="card border-0 shadow-xs rounded-2xl p-6 bg-white space-y-5">
          {/* Device Image Upload Area */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Category Story Görseli *</label>
            <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-2xl bg-slate-50">
              <img
                src={image}
                alt="Önizleme"
                className="w-16 h-16 rounded-full border-2 border-emerald-600 object-cover p-0.5 bg-white shadow-xs"
              />
              <div className="space-y-2">
                <label
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="cursor-pointer font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-2 shadow-xs hover:opacity-95 transition"
                >
                  <span>📁 Cihazdan Görsel Seç / Yükle</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
                <div className="text-[11px] text-slate-400 font-semibold">Bilgisayarınızdan veya telefonunuzdan istediğiniz görseli yükleyin.</div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Adı *</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
              placeholder="Örn: Saksı Çiçekleri"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
              }}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">URL (slug)</label>
            <input
              type="text"
              className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
              placeholder="saksi-cicekleri"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
