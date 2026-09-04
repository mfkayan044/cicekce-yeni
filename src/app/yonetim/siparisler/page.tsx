"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

function getCanonicalStatus(status?: string, courierId?: string) {
  if (!status) return "Yeni Sipariş";
  if (status.includes("Kurye") || status.includes("Arabaya")) return "Kuryede / Dağıtımda";
  if (status.includes("Teslim Edildi")) return "Teslim Edildi";
  if (status.includes("Hazırlanıyor") || status.includes("Fotoğraflı Onay") || status.includes("Onay")) return "Hazırlanıyor";
  return status;
}

function normalizeDateStr(dateVal?: string): string {
  if (!dateVal) return "";
  let str = String(dateVal).trim();
  if (!str) return "";

  // If ISO string with T, extract date portion
  if (str.includes("T")) {
    str = str.split("T")[0];
  }

  // Handing Turkish month names (both short & long aliases)
  const trMonths: Array<[string[], string]> = [
    [["ocak", "oca"], "01"],
    [["şubat", "şub", "subat", "sub"], "02"],
    [["mart", "mar"], "03"],
    [["nisan", "nis"], "04"],
    [["mayıs", "may", "mayis"], "05"],
    [["haziran", "haz"], "06"],
    [["temmuz", "tem"], "07"],
    [["ağustos", "ağust", "ağu", "agustos", "agu"], "08"],
    [["eylül", "eyl", "eylul"], "09"],
    [["ekim", "eki"], "10"],
    [["kasım", "kas", "kasim"], "11"],
    [["aralık", "ara", "aralik"], "12"],
  ];

  const lowerStr = str.toLowerCase();
  for (const [aliases, mNum] of trMonths) {
    for (const alias of aliases) {
      if (lowerStr.includes(alias)) {
        const parts = str.split(/\s+/);
        if (parts.length >= 3) {
          const rawDay = parts[0].replace(/\D/g, "");
          const rawYear = parts[2].replace(/\D/g, "");
          if (rawDay && rawYear) {
            const day = rawDay.padStart(2, "0");
            const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
            return `${year}-${mNum}-${day}`;
          }
        }
      }
    }
  }

  // Format DD.MM.YYYY HH:MM:SS or DD/MM/YYYY
  if (str.includes(".") || str.includes("/")) {
    const firstPart = str.split(" ")[0];
    const parts = firstPart.split(/[./]/);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }

  // Format YYYY-MM-DD
  if (str.includes("-")) {
    const parts = str.split("-");
    if (parts.length >= 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, "0");
      const day = parts[2].slice(0, 2).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  return str;
}

function getTodayIsoStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Default to Today's Date
  const todayDefault = getTodayIsoStr();
  const [startDate, setStartDate] = useState<string>(todayDefault);
  const [endDate, setEndDate] = useState<string>(todayDefault);
  const [dateFilterType, setDateFilterType] = useState<"all" | "today" | "upcoming" | "past" | "custom">("today");

  useEffect(() => {
    fetchOrders();
    fetchCouriers();

    // DYNAMIC REAL-TIME POLLING: Auto-update orders every 4 seconds without F5!
    const interval = setInterval(() => {
      fetchOrdersSilently();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchOrdersSilently = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {}
  };

  const fetchCouriers = async () => {
    try {
      const res = await fetch("/api/couriers");
      if (res.ok) {
        const data = await res.json();
        setCouriers(Array.isArray(data.list) ? data.list : []);
      }
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourier = async (orderId: string, courierId: string) => {
    const selectedCourier = couriers.find((c: any) => String(c.id) === String(courierId));
    const courierName = selectedCourier ? selectedCourier.name : "";
    const newStatus = courierId ? "Kuryede / Dağıtımda" : "Hazırlanıyor";

    // Optimistic state update - Automatically switch status to Kuryede / Dağıtımda when courier is assigned!
    setOrders((prev) =>
      prev.map((o) =>
        String(o.id) === String(orderId)
          ? {
              ...o,
              courierId,
              courierName,
              status: newStatus,
            }
          : o
      )
    );

    if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
      setSelectedOrder((prev: any) => ({
        ...prev,
        courierId,
        courierName,
        status: newStatus,
      }));
    }

    try {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          courierId,
          courierName,
          status: newStatus,
        }),
      });
    } catch (e) {
      alert("Kurye atama hatası.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`${orderId} numaralı siparişi silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setOrders(orders.filter((o) => o.id !== orderId));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
      }
    } catch (e) {
      alert("Sipariş silinirken hata oluştu.");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const deliveredAt = newStatus === "Teslim Edildi" ? new Date().toLocaleString("tr-TR") : undefined;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus, deliveredAt }),
      });
      if (res.ok) {
        setOrders(
          orders.map((o) => (o.id === orderId ? { ...o, status: newStatus, deliveredAt: deliveredAt || o.deliveredAt } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus, deliveredAt: deliveredAt || selectedOrder.deliveredAt });
        }
      }
    } catch (e) {
      alert("Durum güncellenirken hata oluştu.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingOrderId(orderId);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const photoTime = new Date().toISOString();
        const updateRes = await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            preparedPhoto: data.url,
            preparedPhotoTime: photoTime,
            status: "Fotoğraflı Onay Bekliyor",
            customerApprovalStatus: "Bekliyor",
            rejectionReason: "",
          }),
        });

        if (updateRes.ok) {
          setOrders(
            orders.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    preparedPhoto: data.url,
                    preparedPhotoTime: photoTime,
                    status: "Fotoğraflı Onay Bekliyor",
                    customerApprovalStatus: "Bekliyor",
                    rejectionReason: "",
                  }
                : o
            )
          );
          if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({
              ...selectedOrder,
              preparedPhoto: data.url,
              status: "Fotoğraflı Onay Bekliyor",
              customerApprovalStatus: "Onay Bekliyor",
            });
          }
          alert("Hazırlanan çiçeğin fotoğrafı yüklendi ve siparişe kaydedildi!");
        }
      }
    } catch (err) {
      alert("Fotoğraf yükleme hatası.");
    } finally {
      setUploadingOrderId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center font-extrabold text-slate-500">Sipariş yönetim paneli yükleniyor...</div>
      </AdminLayout>
    );
  }

  const todayStr = getTodayIsoStr();

  // 1. Calculate Quick Date Preset Counts (over all orders in database)
  const countTodayOrders = orders.filter(
    (o) => normalizeDateStr(o.deliveryDate || o.delivery_date || o.date || o.created_at) === todayStr
  ).length;

  const countUpcomingOrders = orders.filter((o) => {
    const d = normalizeDateStr(o.deliveryDate || o.delivery_date || o.date || o.created_at);
    return d > todayStr;
  }).length;

  const countPastOrders = orders.filter((o) => {
    const d = normalizeDateStr(o.deliveryDate || o.delivery_date || o.date || o.created_at);
    return d < todayStr && d.length > 0;
  }).length;

  // 2. Filter Orders by Date Range First
  const dateFilteredOrders = orders.filter((o) => {
    const orderDateNorm = normalizeDateStr(o.deliveryDate || o.delivery_date || o.date || o.created_at);

    if (dateFilterType === "today") {
      return orderDateNorm === todayStr;
    }
    if (dateFilterType === "upcoming") {
      return orderDateNorm > todayStr;
    }
    if (dateFilterType === "past") {
      return orderDateNorm < todayStr && orderDateNorm.length > 0;
    }
    if (dateFilterType === "custom") {
      if (startDate && orderDateNorm < startDate) return false;
      if (endDate && orderDateNorm > endDate) return false;
      return true;
    }
    // "all"
    return true;
  });

  // 3. Status Tab Counts computed based on dateFilteredOrders
  const countAllInDate = dateFilteredOrders.length;
  const countNew = dateFilteredOrders.filter(
    (o) => getCanonicalStatus(o.status, o.courierId) === "Yeni Sipariş"
  ).length;
  const countPreparing = dateFilteredOrders.filter(
    (o) =>
      getCanonicalStatus(o.status, o.courierId) === "Hazırlanıyor" ||
      String(o.status || "").includes("Hazırlanıyor") ||
      String(o.status || "").includes("Fotoğraf")
  ).length;
  const countShipping = dateFilteredOrders.filter(
    (o) => getCanonicalStatus(o.status, o.courierId) === "Kuryede / Dağıtımda"
  ).length;
  const countDelivered = dateFilteredOrders.filter(
    (o) => getCanonicalStatus(o.status, o.courierId) === "Teslim Edildi"
  ).length;

  // 4. Final Filtered Orders (Search Query + Active Tab)
  const filteredOrders = dateFilteredOrders.filter((o) => {
    const currentStatus = getCanonicalStatus(o.status, o.courierId);

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = String(o.id).toLowerCase().includes(q);
      const matchCustomer = String(o.customerName || "").toLowerCase().includes(q);
      const matchRecipient = String(o.recipientName || "").toLowerCase().includes(q);
      const matchAddress = String(o.address || "").toLowerCase().includes(q);
      if (!matchId && !matchCustomer && !matchRecipient && !matchAddress) return false;
    }

    // Tab filter
    if (activeTab === "new") return currentStatus === "Yeni Sipariş";
    if (activeTab === "preparing")
      return (
        currentStatus === "Hazırlanıyor" ||
        currentStatus === "Fotoğraflı Onay Bekliyor" ||
        String(o.status || "").includes("Hazırlanıyor") ||
        String(o.status || "").includes("Fotoğraf")
      );
    if (activeTab === "shipping") return currentStatus === "Kuryede / Dağıtımda";
    if (activeTab === "delivered") return currentStatus === "Teslim Edildi";
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* LUXURY PAGE HEADER BANNER */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black uppercase text-amber-900 tracking-wider mb-1">🌸 ÇİÇEKÇE CANLI SİPARİŞ MERKEZİ</div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Sipariş Yönetim & Kurye Dağıtım Paneli</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gelen siparişler, hazırlanan buket fotoğrafları, WhatsApp müşteri onayları ve canlı kurye atamaları.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="hover:opacity-95 px-5 py-2.5 rounded-2xl font-extrabold text-xs shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <span>🔄 Canlı Yenile</span>
          </button>
        </div>

        {/* PREMIUM DATE FILTER & DELIVERY CALENDAR BAR */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2b2623] text-white flex items-center justify-center font-bold text-lg shadow-xs">
                📅
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 m-0">Sipariş Tarihi ve Teslimat Takvimi</h4>
                <p className="text-xs text-slate-500 m-0">Siparişleri teslimat tarihlerine göre filtreleyin veya iki tarih arasını listeleyin.</p>
              </div>
            </div>

            {/* Date Inputs */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="text-slate-400">Başlangıç:</span>
                <input
                  type="date"
                  className="bg-transparent text-xs font-extrabold text-slate-900 outline-none cursor-pointer"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (!endDate || endDate < val) {
                      setEndDate(val);
                    }
                    setDateFilterType("custom");
                  }}
                />
              </div>

              <span className="text-slate-300 font-black text-sm">-</span>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs">
                <span className="text-slate-400">Bitiş:</span>
                <input
                  type="date"
                  className="bg-transparent text-xs font-extrabold text-slate-900 outline-none cursor-pointer"
                  value={endDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEndDate(val);
                    if (startDate && startDate > val) {
                      setStartDate(val);
                    }
                    setDateFilterType("custom");
                  }}
                />
              </div>

              {(startDate !== todayDefault || endDate !== todayDefault || dateFilterType !== "today") && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate(todayDefault);
                    setEndDate(todayDefault);
                    setDateFilterType("today");
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold transition border border-slate-200"
                >
                  ↩ Bugün'e Dön
                </button>
              )}
            </div>
          </div>

          {/* Quick Date Filter Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setDateFilterType("today");
                setStartDate(todayDefault);
                setEndDate(todayDefault);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                dateFilterType === "today"
                  ? "bg-[#2b2623] text-white shadow-xs ring-2 ring-[#2b2623]/20"
                  : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              <span>📅 Bugünün Siparişleri</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dateFilterType === "today" ? "bg-white/20 text-white" : "bg-emerald-200/80 text-emerald-950"}`}>
                {countTodayOrders}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDateFilterType("upcoming")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                dateFilterType === "upcoming"
                  ? "bg-[#2b2623] text-white shadow-xs ring-2 ring-[#2b2623]/20"
                  : "bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200"
              }`}
            >
              <span>⏩ İleri Tarihli Siparişler</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dateFilterType === "upcoming" ? "bg-white/20 text-white" : "bg-blue-200/80 text-blue-950"}`}>
                {countUpcomingOrders}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDateFilterType("past")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                dateFilterType === "past"
                  ? "bg-[#2b2623] text-white shadow-xs ring-2 ring-[#2b2623]/20"
                  : "bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              <span>⏪ Geçmiş Tarihli Siparişler</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dateFilterType === "past" ? "bg-white/20 text-white" : "bg-purple-200/80 text-purple-950"}`}>
                {countPastOrders}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDateFilterType("all");
                setStartDate("");
                setEndDate("");
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
                dateFilterType === "all"
                  ? "bg-[#2b2623] text-white shadow-xs ring-2 ring-[#2b2623]/20"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              <span>🌐 Tüm Zamanlar</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${dateFilterType === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"}`}>
                {orders.length}
              </span>
            </button>
          </div>
        </div>

        {/* ELEGANT PILL STATUS FILTER TABS */}
        <div className="bg-white rounded-3xl p-2 border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-[#2b2623] text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Tüm Siparişler</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              {countAllInDate}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("new")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "new"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            <span>🔴 Yeni Sipariş</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "new" ? "bg-white/20 text-white" : "bg-red-200 text-red-900"}`}>
              {countNew}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("preparing")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "preparing"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            <span>🟡 Hazırlanıyor</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "preparing" ? "bg-white/20 text-white" : "bg-amber-200 text-amber-900"}`}>
              {countPreparing}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("shipping")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "shipping"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <span>🚚 Arabaya Verildi / Kuryede</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "shipping" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-900"}`}>
              {countShipping}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("delivered")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "delivered"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <span>🟢 Teslim Edildi</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "delivered" ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-900"}`}>
              {countDelivered}
            </span>
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs">
          <div className="relative">
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2b2623] transition placeholder:text-slate-400"
              placeholder="🔍 Sipariş kuralı, Sipariş No (#SIP-...), Alıcı Adı, Telefon veya Teslimat Adresi ile arama yapın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="absolute left-4 top-3.5 text-slate-400 text-sm"></span>
          </div>
        </div>

        {/* PREVIEW & ORDERS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-100/80 text-[11px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4" style={{ width: "240px" }}>Çiçek / Ürün</th>
                  <th className="px-3 py-4 text-center" style={{ width: "60px" }}>Adet</th>
                  <th className="px-4 py-4" style={{ width: "110px" }}>Sipariş No</th>
                  <th className="px-4 py-4 text-center" style={{ width: "200px" }}>DURUM</th>
                  <th className="px-4 py-4" style={{ width: "160px" }}>Teslimat Bilgisi</th>
                  <th className="px-4 py-4" style={{ width: "110px" }}>Tutar</th>
                  <th className="px-5 py-4">Alıcı & Gönderen</th>
                  <th className="px-5 py-4 text-right" style={{ width: "150px" }}>İşlemler</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400 font-extrabold">
                      🌸 Seçilen filtre kriterlerine uygun sipariş bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o: any) => {
                    const firstItem = Array.isArray(o.items) && o.items[0] ? o.items[0] : null;
                    const itemTitle = firstItem?.title || firstItem?.product?.title || "Özel Çiçek Aranjmanı";
                    const itemImage = firstItem?.image || firstItem?.product?.image || "https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp";

                    const approvalLink = `http://localhost:3000/siparis-onay/${o.id}`;
                    const waMessage = `Merhaba Sayın ${o.customerName || "Müşterimiz"}, Çiçekçe'den sipariş ettiğiniz çiçeğiniz özenle hazırlandı! 🌸 Hazırlanan çiçeğinizin fotoğrafını incelemek ve onaylamak için tıklayın: ${approvalLink}`;
                    const waUrl = `https://wa.me/${(o.customerPhone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`;

                    const currentCourierId = o.courierId || couriers.find((c: any) => String(c.id) === String(o.courierId) || String(c.name).toLowerCase() === String(o.courierName || "").toLowerCase())?.id || "";
                    const canonicalStatus = getCanonicalStatus(o.status, currentCourierId);

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition duration-150">
                        {/* 1. ÜRÜN */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={itemImage}
                              alt={itemTitle}
                              className="w-14 h-14 object-cover rounded-2xl border border-slate-200 shadow-xs shrink-0 bg-slate-50"
                            />
                            <div className="space-y-1">
                              <div className="font-extrabold text-slate-900 line-clamp-2 text-xs leading-snug">
                                {itemTitle}
                              </div>
                              <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="inline-block text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                                {firstItem?.code || `DM${o.id}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. ADET */}
                        <td className="px-3 py-4 text-center font-black text-slate-800 text-xs">
                          {firstItem?.quantity || 1}
                        </td>

                        {/* 3. SİPARİŞ NO */}
                        <td className="px-4 py-4 space-y-1">
                          <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-950 font-black rounded-lg text-xs font-monospace shadow-xs border border-amber-200/60">
                            #{o.id}
                          </span>
                          <div className="text-[11px] text-slate-400 font-bold">{o.date}</div>
                        </td>

                        {/* 4. DURUM SÜTUNU (DİNAMİK BUTONLAR) */}
                        <td className="px-4 py-4 space-y-1.5 text-center">
                          {/* CASE 1: YENİ SİPARİŞ */}
                          {canonicalStatus === "Yeni Sipariş" && (
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(o.id, "Hazırlanıyor")}
                                className="w-full py-2 px-3 rounded-xl font-black text-xs bg-amber-500 text-white shadow-xs hover:bg-amber-600 transition flex items-center justify-center gap-1.5"
                              >
                                <span>🟡 Hazırlanıyor'a Al</span>
                              </button>
                              <span className="inline-block text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                                🔴 Yeni Sipariş
                              </span>
                            </div>
                          )}

                          {/* CASE 2: HAZIRLANIYOR / FOTOĞRAFLI ONAY BEKLİYOR */}
                          {(canonicalStatus === "Hazırlanıyor" || canonicalStatus === "Fotoğraflı Onay Bekliyor") && (
                            <div className="space-y-1.5">
                              {/* Subcase A: Müşteri Onayladı -> Yeşil Kuryeye Teslim Edin */}
                              {(o.customerApprovalStatus === "Onaylandı" || o.customerApprovalStatus === "Otomatik Onaylandı" || o.customerApprovalStatus === "Sistem Tarafından Onaylandı") ? (
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (o.courierId || o.courierName) {
                                        handleStatusChange(o.id, "Kuryede / Dağıtımda");
                                      } else {
                                        setSelectedOrder(o);
                                      }
                                    }}
                                    className="w-full py-2 px-2.5 rounded-xl font-black text-xs bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1"
                                  >
                                    <span>🟢 Kuryeye Teslim Edin</span>
                                  </button>
                                  {/* DISTINCT APPROVAL SOURCE BADGES */}
                                  {String(o.customerApprovalStatus || "").includes("Sistem") ? (
                                    <div className="text-[10px] font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-300 flex items-center justify-center gap-1">
                                      <span>🤖 Sistem Otomatik Onayladı (15 Dk Doldu)</span>
                                    </div>
                                  ) : String(o.customerApprovalStatus || "").includes("Onaylandı") ? (
                                    <div className="text-[10px] font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center justify-center gap-1">
                                      <span>🧑 Müşteri Tarafından Onaylandı</span>
                                    </div>
                                  ) : null}
                                </div>
                              ) : o.customerApprovalStatus === "Reddedildi" ? (
                                /* Subcase B: Müşteri Reddeti -> Kırmızı Yeniden Görsel İletin */
                                <div className="space-y-1">
                                  <div className="space-y-1.5">
                                    <label className="w-full py-2 px-2 rounded-xl font-black text-xs bg-red-600 text-white shadow-xs hover:bg-red-700 transition flex items-center justify-center gap-1 cursor-pointer">
                                      <span>🔴 Müşteri Düzeltme İstedi (Yeni Görsel Yükle)</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingOrderId === o.id}
                                        onChange={(e) => handlePhotoUpload(e, o.id)}
                                      />
                                    </label>
                                    {o.rejectionReason ? (
                                      <div className="p-2 bg-red-50 rounded-xl border border-red-200 text-left space-y-0.5">
                                        <div className="text-[10px] font-black text-red-800 uppercase flex items-center gap-1">
                                          <span>💬</span> Müşteri İsteği:
                                        </div>
                                        <div className="text-xs font-bold text-red-950 italic">
                                          "{o.rejectionReason}"
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] font-bold text-red-600">
                                        Müşteri görseli reddetti.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : o.preparedPhoto ? (
                                /* Subcase C: Görsel Yüklendi -> Onay Bekleniyor & WhatsApp */
                                <div className="space-y-1">
                                  <div className="p-1.5 bg-purple-50 rounded-xl border border-purple-200 text-center">
                                    <span className="text-[11px] font-black text-purple-900">
                                      📸 Müşteri Onayı Bekleniyor
                                    </span>
                                  </div>
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                                    className="w-full py-1 px-2 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1 shadow-2xs"
                                  >
                                    <span>💬 Onay Linki Gönder</span>
                                  </a>
                                </div>
                              ) : (
                                /* Subcase D: Fotoğraf Onayı Gönder */
                                <label className="w-full py-2 px-2 rounded-xl font-black text-xs bg-[#2b2623] text-white shadow-xs hover:opacity-95 transition flex items-center justify-center gap-1 cursor-pointer">
                                  <span>📸 {uploadingOrderId === o.id ? "Yükleniyor..." : "Fotoğraf Onayı Gönder"}</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingOrderId === o.id}
                                    onChange={(e) => handlePhotoUpload(e, o.id)}
                                  />
                                </label>
                              )}
                            </div>
                          )}

                          {/* CASE 3: KURYEDE / DAĞITIMDA */}
                          {canonicalStatus === "Kuryede / Dağıtımda" && (
                            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-black flex items-center justify-center gap-1.5">
                              <span>🛵</span>
                              <span>{o.courierName ? o.courierName : "Kuryede"}</span>
                            </div>
                          )}

                          {/* CASE 4: TESLİM EDİLDİ */}
                          {canonicalStatus === "Teslim Edildi" && (
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-black flex items-center justify-center gap-1.5">
                              <span>✅</span>
                              <span>Teslim Edildi</span>
                            </div>
                          )}

                          {/* CASE 5: İPTAL */}
                          {canonicalStatus === "İptal" && (
                            <div className="p-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold text-center">
                              İptal Edildi
                            </div>
                          )}
                        </td>

                        {/* 5. TESLİMAT BİLGİSİ */}
                        <td className="px-4 py-4 space-y-1">
                          <div className="text-xs font-bold text-slate-800">Servis İle Gönderim</div>
                          <div className="text-xs font-black text-[#2b2623]">
                            📅 {o.deliveryDate || o.date}
                          </div>
                          <div className="text-[11px] text-slate-500 font-extrabold">
                            ⏰ {o.deliveryTime || "09:00 - 18:00"}
                          </div>
                        </td>

                        {/* 6. FİYAT */}
                        <td className="px-4 py-4 font-black text-slate-900 text-sm">
                          {o.totalAmount || o.totalPrice} ₺
                        </td>

                        {/* 7. ALICI & GÖNDEREN */}
                        <td className="px-5 py-4 max-w-xs space-y-1">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {o.recipientName || "Alıcı Adı Belirtilmedi"}
                          </div>
                          <div className="text-xs text-slate-600 font-medium line-clamp-2 leading-snug">
                            {o.address}
                          </div>
                          <div className="text-[11px] text-slate-400 font-bold">
                            Gönderen: <span className="text-slate-700">{o.customerName || "İsimsiz"}</span> ({o.customerPhone || "—"})
                          </div>
                        </td>

                        {/* 8. İŞLEMLER */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex flex-col gap-1.5 items-end">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(o)}
                              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                              className="hover:opacity-90 px-3 py-1.5 rounded-xl font-extrabold text-xs shadow-xs transition w-full text-center"
                            >
                              👁 Detay
                            </button>

                            {o.preparedPhoto ? (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-xl font-extrabold text-[11px] shadow-xs transition w-full text-center"
                              >
                                💬 WhatsApp
                              </a>
                            ) : (
                              <label className="border border-blue-600 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition w-full text-center cursor-pointer">
                                <span>📸 Foto Yükle</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="d-none"
                                  onChange={(e) => handlePhotoUpload(e, o.id)}
                                />
                              </label>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(o.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-xl font-extrabold text-[11px] transition w-full text-center"
                            >
                              🗑️ Sil
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

        {/* COMPREHENSIVE FLORIST ORDER DETAILS MODAL */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden font-sans flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 bg-slate-50 border-b flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F5EFE6] text-[#2b2623] flex items-center justify-center font-black text-lg">
                    🌸
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 m-0">
                        Sipariş #{selectedOrder.id}
                      </h3>
                      <span
                        style={{
                          backgroundColor:
                            selectedOrder.status === "Teslim Edildi" ? "#dcfce7" :
                            selectedOrder.status === "Kuryede / Dağıtımda" ? "#e0e7ff" :
                            selectedOrder.status === "Müşteri Onayı Bekliyor" ? "#fef3c7" :
                            selectedOrder.status === "Hazırlanıyor" ? "#ffedd5" :
                            selectedOrder.status === "İptal Edildi" ? "#fee2e2" : "#f1f5f9",
                          color:
                            selectedOrder.status === "Teslim Edildi" ? "#166534" :
                            selectedOrder.status === "Kuryede / Dağıtımda" ? "#3730a3" :
                            selectedOrder.status === "Müşteri Onayı Bekliyor" ? "#92400e" :
                            selectedOrder.status === "Hazırlanıyor" ? "#9a3412" :
                            selectedOrder.status === "İptal Edildi" ? "#991b1b" : "#475569"
                        }}
                        className="px-2.5 py-0.5 rounded-full text-xs font-black border"
                      >
                        {getCanonicalStatus(selectedOrder.status, selectedOrder.courierId)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">
                      Tarih: {selectedOrder.date || selectedOrder.createdAt || "Bugün"} · Ödeme: <strong className="text-slate-800">{selectedOrder.paymentMethod || "Kredi Kartı"}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/yonetim/siparisler/fis/${selectedOrder.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-light btn-sm text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 border shadow-2xs"
                  >
                    <span>🖨️ 80mm Fiş Yazdır</span>
                  </a>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* REJECTION REASON ALERT IF CUSTOMER REQUESTED CHANGES AND STATUS IS STILL REDDEDILDI */}
                {selectedOrder.customerApprovalStatus === "Reddedildi" && selectedOrder.rejectionReason && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-red-950 space-y-1.5 shadow-xs">
                    <div className="font-black text-xs text-red-800 uppercase flex items-center gap-1.5">
                      <span>💬</span> <span>MÜŞTERİNİN ÇİÇEK DÜZELTME & DEĞİŞİKLİK TALEBİ:</span>
                    </div>
                    <div className="text-sm font-bold bg-white p-3.5 rounded-xl border border-red-200 text-red-950 leading-relaxed shadow-2xs">
                      "{selectedOrder.rejectionReason}"
                    </div>
                  </div>
                )}

                {/* 1. STATUS & COURIER CONTROL BAR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF6F0] p-4 rounded-2xl border border-slate-200/80">
                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
                      <span>🔄</span> <span>Sipariş Durumunu Güncelle:</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white font-bold text-slate-800 border border-slate-300 rounded-xl text-xs shadow-xs focus:ring-2 focus:ring-[#2b2623]"
                      value={getCanonicalStatus(selectedOrder.status, selectedOrder.courierId)}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    >
                      <option value="Yeni Sipariş">🟡 Yeni Sipariş</option>
                      <option value="Hazırlanıyor">🟠 Hazırlanıyor (Çiçek Düzenleniyor)</option>
                      <option value="Müşteri Onayı Bekliyor">📸 Müşteri Görsel Onayı Bekliyor</option>
                      <option value="Kuryede / Dağıtımda">🛵 Kuryede / Dağıtımda</option>
                      <option value="Teslim Edildi">✅ Teslim Edildi</option>
                      <option value="İptal Edildi">❌ İptal Edildi</option>
                    </select>
                  </div>

                  {/* Courier Assignment */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5 flex items-center gap-1">
                      <span>🛵</span> <span>Kurye / Şoför Ataması:</span>
                    </label>
                    <select
                      className="w-full px-3 py-2 bg-white font-bold text-slate-800 border border-slate-300 rounded-xl text-xs shadow-xs focus:ring-2 focus:ring-[#2b2623]"
                      value={selectedOrder.courierId || couriers.find((c: any) => c.name === selectedOrder.courierName)?.id || ""}
                      onChange={(e) => handleAssignCourier(selectedOrder.id, e.target.value)}
                    >
                      <option value="">-- Kurye Atanmadı --</option>
                      {couriers.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          🛵 {c.name} ({c.region || "Genel"} - {c.phone || "Tel Yok"})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. PREPARED FLOWER PHOTO & CUSTOMER APPROVAL SECTION */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📸</span>
                      <h4 className="text-sm font-black text-slate-900 m-0">Hazırlanan Çiçek Görseli & Müşteri Onayı</h4>
                    </div>
                    {selectedOrder.preparedPhoto ? (
                      <div className="flex items-center gap-2">
                        {String(selectedOrder.customerApprovalStatus || "").includes("Sistem") ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                            <span>🤖</span> <span>Sistem Otomatik Onayladı (15 Dk Süre Doldu)</span>
                          </span>
                        ) : String(selectedOrder.customerApprovalStatus || "").includes("Onaylandı") ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <span>🧑</span> <span>Müşteri Tarafından Onaylandı</span>
                          </span>
                        ) : selectedOrder.customerApprovalStatus === "Reddedildi" ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300 flex items-center gap-1">
                            <span>🔴</span> <span>Müşteri Görseli Reddeti</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                            <span>⏳</span> <span>Müşteri Onayı Bekliyor (15 Dk Sayaç Aktif)</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <span>⏳</span> <span>Fotoğraf Bekleniyor</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {selectedOrder.preparedPhoto ? (
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden border bg-slate-100 shrink-0 shadow-xs">
                        <img
                          src={selectedOrder.preparedPhoto}
                          alt="Hazırlanan Çiçek"
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={selectedOrder.preparedPhoto}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold"
                        >
                          Büyüt 🔍
                        </a>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 p-2 text-center text-xs">
                        <span className="text-2xl mb-1">💐</span>
                        <span>Fotoğraf Yok</span>
                      </div>
                    )}

                    <div className="space-y-2 flex-1 w-full">
                      <p className="text-xs text-slate-600 m-0">
                        Çiçek atölyede hazırlandığında fotoğrafını yükleyerek müşterinin sipariş takip ekranında canlı onaylamasını sağlayabilirsiniz.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <label className="btn btn-dark btn-sm text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs">
                          <span>📸 {selectedOrder.preparedPhoto ? "Fotoğrafı Değiştir" : "Canlı Fotoğraf Yükle"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e, selectedOrder.id)}
                          />
                        </label>

                        {selectedOrder.preparedPhoto && (
                          <a
                            href={`https://wa.me/90${(selectedOrder.customerPhone || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Merhaba ${selectedOrder.customerName}, #${selectedOrder.id} numaralı siparişiniz atölyemizde özenle hazırlandı! 🌸 Fotoğrafı incelemek ve onaylamak için: http://localhost:3000/siparis-takip?orderId=${selectedOrder.id}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                            className="btn btn-sm text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs"
                          >
                            <span>💬 Müşteriye Onay Linki Gönder</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SEPARATE COURIER DOOR DELIVERY PHOTO DISPLAY */}
                  {selectedOrder.deliveredPhoto && selectedOrder.deliveredPhoto !== selectedOrder.preparedPhoto && (
                    <div className="pt-3 border-t border-slate-200 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">🚚</span>
                        <h4 className="text-xs font-black text-slate-900 m-0 uppercase">Kurye Kapıda Teslimat Görseli</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Teslimat Anında Çekildi ({selectedOrder.deliveredAt || "Teslim Edildi"})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border bg-slate-100 shrink-0 shadow-xs">
                          <img
                            src={selectedOrder.deliveredPhoto}
                            alt="Kurye Teslimat Fotoğrafı"
                            className="w-full h-full object-cover"
                          />
                          <a
                            href={selectedOrder.deliveredPhoto}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold"
                          >
                            Büyüt 🔍
                          </a>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div>Teslim Edilme Zamanı: <strong className="text-slate-900">{selectedOrder.deliveredAt || "—"}</strong></div>
                          <div>Teslimat Notu: <strong className="text-slate-900">{selectedOrder.deliveryNote || "Alıcının kendisine teslim edildi."}</strong></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. FLOWER CARD NOTE (YAZILACAK KART NOTU) */}
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 text-amber-950 space-y-2.5">
                  <div className="font-black text-xs uppercase text-amber-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>💌</span> <span>YAZILACAK ÇİÇEK KART NOTU</span>
                    </span>
                    {selectedOrder.isAnonymous && (
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                        🕵️ Gizli Gönderici (İsim Yazılmayacak)
                      </span>
                    )}
                  </div>
                  <div className="text-base font-bold italic text-slate-900 bg-white/80 p-3 rounded-xl border border-amber-200/80">
                    "{selectedOrder.cardNote || "Kart notu belirtilmedi."}"
                  </div>
                  <div className="flex flex-wrap justify-between text-xs text-slate-700 pt-1 gap-2 font-medium">
                    <span>Gönderen: <strong className="text-slate-900">{selectedOrder.customerName}</strong> ({selectedOrder.customerPhone || "—"})</span>
                    <span>Alıcı: <strong className="text-slate-900">{selectedOrder.recipientName}</strong> ({selectedOrder.recipientPhone || "—"})</span>
                  </div>
                </div>

                {/* 4. PRODUCTS & EXTRAS TABLE */}
                <div className="border rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <div className="bg-slate-50 px-4 py-2.5 border-b font-black text-xs text-slate-700 uppercase flex justify-between items-center">
                    <span>Siparişteki Çiçekler & Ek Ürünler</span>
                    <span>Toplam: <strong className="text-[#2b2623] text-sm">{selectedOrder.totalAmount || selectedOrder.totalPrice} ₺</strong></span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 w-full text-xs">
                      <thead className="bg-slate-50/50 text-[11px] text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-2">Ürün / Ekstra</th>
                          <th className="px-4 py-2">Tür</th>
                          <th className="px-4 py-2 text-center">Adet</th>
                          <th className="px-4 py-2 text-end">Birim Fiyat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Items */}
                        {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((it: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 font-bold text-slate-800">
                                🌸 {it.title || it.name || "Çiçek Buketi"}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                                  Ana Ürün
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-bold">{it.quantity || 1}</td>
                              <td className="px-4 py-3 font-black text-end text-slate-900">{it.price || "—"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="px-4 py-3 font-bold text-slate-800">
                              🌸 {selectedOrder.productName || selectedOrder.product || "Çiçek Buketi"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                                Ana Ürün
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold">1</td>
                            <td className="px-4 py-3 font-black text-end text-slate-900">{selectedOrder.totalAmount || selectedOrder.totalPrice} ₺</td>
                          </tr>
                        )}

                        {/* Addons / Extras */}
                        {Array.isArray(selectedOrder.addons) && selectedOrder.addons.map((add: any, idx: number) => (
                          <tr key={`addon-${idx}`} className="bg-amber-50/30">
                            <td className="px-4 py-3 font-bold text-amber-950 flex items-center gap-1.5">
                              <span>🎁</span> <span>{add.name}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded border border-amber-300">
                                Ekstra Hediye
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-bold">1</td>
                            <td className="px-4 py-3 font-black text-end text-amber-900">{add.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. DELIVERY & RECIPIENT INFORMATION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recipient Details */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <h5 className="font-black text-slate-800 text-xs uppercase border-b pb-2 flex items-center gap-1.5">
                      <span>📍</span> <span>Teslimat & Alıcı Bilgileri</span>
                    </h5>
                    <div className="space-y-1 text-slate-700">
                      <div>Alıcı Adı: <strong className="text-slate-900">{selectedOrder.recipientName || "—"}</strong></div>
                      <div>Alıcı Telefonu: <strong className="text-slate-900">{selectedOrder.recipientPhone || "—"}</strong></div>
                      <div>Teslimat Tarihi: <strong className="text-[#2b2623]">{selectedOrder.deliveryDate || selectedOrder.date}</strong></div>
                      <div>Teslimat Saati: <strong className="text-[#2b2623]">{selectedOrder.deliveryTime || "09:00 - 18:00"}</strong></div>
                      <div className="pt-1">
                        <span className="text-slate-500">Açık Adres:</span>
                        <div className="font-bold text-slate-800 mt-0.5 bg-white p-2 rounded-lg border">{selectedOrder.address || "Adres belirtilmedi"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Customer (Sender) Details */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <h5 className="font-black text-slate-800 text-xs uppercase border-b pb-2 flex items-center gap-1.5">
                      <span>👤</span> <span>Siparişi Veren Müşteri Bilgileri</span>
                    </h5>
                    <div className="space-y-1 text-slate-700">
                      <div>Müşteri Adı: <strong className="text-slate-900">{selectedOrder.customerName || "Misafir"}</strong></div>
                      <div>Telefon: <strong className="text-slate-900">{selectedOrder.customerPhone || "—"}</strong></div>
                      <div>E-Posta: <strong className="text-slate-900">{selectedOrder.customerEmail || "—"}</strong></div>
                      <div>Ödeme Türü: <strong className="text-slate-900">{selectedOrder.paymentMethod || "Kredi Kartı"}</strong></div>
                      <div className="pt-2">
                        <a
                          href={`https://wa.me/90${(selectedOrder.customerPhone || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Merhaba ${selectedOrder.customerName}, #${selectedOrder.id} numaralı siparişiniz ile ilgili bilgi vermek için ulaşıyoruz.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                          className="btn btn-sm w-full font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <span>💬 Müşteriyle WhatsApp'tan Görüş</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="text-red-600 hover:text-red-800 font-bold text-xs flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-red-50 transition"
                >
                  <span>🗑️ Siparişi Sil</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-6 py-2.5 rounded-xl font-extrabold text-xs shadow-xs hover:opacity-90 transition"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
