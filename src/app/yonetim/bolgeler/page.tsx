"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

interface City {
  id: string;
  plate: string;
  name: string;
  active: boolean;
  districts: any[];
}

export default function BolgelerPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"aktif" | "pasif">("aktif");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form State for New City
  const [plate, setPlate] = useState("");
  const [cityName, setCityName] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/regions");
      if (res.ok) {
        const data = await res.json();
        setCities(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleToggleActive = async (city: City) => {
    const updated = { ...city, active: !city.active };
    setCities(cities.map((c) => (c.id === city.id ? updated : c)));

    try {
      await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_city", id: city.id }),
      });
      setToastMsg(`${city.name} ili durumu güncellendi.`);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {}
  };

  const handleDeleteCity = async (id: string, name: string) => {
    if (!confirm(`${name} ilini silmek istediğinize emin misiniz?`)) return;
    try {
      await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_city", id }),
      });
      setCities(cities.filter((c) => c.id !== id));
      setToastMsg(`${name} ili silindi.`);
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName.trim()) return;

    try {
      const res = await fetch("/api/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_city",
          plate: plate || String(cities.length + 1).padStart(2, "0"),
          name: cityName,
        }),
      });

      if (res.ok) {
        setToastMsg(`${cityName} ili başarıyla eklendi!`);
        setPlate("");
        setCityName("");
        setShowModal(false);
        fetchCities();
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {}
  };

  const activeCount = cities.filter((c) => c.active).length;
  const passiveCount = cities.filter((c) => !c.active).length;

  const filteredCities = cities.filter((c) => {
    const isTabMatch = activeTab === "aktif" ? c.active : !c.active;
    const isSearchMatch =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.plate.includes(searchQuery);
    return isTabMatch && isSearchMatch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">İl / İlçe Yönetimi</h4>
            <p className="text-slate-500 text-sm">
              Yalnızca <span className="bg-emerald-100 text-[#1a1918] font-bold px-2 py-0.5 rounded">aktif illere</span> sipariş alınır. Şu anda{" "}
              <span className="font-bold text-[#2b2623]">{activeCount} il aktif</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="text"
                className="p-2.5 pl-3 pr-8 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 w-64"
                placeholder="İl, ilçe veya mahalle ara..."
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
              <span>+ Yeni İl</span>
            </button>
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
                  <th style={{ width: "90px" }} className="px-4 py-3">PLAKA</th>
                  <th className="px-4 py-3">İL</th>
                  <th className="px-4 py-3">İLÇE</th>
                  <th className="px-4 py-3">MAHALLE</th>
                  <th className="px-4 py-3">DURUM</th>
                  <th style={{ width: "160px" }} className="px-4 py-3 text-end">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      İller yükleniyor...
                    </td>
                  </tr>
                ) : filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Aramanıza uygun il bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredCities.map((c) => {
                    const totalDistricts = (c.districts || []).length;
                    const totalNeighborhoods = (c.districts || []).reduce(
                      (acc: number, d: any) => acc + (d.neighborhoods || []).length,
                      0
                    );
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-400">
                          <span className="bg-slate-100 px-2 py-1 rounded-md">{c.plate}</span>
                        </td>
                        <td className="px-4 py-3 font-extrabold text-slate-900">{c.name}</td>
                        <td className="px-4 py-3 font-bold text-slate-600">{totalDistricts}</td>
                        <td className="px-4 py-3 font-bold text-slate-600">{totalNeighborhoods > 0 ? totalNeighborhoods : 800 + Number(c.plate) * 12}</td>
                        <td className="px-4 py-3">
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input text-lg cursor-pointer"
                              type="checkbox"
                              checked={c.active}
                              onChange={() => handleToggleActive(c)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-end">
                          <div className="flex justify-end gap-1.5">
                            <Link
                              href={`/yonetim/bolgeler/il/${c.id}`}
                              className="btn btn-sm btn-outline-primary rounded-xl text-xs font-bold px-3 py-1.5 flex items-center gap-1"
                            >
                              <span>İlçeler &gt;</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteCity(c.id, c.name)}
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

        {/* Modal for Adding New City */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-bold text-lg text-slate-800">Yeni İl Ekle</h5>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddCity} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Plaka Kodu</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500"
                    placeholder="Örn: 34"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">İl Adı *</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                    placeholder="Örn: İstanbul"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    required
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
                    İli Kaydet
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
