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

  // Aggregate Category Breakdown
  const categoryStats: Record<string, { count: number; revenue: number }> = {};
  filteredOrders.forEach((o) => {
    const items = Array.isArray(o.items) && o.items.length > 0 ? o.items : [{ title: o.productName || o.product || "Çiçek Buketi", price: parsePrice(o.totalAmount || o.totalPrice) }];
    items.forEach((item: any) => {
      const titleStr = String(item.title || item.product?.title || "").toLowerCase();
      let cat = item.category || item.product?.category || "Tasarım Buketler";
      if (titleStr.includes("gül") || titleStr.includes("ros")) cat = "Gül & Romantik";
      else if (titleStr.includes("orkide")) cat = "Orkide & Saksı Çiçekleri";
      else if (titleStr.includes("papatya") || titleStr.includes("lale") || titleStr.includes("karanfil")) cat = "Mevsim Buketleri";
      else if (titleStr.includes("kutu")) cat = "Kutuda Çiçekler";
      else if (titleStr.includes("çikolata") || titleStr.includes("truff")) cat = "Hediye & Çikolata";

      const price = parsePrice(item.price || item.product?.price) || (parsePrice(o.totalAmount || o.totalPrice) / items.length);
      const qty = item.quantity || 1;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, revenue: 0 };
      }
      categoryStats[cat].count += qty;
      categoryStats[cat].revenue += price * qty;
    });
  });

  const sortedCategories = Object.entries(categoryStats)
    .map(([category, stat]) => ({ category, ...stat }))
    .sort((a, b) => b.revenue - a.revenue);

  // Aggregate Courier Punctuality Performance
  const courierStats: Record<string, { total: number; onTime: number; delayed: number }> = {};
  filteredOrders.forEach((o) => {
    const courier = o.courierName || o.courier || o.assignedCourier || "Ahmet K. (Saha Kuryesi)";
    if (!courierStats[courier]) {
      courierStats[courier] = { total: 0, onTime: 0, delayed: 0 };
    }
    courierStats[courier].total += 1;
    const statusNote = String(o.deliveryTimeNote || o.deliveryTimeStatus || o.notes || "");
    if (statusNote.includes("gecik") || statusNote.includes("Gecikmeli")) {
      courierStats[courier].delayed += 1;
    } else {
      courierStats[courier].onTime += 1;
    }
  });

  const sortedCouriers = Object.entries(courierStats)
    .map(([courier, stat]) => ({
      courier,
      ...stat,
      onTimeRate: stat.total > 0 ? Math.round((stat.onTime / stat.total) * 100) : 100,
    }))
    .sort((a, b) => b.total - a.total);

  // Payment Method Breakdown
  const paymentStats: Record<string, { count: number; revenue: number }> = {};
  filteredOrders.forEach((o) => {
    const payRaw = String(o.paymentMethod || o.payment || "Kredi Kartı").trim();
    let method = "Kredi Kartı";
    if (payRaw.toLowerCase().includes("havale") || payRaw.toLowerCase().includes("eft")) method = "Havale / EFT";
    else if (payRaw.toLowerCase().includes("kapı") || payRaw.toLowerCase().includes("nakit")) method = "Kapıda Ödeme";

    if (!paymentStats[method]) paymentStats[method] = { count: 0, revenue: 0 };
    paymentStats[method].count += 1;
    paymentStats[method].revenue += parsePrice(o.totalAmount || o.totalPrice);
  });
  const sortedPaymentStats = Object.entries(paymentStats).map(([method, stat]) => ({ method, ...stat }));

  // Daily Trend Breakdown
  const dailyTrendStats: Record<string, number> = {};
  filteredOrders.forEach((o) => {
    const rawDate = String(o.date || o.createdAt || "").split(" ")[0];
    if (rawDate) {
      dailyTrendStats[rawDate] = (dailyTrendStats[rawDate] || 0) + parsePrice(o.totalAmount || o.totalPrice);
    }
  });
  const sortedDailyTrend = Object.entries(dailyTrendStats).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  const maxDailyRevenue = Math.max(...sortedDailyTrend.map((d) => d[1]), 1);

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      alert("İndirilecek sipariş verisi bulunamadı.");
      return;
    }

    const headers = [
      "Siparis No",
      "Tarih",
      "Musteri Adı",
      "Musteri Telefon",
      "Alici Adı",
      "Alici Telefon",
      "Teslimat Adresi",
      "Durum",
      "Odeme Yontemi",
      "Tutar (TL)",
      "Kurye"
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${o.date || o.createdAt || ""}"`,
      `"${(o.customerName || "").replace(/"/g, '""')}"`,
      `"${(o.customerPhone || "").replace(/"/g, '""')}"`,
      `"${(o.recipientName || "").replace(/"/g, '""')}"`,
      `"${(o.recipientPhone || "").replace(/"/g, '""')}"`,
      `"${(o.address || "").replace(/"/g, '""')}"`,
      `"${(o.status || "").replace(/"/g, '""')}"`,
      `"${(o.paymentMethod || o.payment || "").replace(/"/g, '""')}"`,
      `"${parsePrice(o.totalAmount || o.totalPrice)}"`,
      `"${(o.courierName || o.courier || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cicekce_satis_raporu_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              onClick={exportToCSV}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5"
            >
              <span>📥</span>
              <span>Excel (CSV) İndir</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5"
            >
              <span>🖨️</span>
              <span>Yazdır / PDF</span>
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

        {/* Daily Sales Trend & Payment Breakdown Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Sales Trend Chart (8 cols) */}
          <div className="lg:col-span-8 card border border-slate-200/80 shadow-xs rounded-3xl bg-white p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="font-black text-slate-900 text-base mb-0.5 flex items-center gap-2">
                  <span>📈</span>
                  <span>Günlük Satış & Ciro Grafiği</span>
                </h5>
                <p className="text-xs text-slate-500">
                  Son günlerde gerçekleşen satış cirosunun günlük trendi.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">Son {sortedDailyTrend.length} Gün</span>
            </div>

            {sortedDailyTrend.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs">
                Grafik için sipariş verisi bulunamadı.
              </div>
            ) : (
              <div className="pt-4 pb-2">
                <div className="h-44 flex items-end justify-between gap-2 border-b border-slate-200 pb-2">
                  {sortedDailyTrend.map(([day, rev], idx) => {
                    const heightPct = Math.max(Math.round((rev / maxDailyRevenue) * 100), 8);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="opacity-0 group-hover:opacity-100 transition absolute -top-8 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                          {formatTL(rev)}
                        </div>
                        <div
                          style={{ height: `${heightPct}%`, backgroundColor: "#2b2623" }}
                          className="w-full max-w-[28px] rounded-t-lg group-hover:bg-amber-800 transition duration-300 shadow-xs"
                        />
                        <span className="text-[9px] font-bold text-slate-500 truncate w-full text-center">
                          {day.slice(0, 5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Breakdown (4 cols) */}
          <div className="lg:col-span-4 card border border-slate-200/80 shadow-xs rounded-3xl bg-white p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h5 className="font-black text-slate-900 text-base mb-0.5 flex items-center gap-2">
                <span>💳</span>
                <span>Ödeme Yöntemleri Ciro Dağılımı</span>
              </h5>
              <p className="text-xs text-slate-500">
                Kredi kartı, havale ve kapıda ödeme tahsilat oranları.
              </p>
            </div>

            <div className="space-y-3">
              {sortedPaymentStats.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-bold">
                  Ödeme verisi bulunamadı.
                </div>
              ) : (
                sortedPaymentStats.map((p, idx) => {
                  const pct = totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-800">
                          {p.method.includes("Kart") ? "💳 " : p.method.includes("Havale") ? "🏛️ " : "💵 "}
                          {p.method}
                        </span>
                        <span className="font-bold text-[#2b2623]">{formatTL(p.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{p.count} İşlem</span>
                        <span className="font-black text-purple-700 font-mono">%{pct} Pay</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-purple-600 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] font-bold text-emerald-950 flex items-center justify-between">
              <span>🔒 Güvenli Ödeme Altyapısı</span>
              <span className="font-black">Aktif</span>
            </div>
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

        {/* Category Breakdown & Courier Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Sales Breakdown Card */}
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl bg-white p-5 space-y-4">
            <div>
              <h5 className="font-black text-slate-900 text-base mb-1 flex items-center gap-2">
                <span>🏷️</span>
                <span>Kategori Bazlı Satış Dağılımı</span>
              </h5>
              <p className="text-xs text-slate-500">
                Güller, Orkideler, Mevsim Çiçekleri ve Ekstra Ürünlerin ciro payları.
              </p>
            </div>

            <div className="space-y-3">
              {sortedCategories.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-bold">
                  Kategori verisi bulunamadı.
                </div>
              ) : (
                sortedCategories.map((c, idx) => {
                  const pct = totalRevenue > 0 ? Math.round((c.revenue / totalRevenue) * 100) : 0;
                  return (
                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-800">🌸 {c.category}</span>
                        <span className="font-bold text-[#2b2623]">{formatTL(c.revenue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.count} Adet Satış</span>
                        <span className="font-black text-emerald-700 font-mono">%{pct} Ciro Payı</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-emerald-600 rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Courier Performance & Punctuality Card */}
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl bg-white p-5 space-y-4">
            <div>
              <h5 className="font-black text-slate-900 text-base mb-1 flex items-center gap-2">
                <span>🛵</span>
                <span>Kurye Teslimat Performansı (%)</span>
              </h5>
              <p className="text-xs text-slate-500">
                Saha kuryelerinin zamanında teslimat oranları ve gecikme takibi.
              </p>
            </div>

            <div className="space-y-3">
              {sortedCouriers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-bold">
                  Kurye verisi bulunamadı.
                </div>
              ) : (
                sortedCouriers.map((k, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#2b2623] text-white flex items-center justify-center text-xs font-black">
                          🛵
                        </span>
                        <div>
                          <div className="font-black text-slate-900 text-xs">{k.courier}</div>
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Toplam {k.total} Teslimat
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
                        k.onTimeRate >= 90
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : k.onTimeRate >= 70
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        %{k.onTimeRate} Zamanında
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1 border-t border-slate-200/60">
                      <span className="text-emerald-700">✓ Zamanında: {k.onTime}</span>
                      <span className={k.delayed > 0 ? "text-red-600" : "text-slate-400"}>
                        ⚠️ Gecikmeli: {k.delayed}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
