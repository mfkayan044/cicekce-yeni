"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { useStore, Product } from "@/lib/store";

export default function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { products, updateProduct, categories } = useStore();

  const currentProduct = products.find((p: Product) => String(p.id) === String(id));

  const [activeTab, setActiveTab] = useState<"TR" | "EN" | "DE" | "RU" | "CATS">("TR");
  const [uploading, setUploading] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [dynamicFilters, setDynamicFilters] = useState<any>(null);

  useEffect(() => {
    fetch("/api/filters").then(res => res.json()).then(data => setDynamicFilters(data)).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    code: "",
    category: "Buketler",
    price: "",
    oldPrice: "",
    discount: "%10",
    image: "",
    description: "",
    seoTitle: "",
    seoDesc: "",
    seoKeywords: "",
    stock: true,
    featured: true,
    selectedCategorySlugs: ["buketler"],
    designType: "Buket",
    recipient: "Sevgiliye",
    purpose: "Doğum Günü",
    color: "Kırmızı",
  });

  useEffect(() => {
    if (currentProduct) {
      setForm({
        title: currentProduct.title || "",
        slug: currentProduct.slug || "",
        code: currentProduct.code || `DM${currentProduct.id}`,
        category: currentProduct.category || "Buketler",
        price: currentProduct.price || "",
        oldPrice: currentProduct.oldPrice || "",
        discount: currentProduct.discount || "%10",
        image: currentProduct.image || "",
        description: currentProduct.description || "",
        seoTitle: `${currentProduct.title} Siparişi - Demo Çiçekçilik`,
        seoDesc: `${currentProduct.title} taze canlı çiçek buketini aynı gün teslimat fırsatıyla sipariş edin.`,
        seoKeywords: "çiçek, buket, orkide, gül",
        stock: currentProduct.stock !== undefined ? currentProduct.stock : true,
        featured: currentProduct.featured !== undefined ? currentProduct.featured : true,
        selectedCategorySlugs: (currentProduct as any).selectedCategorySlugs || [
          currentProduct.categorySlug || "buketler",
        ],
        designType: (currentProduct as any).designType || "Buket",
        recipient: (currentProduct as any).recipient || "Sevgiliye",
        purpose: (currentProduct as any).purpose || "Doğum Günü",
        color: (currentProduct as any).color || "Kırmızı",
      });
    }
  }, [currentProduct]);

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

  const toggleCategorySlug = (cSlug: string) => {
    let updated = [...form.selectedCategorySlugs];
    if (updated.includes(cSlug)) {
      updated = updated.filter((s) => s !== cSlug);
    } else {
      updated.push(cSlug);
    }
    setForm({ ...form, selectedCategorySlugs: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      alert("Lütfen ürün adını giriniz.");
      return;
    }

    const formattedPrice = form.price.includes("₺") ? form.price : `${form.price} ₺`;
    const formattedOldPrice = form.oldPrice ? (form.oldPrice.includes("₺") ? form.oldPrice : `${form.oldPrice} ₺`) : undefined;

    // Pick first selected category slug as main category
    const mainSlug = form.selectedCategorySlugs[0] || "buketler";
    const mainCatObj = categories.find((c: any) => c.slug === mainSlug);
    const mainCatName = mainCatObj ? mainCatObj.name : form.category;

    await updateProduct(id, {
      title: form.title,
      slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      code: form.code,
      category: mainCatName,
      categorySlug: mainSlug,
      selectedCategorySlugs: form.selectedCategorySlugs,
      price: formattedPrice,
      oldPrice: formattedOldPrice,
      discount: form.discount,
      image: form.image,
      description: form.description,
      stock: form.stock,
      featured: form.featured,
      designType: form.designType,
      recipient: form.recipient,
      purpose: form.purpose,
      color: form.color,
    } as any);

    alert("Ürün ve kategori seçimleri başarıyla kaydedildi! Ürün artık sadece seçtiğiniz kategorilerde görüntülenecektir.");
    router.push("/yonetim/urunler");
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-0">
        {/* Top Title Row */}
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
          <h4 className="fw-bold mb-0">Ürün Düzenle</h4>
          <Link href="/yonetim/urunler" className="btn btn-outline-secondary btn-sm">
            ← Geri
          </Link>
        </div>

        {/* Multi-Tab Bar */}
        <ul className="nav nav-tabs mb-4 border-bottom">
          <li className="nav-item">
            <button
              type="button"
              onClick={() => setActiveTab("TR")}
              className={`nav-link fw-bold ${activeTab === "TR" ? "active text-primary" : "text-muted"}`}
            >
              🇹🇷 Türkçe
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              onClick={() => setActiveTab("EN")}
              className={`nav-link ${activeTab === "EN" ? "active text-primary" : "text-muted"}`}
            >
              🇬🇧 İngilizce
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              onClick={() => setActiveTab("DE")}
              className={`nav-link ${activeTab === "DE" ? "active text-primary" : "text-muted"}`}
            >
              🇩🇪 Almanca
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              onClick={() => setActiveTab("RU")}
              className={`nav-link ${activeTab === "RU" ? "active text-primary" : "text-muted"}`}
            >
              🇷🇺 Rusça
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              onClick={() => setActiveTab("CATS")}
              className={`nav-link fw-bold ${activeTab === "CATS" ? "active text-primary" : "text-muted"}`}
            >
              🗂️ Kategoriler ({form.selectedCategorySlugs.length})
            </button>
          </li>
        </ul>

        {/* TAB 1: TÜRKÇE */}
        {(activeTab === "TR" || activeTab === "EN" || activeTab === "DE" || activeTab === "RU") && (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Left Column: SEO (Türkçe) */}
              <div className="col-12 col-lg-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white fw-bold border-bottom">
                    SEO ({activeTab === "TR" ? "Türkçe" : activeTab})
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label small text-muted">Meta Başlık (Title)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Sayfa başlığı..."
                        value={form.seoTitle}
                        onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Meta Açıklama (Description)</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Arama motoru açıklaması..."
                        value={form.seoDesc}
                        onChange={(e) => setForm({ ...form, seoDesc: e.target.value })}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted">Anahtar Kelimeler (Keywords)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="çiçek, buket, orkide"
                        value={form.seoKeywords}
                        onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Görseller Upload Area */}
              <div className="col-12 col-lg-6">
                <div className="card shadow-sm border-0 h-100">
                  <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
                    <span>Görseller</span>
                  </div>
                  <div className="card-body">
                    <div className="border-2 border-dashed rounded-3 p-4 text-center mb-3 bg-light">
                      <i className="bx bx-cloud-upload fs-1 text-primary mb-2"></i>
                      <div className="fw-semibold text-dark mb-1">
                        Görsel seç / sürükle
                      </div>
                      <div className="text-muted small mb-3" style={{ fontSize: "11px" }}>
                        JPG, PNG, WEBP — max 8MB
                      </div>
                      
                      <label className="btn btn-sm btn-primary cursor-pointer px-4">
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

                    {form.image && (
                      <div className="d-flex align-items-center gap-3 p-2 border rounded bg-white mb-3">
                        <div className="position-relative">
                          <img
                            src={form.image}
                            alt="Preview"
                            className="rounded border"
                            style={{ width: "70px", height: "70px", objectFit: "cover" }}
                          />
                          <span className="position-absolute top-0 start-0 badge bg-warning text-dark p-1">
                            ⭐ Main
                          </span>
                        </div>
                        <div className="flex-grow-1 overflow-hidden text-break small">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={form.image}
                            onChange={(e) => setForm({ ...form, image: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Section: Ürün Bilgileri */}
              <div className="col-12">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white fw-bold border-bottom">
                    Ürün Bilgileri (Türkçe)
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold small">Ürün Adı *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold small">URL (Slug)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.slug}
                          onChange={(e) => setForm({ ...form, slug: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-bold small">Ürün Kodu</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value })}
                        />
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-bold small">Ana Kategori *</label>
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

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-bold small">Fiyat (TL) *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm mt-3">
                      💾 Kaydet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 5: KATEGORİLER & FİLTRELER */}
        {activeTab === "CATS" && (
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-12 col-lg-8">
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white fw-bold border-bottom">
                    🗂️ Kategoriler
                    <div className="text-muted fw-normal small">
                      Bu ürünün görüntüleneceği kategorileri işaretleyin. Ürün SADECE işaretli kategorilerde çıkacaktır.
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row g-4">
                      {/* Dynamic Checkboxes from API Categories */}
                      {categories.map((cat: any) => {
                        const isChecked = form.selectedCategorySlugs.includes(cat.slug);
                        return (
                          <div key={cat.id} className="col-12 col-md-4">
                            <div className="form-check p-2 border rounded hover:bg-light transition">
                              <input
                                className="form-check-input cursor-pointer"
                                type="checkbox"
                                id={`cat-${cat.id}`}
                                checked={isChecked}
                                onChange={() => toggleCategorySlug(cat.slug)}
                              />
                              <label className="form-check-label fw-semibold cursor-pointer text-dark ms-2" htmlFor={`cat-${cat.id}`}>
                                {cat.name}
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Filter Attributes Pills */}
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white fw-bold border-bottom">
                    🎨 Filtre Özellikleri <a href="/yonetim/filtreler" target="_blank" className="btn btn-xs btn-outline-primary ms-3">⚙️ Filtre Ekle / Çıkar (Filtre Yönetimi)</a>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">Tasarım Tipi</label>
                      <div className="d-flex flex-wrap gap-1">
                        {(dynamicFilters?.designTypes || ["Buket", "Kutuda", "Aranjman", "Vazoda", "Tasarım"]).map((t: string) => (
                          <span
                            key={t}
                            onClick={() => setForm({ ...form, designType: t })}
                            className={`badge border px-3 py-2 cursor-pointer ${
                              form.designType === t ? "bg-primary text-white" : "bg-light text-dark"
                            }`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">Kime</label>
                      <div className="d-flex flex-wrap gap-1">
                        {(dynamicFilters?.recipients || ["Sevgiliye", "Anneye", "Eşe", "Arkadaşa", "İş Arkadaşına", "Kendine"]).map((r: string) => (
                          <span
                            key={r}
                            onClick={() => setForm({ ...form, recipient: r })}
                            className={`badge border px-3 py-2 cursor-pointer ${
                              form.recipient === r ? "bg-primary text-white" : "bg-light text-dark"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">Gönderim Amacı</label>
                      <div className="d-flex flex-wrap gap-1">
                        {(dynamicFilters?.purposes || ["Doğum Günü", "Yıl Dönümü", "Geçmiş Olsun", "Kutlama", "Özür", "Tebrik", "Sevgililer Günü"]).map((p: string) => (
                          <span
                            key={p}
                            onClick={() => setForm({ ...form, purpose: p })}
                            className={`badge border px-3 py-2 cursor-pointer ${
                              form.purpose === p ? "bg-primary text-white" : "bg-light text-dark"
                            }`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold small text-muted">Renk</label>
                      <div className="d-flex flex-wrap gap-2">
                        {(dynamicFilters?.colors || [
                          { name: "Kırmızı", dot: "🔴" },
                          { name: "Beyaz", dot: "⚪" },
                          { name: "Pembe", dot: "🌸" },
                          { name: "Sarı", dot: "🟡" },
                          { name: "Turuncu", dot: "🟠" },
                          { name: "Mor", dot: "🟣" },
                          { name: "Mavi", dot: "🔵" },
                          { name: "Karışık", dot: "🎨" },
                        ]).map((c: any) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setForm({ ...form, color: c.name })}
                            className={`btn btn-sm border d-flex align-items-center gap-1 ${
                              form.color === c.name ? "btn-primary" : "btn-light"
                            }`}
                          >
                            <span>{c.dot}</span>
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm">
                      💾 Kaydet
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Product Image Large Preview */}
              <div className="col-12 col-lg-4">
                <div className="card shadow-sm border-0 sticky-top" style={{ top: "90px" }}>
                  <div className="card-header bg-white fw-bold border-bottom">
                    🖼️ Seçilen Kategoriler
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-3">
                      <div className="small fw-bold text-muted mb-2">Bu Ürünün Yayınlanacağı Sayfalar:</div>
                      <div className="d-flex flex-wrap gap-1">
                        {form.selectedCategorySlugs.map((s) => (
                          <span key={s} className="badge bg-label-success">
                            /kategori/{s}
                          </span>
                        ))}
                      </div>
                    </div>
                    {form.image && (
                      <img
                        src={form.image}
                        alt={form.title}
                        className="w-100 rounded border object-fit-cover shadow-sm mt-3"
                        style={{ maxHeight: "300px" }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
