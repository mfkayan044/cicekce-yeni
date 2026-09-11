"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore, generateSeoDetails } from "@/lib/store";

export default function AdminNewProductPage() {
  const router = useRouter();
  const { addProduct, categories } = useStore();

  const [aiGenerating, setAiGenerating] = useState(false);

  const handleGeminiGenerate = async () => {
    if (!form.title.trim()) {
      alert("Lütfen içerik üretmeden önce bir Ürün Adı giriniz.");
      return;
    }

    setAiGenerating(true);
    try {
      const res = await fetch("/api/generate-product-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          price: form.price,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForm((prev: any) => ({
          ...prev,
          description: data.description || prev.description,
          seoTitle: data.seoTitle || prev.seoTitle,
          seoDesc: data.seoDesc || prev.seoDesc,
          seoKeywords: data.seoKeywords || prev.seoKeywords,
        }));
        alert(data.source === "gemini_ai" 
          ? "✨ Gemini 3.6 Flash Yapay Zeka ürününüz için %100 özgün açıklama ve SEO metinlerini başarıyla üretti!" 
          : "✨ Ürün açıklaması ve SEO metinleri başarıyla oluşturuldu!");
      } else {
        alert("İçerik oluşturulamadı: " + (data.error || "Hata"));
      }
    } catch (err) {
      alert("Yapay zeka ile içerik oluşturulurken bir hata meydana geldi.");
    } finally {
      setAiGenerating(false);
    }
  };

  const [form, setForm] = useState({
    title: "",
    category: categories[0]?.name || "Buketler",
    price: "",
    oldPrice: "",
    discount: "%10",
    image: "https://demo.procicek.com.tr/urunler/7-kirmizi-gul-ve-beyaz-bicme-179-v2.webp",
    description: "",
    seoTitle: "",
    seoDesc: "",
    seoKeywords: "",
    stock: true,
    featured: true,
  });

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setForm((prev) => ({ ...prev, image: data.url }));
        alert("Görsel bilgisayarınızdan başarıyla yüklendi!");
      } else {
        alert("Görsel yüklenemedi: " + (data.error || "Hata"));
      }
    } catch (err) {
      alert("Görsel yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      alert("Lütfen ürün başlığını giriniz.");
      return;
    }
    const formattedPrice = form.price.includes("₺") ? form.price : `${form.price} ₺`;
    const formattedOldPrice = form.oldPrice ? (form.oldPrice.includes("₺") ? form.oldPrice : `${form.oldPrice} ₺`) : undefined;

    await addProduct({
      title: form.title,
      category: form.category,
      price: formattedPrice,
      oldPrice: formattedOldPrice,
      discount: form.discount,
      image: form.image,
      description: form.description,
      seoTitle: form.seoTitle,
      seoDesc: form.seoDesc,
      seoKeywords: form.seoKeywords,
      stock: form.stock,
      featured: form.featured,
    });

    alert("Ürün başarıyla eklendi ve mağazada yayınlandı!");
    router.push("/yonetim/urunler");
  };

  return (
    <AdminLayout>
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-4 border-b pb-3">
                <h4 className="fw-bold mb-0">Yeni Ürün Ekle</h4>
                <Link href="/yonetim/urunler" className="btn btn-outline-secondary btn-sm">
                  ← Ürün Listesine Dön
                </Link>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Ürün Adı *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: 101 Kırmızı Gül Buketi"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-bold">Kategori *</label>
                    <select
                      className="form-select"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    >
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-bold">Satış Fiyatı (₺) *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: 2500"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-bold">Eski Fiyat (İndirim Öncesi)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: 2850 (Opsiyonel)"
                      value={form.oldPrice}
                      onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-bold">İndirim Oranı Etiketi</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Örn: %10"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    />
                  </div>
                </div>

                {/* PC File Upload & Image URL */}
                <div className="mb-4 p-3 border rounded bg-light">
                  <label className="form-label fw-bold d-block mb-2">Ürün Görseli *</label>
                  
                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-6">
                      <label className="btn btn-outline-primary w-100 d-flex align-items-center justify-center gap-2 cursor-pointer">
                        <i className="bx bx-upload fs-5"></i>
                        <span>{uploading ? "Yükleniyor..." : "📁 PC'den Görsel Yükle"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>

                    <div className="col-12 col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Veya Görsel URL'si (https://...)"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                      />
                    </div>
                  </div>

                  {form.image && (
                    <div className="mt-3 d-flex align-items-center gap-3 bg-white p-2 rounded border">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="rounded border"
                        style={{ width: "80px", height: "80px", objectFit: "cover" }}
                      />
                      <div className="text-muted small overflow-hidden text-break">
                        <div className="fw-bold text-dark">Seçilen Görsel:</div>
                        <code>{form.image}</code>
                      </div>
                    </div>
                  )}
                </div>

                {/* GEMINI AI CONTENT GENERATOR BANNER */}
                <div className="p-3 mb-4 rounded-3 border bg-gradient text-dark d-flex flex-wrap align-items-center justify-content-between gap-3 shadow-xs" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #eff6ff 100%)", borderColor: "#c084fc" }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 bg-primary text-white d-flex align-items-center justify-content-center font-bold" style={{ width: "40px", height: "40px", fontSize: "1.2rem", background: "linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)" }}>
                      ✨
                    </div>
                    <div>
                      <div className="fw-bold small text-dark">Gemini 3.6 Flash Yapay Zeka İçerik Asistanı</div>
                      <div className="text-muted small">Ürününüz için %100 özgün 3 paragraflık açıklama ve Google SEO etiketlerini otomatik yazar.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeminiGenerate}
                    disabled={aiGenerating}
                    className="btn btn-sm fw-bold px-3 py-2 rounded-3 text-white border-0 shadow-xs"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
                  >
                    {aiGenerating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        <span>Yapay Zeka Yazıyor...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ Gemini AI İle Özgün İçerik & SEO Üret</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <label className="form-label fw-bold mb-0">Ürün Açıklaması</label>
                  </div>
                  <textarea
                    className="form-control"
                    rows={6}
                    placeholder="Ürün hakkında detaylı bilgi... (Veya yukarıdaki Gemini AI butonuna tıklayarak otomatik özgün metin ürettirebilirsiniz)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {/* SEO META FIELDS */}
                <div className="p-3 border rounded bg-light mb-4 space-y-3">
                  <div className="fw-bold border-b pb-2 mb-3 text-dark d-flex align-items-center gap-2">
                    <span>🔍</span> <span>Google & Arama Motoru SEO Meta Bilgileri</span>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">SEO Başlığı (Meta Title)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Örn: 101 Kırmızı Gül Buketi Siparişi - Aynı Gün Teslimat | Çiçekçe"
                      value={form.seoTitle}
                      onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">SEO Açıklaması (Meta Description)</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={2}
                      placeholder="Google arama sonuçlarında görünecek çekici özet açıklama metni..."
                      value={form.seoDesc}
                      onChange={(e) => setForm({ ...form, seoDesc: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-bold small text-muted">SEO Anahtar Kelimeleri (Keywords)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="kırmızı gül, buket siparişi, taze çiçek, hızlı teslimat"
                      value={form.seoKeywords}
                      onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center gap-4 mb-4">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="stockSwitch"
                      checked={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.checked })}
                    />
                    <label className="form-check-label fw-bold" htmlFor="stockSwitch">Stokta Var</label>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="featuredSwitch"
                      checked={form.featured}
                      onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    />
                    <label className="form-check-label fw-bold" htmlFor="featuredSwitch">Ana Sayfa Vitrininde Göster</label>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 border-t pt-3">
                  <Link href="/yonetim/urunler" className="btn btn-outline-secondary">İptal</Link>
                  <button type="submit" className="btn btn-primary px-4 fw-bold">
                    <i className="bx bx-check me-1"></i> Ürünü Yayınla
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
