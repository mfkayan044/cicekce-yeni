"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";
import { useStore, CategoryItem } from "@/lib/store";

export default function AdminVitrinPage() {
  const { categories, updateCategory } = useStore();
  const [heroData, setHeroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      const res = await fetch("/api/hero");
      const data = await res.json();
      setHeroData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, updateCallback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        updateCallback(data.url);
        alert("Görsel PC'den başarıyla yüklendi!");
      } else {
        alert("Görsel yüklenemedi: " + (data.error || "Hata"));
      }
    } catch (err) {
      alert("Görsel yükleme hatası.");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heroData),
      });
      if (res.ok) {
        alert("Ana Sayfa Slider, Bannerlar ve Görseller başarıyla kaydedildi!");
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Kaydetme hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const addSlider = () => {
    const sliders = heroData.sliders || [];
    if (sliders.length >= 4) {
      alert("Maksimum 4 adet slayt görseli ekleyebilirsiniz.");
      return;
    }
    const newId = sliders.length + 1;
    sliders.push({
      id: newId,
      title: `Yeni Slayt ${newId}`,
      price: "2.500 ₺",
      discountBadge: "%10 İndirim",
      image: "https://demo.procicek.com.tr/urunler/7-kirmizi-gul-ve-beyaz-bicme-179-v2.webp",
      link: "/urun/yeni-urun"
    });
    setHeroData({ ...heroData, sliders });
  };

  const removeSlider = (idx: number) => {
    const sliders = [...heroData.sliders];
    sliders.splice(idx, 1);
    setHeroData({ ...heroData, sliders });
  };

  if (loading || !heroData) {
    return (
      <AdminLayout>
        <div className="p-5 text-center">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  const sliders = heroData.sliders || [];

  return (
    <AdminLayout>
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
          <div>
            <h3 className="fw-bold mb-1">Vitrin & Slayt Yönetimi</h3>
            <p className="text-muted small mb-0">
              Ana sayfadaki büyük slayt görsellerini, 4 promo kartını, 3 yatay bannerı ve hikaye dairelerini ideal piksel ölçüleriyle buradan yönetebilirsiniz.
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn btn-primary px-4 fw-bold shadow-sm"
          >
            {saving ? "Kaydediliyor..." : "💾 Tüm Değişiklikleri Kaydet"}
          </button>
        </div>

        {/* SECTION 1: Ana Sayfa Büyük 4'lü Slayt */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
            <div>
              <span>🖼️ 1. Ana Sayfa Büyük Slayt (Hero Slider)</span>
              <span className="badge bg-label-info ms-2 font-monospace">
                📐 İdeal Görsel Boyutu: 1200 x 750 px (Oran 16:10)
              </span>
            </div>
            <button onClick={addSlider} disabled={sliders.length >= 4} className="btn btn-xs btn-outline-primary fw-bold">
              + Slayt Ekle ({sliders.length}/4)
            </button>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              {sliders.map((slide: any, idx: number) => (
                <div key={idx} className="col-12 col-md-6">
                  <div className="border rounded p-3 bg-light relative">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary">Slayt #{idx + 1}</span>
                      {sliders.length > 1 && (
                        <button onClick={() => removeSlider(idx)} className="btn btn-xs btn-outline-danger">
                          🗑️ Kaldır
                        </button>
                      )}
                    </div>

                    <div className="text-center mb-3">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-100 rounded border object-fit-cover shadow-sm mb-2"
                        style={{ height: "160px" }}
                      />
                      <div className="text-muted mb-2" style={{ fontSize: "11px" }}>
                        📐 Önerilen Görsel Boyutu: <b>1200 x 750 px</b>
                      </div>
                      <label className="btn btn-xs btn-outline-primary w-100">
                        <span>📁 PC'den Resim Yükle</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={(e) => handleFileUpload(e, (url) => {
                            const updated = [...heroData.sliders];
                            updated[idx].image = url;
                            setHeroData({ ...heroData, sliders: updated });
                          })}
                        />
                      </label>
                    </div>

                    <div className="mb-2">
                      <label className="form-label fw-bold small mb-1">Başlık Metni</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={slide.title}
                        onChange={(e) => {
                          const updated = [...heroData.sliders];
                          updated[idx].title = e.target.value;
                          setHeroData({ ...heroData, sliders: updated });
                        }}
                      />
                    </div>

                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">Fiyat Metni</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={slide.price}
                          onChange={(e) => {
                            const updated = [...heroData.sliders];
                            updated[idx].price = e.target.value;
                            setHeroData({ ...heroData, sliders: updated });
                          }}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-muted mb-1">İndirim Rozeti</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={slide.discountBadge}
                          onChange={(e) => {
                            const updated = [...heroData.sliders];
                            updated[idx].discountBadge = e.target.value;
                            setHeroData({ ...heroData, sliders: updated });
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label small text-muted mb-1">Tıklama Linki</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={slide.link}
                        onChange={(e) => {
                          const updated = [...heroData.sliders];
                          updated[idx].link = e.target.value;
                          setHeroData({ ...heroData, sliders: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: Sağdaki 4 Promo Kartı */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
            <span>🎴 2. Sağdaki 4 Promo Kartı</span>
            <span className="badge bg-label-success font-monospace">
              📐 İdeal Görsel Boyutu: 600 x 450 px (Oran 4:3)
            </span>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              {heroData.promoCards?.map((promo: any, idx: number) => (
                <div key={promo.id || idx} className="col-12 col-md-6">
                  <div className="border rounded p-3 bg-light">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      <img
                        src={promo.image}
                        alt={promo.title}
                        className="rounded border"
                        style={{ width: "90px", height: "70px", objectFit: "cover" }}
                      />
                      <div className="flex-grow-1">
                        <label className="form-label fw-bold small mb-1">{idx + 1}. Kart Başlığı</label>
                        <input
                          type="text"
                          className="form-control form-control-sm mb-1"
                          value={promo.title}
                          onChange={(e) => {
                            const updated = [...heroData.promoCards];
                            updated[idx].title = e.target.value;
                            setHeroData({ ...heroData, promoCards: updated });
                          }}
                        />
                        <div className="text-muted" style={{ fontSize: "10px" }}>
                          📐 İdeal Boyut: <b>600 x 450 px</b>
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="btn btn-sm btn-outline-secondary w-100">
                        <span>📁 PC'den Resim Yükle (600x450 px)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={(e) => handleFileUpload(e, (url) => {
                            const updated = [...heroData.promoCards];
                            updated[idx].image = url;
                            setHeroData({ ...heroData, promoCards: updated });
                          })}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="form-label small text-muted mb-1">Tıklama Linki</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={promo.link}
                        onChange={(e) => {
                          const updated = [...heroData.promoCards];
                          updated[idx].link = e.target.value;
                          setHeroData({ ...heroData, promoCards: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: Alttaki 3 Yatay Banner */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
            <span>📜 3. Alttaki 3 Yatay Banner</span>
            <span className="badge bg-label-warning font-monospace">
              📐 İdeal Görsel Boyutu: 800 x 450 px (Oran 16:9)
            </span>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              {heroData.horizontalBanners?.map((banner: any, idx: number) => (
                <div key={banner.id || idx} className="col-12 col-md-4">
                  <div className="border rounded p-3 bg-light">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-100 rounded border mb-2 object-fit-cover"
                      style={{ height: "110px" }}
                    />
                    <div className="text-muted text-center mb-2" style={{ fontSize: "10px" }}>
                      📐 İdeal Boyut: <b>800 x 450 px</b>
                    </div>
                    <div className="mb-2">
                      <label className="form-label fw-bold small mb-1">{idx + 1}. Banner Başlığı</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={banner.title}
                        onChange={(e) => {
                          const updated = [...heroData.horizontalBanners];
                          updated[idx].title = e.target.value;
                          setHeroData({ ...heroData, horizontalBanners: updated });
                        }}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="btn btn-sm btn-outline-primary w-100">
                        <span>📁 PC'den Banner Yükle (800x450 px)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={(e) => handleFileUpload(e, (url) => {
                            const updated = [...heroData.horizontalBanners];
                            updated[idx].image = url;
                            setHeroData({ ...heroData, horizontalBanners: updated });
                          })}
                        />
                      </label>
                    </div>
                    <div>
                      <label className="form-label small text-muted mb-1">Tıklama Linki</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={banner.link}
                        onChange={(e) => {
                          const updated = [...heroData.horizontalBanners];
                          updated[idx].link = e.target.value;
                          setHeroData({ ...heroData, horizontalBanners: updated });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: Yuvarlak Hikaye Kategorileri (Story Circles) */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
            <span>🟣 4. Üst Yuvarlak Hikaye Kategorileri (Story Circles)</span>
            <span className="badge bg-label-secondary font-monospace">
              📐 İdeal Görsel Boyutu: 300 x 300 px (Karesel 1:1)
            </span>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              {categories.map((cat: CategoryItem) => (
                <div key={cat.id} className="col-6 col-sm-4 col-md-3 text-center">
                  <div className="border rounded p-3 bg-light">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="rounded-circle border mx-auto mb-2"
                      style={{ width: "65px", height: "65px", objectFit: "cover" }}
                    />
                    <div className="fw-bold small text-dark mb-1">{cat.name}</div>
                    <div className="text-muted mb-2" style={{ fontSize: "10px" }}>
                      📐 İdeal Boyut: <b>300 x 300 px</b>
                    </div>
                    <label className="btn btn-xs btn-outline-secondary w-100">
                      <span>📁 Resim Değiştir</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={(e) => handleFileUpload(e, async (url) => {
                          updateCategory(cat.id, { image: url });
                          try {
                            await fetch("/api/categories", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: cat.id, name: cat.name, slug: cat.slug, image: url })
                            });
                          } catch (err) {}
                        })}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
