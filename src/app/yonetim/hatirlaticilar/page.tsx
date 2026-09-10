"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";
import { Calendar, MessageSquare, Send, Gift, Sparkles, Clock, RefreshCw, CheckCircle2, UserCheck, BellRing } from "lucide-react";

export default function AdminRemindersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState<string>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  // Process orders into annual reminders
  const reminders = orders.map((o: any) => {
    const rawDate = o.deliveryDate || o.date || "Bugün";
    const custName = o.customerName || "Müşterimiz";
    const phone = o.customerPhone || o.recipientPhone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    // Guess occasion from items / cardNote
    let occasion = "Özel Gün";
    const noteLower = (o.cardNote || "").toLowerCase();
    const itemLower = (o.items?.[0]?.title || "").toLowerCase();

    if (noteLower.includes("doğum") || itemLower.includes("doğum")) occasion = "Doğum Günü";
    else if (noteLower.includes("yıl") || noteLower.includes("yıldönümü") || itemLower.includes("yıl")) occasion = "Yıl Dönümü";
    else if (noteLower.includes("sevgi") || noteLower.includes("aşk") || itemLower.includes("sevgililer")) occasion = "Sevgililer Günü";
    else if (noteLower.includes("anneler") || itemLower.includes("anne")) occasion = "Anneler Günü";
    else if (noteLower.includes("geçmiş")) occasion = "Geçmiş Olsun";

    const couponCode = `HATIRLATMA10`;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://cicekce-yeni-two.vercel.app";
    const waMsg = `Merhaba Sayın ${custName}, Çiçekçe'den geçen yıl bu zamanlar sevdiklerinize unutulmaz bir çiçek sürprizi yapmıştınız! 🌸 Yaklaşan ${occasion} kutlamanızı unutmayın diye size özel %10 indirim tanımladık. İndirim Kodunuz: ${couponCode}\n\nHemen sipariş verin: ${origin}`;
    const waUrl = `https://wa.me/90${cleanPhone.slice(-10)}?text=${encodeURIComponent(waMsg)}`;

    return {
      orderId: o.id,
      customerName: custName,
      phone: cleanPhone,
      recipientName: o.recipientName || "Alıcı",
      lastDeliveryDate: rawDate,
      occasion,
      itemTitle: o.items?.[0]?.title || "Çiçek Aranjmanı",
      waUrl,
      couponCode,
    };
  });

  const filteredReminders = reminders.filter((r) => {
    if (selectedOccasion === "all") return true;
    return r.occasion === selectedOccasion;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center font-extrabold text-slate-500">Hatırlatıcı ve pazarlama paneli yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* HEADER */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black uppercase text-amber-900 tracking-wider mb-1 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-[#2b2623]" /> YILLIK OTOMATİK HATIRLATICI & PAZARLAMA PORTALI
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Özel Gün Hatırlatma & Müşteri Bağlama Paneli</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Geçmiş sipariş veren müşterilerinizin yaklaşan özel günlerini (Doğum Günü, Yıl Dönümü vb.) otomatik tespit edin, WhatsApp veya SMS ile indirimli kupon göndererek satışlarınızı katlayın.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="hover:opacity-95 px-5 py-2.5 rounded-2xl font-extrabold text-xs shadow-sm transition flex items-center gap-2 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Listeyi Yenile</span>
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Hatırlatma Bekleyen Müşteri</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{reminders.length}</div>
            <div className="text-[11px] text-slate-400 font-semibold">Yaklaşan özel gün kayıtları</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-600" />
              <span>Tanımlanan Kupon Oranı</span>
            </div>
            <div className="text-3xl font-black text-slate-900">%10 İndirim</div>
            <div className="text-[11px] text-slate-400 font-semibold">Kupon Kodu: HATIRLATMA10</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Tahmini Geri Dönüş Oranı</span>
            </div>
            <div className="text-3xl font-black text-slate-900">%42 Dönüş</div>
            <div className="text-[11px] text-slate-400 font-semibold">Özel gün hatırlatmalarında</div>
          </div>
        </div>

        {/* OCCASION FILTER BADGES */}
        <div className="bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap gap-2">
          {["all", "Doğum Günü", "Yıl Dönümü", "Sevgililer Günü", "Anneler Günü", "Geçmiş Olsun"].map((occ) => (
            <button
              key={occ}
              onClick={() => setSelectedOccasion(occ)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition ${
                selectedOccasion === occ
                  ? "bg-[#2b2623] text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {occ === "all" ? "Tüm Özel Günler" : occ}
            </button>
          ))}
        </div>

        {/* REMINDERS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="bg-slate-50 text-[11px] font-black text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4">Müşteri / Alıcı</th>
                  <th className="px-4 py-4">Son Teslimat Tarihi</th>
                  <th className="px-4 py-4">Özel Gün Kategorisi</th>
                  <th className="px-4 py-4">Son Alınan Ürün</th>
                  <th className="px-4 py-4 text-center">Özel Kupon</th>
                  <th className="px-5 py-4 text-right">İşlem (WhatsApp / SMS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredReminders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400 font-extrabold">
                      Seçilen kategoriye ait hatırlatıcı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredReminders.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-900">{r.customerName}</div>
                        <div className="text-xs text-slate-500 font-mono">Tel: {r.phone || "—"}</div>
                        <div className="text-[10px] text-slate-400">Alıcı: {r.recipientName}</div>
                      </td>

                      <td className="px-4 py-4 font-bold text-slate-700">
                        📅 {r.lastDeliveryDate}
                      </td>

                      <td className="px-4 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-200 inline-block">
                          🎉 {r.occasion}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-slate-800 font-bold">
                        🌸 {r.itemTitle}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="font-mono text-xs font-black bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg">
                          {r.couponCode}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <a
                          href={r.waUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                          className="hover:opacity-90 px-4 py-2 rounded-xl font-extrabold text-xs shadow-xs transition inline-flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp Hatırlatması Gönder</span>
                        </a>
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
