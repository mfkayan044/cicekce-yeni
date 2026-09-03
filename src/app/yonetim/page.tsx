"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

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

function formatPriceTL(num: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [whatsappClicksCount, setWhatsappClicksCount] = useState<number>(0);
  const [abandonedCount, setAbandonedCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, prodsRes, waRes, abRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
        fetch("/api/whatsapp-clicks"),
        fetch("/api/abandoned-carts"),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data)) setOrders(data);
      }

      if (prodsRes.ok) {
        const pData = await prodsRes.json();
        const list = Array.isArray(pData) ? pData : Array.isArray(pData?.products) ? pData.products : [];
        setProductsCount(list.length);
      }

      if (waRes.ok) {
        const waData = await waRes.json();
        const list = Array.isArray(waData) ? waData : Array.isArray(waData?.clicks) ? waData.clicks : [];
        setWhatsappClicksCount(list.length);
      }

      if (abRes.ok) {
        const abData = await abRes.json();
        const list = Array.isArray(abData) ? abData : Array.isArray(abData?.carts) ? abData.carts : [];
        setAbandonedCount(list.length);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Compute live financial & order metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parsePrice(o.totalAmount || o.totalPrice), 0);
  const deliveredOrders = orders.filter((o) => o.status === "Teslim Edildi");
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + parsePrice(o.totalAmount || o.totalPrice), 0);

  const newOrdersCount = orders.filter((o) => o.status === "Yeni Sipariş").length;
  const preparingCount = orders.filter((o) => o.status === "Hazırlanıyor" || o.status === "Fotoğraflı Onay Bekliyor").length;
  const shippingCount = orders.filter((o) => o.status === "Kuryede / Dağıtımda").length;

  const recentOrders = orders.slice(0, 6);

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* Title & Live Refresh Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="text-[11px] font-black uppercase text-amber-900 tracking-wider mb-1">
              🌸 ÇİÇEKÇE CANLI MAĞAZA ANALİTİĞİ
            </div>
            <h4 className="font-black text-2xl lg:text-3xl text-slate-900 m-0">
              Genel Bakış & Performans
            </h4>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Veritabanından çekilen anlık siparişler, toplam ciro, aktif kurye teslimatları ve mağaza verileri.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDashboardData}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-xs hover:opacity-95 transition flex items-center gap-1.5"
            >
              <span>🔄 Verileri Yenile</span>
            </button>
            <Link
              href="/yonetim/siparisler"
              className="px-4 py-2.5 rounded-2xl font-extrabold text-xs bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 transition"
            >
              Sipariş Paneli →
            </Link>
          </div>
        </div>

        {/* Top Metric Cards (Dynamic Live Stats) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Toplam Sipariş */}
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Toplam Sipariş</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg font-bold">
                🛒
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{totalOrders}</div>
            <div className="text-xs text-purple-700 font-bold flex items-center gap-1">
              <span>{newOrdersCount} yeni bekleyen</span>
            </div>
          </div>

          {/* Toplam Ciro */}
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Toplam Ciro</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold">
                💰
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{formatPriceTL(totalRevenue)}</div>
            <div className="text-xs text-emerald-700 font-bold">
              Teslim: {formatPriceTL(deliveredRevenue)}
            </div>
          </div>

          {/* Aktif Dağıtım & Hazırlık */}
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Aktif Çiçekler</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg font-bold">
                🛵
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{preparingCount + shippingCount}</div>
            <div className="text-xs text-amber-800 font-bold">
              {preparingCount} hazırlık · {shippingCount} kuryede
            </div>
          </div>

          {/* Ürün Kataloğu */}
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">Aktif Ürünler</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg font-bold">
                💐
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{productsCount}</div>
            <Link href="/yonetim/urunler" className="text-xs text-blue-700 font-bold hover:underline block">
              Kataloğu Yönet →
            </Link>
          </div>

          {/* WhatsApp / Ziyaret Tıklamaları */}
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl p-5 bg-white space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-xs font-black uppercase tracking-wider">WhatsApp İletişim</span>
              <div className="w-9 h-9 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center text-lg font-bold">
                💬
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{whatsappClicksCount}</div>
            <Link href="/yonetim/whatsapp-tiklamalari" className="text-xs text-green-700 font-bold hover:underline block">
              Tıklamaları Gör →
            </Link>
          </div>
        </div>

        {/* Middle Section: Recent Live Orders Table & Distribution Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Son Siparişler Table (Real Database Orders) */}
          <div className="lg:col-span-2 card border border-slate-200/80 shadow-xs rounded-3xl bg-white overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
              <h5 className="font-black text-slate-900 text-base m-0 flex items-center gap-2">
                <span>🛒</span>
                <span>Canlı Son Siparişler</span>
              </h5>
              <Link
                href="/yonetim/siparisler"
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs hover:opacity-95 transition"
              >
                Tüm Siparişleri Aç ({orders.length})
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[11px] border-b">
                  <tr>
                    <th className="px-5 py-3.5">Sipariş No</th>
                    <th className="px-4 py-3.5">Alıcı / Gönderen</th>
                    <th className="px-4 py-3.5">Tutar</th>
                    <th className="px-4 py-3.5">Durum</th>
                    <th className="px-4 py-3.5">Tarih</th>
                    <th className="px-4 py-3.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">
                        Sipariş verileri yükleniyor...
                      </td>
                    </tr>
                  ) : recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">
                        Henüz sipariş kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((o) => {
                      const amountStr = typeof o.totalAmount === "string" ? o.totalAmount : `${o.totalPrice || 0} ₺`;
                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition duration-150">
                          <td className="px-5 py-3.5 font-bold">
                            <span className="font-mono bg-amber-50 text-amber-950 px-2 py-0.5 rounded-lg border border-amber-200">
                              #{o.id}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{o.recipientName || "Alıcı Belirtilmedi"}</div>
                            <div className="text-[10px] text-slate-400">G: {o.customerName || "Misafir"}</div>
                          </td>
                          <td className="px-4 py-3.5 font-black text-slate-900">{amountStr}</td>
                          <td className="px-4 py-3.5">
                            <span
                              style={{
                                backgroundColor:
                                  o.status === "Teslim Edildi" ? "#dcfce7" :
                                  o.status === "Kuryede / Dağıtımda" ? "#e0e7ff" :
                                  o.status === "Hazırlanıyor" || o.status === "Fotoğraflı Onay Bekliyor" ? "#ffedd5" :
                                  o.status === "Yeni Sipariş" ? "#fee2e2" : "#f1f5f9",
                                color:
                                  o.status === "Teslim Edildi" ? "#166534" :
                                  o.status === "Kuryede / Dağıtımda" ? "#3730a3" :
                                  o.status === "Hazırlanıyor" || o.status === "Fotoğraflı Onay Bekliyor" ? "#9a3412" :
                                  o.status === "Yeni Sipariş" ? "#991b1b" : "#475569",
                              }}
                              className="px-2.5 py-1 rounded-full text-[10px] font-black border inline-block"
                            >
                              {o.status || "Yeni Sipariş"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 text-[11px] font-bold">{o.date || o.createdAt || "Bugün"}</td>
                          <td className="px-4 py-3.5 text-right">
                            <Link
                              href="/yonetim/siparisler"
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-[11px] transition"
                            >
                              Yönet →
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Shortcuts & Live Operations Widget */}
          <div className="card border border-slate-200/80 shadow-xs rounded-3xl bg-white p-5 flex flex-col justify-between space-y-4">
            <div>
              <h5 className="font-black text-slate-900 text-base mb-1 flex items-center gap-2">
                <span>⚡</span>
                <span>Hızlı Mağaza İşlemleri</span>
              </h5>
              <p className="text-xs text-slate-500">
                Sık kullanılan operasyonel yönetim sayfalarına tek tıkla ulaşın.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/yonetim/siparisler"
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📦</span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-amber-900">Sipariş & Dağıtım</div>
                    <div className="text-[10px] text-slate-400">{orders.length} aktif sipariş kaydı</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>

              <Link
                href="/yonetim/yarim-siparisler"
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🛍️</span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-amber-900">Yarım Kalan Sepetler</div>
                    <div className="text-[10px] text-slate-400">{abandonedCount} terk edilen sepet</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>

              <Link
                href="/kurye"
                target="_blank"
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🛵</span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-amber-900">Mobil Kurye Portalı</div>
                    <div className="text-[10px] text-slate-400">Kuryeler için telefon ekranı</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400">↗</span>
              </Link>

              <Link
                href="/yonetim/asistan-konusmalari"
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🎧</span>
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-amber-900">AI Asistan Konuşmaları</div>
                    <div className="text-[10px] text-slate-400">Canlı chatbot logları</div>
                  </div>
                </div>
                <span className="text-xs text-slate-400">→</span>
              </Link>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center text-xs font-black text-amber-950">
              🌸 Çiçekçe E-Ticaret v2.4 Canlı
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
