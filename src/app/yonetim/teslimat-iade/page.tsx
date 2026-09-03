"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function TeslimatVeIadePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "shipping" | "delivered" | "returned">("all");
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetchOrdersAndCouriers();
  }, []);

  const fetchOrdersAndCouriers = async () => {
    try {
      const [ordersRes, couriersRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/couriers")
      ]);

      const ordersData = ordersRes.ok ? await ordersRes.json() : [];
      const couriersData = couriersRes.ok ? await couriersRes.json() : {};

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCouriers(Array.isArray(couriersData.list) ? couriersData.list : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourier = async (orderId: string, courierId: string) => {
    const selectedCourier = couriers.find((c) => c.id === courierId);
    const courierName = selectedCourier ? selectedCourier.name : "";

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          courierId,
          courierName,
          status: "Kuryede / Dağıtımda"
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, courierId, courierName, status: "Kuryede / Dağıtımda" }
              : o
          )
        );
        setToastMsg(`Sipariş #${orderId} kuryeye (${courierName}) atandı ve durumu 'Kuryede / Dağıtımda' olarak güncellendi!`);
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Kurye atama hatası.");
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const deliveredAt = newStatus === "Teslim Edildi" ? new Date().toLocaleString("tr-TR") : undefined;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: newStatus,
          deliveredAt
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: newStatus, deliveredAt: deliveredAt || o.deliveredAt }
              : o
          )
        );
        setToastMsg(`Sipariş #${orderId} durumu '${newStatus}' olarak güncellendi!`);
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Durum güncelleme hatası.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-5 text-center font-bold text-slate-600">Teslimat & İade operasyon verileri yükleniyor...</div>
      </AdminLayout>
    );
  }

  // Filter orders based on active tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === "shipping") return o.status === "Kuryede / Dağıtımda" || o.courierName;
    if (activeTab === "delivered") return o.status === "Teslim Edildi";
    if (activeTab === "returned") return o.status === "İade Edildi" || o.status === "İptal Edildi";
    return true;
  });

  const countDelivered = orders.filter((o) => o.status === "Teslim Edildi").length;
  const countShipping = orders.filter((o) => o.status === "Kuryede / Dağıtımda" || o.courierName).length;
  const countReturned = orders.filter((o) => o.status === "İade Edildi" || o.status === "İptal Edildi").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Teslimat & Kasa /</span> Kurye Teslimat & İade Operasyon Paneli
            </h4>
            <p className="text-slate-500 text-sm">
              Saha kuryelerine atanan siparişler, teslimat saatleri, teslim edilen çiçekler ve iade durumları.
            </p>
          </div>
        </div>

        {toastMsg && (
          <div className="alert alert-success p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 text-sm rounded-lg font-bold">
            ✅ {toastMsg}
          </div>
        )}

        {/* STATS SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card border-0 shadow-sm rounded-xl p-4 bg-white border-l-4 border-blue-500">
            <div className="text-xs text-slate-500 font-bold uppercase">Toplam Sipariş</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{orders.length} Adet</div>
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-4 bg-white border-l-4 border-amber-500">
            <div className="text-xs text-slate-500 font-bold uppercase">Kuryede / Dağıtımda</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{countShipping} Adet</div>
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-4 bg-white border-l-4 border-emerald-500">
            <div className="text-xs text-slate-500 font-bold uppercase">Teslim Edilenler</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{countDelivered} Adet</div>
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-4 bg-white border-l-4 border-red-500">
            <div className="text-xs text-slate-500 font-bold uppercase">İade / İptal Olanlar</div>
            <div className="text-2xl font-black text-red-600 mt-1">{countReturned} Adet</div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="card border-0 shadow-sm rounded-xl bg-white p-2 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`btn btn-sm font-extrabold px-4 py-2 rounded-lg ${
              activeTab === "all" ? "btn-primary" : "btn-light text-slate-700"
            }`}
          >
            📦 Tüm Teslimat Kayıtları ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("shipping")}
            className={`btn btn-sm font-extrabold px-4 py-2 rounded-lg ${
              activeTab === "shipping" ? "btn-amber bg-amber-500 text-white" : "btn-light text-slate-700"
            }`}
          >
            🚚 Kuryede / Dağıtımda ({countShipping})
          </button>
          <button
            onClick={() => setActiveTab("delivered")}
            className={`btn btn-sm font-extrabold px-4 py-2 rounded-lg ${
              activeTab === "delivered" ? "btn-success bg-emerald-600 text-white" : "btn-light text-slate-700"
            }`}
          >
            ✅ Teslim Edilen Çiçekler ({countDelivered})
          </button>
          <button
            onClick={() => setActiveTab("returned")}
            className={`btn btn-sm font-extrabold px-4 py-2 rounded-lg ${
              activeTab === "returned" ? "btn-danger bg-red-600 text-white" : "btn-light text-slate-700"
            }`}
          >
            🔄 İade / İptal Olanlar ({countReturned})
          </button>
        </div>

        {/* ORDERS LOGISTICS TABLE */}
        <div className="card border-0 shadow-sm rounded-xl bg-white overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Sipariş kuralı & Müşteri</th>
                  <th className="px-4 py-3">Teslimat Adresi</th>
                  <th className="px-4 py-3">İstenen Zaman</th>
                  <th className="px-4 py-3">Atanan Kurye</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Teslimat Zamanı</th>
                  <th className="px-4 py-3 text-end">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                      Seçilen filtrede kayıtlı teslimat bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-800">#{order.id}</div>
                        <div className="text-xs text-slate-600">{order.recipientName || order.customerName}</div>
                        <div className="text-[11px] text-slate-400">{order.recipientPhone || order.customerPhone}</div>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-xs text-slate-700 line-clamp-2">{order.address}</div>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-bold text-slate-800">{order.deliveryDate || order.date}</div>
                        <div className="text-slate-500">{order.deliveryTime || "Tüm Gün"}</div>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          className="form-select form-select-sm text-xs font-bold border-slate-300"
                          value={order.courierId || couriers.find((c: any) => c.name === order.courierName)?.id || ""}
                          onChange={(e) => handleAssignCourier(order.id, e.target.value)}
                        >
                          <option value="">-- Kurye Ata --</option>
                          {couriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              🛵 {c.name} ({c.region || "Genel"})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          className="form-select form-select-sm text-xs font-bold border-slate-300"
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        >
                          <option value="Yeni Sipariş">Yeni Sipariş</option>
                          <option value="Hazırlanıyor">Hazırlanıyor</option>
                          <option value="Kuryede / Dağıtımda">Kuryede / Dağıtımda</option>
                          <option value="Teslim Edildi">✅ Teslim Edildi</option>
                          <option value="İade Edildi">🔄 İade Edildi</option>
                          <option value="İptal Edildi">❌ İptal Edildi</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        {order.deliveredAt ? (
                          <span className="font-bold text-emerald-700">✅ {order.deliveredAt}</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Henüz Teslim Edilmedi</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-end">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleUpdateStatus(order.id, "Teslim Edildi")}
                            className="btn btn-xs btn-success font-bold text-[10px]"
                            title="Teslim Edildi İşaretle"
                          >
                            ✅ Teslim Et
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, "İade Edildi")}
                            className="btn btn-xs btn-outline-danger font-bold text-[10px]"
                            title="İade Et"
                          >
                            🔄 İade Et
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
