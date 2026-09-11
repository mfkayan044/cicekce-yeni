"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function YarimSiparislerPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchCarts = async () => {
    try {
      const res = await fetch("/api/abandoned-carts");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCarts(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
    const interval = setInterval(fetchCarts, 4000);
    return () => clearInterval(interval);
  }, []);

  const normalizedCarts = (carts || []).map((c: any) => ({
    id: String(c.id || Date.now()),
    cartNo: c.cartNo || c.id || "SEPET",
    customer: c.customer || c.customerName || "Misafir Ziyaretçi",
    phone: c.phone || c.customerPhone || "-",
    product: c.product || (c.items?.[0]?.product?.title) || "Çiçek Buketi",
    step: c.step || c.lastStep || "Ödeme Adımı",
    total: c.total || c.cartTotal || "0 ₺",
    date: c.date || "Bugün"
  }));

  const filtered = normalizedCarts.filter(
    (c: any) =>
      String(c.cartNo || "").toLowerCase().includes(search.toLowerCase()) ||
      String(c.customer || "").toLowerCase().includes(search.toLowerCase()) ||
      String(c.phone || "").includes(search)
  );

  const allFilteredIds = filtered.map((c: any) => c.id);
  const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...allFilteredIds]));
      setSelectedIds(combined);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!confirm("Bu yarım kalan sepet kaydını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/abandoned-carts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setCarts((prev) => prev.filter((c: any) => String(c.id) !== String(id)));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
    } catch (e) {
      alert("Silme işlemi sırasında bir hata oluştu.");
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Seçtiğiniz ${selectedIds.length} adet yarım kalan sepet kaydını silmek istediğinize emin misiniz?`)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/abandoned-carts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setCarts((prev) => prev.filter((c: any) => !selectedIds.includes(String(c.id))));
        setSelectedIds([]);
        alert("Seçilen kayıtlar başarıyla silindi!");
      } else {
        alert("Toplu silme hatası oluştu.");
      }
    } catch (e) {
      alert("Toplu silme işlemi sırasında bir hata oluştu.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("TÜM yarım kalan sepet kayıtlarını kalıcı olarak temizlemek istediğinize emin misiniz?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/abandoned-carts?all=true", { method: "DELETE" });
      if (res.ok) {
        setCarts([]);
        setSelectedIds([]);
        alert("Tüm yarım kalan sepetler temizlendi.");
      }
    } catch (e) {
      alert("Temizleme hatası.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Sipariş Merkezi /</span> Yarım Kalan Siparişler
            </h4>
            <p className="text-slate-500 text-sm">
              Ödeme aşamasında terk edilen canlı sepetleri inceleyin, toplu olarak temizleyin veya iletişime geçin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchCarts}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="font-bold rounded-xl text-xs px-4 py-2 flex items-center gap-1 shadow-sm cursor-pointer hover:opacity-90 transition"
            >
              <span>🔄 Canlı Listeyi Yenile</span>
            </button>

            {carts.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={deleting}
                className="btn btn-outline-danger btn-sm text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-2xs"
              >
                <span>⚠️ Tümünü Temizle</span>
              </button>
            )}
          </div>
        </div>

        {/* SEARCH & BULK ACTION BAR */}
        <div className="card border-0 shadow-sm rounded-xl p-4 bg-white flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              className="w-full pl-4 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Sepet No, Müşteri veya Tel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 w-full md:w-auto bg-red-50 p-2.5 px-4 rounded-xl border border-red-200">
              <span className="text-xs font-black text-red-900">
                {selectedIds.length} sepet seçildi
              </span>
              <button
                onClick={handleDeleteBulk}
                disabled={deleting}
                className="btn btn-danger btn-sm font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1"
              >
                <span>🗑️ Seçilenleri Sil ({selectedIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline"
              >
                Vazgeç
              </button>
            </div>
          )}
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      className="form-check-input cursor-pointer"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3">Sepet No</th>
                  <th className="px-4 py-3">Müşteri / Alıcı</th>
                  <th className="px-4 py-3">Seçilen Ürün</th>
                  <th className="px-4 py-3">Kaldığı Adım</th>
                  <th className="px-4 py-3">Tutar</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3 text-end">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400">
                      Yarım kalan sepetler yükleniyor...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-400">
                      Henüz yarım kalan sepet kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c: any) => {
                    const isChecked = selectedIds.includes(c.id);
                    return (
                      <tr key={c.id} className={`hover:bg-slate-50 transition ${isChecked ? "bg-amber-50/40" : ""}`}>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            className="form-check-input cursor-pointer"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(c.id)}
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-[#2b2623]">
                          <Link href={`/yonetim/yarim-siparisler/${c.id}`} className="hover:underline">
                            {c.cartNo}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{c.customer}</div>
                          <div className="text-xs text-slate-500 font-bold">{c.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{c.product}</td>
                        <td className="px-4 py-3">
                          <span
                            style={{ color: "#78350f", backgroundColor: "#fef3c7", borderColor: "#fcd34d" }}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black border shadow-2xs"
                          >
                            {c.step}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">{c.total}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.date}</td>
                        <td className="px-4 py-3 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/yonetim/yarim-siparisler/${c.id}`}
                              className="btn btn-sm btn-outline-primary rounded-lg text-xs px-3 py-1 inline-flex items-center gap-1 font-bold"
                            >
                              <span>Detay</span>
                            </Link>
                            <button
                              onClick={() => handleDeleteSingle(c.id)}
                              className="btn btn-sm btn-outline-danger rounded-lg text-xs px-2.5 py-1 inline-flex items-center gap-1 font-bold"
                              title="Sepeti Sil"
                            >
                              <span>🗑️ Sil</span>
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
      </div>
    </AdminLayout>
  );
}
