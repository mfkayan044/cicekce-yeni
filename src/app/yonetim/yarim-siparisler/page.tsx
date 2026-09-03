"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

interface AbandonedCart {
  id: string;
  cartNo: string;
  customer: string;
  phone: string;
  product: string;
  step: string;
  total: string;
  date: string;
}

export default function YarimSiparislerPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCarts = async () => {
    try {
      const res = await fetch("/api/abandoned-carts");
      if (res.ok) {
        const data = await res.json();
        setCarts(data);
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

  const filtered = carts.filter(
    (c) =>
      c.cartNo.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Sipariş Merkezi /</span> Yarım Kalan Siparişler
            </h4>
            <p className="text-slate-500 text-sm">
              Ödeme aşamasında terk edilen canlı sepetleri inceleyin, müşteriyle iletişime geçin.
            </p>
          </div>

          <button
            onClick={fetchCarts}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="font-bold rounded-xl text-xs px-4 py-2 flex items-center gap-1 shadow-sm"
          >
            <span>🔄 Canlı Listeyi Yenile</span>
          </button>
        </div>

        <div className="card border-0 shadow-sm rounded-xl p-4 bg-white">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              className="w-full pl-4 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Sepet No, Alıcı veya Tel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
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
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      Yarım kalan sepetler yükleniyor...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      Henüz yarım kalan sepet kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
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
                        <Link
                          href={`/yonetim/yarim-siparisler/${c.id}`}
                          className="btn btn-sm btn-outline-primary rounded-lg text-xs px-3 py-1 inline-flex items-center gap-1"
                        >
                          <span>Detay İncele</span>
                        </Link>
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
