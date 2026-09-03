"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Çiçek Rehberi");
  const [image, setImage] = useState("https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const autoSlug = val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setSlug(autoSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, category, image, summary, content }),
      });

      if (res.ok) {
        alert("Blog makalesi başarıyla yayınlandı!");
        router.push("/yonetim/blog");
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">Yeni Blog Yazısı Ekle</h4>
            <p className="text-slate-500 text-sm">Google'da üst sıralara çıkmak için SEO odaklı makale yazın.</p>
          </div>
          <Link href="/yonetim/blog" className="btn btn-outline-secondary">
            ← Geri Dön
          </Link>
        </div>

        <div className="card border-0 shadow-sm rounded-xl p-6 bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-3">
              <label className="form-label fw-bold">Makale Başlığı (H1)</label>
              <input
                type="text"
                className="form-control fw-bold"
                placeholder="Örn: Evde Orkide Bakımı Nasıl Yapılır?"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-bold">URL Bağlantısı (Slug)</label>

                <input
                  type="text"
                  className="form-control text-muted"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-bold">Kategori</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Çiçek Rehberi">Çiçek Rehberi</option>
                  <option value="Çiçek Bakımı">Çiçek Bakımı</option>
                  <option value="Pratik İpuçları">Pratik İpuçları</option>
                  <option value="Özel Günler">Özel Günler</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Kapak Görseli URL</label>
              <input
                type="text"
                className="form-control"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Özet Metni (Arama Sonuçlarında Görünür)</label>
              <textarea
                rows={2}
                className="form-control text-sm"
                placeholder="Makalenin kısa özeti..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-bold">Makale Detay İçeriği</label>
              <textarea
                rows={12}
                className="form-control text-sm font-sans"
                placeholder="Detaylı makale içeriğini yazın..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={saving} className="btn btn-primary px-5 fw-bold shadow-sm">
              {saving ? "Yayınlanıyor..." : "🚀 Blog Makalesini Yayınla"}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
