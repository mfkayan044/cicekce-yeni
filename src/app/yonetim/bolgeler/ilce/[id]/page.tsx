"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect, use } from "react";

export default function MahallelerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const districtId = resolvedParams.id;

  const [regionData, setRegionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"aktif" | "pasif">("aktif");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form State for New Neighborhood
  const [neighName, setNeighName] = useState("");
  const [minOrder, setMinOrder] = useState("300 ₺");
  const [extraFee, setExtraFee] = useState("0 ₺");
  const [toastMsg, setToastMsg] = useState("");

  const fetchDistrictData = async () => {
    try {
      const res = await fetch(`/api/regions?districtId=${districtId}`);
      if (res.ok) {
        const data = await res.json();
        setRegionData(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistrictData();
  }, [districtId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-400">Mahalle bilgileri yükleniyor...</div>
      </AdminLayout>
    );
  }

  if (!regionData || !regionData.district) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-slate-400">
          İlçe bulunamadı. <Link href="/yonetim/bolgeler" className="text-blue-600 font-bold">İllere Dön</Link>
        </div>
      </AdminLayout>
    );
  }

  const { city, district } = regionData;
  const neighborhoods = district.neighborhoods || [];

  const handleToggleNeighActive = async (neigh: any) => {
    try {
      await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_neighborhood", id: neigh.id }),
      });
      setToastMsg(`${neigh.name} mahalle durumu güncellendi.`);
      fetchDistrictData();
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {}
  };

  const handleDeleteNeigh = async (id: string, name: string) => {
    if (!confirm(`${name} mahallesini silmek istediğinize emin misiniz?`)) return;
    try {
      await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_neighborhood", id }),
      });
      setToastMsg(`${name} mahallesi silindi.`);
      fetchDistrictData();
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  const handleAddNeigh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neighName.trim()) return;

    try {
      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_neighborhood",
          districtId,
          name: neighName,
          minOrder: minOrder || "300 ₺",
          extraFee: extraFee || "0 ₺",
        }),
      });

      if (res.ok) {
        setToastMsg(`${neighName} mahallesi başarıyla eklendi!`);
        setNeighName("");
        setMinOrder("300 ₺");
        setExtraFee("0 ₺");
        setShowModal(false);
        fetchDistrictData();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {}
  };

  const activeCount = neighborhoods.filter((n: any) => n.active).length;
  const passiveCount = neighborhoods.filter((n: any) => !n.active).length;

  const filteredNeighs = neighborhoods.filter((n: any) => {
    const isTabMatch = activeTab === "aktif" ? n.active : !n.active;
    const isSearchMatch =
      !searchQuery.trim() || n.name.toLowerCase().includes(searchQuery.toLowerCase());
    return isTabMatch && isSearchMatch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb & Header */}
        <div>
          <nav className="text-xs text-slate-400 mb-2 flex items-center gap-1.5">
            <Link href="/yonetim/bolgeler" className="hover:text-blue-600 transition">İller</Link>
            <span>/</span>
            <Link href={`/yonetim/bolgeler/il/${city.id}`} className="hover:text-blue-600 transition">{city.name}</Link>
            <span>/</span>
            <span className="font-bold text-slate-700">{district.name}</span>
          </nav>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
                {district.name} / Mahalleler
              </h4>
              <p className="text-slate-500 text-sm">
                <span className="bg-emerald-100 text-[#1a1918] font-bold px-2 py-0.5 rounded text-xs">
                  {city.name} - {district.name}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  className="p-2.5 pl-3 pr-8 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 w-64"
                  placeholder="Mahalle ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="absolute right-2.5 top-2.5 text-slate-400 text-sm">🔍</span>
              </div>

              <button
                onClick={() => setShowModal(true)}
                style={{ backgroundColor: "#4285f4", color: "#ffffff" }}
                className="font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
              >
                <span>+ Yeni Mahalle</span>
              </button>
            </div>
          </div>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("aktif")}
            className={`text-sm font-extrabold pb-2 px-1 transition relative ${
              activeTab === "aktif" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span>Aktif ({activeCount})</span>
            {activeTab === "aktif" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>}
          </button>
          <button
            onClick={() => setActiveTab("pasif")}
            className={`text-sm font-extrabold pb-2 px-1 transition relative ${
              activeTab === "pasif" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span>Pasif ({passiveCount})</span>
            {activeTab === "pasif" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></span>}
          </button>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">MAHALLE</th>
                  <th className="px-4 py-3">MİN. SİPARİŞ TUTARI</th>
                  <th className="px-4 py-3">EK KURYE ÜCRETİ</th>
                  <th className="px-4 py-3">DURUM</th>
                  <th style={{ width: "120px" }} className="px-4 py-3 text-end">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNeighs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      Bu ilçe için mahalle kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredNeighs.map((n: any) => (
                    <tr key={n.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-extrabold text-slate-900">{n.name}</td>
                      <td className="px-4 py-3 font-bold text-slate-700">{n.minOrder || "300 ₺"}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{n.extraFee || "0 ₺"}</td>
                      <td className="px-4 py-3">
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input text-lg cursor-pointer"
                            type="checkbox"
                            checked={n.active}
                            onChange={() => handleToggleNeighActive(n)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteNeigh(n.id, n.name)}
                          className="btn btn-sm btn-outline-danger rounded-xl px-2 py-1.5"
                        >
                          <span>🗑️</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Adding New Neighborhood */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-lg text-slate-800">{district.name} - Yeni Mahalle Ekle</h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddNeigh} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mahalle Adı *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                    placeholder="Örn: Moda Mah."
                    value={neighName}
                    onChange={(e) => setNeighName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Minimum Sipariş Tutarı (₺)</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500"
                    placeholder="Örn: 400 ₺"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ek Kurye Ücreti (₺)</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500"
                    placeholder="Örn: 50 ₺"
                    value={extraFee}
                    onChange={(e) => setExtraFee(e.target.value)}
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-light px-4 py-2 text-sm font-bold">
                    İptal
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: "#4285f4", color: "#ffffff" }}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:opacity-95 transition"
                  >
                    Mahalleayi Kaydet
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
