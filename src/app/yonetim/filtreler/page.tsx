"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function AdminFiltersPage() {
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newDesign, setNewDesign] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorDot, setNewColorDot] = useState("🔴");

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    try {
      const res = await fetch("/api/filters");
      const data = await res.json();
      setFilterOptions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filterOptions),
      });
      if (res.ok) {
        alert("Filtre özellikleri başarıyla kaydedildi! Ürün düzenleme ekranında anında aktifleşti.");
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // Item management helpers
  const addItem = (category: string, value: any) => {
    if (!value) return;
    const list = [...(filterOptions[category] || [])];
    list.push(value);
    setFilterOptions({ ...filterOptions, [category]: list });
  };

  const removeItem = (category: string, idx: number) => {
    const list = [...filterOptions[category]];
    list.splice(idx, 1);
    setFilterOptions({ ...filterOptions, [category]: list });
  };

  if (loading || !filterOptions) {
    return (
      <AdminLayout>
        <div className="p-5 text-center">Filtre seçenekleri yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid px-0">
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
          <div>
            <h3 className="fw-bold mb-1">Filtre Özellikleri & Seçenek Yönetimi</h3>
            <p className="text-muted small mb-0">Ürün düzenleme ekranında çıkan Tasarım Tipi, Kime, Gönderim Amacı ve Renk filtrelerini buradan ekleyip çıkarabilirsiniz.</p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn btn-primary px-4 fw-bold shadow-sm"
          >
            {saving ? "Kaydediliyor..." : "💾 Tüm Filtreleri Kaydet"}
          </button>
        </div>

        <div className="row g-4">
          {/* SECTION 1: Tasarım Tipi */}
          <div className="col-12 col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-bold border-bottom">
                🎨 1. Tasarım Tipi Filtreleri (Buket, Kutuda, Aranjman vb.)
              </div>
              <div className="card-body p-4">
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Yeni tasarım tipi yazın (ör. Ayaklı Sepet)..."
                    value={newDesign}
                    onChange={(e) => setNewDesign(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      addItem("designTypes", newDesign);
                      setNewDesign("");
                    }}
                    className="btn btn-sm btn-primary fw-bold text-nowrap"
                  >
                    + Ekle
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {filterOptions.designTypes?.map((item: string, idx: number) => (
                    <span key={idx} className="badge bg-light text-dark border p-2 d-flex align-items-center gap-2">
                      <span className="fw-bold">{item}</span>
                      <button
                        onClick={() => removeItem("designTypes", idx)}
                        className="btn-close"
                        style={{ fontSize: "10px" }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Kime */}
          <div className="col-12 col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-bold border-bottom">
                👤 2. Kime Filtreleri (Sevgiliye, Anneye, Eşe vb.)
              </div>
              <div className="card-body p-4">
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Yeni hedef kişi yazın (ör. Öğretmene)..."
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      addItem("recipients", newRecipient);
                      setNewRecipient("");
                    }}
                    className="btn btn-sm btn-primary fw-bold text-nowrap"
                  >
                    + Ekle
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {filterOptions.recipients?.map((item: string, idx: number) => (
                    <span key={idx} className="badge bg-light text-dark border p-2 d-flex align-items-center gap-2">
                      <span className="fw-bold">{item}</span>
                      <button
                        onClick={() => removeItem("recipients", idx)}
                        className="btn-close"
                        style={{ fontSize: "10px" }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Gönderim Amacı */}
          <div className="col-12 col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-bold border-bottom">
                🎁 3. Gönderim Amacı Filtreleri (Doğum Günü, Yıl Dönümü vb.)
              </div>
              <div className="card-body p-4">
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Yeni amaç yazın (ör. Yeni Bebek, Açılış)..."
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      addItem("purposes", newPurpose);
                      setNewPurpose("");
                    }}
                    className="btn btn-sm btn-primary fw-bold text-nowrap"
                  >
                    + Ekle
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {filterOptions.purposes?.map((item: string, idx: number) => (
                    <span key={idx} className="badge bg-light text-dark border p-2 d-flex align-items-center gap-2">
                      <span className="fw-bold">{item}</span>
                      <button
                        onClick={() => removeItem("purposes", idx)}
                        className="btn-close"
                        style={{ fontSize: "10px" }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Renk Filtreleri */}
          <div className="col-12 col-md-6">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white fw-bold border-bottom">
                🌈 4. Renk Filtreleri (Kırmızı 🔴, Beyaz ⚪ vb.)
              </div>
              <div className="card-body p-4">
                <div className="d-flex gap-2 mb-3">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "90px" }}
                    value={newColorDot}
                    onChange={(e) => setNewColorDot(e.target.value)}
                  >
                    <option value="🔴">🔴 Kırmızı</option>
                    <option value="⚪">⚪ Beyaz</option>
                    <option value="🌸">🌸 Pembe</option>
                    <option value="🟡">🟡 Sarı</option>
                    <option value="🟠">🟠 Turuncu</option>
                    <option value="🟣">🟣 Mor</option>
                    <option value="🔵">🔵 Mavi</option>
                    <option value="🟢">🟢 Yeşil</option>
                    <option value="🎨">🎨 Karışık</option>
                  </select>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Renk adı (ör. Yeşil)..."
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (newColorName) {
                        addItem("colors", { name: newColorName, dot: newColorDot });
                        setNewColorName("");
                      }
                    }}
                    className="btn btn-sm btn-primary fw-bold text-nowrap"
                  >
                    + Ekle
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {filterOptions.colors?.map((item: any, idx: number) => (
                    <span key={idx} className="badge bg-light text-dark border p-2 d-flex align-items-center gap-2">
                      <span>{item.dot}</span>
                      <span className="fw-bold">{item.name}</span>
                      <button
                        onClick={() => removeItem("colors", idx)}
                        className="btn-close"
                        style={{ fontSize: "10px" }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
