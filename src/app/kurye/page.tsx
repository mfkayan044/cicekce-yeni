"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Courier {
  id: string;
  name: string;
  phone: string;
  region?: string;
  vehicle?: string;
  avatar?: string;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
  totalAmount?: string;
  totalPrice?: string;
  cardNote?: string;
  items?: any[];
  addons?: any[];
  courierId?: string;
  courierName?: string;
  preparedPhoto?: string;
  deliveredPhoto?: string;
  deliveredAt?: string;
}

export default function CourierPortalPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>("");
  const [deliveredNote, setDeliveredNote] = useState("Alıcının kendisine teslim edildi.");
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Fetch Couriers and Orders
  const fetchData = async () => {
    try {
      const [cRes, oRes] = await Promise.all([
        fetch("/api/couriers"),
        fetch("/api/orders"),
      ]);
      if (cRes.ok) {
        const cData = await cRes.json();
        const list = Array.isArray(cData.list) ? cData.list : [];
        setCouriers(list);
        if (!selectedCourier && list.length > 0) {
          const savedId = typeof window !== "undefined" ? localStorage.getItem("cicekce_courier_id") : null;
          const found = list.find((c: Courier) => String(c.id) === String(savedId)) || list[0];
          setSelectedCourier(found);
        }
      }
      if (oRes.ok) {
        const oData = await oRes.json();
        if (Array.isArray(oData)) {
          setOrders(oData);
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCourier = (c: Courier) => {
    setSelectedCourier(c);
    try {
      localStorage.setItem("cicekce_courier_id", String(c.id));
    } catch (e) {}
  };

  // Filter orders for the selected courier
  const courierOrders = orders.filter((o) => {
    if (!selectedCourier) return false;
    const orderCourierId = String(o.courierId || "").trim();
    const orderCourierName = String(o.courierName || "").toLowerCase().trim();
    const selectedId = String(selectedCourier.id || "").trim();
    const selectedName = String(selectedCourier.name || "").toLowerCase().trim();

    const matchesId = orderCourierId && orderCourierId === selectedId;
    const matchesName =
      orderCourierName &&
      selectedName &&
      (orderCourierName.includes(selectedName) || selectedName.includes(orderCourierName));

    return matchesId || matchesName;
  });

  const activeDeliveries = courierOrders.filter(
    (o) => o.status !== "Teslim Edildi" && o.status !== "İptal" && o.status !== "İptal Edildi"
  );
  const completedDeliveries = courierOrders.filter((o) => o.status === "Teslim Edildi");

  // Handle Photo Selection & Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const upRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (upRes.ok) {
        const upData = await upRes.json();
        if (upData.url) {
          setPreviewPhotoUrl(upData.url);
        }
      } else {
        // Fallback local preview object url
        setPreviewPhotoUrl(URL.createObjectURL(file));
      }
    } catch (err) {
      setPreviewPhotoUrl(URL.createObjectURL(file));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Final Submit Delivery Action
  const handleSubmitDelivery = async () => {
    if (!deliveringOrder) return;
    setSubmittingDelivery(true);

    const finalPhoto =
      previewPhotoUrl ||
      deliveringOrder.preparedPhoto ||
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=60";
    const deliveredTimeStr = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    const deliveredDateStr = new Date().toLocaleDateString("tr-TR");
    const deliveredAtFull = `${deliveredDateStr} ${deliveredTimeStr}`;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deliveringOrder.id,
          status: "Teslim Edildi",
          deliveredPhoto: finalPhoto,
          deliveredAt: deliveredAtFull,
          deliveryNote: deliveredNote || "Alıcının kendisine teslim edildi.",
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            String(o.id) === String(deliveringOrder.id)
              ? {
                  ...o,
                  status: "Teslim Edildi",
                  deliveredPhoto: finalPhoto,
                  deliveredAt: deliveredAtFull,
                }
              : o
          )
        );
        setDeliveringOrder(null);
        setPreviewPhotoUrl("");
        setActiveTab("completed");
        alert("🎉 Tebrikler! Çiçek teslimatı başarıyla sisteme kaydedildi ve tamamlandı.");
      } else {
        alert("Teslimat kaydedilirken bir hata oluştu.");
      }
    } catch (e) {
      alert("Bağlantı hatası oluştu.");
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const getCleanPhone = (phone?: string) => {
    if (!phone) return "";
    return phone.replace(/[^\d]/g, "");
  };

  return (
    <div className="bg-[#FAF6F0] min-h-screen font-sans pb-16">
      {/* Mobile Top App Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#2b2623] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              🛵
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 m-0">Kurye Dağıtım Portalı</h1>
              <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Canlı Sipariş Takibi</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition"
            >
              🔄 Yenile
            </button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-xl bg-slate-100"
            >
              Mağaza
            </Link>
          </div>
        </div>

        {/* Courier Selector Dropdown */}
        <div className="max-w-md mx-auto px-4 pb-3">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">Aktif Kurye:</span>
            <select
              value={selectedCourier?.id || ""}
              onChange={(e) => {
                const found = couriers.find((c) => String(c.id) === String(e.target.value));
                if (found) handleSelectCourier(found);
              }}
              className="bg-white border border-slate-300 font-extrabold text-xs text-slate-900 px-3 py-1.5 rounded-xl shadow-2xs outline-none w-full"
            >
              {couriers.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  🛵 {c.name} ({c.region || "Genel Bölge"})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
              activeTab === "active"
                ? "bg-white text-[#2b2623] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📦 Teslim Edilecekler</span>
            <span
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-2 py-0.5 rounded-full text-[10px] font-black"
            >
              {activeDeliveries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 ${
              activeTab === "completed"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>✅ Teslim Edilenler</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
              {completedDeliveries.length}
            </span>
          </button>
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 font-bold border">
            Teslimatlar yükleniyor...
          </div>
        ) : (activeTab === "active" ? activeDeliveries : completedDeliveries).length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-2 border border-slate-200/80 shadow-xs">
            <div className="text-4xl">🎉</div>
            <h3 className="font-extrabold text-slate-800 text-base">
              {activeTab === "active" ? "Aktif Teslimatınız Yok" : "Henüz Teslim Edilen Sipariş Yok"}
            </h3>
            <p className="text-xs text-slate-500">
              {activeTab === "active"
                ? "Yönetici size yeni bir çiçek siparişi atadığında burada otomatik olarak belirecektir."
                : "Tamamladığınız teslimatlar burada kayıtlı kalacaktır."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(activeTab === "active" ? activeDeliveries : completedDeliveries).map((order) => {
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                order.address
              )}`;
              const cleanRecipientPhone = getCleanPhone(order.recipientPhone);
              const waUrl = `https://wa.me/90${cleanRecipientPhone}?text=${encodeURIComponent(
                `Merhaba ${order.recipientName}, Çiçekçe ekibinden kuryeniz ulaşıyor. Çiçek siparişinizi teslim etmek üzere adresinize geliyorum.`
              )}`;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3.5 relative overflow-hidden"
                >
                  {/* Top Header Card */}
                  <div className="flex items-center justify-between border-b pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sipariş No</span>
                      <div className="font-black text-sm text-slate-900 font-mono">#{order.id}</div>
                    </div>

                    <div className="text-right">
                      <div
                        style={{
                          backgroundColor:
                            order.status === "Teslim Edildi" ? "#dcfce7" : "#fef3c7",
                          color:
                            order.status === "Teslim Edildi" ? "#166534" : "#92400e",
                        }}
                        className="px-2.5 py-1 rounded-full text-xs font-black border"
                      >
                        {order.status === "Teslim Edildi" ? "✅ Teslim Edildi" : "🛵 Dağıtımda"}
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                        ⏰ {order.deliveryTime || "Tüm Gün"}
                      </div>
                    </div>
                  </div>

                  {/* Recipient Information */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Alıcı Bilgileri</div>
                    <div className="text-base font-black text-slate-900 flex items-center justify-between">
                      <span>{order.recipientName}</span>
                      <span className="text-xs text-slate-500 font-bold">{order.recipientPhone}</span>
                    </div>

                    {/* One-Tap Call and WhatsApp Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`tel:${order.recipientPhone}`}
                        className="py-2 px-3 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-200 transition"
                      >
                        <span>📞 Alıcıyı Ara</span>
                      </a>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                        className="py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-2xs hover:opacity-95 transition"
                      >
                        <span>💬 WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Address & Navigation Buttons */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <span>📍</span> <span>Teslimat Adresi</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-snug">{order.address}</div>

                    {/* Navigation Buttons */}
                    <div className="pt-1">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ backgroundColor: "#4285F4", color: "#ffffff" }}
                        className="w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <span>🗺️ Google Haritalar'da Rotayı Aç</span>
                      </a>
                    </div>
                  </div>

                  {/* Card Note Preview */}
                  {order.cardNote && order.cardNote !== "Kart notu belirtilmedi." && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1">
                      <div className="font-bold text-amber-900 text-[10px] uppercase flex items-center gap-1">
                        <span>💌</span> <span>Çiçek Kart Notu</span>
                      </div>
                      <div className="text-slate-800 italic font-medium">"{order.cardNote}"</div>
                    </div>
                  )}

                  {/* Products in Bouquet */}
                  <div className="text-xs space-y-1 text-slate-700">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>Çiçek / Ürünler:</span>
                      <span className="text-[#2b2623] font-black">{order.totalAmount || order.totalPrice} ₺</span>
                    </div>
                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border">
                      {order.items && order.items.length > 0
                        ? order.items.map((it: any) => `${it.quantity || 1}x ${it.title || it.name}`).join(", ")
                        : "1x Çiçek Buketi"}
                      {order.addons && order.addons.length > 0 && ` + ${order.addons.map((a: any) => a.name).join(", ")}`}
                    </div>
                  </div>

                  {/* ACTION BUTTON: COMPLETE DELIVERY / VIEW PROOF */}
                  {order.status === "Teslim Edildi" ? (
                    <div className="pt-1">
                      {order.deliveredPhoto ? (
                        <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                          <img
                            src={order.deliveredPhoto}
                            alt="Teslimat Fotoğrafı"
                            className="w-12 h-12 rounded-xl object-cover border"
                          />
                          <div className="text-xs">
                            <div className="font-extrabold text-emerald-800">✓ Teslimat Kanıtı Yüklendi</div>
                            <div className="text-[10px] text-slate-500">{order.deliveredAt}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-2 bg-emerald-50 rounded-2xl text-xs font-bold text-emerald-800">
                          ✅ Teslimat Başarıyla Yapıldı ({order.deliveredAt || "Bugün"})
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveringOrder(order);
                          setPreviewPhotoUrl(order.preparedPhoto || "");
                        }}
                        style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                        className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition"
                      >
                        <span>📸 Kapıda Teslim Ettim (Teslimatı Tamamla)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* PROOF OF DELIVERY MODAL */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
              📸
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-lg">Teslimatı Tamamla</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong>{deliveringOrder.recipientName}</strong> adlı alıcıya teslim ettiğinizi onaylamak için teslimat notunu ve varsa kanıt fotoğrafını kaydediniz.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Teslimat Notu:</label>
                <select
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-semibold"
                  value={deliveredNote}
                  onChange={(e) => setDeliveredNote(e.target.value)}
                >
                  <option value="Alıcının kendisine teslim edildi.">Alıcının kendisine teslim edildi.</option>
                  <option value="Apartman görevlisine / Güvenliğe teslim edildi.">Apartman görevlisine / Güvenliğe teslim edildi.</option>
                  <option value="İşyeri danışmasına / Resepsiyona teslim edildi.">İşyeri danışmasına / Resepsiyona teslim edildi.</option>
                  <option value="Komşusuna teslim edildi.">Komşusuna teslim edildi.</option>
                  <option value="Alıcının yakınına / ailesine teslim edildi.">Alıcının yakınına / ailesine teslim edildi.</option>
                </select>
              </div>

              {/* Photo Preview if Uploaded */}
              {previewPhotoUrl && (
                <div className="p-2 border rounded-2xl bg-slate-50 text-center space-y-1.5">
                  <img
                    src={previewPhotoUrl}
                    alt="Teslimat Fotoğrafı"
                    className="w-full h-32 object-cover rounded-xl border mx-auto"
                  />
                  <div className="text-[10px] text-emerald-700 font-bold">✓ Fotoğraf Seçildi</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teslimat Kanıt Fotoğrafı:</label>
                <label
                  style={{ backgroundColor: "#FAF6F0", color: "#2b2623" }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-100 transition"
                >
                  <span>📷 {uploadingPhoto ? "Yükleniyor..." : previewPhotoUrl ? "Fotoğrafı Değiştir" : "Kameradan Çek / Fotoğraf Seç"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={uploadingPhoto || submittingDelivery}
                    onChange={handlePhotoSelect}
                  />
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="button"
                onClick={handleSubmitDelivery}
                disabled={submittingDelivery || uploadingPhoto}
                style={{ backgroundColor: "#166534", color: "#ffffff" }}
                className="w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition"
              >
                <span>{submittingDelivery ? "Kaydediliyor..." : "✅ Teslimatı Tamamla ve Onayla"}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={submittingDelivery}
              onClick={() => {
                setDeliveringOrder(null);
                setPreviewPhotoUrl("");
              }}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
