"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

interface ExtraItem {
  id: string;
  order: number;
  active: boolean;
  image: string;
  price: string;
  names: {
    tr: string;
    en?: string;
    de?: string;
    ru?: string;
  };
}

export default function EkstralarPage() {
  const [extras, setExtras] = useState<ExtraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const fetchExtras = async () => {
    try {
      const res = await fetch("/api/extras");
      if (res.ok) {
        const data = await res.json();
        setExtras(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtras();
  }, []);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const target = extras.find((x) => x.id === id);
    if (!target) return;

    const updated = { ...target, active: !currentActive };
    setExtras(extras.map((x) => (x.id === id ? updated : x)));

    try {
      await fetch("/api/extras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setToastMsg("Ek ürün durumu güncellendi.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ek ürünü silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/extras?id=${id}`, { method: "DELETE" });
      setExtras(extras.filter((x) => x.id !== id));
      setToastMsg("Ek ürün silindi.");
      setTimeout(() => setToastMsg(""), 2500);
    } catch (e) {}
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Çiçek Kataloğu /</span> Ek Ürünler (Hediyeler)
            </h4>
            <p className="text-slate-500 text-sm">
              Sipariş yanına eklenebilen çikolata, peluş ayı, balon ve ekstra hediyelerin yönetimi.
            </p>
          </div>
          <Link
            href="/yonetim/ekstralar/yeni"
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="font-bold rounded-xl text-xs px-4 py-2.5 flex items-center gap-2 shadow-sm hover:opacity-95 transition"
          >
            <span>➕ Yeni Ek Ürün Ekle</span>
          </Link>
        </div>

        {toastMsg && (
          <div className="p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm rounded-xl font-bold flex items-center gap-2">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Table Card */}
        <div className="card border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th style={{ width: "70px" }} className="px-4 py-3">Sıra</th>
                  <th style={{ width: "80px" }} className="px-4 py-3">Görsel</th>
                  <th className="px-4 py-3">Ek Ürün Adı</th>
                  <th className="px-4 py-3">Ek Fiyat</th>
                  <th className="px-4 py-3">Durum</th>
                  <th style={{ width: "160px" }} className="px-4 py-3 text-end">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Ek ürünler yükleniyor...
                    </td>
                  </tr>
                ) : extras.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-400">
                      Henüz ek ürün kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  extras.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-bold text-slate-400">{ex.order}</td>
                      <td className="px-4 py-3">
                        <img
                          src={ex.image || "https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp"}
                          alt={ex.names?.tr || "Ek Ürün"}
                          className="w-12 h-12 rounded-xl object-cover border bg-slate-50"
                        />
                      </td>
                      <td className="px-4 py-3 font-extrabold text-slate-800">
                        {ex.names?.tr || "Ek Ürün"}
                      </td>
                      <td className="px-4 py-3 font-black text-[#2b2623]">
                        {ex.price} ₺
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(ex.id, ex.active)}
                          className={`badge border px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                            ex.active
                              ? "bg-emerald-100 text-[#1a1918] border-emerald-300"
                              : "bg-slate-100 text-slate-500 border-slate-300"
                          }`}
                        >
                          {ex.active ? "● Aktif" : "○ Pasif"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/yonetim/ekstralar/${ex.id}/duzenle`}
                            className="btn btn-sm btn-outline-primary rounded-lg text-xs px-2.5 py-1 flex items-center gap-1 font-bold"
                          >
                            <span>✏️ Düzenle</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(ex.id)}
                            className="btn btn-sm btn-outline-danger rounded-lg text-xs px-2.5 py-1"
                          >
                            <span>🗑️</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
