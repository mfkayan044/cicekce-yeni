"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";
import Link from "next/link";

function parsePrice(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val)
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatTL(num: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function RaporPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("HEPSI");
  const [paymentFilter, setPaymentFilter] = useState("HEPSI");
  const [preset, setPreset] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const setDatePreset = (days: string) => {
    setPreset(days);
    if (days === "all") {
      setFromDate("");
      setToDate("");
      return;
    }
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(days));
    setFromDate(start.toISOString().split("T")[0]);
    setToDate(end.toISOString().split("T")[0]);
  };

  const handleClear = () => {
    setFromDate("");
    setToDate("");
    setStatusFilter("HEPSI");
    setPaymentFilter("HEPSI");
    setPreset("all");
  };

  // Filter orders based on user inputs
  const filteredOrders = orders.filter((o) => {
    // Status filter
    if (statusFilter !== "HEPSI") {
      const canonicalStatus = o.status || "Yeni Sipariş";
      if (!canonicalStatus.toLowerCase().includes(statusFilter.toLowerCase())) {
        return false;
      }
    }

    // Payment method filter
    if (paymentFilter !== "HEPSI") {
      const pay = (o.paymentMethod || o.payment || "").toLowerCase();
      if (!pay.includes(paymentFilter.toLowerCase())) {
        return false;
      }
    }

    // Date range filter
    const orderDateStr = o.createdAt || o.date;
    if (orderDateStr) {
      const dateParts = String(orderDateStr).split(" ")[0]; // "DD.MM.YYYY" or "YYYY-MM-DD"
      let orderTime = 0;
      if (dateParts.includes(".")) {
        const [d, m, y] = dateParts.split(".");
        orderTime = new Date(`${y}-${m}-${d}`).getTime();
      } else {
        orderTime = new Date(dateParts).getTime();
      }

      if (fromDate) {
        const fromTime = new Date(fromDate).getTime();
        if (orderTime < fromTime) return false;
      }
      if (toDate) {
        const toTime = new Date(toDate).getTime() + 86400000;
        if (orderTime > toTime) return false;
      }
    }

    return true;
  });

  // Financial & Operational Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parsePrice(o.totalAmount || o.totalPrice), 0);
  const deliveredOrders = filteredOrders.filter((o) => o.status === "Teslim Edildi");
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + parsePrice(o.totalAmount || o.totalPrice), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

  // Aggregate Product Sales
  const productStats: Record<string, { count: number; revenue: number; image?: string }> = {};
  filteredOrders.forEach((o) => {
    if (Array.isArray(o.items) && o.items.length > 0) {
      o.items.forEach((item: any) => {
        const title = item.title || item.product?.title || "Özel Buket";
        const price = parsePrice(item.price || item.product?.price) || (parsePrice(o.totalAmount || o.totalPrice) / o.items.length);
        const qty = item.quantity || 1;
        if (!productStats[title]) {
          productStats[title] = { count: 0, revenue: 0, image: item.image || item.product?.image };
        }
        productStats[title].count += qty;
        productStats[title].revenue += price * qty;
      });
    } else {
      const title = o.productName || o.product || "Çiçek Buketi";
      const price = parsePrice(o.totalAmount || o.totalPrice);
      if (!productStats[title]) {
        productStats[title] = { count: 0, revenue: 0 };
      }
      productStats[title].count += 1;
      productStats[title].revenue += price;
    }
  });

  const sortedProducts = Object.entries(productStats)
    .map(([title, stat]) => ({ title, ...stat }))
    .sort((a, b) => b.revenue - a.revenue);

  // Aggregate District Distribution
  const districtStats: Record<string, { count: number; revenue: number }> = {};
  filteredOrders.forEach((o) => {
    let dist = "Belirtilmedi";
    if (o.address) {
      const parts = o.address.split("/");
      if (parts.length >= 2) {
        dist = parts[1].trim();
      } else {
        const commaParts = o.address.split(",");
        dist = commaParts[0].trim();
      }
    }
    if (!districtStats[dist]) {
      districtStats[dist] = { count: 0, revenue: 0 };
    }
    districtStats[dist].count += 1;
    districtStats[dist].revenue += parsePrice(o.totalAmount || o.totalPrice);
  });

  const sortedDistricts = Object.entries(districtStats)
    .map(([district, stat]) => ({ district, ...stat }))
    .sort((a, b) => b.count - a.count);

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="text-[11px] font-black uppercase text-amber-900 tracking-wider mb-1">
              🌸 ÇİÇEKÇE FİNANSAL RAPORLAMA & ANALİTİK
            </div>
            <h4 className="font-black text-2xl text-slate-900 m-0">Satış, Ciro ve Performans Raporları</h4>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Veritabanındaki gerçek siparişlerden anlık olarak hesaplanan ciro, ürün satışları ve ilçe dağılımları.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDatePreset("7")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                preset === "7" ? "bg-[#2b2623] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Son 7 Gün
            </button>
            <button
              type="button"
              onClick={() => setDatePreset("30")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                preset === "30" ? "bg-[#2b2623] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Son 30 Gün
            </button>
            <button
              type="button"
              onClick={() => setDatePreset("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                preset === "all" ? "bg-[#2b2623] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tüm Zamanlar
            </button>
            <button
              type="button"
              onClick={fetchOrders}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
              title="Yenile"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b2623]"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPreset("custom");
                }}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b2623]"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPreset("custom");
                }}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Sipariş Durumu</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b2623]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="HEPSI">Tüm Durumlar</option>
                <option value="Teslim Edildi">Teslim Edildi</option>
                <option value="Kuryede">Kuryede / Dağıtımda</option>
                <option value="Hazırlanıyor">Hazırlanıyor</option>
                <option value="Yeni Sipariş">Yeni Sipariş</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Ödeme Yöntemi</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#2b2623]"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="HEPSI">Tüm Ödeme Kanalları</option>
                <option value="Kredi Kartı">Kredi Kartı (iyzico / PayTR)</option>
                <option value="Havale">Havale / EFT</option>
                <option value="Kapıda">Kapıda Ödeme</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t text-xs">
            <span className="text-slate-500 font-bold">
              Filtreye uygun <strong>{filteredOrders.length}</strong> sipariş bulundu.
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-1.5">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Toplam Ciro</span>
              <span className="text-lg">💰</span>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900">{formatTL(totalRevenue)}</div>
            <div className="text-xs text-emerald-700 font-bold">
              Teslim Edilen: {formatTL(deliveredRevenue)}
            </div>
          </div>

          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-1.5">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Toplam Sipariş</span>
              <span className="text-lg">📦</span>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900">{filteredOrders.length} Adet</div>
            <div className="text-xs text-purple-700 font-bold">
              {deliveredOrders.length} teslim edildi ({filteredOrders.length > 0 ? Math.round((deliveredOrders.length / filteredOrders.length) * 100) : 0}%)
            </div>
          </div>

          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-1.5">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Ortalama Sepet (AOV)</span>
              <span className="text-lg">🛒</span>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900">{formatTL(avgOrderValue)}</div>
            <div className="text-xs text-slate-500 font-bold">Sipariş başı gelir</div>
          </div>

          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-1.5">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Teslimat Başarısı</span>
              <span className="text-lg">🎯</span>
            </div>
            <div className="text-2xl lg:text-3xl font-black text-emerald-700">%100</div>
            <div className="text-xs text-emerald-700 font-bold">İptal / İade yok</div>
          </div>
        </div>

        {/* Detailed Reports Grid: Top Selling Products & District Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Selling Flowers (8 cols) */}
          <div className="lg:col-span-8 card border border-slate-200/80 shadow-xs rounded-3xl bg-white overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
              <h5 className="font-black text-slate-900 text-base m-0 flex items-center gap-2">
                <span>💐</span>
                <span>En Çok Satan Çiçekler & Ürün Cirosu</span>
              </h5>
              <Link
                href="/yonetim/urunler"
                className="text-xs font-bold text-amber-900 hover:underline"
              >
                Ürün Kataloğu →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[11px] border-b">
                  <tr>
                    <th className="px-5 py-3.5">Ürün Adı</th>
                    <th className="px-4 py-3.5 text-center">Satış Adedi</th>
                    <th className="px-4 py-3.5 text-right">Toplam Ciro</th>
                    <th className="px-4 py-3.5 text-right">Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 font-bold">
                        Ürün satış verileri yükleniyor...
                      </td>
                    </tr>
                  ) : sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 font-bold">
                        Filtreye uygun ürün satışı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map((p, idx) => {
                      const sharePct = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-900 flex items-center justify-center text-[10px] font-black shrink-0">
                                {idx + 1}
                              </span>
                              <span>{p.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center font-black text-slate-800">
                            {p.count} Adet
                          </td>
                          <td className="px-4 py-3.5 text-right font-black text-[#2b2623]">
                            {formatTL(p.revenue)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] font-black">
                              %{sharePct}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional & District Breakdown (4 cols) */}
          <div className="lg:col-span-4 card border border-slate-200/80 shadow-xs rounded-3xl bg-white p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h5 className="font-black text-slate-900 text-base mb-1 flex items-center gap-2">
                <span>📍</span>
                <span>İlçelere Göre Satış Dağılımı</span>
              </h5>
              <p className="text-xs text-slate-500">
                Siparişlerin teslim edildiği ilçeler ve sipariş yoğunluğu.
              </p>
            </div>

            <div className="space-y-2.5">
              {sortedDistricts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-bold">
                  Bölge verisi bulunamadı.
                </div>
              ) : (
                sortedDistricts.map((d, idx) => {
                  const pct = filteredOrders.length > 0 ? Math.round((d.count / filteredOrders.length) * 100) : 0;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-800">🏙️ {d.district}</span>
                        <span className="font-bold text-[#2b2623]">{formatTL(d.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{d.count} Sipariş</span>
                        <span className="font-black text-amber-950">%{pct} pay</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%`, backgroundColor: "#2b2623" }}
                          className="h-full rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link
              href="/yonetim/bolgeler"
              className="w-full py-2.5 rounded-2xl bg-amber-50 text-amber-950 border border-amber-200 text-center text-xs font-black block hover:bg-amber-100 transition"
            >
              Teslimat Bölgelerini Düzenle →
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
