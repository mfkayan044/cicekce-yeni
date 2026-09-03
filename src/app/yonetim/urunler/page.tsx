"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useStore, Product } from "@/lib/store";
import { useState } from "react";

export default function AdminProductsPage() {
  const { products, deleteProduct, addProduct, updateProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredProducts = products.filter((p: Product) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(filteredProducts.map((p: Product) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleDuplicate = (p: Product) => {
    addProduct({
      title: `${p.title} (Kopya)`,
      category: p.category,
      categorySlug: p.categorySlug,
      price: p.price,
      oldPrice: p.oldPrice,
      discount: p.discount,
      image: p.image,
      description: p.description,
      stock: p.stock,
      featured: p.featured,
    });
    showToast(`"${p.title}" ürünü başarıyla kopyalandı!`);
  };

  const handleDeleteSelected = () => {
    if (selectedProductIds.length === 0) return;
    if (confirm(`${selectedProductIds.length} ürünü silmek istediğinize emin misiniz?`)) {
      selectedProductIds.forEach((id) => deleteProduct(id));
      setSelectedProductIds([]);
      showToast("Seçilen ürünler silindi.");
    }
  };

  const handleToggleStock = async (p: Product) => {
    const newStock = !p.stock;
    await updateProduct(p.id, { stock: newStock });
    showToast(`"${p.title}" durumu ${newStock ? "AKTİF" : "PASİF"} yapıldı.`);
  };

  const handleToggleFeatured = async (p: Product) => {
    const newFeatured = !p.featured;
    await updateProduct(p.id, { featured: newFeatured });
    showToast(`"${p.title}" menü vitrini ${newFeatured ? "AÇILDI" : "KAPATILDI"}.`);
  };

  return (
    <AdminLayout>
      <div className="container-fluid px-0">
        {/* Toast Notification */}
        {toastMsg && (
          <div
            className="position-fixed top-0 end-0 m-4 p-3 bg-success text-white rounded shadow-lg z-50 animate-in fade-in"
            style={{ zIndex: 9999 }}
          >
            ✓ {toastMsg}
          </div>
        )}

        {/* Top Header Row */}
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">Ürünler</h3>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-danger btn-sm dropdown-toggle" type="button">
              Vitrini Temizle
            </button>
            <Link href="/yonetim/urunler/yeni" className="btn btn-primary btn-sm px-3 fw-bold d-flex align-items-center gap-1">
              <span>+ Yeni Ürün</span>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ürün adı veya kodu ara (ör. GC31)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <select
                  className="form-select form-select-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="ALL">Tüm kategoriler</option>
                  <option value="Buketler">Buketler</option>
                  <option value="Aranjmanlar">Aranjmanlar</option>
                  <option value="Güller">Güller</option>
                  <option value="Gerbera">Gerbera</option>
                  <option value="Saksı Çiçeği">Saksı Çiçeği</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <button className="btn btn-outline-secondary btn-sm w-100 fw-semibold">
                  Filtrele
                </button>
              </div>
            </div>

            {/* Selection info & Batch actions */}
            <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top">
              <span className="text-muted small">
                {selectedProductIds.length} ürün seçildi
              </span>
              <div className="d-flex align-items-center gap-2">
                {selectedProductIds.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                  >
                    <i className="bx bx-trash"></i>
                    <span>Seçilenleri Sil</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("ALL");
                    setSelectedProductIds([]);
                  }}
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                >
                  <i className="bx bx-refresh"></i>
                  <span>Tabloyu Sıfırla</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="card shadow-sm border-0">
          <div className="table-responsive text-nowrap">
            <table className="table table-hover align-middle mb-0 text-sm">
              <thead className="table-light">
                <tr className="text-uppercase small text-muted">
                  <th style={{ width: "40px" }} className="ps-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={
                        filteredProducts.length > 0 &&
                        selectedProductIds.length === filteredProducts.length
                      }
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th style={{ width: "110px" }}>İŞLEM</th>
                  <th style={{ width: "80px" }}>GÖRSEL</th>
                  <th>ÜRÜN</th>
                  <th style={{ width: "100px" }}>KOD</th>
                  <th style={{ width: "140px" }}>FİYAT</th>
                  <th style={{ width: "120px" }}>VİTRİN ⓘ</th>
                  <th style={{ width: "120px" }}>SLİDE ⓘ</th>
                  <th style={{ width: "110px" }}>DURUM ⓘ</th>
                  <th style={{ width: "130px" }}>MENÜ VİTRİNİ ⓘ</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p: Product) => {
                    const isSelected = selectedProductIds.includes(p.id);
                    const rawNumPrice = parseFloat(String(p.price).replace(/[^\d.]/g, "")) || 2500;

                    return (
                      <tr key={p.id} className={isSelected ? "table-active" : ""}>
                        <td className="ps-3">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={isSelected}
                            onChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <Link
                              href={`/yonetim/urunler/${p.id}/duzenle`}
                              className="btn btn-xs btn-icon btn-outline-secondary"
                              title="Düzenle"
                            >
                              <i className="bx bx-edit-alt"></i>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDuplicate(p)}
                              className="btn btn-xs btn-icon btn-outline-info"
                              title="Kopyala"
                            >
                              <i className="bx bx-copy"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`"${p.title}" ürününü silmek istediğinize emin misiniz?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="btn btn-xs btn-icon btn-outline-danger"
                              title="Sil"
                            >
                              <i className="bx bx-trash"></i>
                            </button>
                          </div>
                        </td>
                        <td>
                          <img
                            src={p.image}
                            alt={p.title}
                            className="rounded border"
                            style={{ width: "50px", height: "50px", objectFit: "cover" }}
                          />
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{p.title}</div>
                          <div className="text-muted small" style={{ fontSize: "11px" }}>
                            {p.slug}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-label-primary font-monospace">
                            {p.code || `DM${p.id}`}
                          </span>
                        </td>
                        <td>
                          <div className="small">
                            <div className="d-flex justify-content-between gap-2">
                              <span className="text-muted">TR</span>
                              <span className="fw-bold text-dark">{String(p.price)}</span>
                            </div>
                            <div className="d-flex justify-content-between gap-2 text-muted" style={{ fontSize: "10px" }}>
                              <span>EN</span>
                              <span>{Math.round(rawNumPrice / 50)} $</span>
                            </div>
                            <div className="d-flex justify-content-between gap-2 text-muted" style={{ fontSize: "10px" }}>
                              <span>DE</span>
                              <span>{Math.round(rawNumPrice / 55)} €</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1 fs-6">
                            <span title="Türkiye">🇹🇷</span>
                            <span title="İngiltere" className="opacity-50">🇬🇧</span>
                            <span title="Almanya" className="opacity-50">🇩🇪</span>
                            <span title="Rusya" className="opacity-50">🇷🇺</span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1 fs-6">
                            <span title="Türkiye">🇹🇷</span>
                            <span title="İngiltere" className="opacity-50">🇬🇧</span>
                            <span title="Almanya" className="opacity-50">🇩🇪</span>
                            <span title="Rusya" className="opacity-50">🇷🇺</span>
                          </div>
                        </td>
                        {/* DURUM Switch (Working Functionality) */}
                        <td>
                          <div className="form-check form-switch m-0 d-flex align-items-center gap-1">
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              checked={p.stock}
                              onChange={() => handleToggleStock(p)}
                            />
                            <span className={`small fw-semibold ${p.stock ? "text-success" : "text-danger"}`}>
                              {p.stock ? "Aktif" : "Pasif"}
                            </span>
                          </div>
                        </td>
                        {/* MENÜ VİTRİNİ Switch (Working Functionality) */}
                        <td>
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              checked={p.featured}
                              onChange={() => handleToggleFeatured(p)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center py-5 text-muted">
                      <i className="bx bx-package fs-1 d-block mb-2"></i>
                      Ürün bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
