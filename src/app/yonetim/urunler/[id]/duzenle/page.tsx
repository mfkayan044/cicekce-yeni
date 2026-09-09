"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { useStore, Product, generateSeoDetails } from "@/lib/store";

export default function AdminEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { products, updateProduct, categories } = useStore();

  const handleAutoSeo = () => {
    if (!form.title) {
      alert("Lütfen önce ürün adını giriniz.");
      return;
    }
    const res = generateSeoDetails({
      title: form.title,
      category: form.category,
      designTypes: form.designTypes,
      recipients: form.recipients,
      purposes: form.purposes,
      colors: form.colors,
      price: form.price,
    });
    setForm((prev) => ({
      ...prev,
      description: res.description,
      seoTitle: res.seoTitle,
      seoDesc: res.seoDesc,
      seoKeywords: res.seoKeywords,
    }));
    alert("✨ Ürün açıklaması ve SEO meta bilgileri (Title, Description, Keywords) ürün detaylarına uygun olarak başarıyla oluşturuldu!");
  };

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
    designTypes: ["Buket"],
    recipients: ["Sevgiliye"],
    purposes: ["Doğum Günü"],
    colors: ["Kırmızı"],
  });

  useEffect(() => {
    if (currentProduct) {
      const p = currentProduct as any;
      
      let dTypes: string[] = Array.isArray(p.designTypes) ? p.designTypes : (p.designType ? [p.designType] : ["Buket"]);
      let recs: string[] = Array.isArray(p.recipients) ? p.recipients : (p.recipient ? [p.recipient] : ["Sevgiliye"]);
      let purps: string[] = Array.isArray(p.purposes) ? p.purposes : (p.purpose ? [p.purpose] : ["Doğum Günü"]);
      let cols: string[] = Array.isArray(p.colors) ? p.colors : (p.color ? [p.color] : ["Kırmızı"]);

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
        selectedCategorySlugs: p.selectedCategorySlugs || [currentProduct.categorySlug || "buketler"],
        designTypes: dTypes,
        recipients: recs,
        purposes: purps,
        colors: cols,
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

  const toggleMultiFilter = (field: "designTypes" | "recipients" | "purposes" | "colors", val: string) => {
    let currentList = Array.isArray(form[field]) ? [...form[field]] : [];
    if (currentList.includes(val)) {
      currentList = currentList.filter(item => item !== val);
    } else {
      currentList.push(val);
    }
    setForm({ ...form, [field]: currentList });
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
      designType: form.designTypes[0] || "Buket",
      designTypes: form.designTypes,
      recipient: form.recipients[0] || "Sevgiliye",
      recipients: form.recipients,
      purpose: form.purposes[0] || "Doğum Günü",
      purposes: form.purposes,
      color: form.colors[0] || "Kırmızı",
      colors: form.colors,
    } as any);

    alert("Ürün ve kategori seçimleri başarıyla kaydedildi! Ürün seçtiğiniz tüm kategorilerde ve filtrelerde aktif olacaktır.");
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
                  <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
                    <span>SEO ({activeTab === "TR" ? "Türkçe" : activeTab})</span>
                    <button
                      type="button"
                      onClick={handleAutoSeo}
                      className="btn btn-xs fw-bold px-2.5 py-1 rounded-lg border text-xs"
                      style={{ backgroundColor: "#f0fdf4", color: "#15803d", borderColor: "#86efac" }}
                    >
                      ✨ Otomatik SEO Oluştur
                    </button>
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

                    <div className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <label className="form-label fw-bold small mb-0">Ürün Açıklaması</label>
                        <button
                          type="button"
                          onClick={handleAutoSeo}
                          className="btn btn-xs btn-outline-primary fw-bold text-xs flex items-center gap-1 rounded-lg"
                          style={{ backgroundColor: "#f0fdf4", color: "#15803d", borderColor: "#86efac" }}
                        >
                          ✨ Otomatik SEO Açıklaması Oluştur
                        </button>
                      </div>
                      <textarea
                        className="form-control text-sm"
                        rows={5}
                        placeholder="Ürün hakkında detaylı bilgi... (Veya yukarıdaki butona tıklayarak otomatik oluşturabilirsiniz)"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
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

                {/* Filter Attributes Pills (Multi-Selectable) */}
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
                    <span>🎨 Filtre Özellikleri (Çoklu Seçilebilir)</span>
                    <a href="/yonetim/filtreler" target="_blank" className="btn btn-xs btn-outline-primary">⚙️ Filtre Yönetimi</a>
                  </div>
                  <div className="card-body">
                    {/* Tasarım Tipi */}
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">
                        Tasarım Tipi <span className="text-primary font-normal">({form.designTypes.length} Seçili)</span>
                      </label>
                      <div className="d-flex flex-wrap gap-1">
                        {(dynamicFilters?.designTypes || ["Buket", "Kutuda", "Aranjman", "Vazoda", "Tasarım", "Ayaklı Sepet", "Saksı"]).map((t: string) => {
                          const isSelected = form.designTypes.includes(t);
                          return (
                            <span
                              key={t}
                              onClick={() => toggleMultiFilter("designTypes", t)}
                              className={`badge border px-3 py-2 cursor-pointer transition ${
                                isSelected ? "bg-primary text-white shadow-sm" : "bg-light text-dark hover:bg-slate-200"
                              }`}
                            >
                              {t} {isSelected && "✓"}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Kime */}
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">
                        Kime <span className="text-primary font-normal">({form.recipients.length} Seçili)</span>
                      </label>
                      <div className="d-flex flex-wrap gap-1">
                        {(dynamicFilters?.recipients || ["Sevgiliye", "Anneye", "Eşe", "Arkadaşa", "İş Arkadaşına", "Kendine", "Öğretmene"]).map((r: string) => {
                          const isSelected = form.recipients.includes(r);
                          return (
                            <span
                              key={r}
                              onClick={() => toggleMultiFilter("recipients", r)}
                              className={`badge border px-3 py-2 cursor-pointer transition ${
                                isSelected ? "bg-primary text-white shadow-sm" : "bg-light text-dark hover:bg-slate-200"
                              }`}
                            >
                              {r} {isSelected && "✓"}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gönderim Amacı */}
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">
                        Gönderim Amacı <span className="text-primary font-normal">({form.purposes.length} Seçili)</span>
                      </label>
                      <div className="d-flex flex-wrap gap-1">
                        {(dynamicFilters?.purposes || ["Doğum Günü", "Yıl Dönümü", "Geçmiş Olsun", "Kutlama", "Özür", "Tebrik", "Sevgililer Günü", "Yeni Bebek", "Düğün Nişan", "Açılış"]).map((p: string) => {
                          const isSelected = form.purposes.includes(p);
                          return (
                            <span
                              key={p}
                              onClick={() => toggleMultiFilter("purposes", p)}
                              className={`badge border px-3 py-2 cursor-pointer transition ${
                                isSelected ? "bg-primary text-white shadow-sm" : "bg-light text-dark hover:bg-slate-200"
                              }`}
                            >
                              {p} {isSelected && "✓"}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Renk */}
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-muted">
                        Renk <span className="text-primary font-normal">({form.colors.length} Seçili)</span>
                      </label>
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
                        ]).map((c: any) => {
                          const isSelected = form.colors.includes(c.name);
                          return (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() => toggleMultiFilter("colors", c.name)}
                              className={`btn btn-sm border d-flex align-items-center gap-1 transition ${
                                isSelected ? "btn-primary shadow-sm text-white" : "btn-light text-dark"
                              }`}
                            >
                              <span>{c.dot}</span>
                              <span>{c.name}</span>
                              {isSelected && <span className="ms-1 fw-bold">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm">
                      💾 Kaydet
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Seçilen Kategoriler Box with Clickable Links */}
              <div className="col-12 col-lg-4">
                <div className="card shadow-sm border-0 sticky-top" style={{ top: "90px" }}>
                  <div className="card-header bg-white fw-bold border-bottom">
                    🖼️ Seçilen Kategoriler
                  </div>
                  <div className="card-body p-3">
                    <div className="mb-3">
                      <div className="small fw-bold text-muted mb-2">Bu Ürünün Yayınlanacağı Sayfalar:</div>
                      <div className="d-flex flex-wrap gap-1.5">
                        {form.selectedCategorySlugs.map((s) => (
                          <a
                            key={s}
                            href={`/kategori/${s}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge bg-success text-white text-decoration-none px-2.5 py-1.5 transition hover:opacity-85 shadow-2xs"
                            title="Canlı kategori sayfasında görüntüle"
                          >
                            /kategori/{s} ↗
                          </a>
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
