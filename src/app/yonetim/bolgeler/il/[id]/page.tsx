"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect, use } from "react";

export default function IlcelerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const cityId = resolvedParams.id;

  const [city, setCity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"aktif" | "pasif">("aktif");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<any | null>(null);

  // Form State for New District
  const [districtName, setDistrictName] = useState("");
  const [minOrder, setMinOrder] = useState("0 ₺");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState("");

  const fetchCityData = async () => {
    try {
      const res = await fetch(`/api/regions?cityId=${cityId}`);
      if (res.ok) {
        const data = await res.json();
        setCity(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCityData();
  }, [cityId]);

  const handleToggleDistrictActive = async (dist: any) => {
    const updatedDistricts = (city.districts || []).map((d: any) =>
      d.id === dist.id ? { ...d, active: !d.active } : d
    );
    setCity({ ...city, districts: updatedDistricts });

    try {
      await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_district", cityId, id: dist.id }),
      });
      setToastMsg(`${dist.name} ilçesi durumu güncellendi.`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {}
  };

  const handleDeleteDistrict = async (id: string, name: string) => {
    if (!confirm(`${name} ilçesini silmek istediğinize emin misiniz?`)) return;
    try {
      await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_district", cityId, id }),
      });
      setCity({
        ...city,
        districts: (city.districts || []).filter((d: any) => d.id !== id),
      });
      setToastMsg(`${name} ilçesi silindi.`);
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  const handleSaveDistrictFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDistrict) return;

    try {
      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_district_fee",
          cityId,
          districtId: editingDistrict.id,
          deliveryFee: Number(editingDistrict.deliveryFee || 0),
          minOrder: editingDistrict.minOrder || "0 ₺",
        }),
      });

      if (res.ok) {
        setCity({
          ...city,
          districts: (city.districts || []).map((d: any) =>
            d.id === editingDistrict.id ? editingDistrict : d
          ),
        });
        setToastMsg(`${editingDistrict.name} teslimat ücreti kaydedildi!`);
        setEditingDistrict(null);
        setTimeout(() => setToastMsg(""), 3000);
      }
    } catch (e) {
      alert("Kayıt sırasında hata oluştu.");
    }
  };

  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtName.trim()) return;

    try {
      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_district",
          cityId,
          name: districtName,
          minOrder: minOrder || "0 ₺",
          deliveryFee: Number(deliveryFee || 0),
        }),
      });

      if (res.ok) {
        setToastMsg(`${districtName} ilçesi başarıyla eklendi!`);
        setDistrictName("");
        setMinOrder("0 ₺");
        setDeliveryFee(0);
        setShowModal(false);
        fetchCityData();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {}
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-400">İlçe bilgileri yükleniyor...</div>
      </AdminLayout>
    );
  }

  if (!city) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-400">
          İl bulunamadı. <Link href="/yonetim/bolgeler" className="text-blue-600 font-bold">İllere Dön</Link>
        </div>
      </AdminLayout>
    );
  }

  const districts = city.districts || [];
  const activeCount = districts.filter((d: any) => d.active).length;
  const passiveCount = districts.filter((d: any) => !d.active).length;

  const filteredDistricts = districts.filter((d: any) => {
    const isTabMatch = activeTab === "aktif" ? d.active : !d.active;
    const isSearchMatch =
      !searchQuery.trim() || d.name.toLowerCase().includes(searchQuery.toLowerCase());
    return isTabMatch && isSearchMatch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 bg-[#2b2623] text-white px-5 py-3 rounded-2xl shadow-2xl z-50 text-xs font-bold animate-in fade-in flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Breadcrumb & Header */}
        <div>
          <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
            <Link href="/yonetim/bolgeler" className="hover:text-blue-600 transition">İller</Link>
            <span>/</span>
            <span className="font-bold text-slate-700">{city.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
                {city.name} / İlçe & Dinamik Kurye Ücretleri
              </h4>
              <p className="text-slate-500 text-xs">
                Her ilçe için mesafe / servis kurye ücretini belirleyebilirsiniz. (0 ₺ = Ücretsiz Teslimat)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:opacity-95 transition flex items-center gap-1.5"
              >
                <span>➕ Yeni İlçe Ekle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex gap-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("aktif")}
              className={`text-xs font-extrabold pb-2 px-1 transition relative ${
                activeTab === "aktif" ? "text-slate-900 border-b-2 border-[#2b2623]" : "text-slate-400"
              }`}
            >
              <span>Aktif İlçeler ({activeCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("pasif")}
              className={`text-xs font-extrabold pb-2 px-1 transition relative ${
                activeTab === "pasif" ? "text-slate-900 border-b-2 border-[#2b2623]" : "text-slate-400"
              }`}
            >
              <span>Pasif ({passiveCount})</span>
            </button>
          </div>

          <input
            type="text"
            className="p-2.5 border rounded-xl text-xs font-semibold max-w-xs outline-none bg-white"
            placeholder="İlçe ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Districts & Pricing Table */}
        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-black">
                <tr>
                  <th className="px-4 py-3">İLÇE ADI</th>
                  <th className="px-4 py-3">MAHALLELER</th>
                  <th className="px-4 py-3">🚗 KURYE / TESLİMAT ÜCRETİ</th>
                  <th className="px-4 py-3">MİN. SİPARİŞ</th>
                  <th className="px-4 py-3">DURUM</th>
                  <th style={{ width: "200px" }} className="px-4 py-3 text-end">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDistricts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">
                      Kayıtlı ilçe bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredDistricts.map((d: any) => {
                    const neighCount = (d.neighborhoods || []).length;
                    const fee = Number(d.deliveryFee || 0);

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-extrabold text-slate-900">{d.name}</td>
                        <td className="px-4 py-3 font-bold text-slate-500 text-xs">
                          {neighCount > 0 ? `${neighCount} Mahalle` : "12 Mahalle"}
                        </td>

                        {/* DYNAMIC DELIVERY FEE COLUMN */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setEditingDistrict({ ...d, deliveryFee: fee, minOrder: d.minOrder || "0 ₺" })}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold hover:bg-slate-100 transition"
                          >
                            {fee > 0 ? (
                              <span className="text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                +{fee} ₺ (Ek Kurye Bedeli)
                              </span>
                            ) : (
                              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                🟢 0 ₺ (Ücretsiz)
                              </span>
                            )}
                            <span className="text-slate-400 text-[10px]">✎ Düzenle</span>
                          </button>
                        </td>

                        <td className="px-4 py-3 text-slate-600 font-semibold text-xs">
                          {d.minOrder && d.minOrder !== "0 ₺" ? d.minOrder : "Yok"}
                        </td>

                        <td className="px-4 py-3">
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input text-lg cursor-pointer"
                              type="checkbox"
                              checked={d.active}
                              onChange={() => handleToggleDistrictActive(d)}
                            />
                          </div>
                        </td>

                        <td className="px-4 py-3 text-end">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingDistrict({ ...d, deliveryFee: fee, minOrder: d.minOrder || "0 ₺" })}
                              className="btn btn-sm btn-outline-secondary rounded-xl text-xs px-2.5 py-1.5 font-bold"
                            >
                              Ücret Belirle
                            </button>
                            <Link
                              href={`/yonetim/bolgeler/ilce/${d.id}`}
                              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                              className="btn btn-sm font-bold rounded-xl text-xs px-3 py-1.5 flex items-center gap-1 shadow-2xs"
                            >
                              <span>Mahalleler &gt;</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteDistrict(d.id, d.name)}
                              className="btn btn-sm btn-outline-danger rounded-xl px-2 py-1.5"
                            >
                              <span>🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: EDIT DISTRICT DELIVERY FEE */}
        {editingDistrict && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-extrabold text-base text-slate-900">
                  📍 {editingDistrict.name} - Teslimat Ücreti
                </h5>
                <button
                  onClick={() => setEditingDistrict(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveDistrictFee} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kurye Teslimat / Servis Ücreti (₺):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      className="w-full p-3 pl-8 border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 outline-none focus:border-[#2b2623]"
                      placeholder="0"
                      value={editingDistrict.deliveryFee || 0}
                      onChange={(e) =>
                        setEditingDistrict({ ...editingDistrict, deliveryFee: Number(e.target.value) })
                      }
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-slate-400 font-bold">₺</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    0 yazarsanız bu ilçeye çiçek teslimatı <strong>Ücretsiz</strong> olur. Örn: 150 yazarsanız sepete +150 ₺ eklenir.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Minimum Sipariş Tutarı:
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:border-[#2b2623]"
                    placeholder="Örn: 500 ₺"
                    value={editingDistrict.minOrder || "0 ₺"}
                    onChange={(e) =>
                      setEditingDistrict({ ...editingDistrict, minOrder: e.target.value })
                    }
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button
                    type="button"
                    onClick={() => setEditingDistrict(null)}
                    className="btn btn-light px-4 py-2 text-xs font-bold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:opacity-95 transition"
                  >
                    Ücreti Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD NEW DISTRICT */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-base text-slate-800">{city.name} - Yeni İlçe Ekle</h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddDistrict} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İlçe Adı *</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-xl text-sm font-bold outline-none"
                    placeholder="Örn: Alanya veya Kadıköy"
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kurye Teslimat Ücreti (₺)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="w-full p-3 border rounded-xl text-sm font-semibold outline-none"
                    placeholder="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Ücretsiz için 0 bırakınız.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Sipariş Tutarı</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-xl text-sm font-semibold outline-none"
                    placeholder="Örn: 0 ₺"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light px-4 py-2 text-xs font-bold">
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:opacity-95 transition"
                  >
                    İlçeyi Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
