"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function AdminFooterPage() {
  const [footerData, setFooterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFooterData();
  }, []);

  const fetchFooterData = async () => {
    try {
      const res = await fetch("/api/footer");
      const data = await res.json();
      setFooterData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(footerData),
      });
      if (res.ok) {
        alert("Footer bağlantıları, hizmet bölgeleri ve iletişim bilgileri başarıyla kaydedildi!");
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const addCorporateLink = () => {
    const updated = [...(footerData.corporateLinks || [])];
    updated.push({ title: "Yeni Sayfa", url: "/yeni-sayfa" });
    setFooterData({ ...footerData, corporateLinks: updated });
  };

  const removeCorporateLink = (idx: number) => {
    const updated = [...footerData.corporateLinks];
    updated.splice(idx, 1);
    setFooterData({ ...footerData, corporateLinks: updated });
  };

  const addServiceDistrict = () => {
    const updated = [...(footerData.serviceDistricts || [])];
    updated.push({ title: "Yeni Çiçekçi", url: "/yeni-cicekci" });
    setFooterData({ ...footerData, serviceDistricts: updated });
  };

  const removeServiceDistrict = (idx: number) => {
    const updated = [...footerData.serviceDistricts];
    updated.splice(idx, 1);
    setFooterData({ ...footerData, serviceDistricts: updated });
  };

  if (loading || !footerData) {
    return (
      <AdminLayout>
        <div className="p-5 text-center">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
          <div>
            <h3 className="fw-bold mb-1">Footer & İletişim Yönetimi</h3>
            <p className="text-muted small mb-0">Mağaza altındaki Kurumsal linkleri, Hizmet Bölgelerini ve iletişim bilgilerini buradan yönetebilirsiniz.</p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn btn-primary px-4 fw-bold shadow-sm"
          >
            {saving ? "Kaydediliyor..." : "💾 Tüm Değişiklikleri Kaydet"}
          </button>
        </div>

        {/* SECTION 1: İletişim Bilgileri */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white fw-bold border-bottom">
            📞 İletişim & Adres Bilgileri
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small">Telefon Numarası</label>
                <input
                  type="text"
                  className="form-control"
                  value={footerData.phone}
                  onChange={(e) => setFooterData({ ...footerData, phone: e.target.value })}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small">WhatsApp Numarası (Ülke kodlu)</label>
                <input
                  type="text"
                  className="form-control"
                  value={footerData.whatsapp}
                  onChange={(e) => setFooterData({ ...footerData, whatsapp: e.target.value })}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small">E-Posta Adresi</label>
                <input
                  type="text"
                  className="form-control"
                  value={footerData.email}
                  onChange={(e) => setFooterData({ ...footerData, email: e.target.value })}
                />
              </div>

              <div className="col-12 col-md-8">
                <label className="form-label fw-bold small">Fiziksel Adres</label>
                <input
                  type="text"
                  className="form-control"
                  value={footerData.address}
                  onChange={(e) => setFooterData({ ...footerData, address: e.target.value })}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-bold small">Çalışma Saatleri</label>
                <input
                  type="text"
                  className="form-control"
                  value={footerData.workingHours}
                  onChange={(e) => setFooterData({ ...footerData, workingHours: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Kurumsal Linkler */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
            <span>📜 Kurumsal Bağlantılar</span> <a href="/yonetim/sayfalar" className="btn btn-xs btn-[#2b2623] text-white fw-bold me-2">📝 İçerikleri Metin Olarak Düzenle</a>
            <button onClick={addCorporateLink} className="btn btn-xs btn-outline-primary fw-bold">
              + Yeni Link Ekle
            </button>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              {footerData.corporateLinks?.map((item: any, idx: number) => (
                <div key={idx} className="col-12 col-md-6">
                  <div className="border rounded p-3 bg-light d-flex align-items-center gap-2">
                    <div className="flex-grow-1">
                      <input
                        type="text"
                        className="form-control form-control-sm mb-2 fw-bold"
                        value={item.title}
                        placeholder="Link Başlığı"
                        onChange={(e) => {
                          const updated = [...footerData.corporateLinks];
                          updated[idx].title = e.target.value;
                          setFooterData({ ...footerData, corporateLinks: updated });
                        }}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm text-muted"
                        value={item.url}
                        placeholder="Sayfa URL (örn: /hakkimizda)"
                        onChange={(e) => {
                          const updated = [...footerData.corporateLinks];
                          updated[idx].url = e.target.value;
                          setFooterData({ ...footerData, corporateLinks: updated });
                        }}
                      />
                    </div>
                    <button
                      onClick={() => removeCorporateLink(idx)}
                      className="btn btn-sm btn-outline-danger"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: Hizmet Bölgeleri */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-white fw-bold border-bottom d-flex align-items-center justify-content-between">
            <span>📍 Hizmet Bölgeleri (Konyaaltı Çiçekçi, Muratpaşa Çiçekçi vb.)</span>
            <button onClick={addServiceDistrict} className="btn btn-xs btn-outline-primary fw-bold">
              + Yeni Bölge Ekle
            </button>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              {footerData.serviceDistricts?.map((item: any, idx: number) => (
                <div key={idx} className="col-12 col-md-4">
                  <div className="border rounded p-3 bg-light d-flex align-items-center gap-2">
                    <div className="flex-grow-1">
                      <input
                        type="text"
                        className="form-control form-control-sm mb-2 fw-bold"
                        value={item.title}
                        placeholder="Bölge Başlığı"
                        onChange={(e) => {
                          const updated = [...footerData.serviceDistricts];
                          updated[idx].title = e.target.value;
                          setFooterData({ ...footerData, serviceDistricts: updated });
                        }}
                      />
                      <input
                        type="text"
                        className="form-control form-control-sm text-muted"
                        value={item.url}
                        placeholder="Sayfa URL (örn: /konyaalti-cicekci)"
                        onChange={(e) => {
                          const updated = [...footerData.serviceDistricts];
                          updated[idx].url = e.target.value;
                          setFooterData({ ...footerData, serviceDistricts: updated });
                        }}
                      />
                    </div>
                    <button
                      onClick={() => removeServiceDistrict(idx)}
                      className="btn btn-sm btn-outline-danger"
                      title="Sil"
                    >
                      🗑️
                    </button>
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
