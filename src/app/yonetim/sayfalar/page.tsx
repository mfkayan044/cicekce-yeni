"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function AdminPagesManager() {
  const [pagesData, setPagesData] = useState<any>({});
  const [dynamicPageList, setDynamicPageList] = useState<Array<{ slug: string; label: string; category: string }>>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("hakkimizda");
  const [pageTitle, setPageTitle] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [customSlugInput, setCustomSlugInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllPagesAndFooter();
  }, []);

  const loadAllPagesAndFooter = async () => {
    try {
      const [pagesRes, footerRes] = await Promise.all([
        fetch("/api/pages"),
        fetch("/api/footer")
      ]);

      const pages = pagesRes.ok ? await pagesRes.json() : {};
      const footer = footerRes.ok ? await footerRes.json() : {};

      setPagesData(pages);

      // Build dynamic page list from Footer corporate links & service districts
      const list: Array<{ slug: string; label: string; category: string }> = [];

      // 1. Corporate Links
      if (Array.isArray(footer.corporateLinks)) {
        footer.corporateLinks.forEach((item: any) => {
          if (item.url) {
            const cleanSlug = item.url.startsWith("/") ? item.url.slice(1) : item.url;
            list.push({ slug: cleanSlug, label: item.title || cleanSlug, category: "Kurumsal Sayfalar" });
          }
        });
      }

      // 2. Service Districts
      if (Array.isArray(footer.serviceDistricts)) {
        footer.serviceDistricts.forEach((item: any) => {
          if (item.url) {
            const cleanSlug = item.url.startsWith("/") ? item.url.slice(1) : item.url;
            list.push({ slug: cleanSlug, label: item.title || cleanSlug, category: "Hizmet Bölgeleri" });
          }
        });
      }

      // Add default pages if not present
      const defaultPages = [
        { slug: "hakkimizda", label: "Hakkımızda", category: "Kurumsal Sayfalar" },
        { slug: "aydinlatma-metni-ve-gizlilik-politikasi", label: "Aydınlatma Metni & Gizlilik", category: "Kurumsal Sayfalar" },
        { slug: "kisisel-verilerin-korunmasi", label: "Kişisel Verilerin Korunması (KVKK)", category: "Kurumsal Sayfalar" },
        { slug: "cerez-politikasi", label: "Çerez Politikası", category: "Kurumsal Sayfalar" },
        { slug: "on-bilgilendirme-formu", label: "Ön Bilgilendirme Formu", category: "Kurumsal Sayfalar" },
        { slug: "iptal-ve-iade", label: "İptal ve İade Koşulları", category: "Kurumsal Sayfalar" },
        { slug: "iletisim", label: "İletişim Sayfası", category: "Kurumsal Sayfalar" },
      ];

      defaultPages.forEach((dp) => {
        if (!list.some((l) => l.slug === dp.slug)) {
          list.push(dp);
        }
      });

      // Merge any existing saved pages not in footer
      Object.keys(pages).forEach((savedSlug) => {
        if (!list.some((l) => l.slug === savedSlug)) {
          list.push({
            slug: savedSlug,
            label: pages[savedSlug].title || savedSlug,
            category: "Özel Sayfalar"
          });
        }
      });

      setDynamicPageList(list);

      // Select initial page
      const firstSlug = list[0]?.slug || "hakkimizda";
      setSelectedSlug(firstSlug);

      const existing = pages[firstSlug] || { title: list[0]?.label || firstSlug, content: "" };
      setPageTitle(existing.title || list[0]?.label || firstSlug);
      setPageContent(existing.content || "");

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = (slug: string) => {
    setSelectedSlug(slug);
    const existing = pagesData[slug] || {};
    const item = dynamicPageList.find((l) => l.slug === slug);
    setPageTitle(existing.title || item?.label || slug);
    setPageContent(existing.content || "");
  };

  const handleAddNewCustomPage = () => {
    if (!customSlugInput.trim()) return;
    const cleanSlug = customSlugInput.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!cleanSlug) return;

    if (!dynamicPageList.some((l) => l.slug === cleanSlug)) {
      const newItem = { slug: cleanSlug, label: customSlugInput.trim(), category: "Özel Sayfalar" };
      setDynamicPageList([...dynamicPageList, newItem]);
    }
    setCustomSlugInput("");
    handleSelectPage(cleanSlug);
  };

  const handleDeletePage = async (slugToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = dynamicPageList.find((l) => l.slug === slugToDelete);
    const label = item?.label || slugToDelete;

    if (!confirm(`"${label}" sayfasını ve metin içeriğini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/pages?slug=${slugToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove from local state
        setPagesData((prev: any) => {
          const copy = { ...prev };
          delete copy[slugToDelete];
          return copy;
        });

        const updatedList = dynamicPageList.filter((l) => l.slug !== slugToDelete);
        setDynamicPageList(updatedList);

        if (selectedSlug === slugToDelete) {
          const nextSlug = updatedList[0]?.slug || "";
          if (nextSlug) {
            handleSelectPage(nextSlug);
          } else {
            setSelectedSlug("");
            setPageTitle("");
            setPageContent("");
          }
        }
        alert(`"${label}" sayfası başarıyla silindi.`);
      } else {
        alert("Silme hatası oluştu.");
      }
    } catch (err) {
      alert("Hata oluştu.");
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlug) return;

    setSaving(true);
    try {
      const res = await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          title: pageTitle,
          content: pageContent,
        }),
      });

      if (res.ok) {
        setPagesData((prev: any) => ({
          ...prev,
          [selectedSlug]: { title: pageTitle, content: pageContent },
        }));
        alert(`"${pageTitle}" sayfa içeriği başarıyla kaydedildi! Sitede anında güncellendi.`);
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-5 text-center font-bold text-slate-600">Footer ve Sayfa içerikleri yükleniyor...</div>
      </AdminLayout>
    );
  }

  const selectedItem = dynamicPageList.find((l) => l.slug === selectedSlug);

  return (
    <AdminLayout>
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
          <div>
            <h3 className="fw-bold mb-1">Sayfa İçerikleri & Metin Düzenleyici (CMS)</h3>
            <p className="text-muted small mb-0">
              Footer'a eklediğiniz tüm Hizmet Bölgeleri ve Kurumsal sayfaların başlık ve uzun metin içeriklerini buradan yönetebilirsiniz.
            </p>
          </div>
          <div className="d-flex items-center gap-2">
            <a href={`/${selectedSlug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm fw-bold">
              👁️ Sayfayı Canlıda Gör
            </a>
            <button onClick={handleSavePage} disabled={saving} className="btn btn-primary fw-bold shadow-sm">
              {saving ? "Kaydediliyor..." : "💾 Sayfayı Kaydet"}
            </button>
          </div>
        </div>

        <div className="row g-4">
          {/* LEFT COLUMN: Dynamic Page List */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm border-0 mb-3">
              <div className="card-header bg-white fw-bold border-bottom d-flex items-center justify-content-between">
                <span>📄 Düzenlenecek Sayfalar ({dynamicPageList.length})</span>
              </div>
              <div className="card-body p-2" style={{ maxHeight: "600px", overflowY: "auto" }}>
                <div className="list-group list-group-flush">
                  {dynamicPageList.map((item) => {
                    const hasSavedContent = Boolean(pagesData[item.slug]?.content);
                    const isSelected = item.slug === selectedSlug;
                    return (
                      <div
                        key={item.slug}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectPage(item.slug)}
                        className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 rounded-2 mb-1 border-0 cursor-pointer ${
                          isSelected ? "bg-primary text-white fw-bold" : "hover:bg-light"
                        }`}
                      >
                        <div className="text-truncate me-2">
                          <div className="text-xs opacity-75">{item.category}</div>
                          <div className="text-sm truncate">{item.label}</div>
                          <div className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted"}`}>/{item.slug}</div>
                        </div>
                        <div className="d-flex align-items-center gap-1.5">
                          {hasSavedContent ? (
                            <span className={`badge rounded-pill ${isSelected ? "bg-white text-primary" : "bg-success"}`}>
                              Dolu
                            </span>
                          ) : (
                            <span className={`badge rounded-pill ${isSelected ? "bg-white/20 text-white" : "bg-light text-muted border"}`}>
                              Taslak
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeletePage(item.slug, e)}
                            className={`btn btn-xs ${isSelected ? "btn-outline-light text-white" : "btn-outline-danger"} p-1 leading-none rounded`}
                            title="Sayfayı Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Add New Custom Page Box */}
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white fw-bold border-bottom">
                ➕ Yeni Özel Sayfa Ekle
              </div>
              <div className="card-body p-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Örn: Garanti Şartları"
                    value={customSlugInput}
                    onChange={(e) => setCustomSlugInput(e.target.value)}
                  />
                  <button onClick={handleAddNewCustomPage} className="btn btn-sm btn-outline-primary fw-bold">
                    Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Content Editor */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
                <span>📝 Sayfa Metin İçeriği: <code className="text-primary">/{selectedSlug}</code></span>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSavePage} className="space-y-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold text-sm">Sayfa Başlığı (H1 & Meta Title)</label>
                    <input
                      type="text"
                      className="form-control fw-bold"
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      placeholder="Sayfa Başlığını Yazın..."
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold text-sm">Sayfa Detay Metni / Makale İçeriği</label>
                    <textarea
                      rows={14}
                      className="form-control text-sm font-sans"
                      value={pageContent}
                      onChange={(e) => setPageContent(e.target.value)}
                      placeholder="Sayfa detaylarını, kurumsal bilgileri veya bölge çiçekçi makale metinlerini buraya yazın..."
                    />
                  </div>

                  <div className="p-3 bg-light rounded-3 border text-xs text-muted">
                    💡 <b>İpucu:</b> Paragraflar arasında boşluk bırakabilirsiniz. Kaydettiğiniz an metin canlı sitede <code>/{selectedSlug}</code> adresinde anında yayına girer.
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
