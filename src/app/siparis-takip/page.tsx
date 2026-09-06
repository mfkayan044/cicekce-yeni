"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useState, useEffect } from "react";
import Link from "next/link";
import OrderUpdateRequestModal from "@/components/orders/OrderUpdateRequestModal";

export default function OrderTrackingPage() {
  const [orderIdInput, setOrderIdInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Auto-search if query params exist in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qId = params.get("id");
      const qPhone = params.get("phone");
      const qToken = params.get("token");
      if (qId) {
        setOrderIdInput(qId);
        if (qPhone) setPhoneInput(qPhone);
        handleSearchWithParams(qId, qPhone || "", qToken || "");
      }
    }
  }, []);

  const handleSearchWithParams = async (id: string, phone: string, token: string = "") => {
    if (!phone.trim() && !token.trim()) {
      setError("Güvenlik nedeniyle sipariş durumunu görüntülemek için siparişte kayıtlı telefon numaranızı girmeniz gerekmektedir.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      let url = `/api/orders?id=${encodeURIComponent(id.trim())}`;
      if (phone.trim()) {
        url += `&phone=${encodeURIComponent(phone.trim())}`;
      }
      if (token.trim()) {
        url += `&token=${encodeURIComponent(token.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Belirtilen kriterlere uygun sipariş bulunamadı. Lütfen sipariş numaranızı ve telefon numaranızı kontrol ediniz.");
        return;
      }

      setOrder(data);
      if (
        data.customerApprovalStatus === "Onaylandı" ||
        String(data.customerApprovalStatus || "").includes("Onaylandı") ||
        String(data.customerApprovalStatus || "").includes("Sistem") ||
        String(data.customerApprovalStatus || "").includes("Otomatik")
      ) {
        setApprovedSuccess(true);
      }
    } catch (err) {
      setError("Sipariş sorgulanırken bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim()) {
      setError("Lütfen sipariş numaranızı giriniz.");
      return;
    }
    if (!phoneInput.trim()) {
      setError("Lütfen siparişte kayıtlı telefon numaranızı giriniz.");
      return;
    }
    handleSearchWithParams(orderIdInput, phoneInput);
  };

  const handleApprovePhoto = async () => {
    if (!order) return;
    setApproving(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status: "Müşteri Onayladı - Kuryede",
          customerApprovalStatus: "Onaylandı",
        }),
      });

      if (res.ok) {
        setApprovedSuccess(true);
        setOrder({
          ...order,
          status: "Müşteri Onayladı - Kuryede",
          customerApprovalStatus: "Onaylandı",
        });
      } else {
        alert("Onay işlemi sırasında bir hata oluştu.");
      }
    } catch (e) {
      alert("Bağlantı hatası.");
    } finally {
      setApproving(false);
    }
  };

  // Steps definition for visual stepper
  const steps = [
    { title: "Sipariş Alındı", desc: "Ödeme ve sipariş onaylandı" },
    { title: "Hazırlanıyor", desc: "Çiçek ustamız hazırlıyor" },
    { title: "Görsel Onay", desc: "Hazırlanan çiçek onayınızda" },
    { title: "Kuryede", desc: "Teslimat için yola çıktı" },
    { title: "Teslim Edildi", desc: "Alıcıya ulaştırıldı" },
  ];

  const getActiveStepIndex = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s.includes("teslim edildi") || s.includes("tamamlandı")) return 4;
    if (s.includes("kurye") || s.includes("yolda") || s.includes("dağıtım")) return 3;
    if (s.includes("onay") || s.includes("fotoğraf")) return 2;
    if (s.includes("hazır")) return 1;
    return 0;
  };

  const currentStepIdx = order ? getActiveStepIndex(order.status) : 0;

  return (
    <div className="bg-[#FAF6F0] min-h-screen font-sans flex flex-col justify-between">
      <div>
        <StoreHeader />

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Header Card */}
          <div className="text-center space-y-2">
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 rounded-full inline-block border border-amber-200">
              🌸 Canlı Takip & Fotoğraf Onayı
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              Sipariş Durumu & Kurye Takibi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Sipariş kodunuz ve telefon numaranız ile siparişinizin anlık durumunu, hazırlanan çiçeğinizin fotoğrafını ve kurye sürecini takip edebilirsiniz.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sipariş Numarası *
                </label>
                <input
                  type="text"
                  placeholder="Örn: SIP-12345 veya 12345"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Telefon Numarası * <span className="text-[10px] text-amber-700 font-semibold">(Güvenlik İçin Zorunlu)</span>
                </label>
                <input
                  type="text"
                  placeholder="05XX XXX XX XX"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#2b2623]"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sorgulanıyor...</span>
                    </>
                  ) : (
                    <span>🔍 Siparişi Sorgula</span>
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Order Details View */}
          {order && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Stepper Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
                <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block">Sipariş Kodu</span>
                    <span className="text-lg font-black text-[#2b2623]">{order.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-bold block">Sipariş Tarihi</span>
                    <span className="text-xs font-semibold text-slate-700">{order.date}</span>
                  </div>
                </div>

                {/* Visual Stepper */}
                <div className="grid grid-cols-5 gap-2 text-center pt-2">
                  {steps.map((st, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    return (
                      <div key={idx} className="space-y-2">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shadow-xs ${
                            isDone
                              ? "bg-[#2b2623] text-white"
                              : "bg-slate-100 text-slate-400"
                          } ${isCurrent ? "ring-4 ring-amber-200/60" : ""}`}
                        >
                          {isDone ? "✓" : idx + 1}
                        </div>
                        <div>
                          <div className={`text-[11px] sm:text-xs font-extrabold ${isDone ? "text-slate-900" : "text-slate-400"}`}>
                            {st.title}
                          </div>
                          <div className="hidden sm:block text-[10px] text-slate-400">
                            {st.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Flower Live Prepared Photo Section */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2 border-b pb-3">
                  <span>📸</span>
                  <span>Hazırlanan Çiçeğin Canlı Fotoğrafı</span>
                </h3>

                {order.preparedPhoto ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-4/3 flex items-center justify-center">
                      <img
                        src={order.preparedPhoto}
                        alt="Hazırlanan Çiçek"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-2 text-amber-950">
                        <div className="font-bold text-sm text-amber-900 flex items-center gap-1.5">
                          <span>✨</span>
                          <span>Atölyemizden Canlı Görsel</span>
                        </div>
                        <p className="leading-relaxed">
                          Çiçeğiniz ustalarımız tarafından özenle hazırlandı. Kuryemiz teslimat için yola çıkmadan önce çiçeğinizi onaylayabilirsiniz.
                        </p>
                      </div>

                      {(() => {
                        const isSystemApproved =
                          String(order.customerApprovalStatus || "").includes("Sistem") ||
                          String(order.customerApprovalStatus || "").includes("Otomatik");
                        const isCustomerApproved =
                          approvedSuccess ||
                          order.customerApprovalStatus === "Onaylandı" ||
                          String(order.customerApprovalStatus || "").includes("Müşteri");
                        const isAlreadyInDelivery =
                          String(order.status || "").includes("Kurye") ||
                          String(order.status || "").includes("Teslim") ||
                          String(order.status || "").includes("Dağıtım");

                        if (isSystemApproved) {
                          return (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-purple-950 text-xs font-bold space-y-1">
                              <div className="flex items-center gap-1.5 font-extrabold text-sm text-purple-900">
                                <span>🤖</span>
                                <span>Siparişiniz Sistem Tarafından Otomatik Onaylandı</span>
                              </div>
                              <p className="text-purple-800 leading-relaxed font-medium">
                                15 dakikalık yanıt süresi dolduğu için çiçek görseliniz sistemimiz tarafından otomatik onaylanmış ve kuryemiz teslimat için yola çıkarılmıştır.
                              </p>
                            </div>
                          );
                        }

                        if (isCustomerApproved) {
                          return (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                              <span className="text-lg">✓</span>
                              <span>Çiçek görseli tarafınızca onaylandı. Kuryemiz teslimat için adrese ilerliyor!</span>
                            </div>
                          );
                        }

                        if (isAlreadyInDelivery) {
                          return (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                              <span className="text-lg">✓</span>
                              <span>Çiçek görseli onaylanarak sipariş teslimat sürecine geçmiştir.</span>
                            </div>
                          );
                        }

                        return (
                          <button
                            onClick={handleApprovePhoto}
                            disabled={approving}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                          >
                            {approving ? "Onaylanıyor..." : "✓ Hazırlanan Çiçeği Onaylıyorum"}
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    🌸 Çiçeğiniz şu anda tasarım atölyemizde taze çiçeklerle hazırlanıyor. Hazırlandığında canlı fotoğrafı bu ekranda görünecektir.
                  </div>
                )}
              </div>

              {/* Courier Door Delivery Photo Section - ONLY shown when order status is Teslim Edildi */}
              {order.deliveredPhoto && (order.status === "Teslim Edildi" || String(order.status || "").includes("Teslim")) && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                    <h3 className="font-extrabold text-base text-slate-800 flex items-center gap-2 m-0">
                      <span>🚚</span>
                      <span>Kurye Kapıda Teslimat Görseli</span>
                    </h3>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black rounded-full">
                      ✓ Teslim Edildi ({order.deliveredAt || "Tamamlandı"})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-4/3 flex items-center justify-center">
                      <img
                        src={order.deliveredPhoto}
                        alt="Kurye Kapıda Teslimat Fotoğrafı"
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={order.deliveredPhoto}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition flex items-center gap-1"
                      >
                        <span>🔍 Fotoğrafı Büyüt</span>
                      </a>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-2 text-emerald-950">
                        <div className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                          <span>🎉</span>
                          <span>Çiçeğiniz Alıcısına Teslim Edildi!</span>
                        </div>
                        <p className="leading-relaxed text-slate-700">
                          Kuryemiz teslimatı gerçekleştirirken çiçeğinizin kapıdaki teslimat anı fotoğrafını sisteme yükledi.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                        <div className="text-slate-500 font-bold">Teslimat Zamanı: <span className="text-slate-900 font-extrabold">{order.deliveredAt || "Tamamlandı"}</span></div>
                        <div className="text-slate-500 font-bold">Teslimat Notu: <span className="text-slate-900 font-extrabold">{order.deliveryNote || "Alıcının kendisine teslim edildi."}</span></div>
                        {order.courierName && (
                          <div className="text-slate-500 font-bold">Teslim Eden Kurye: <span className="text-blue-900 font-extrabold">{order.courierName}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Update Request Status Alert if exists */}
              {order.updateRequest && (
                <div className="bg-white rounded-3xl p-5 border shadow-xs space-y-2 text-xs">
                  {order.updateRequest.status === "PENDING" && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-950 space-y-1">
                      <div className="font-extrabold text-sm text-amber-900 flex items-center gap-2">
                        <span>⏳</span>
                        <span>Sipariş Bilgileri Güncelleme Talebiniz İnceleniyor</span>
                      </div>
                      <p className="text-slate-700">
                        Teslimat adresi/zamanı değişikliği talebiniz müşteri temsilcimiz ve atölyemiz tarafından inceleniyor. Kısa süre içinde sonuçlandırılacaktır.
                      </p>
                      {order.updateRequest.requestedChanges?.reason && (
                        <div className="italic text-slate-500 pt-1">
                          Talep Notunuz: "{order.updateRequest.requestedChanges.reason}"
                        </div>
                      )}
                    </div>
                  )}

                  {order.updateRequest.status === "APPROVED" && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-1">
                      <div className="font-extrabold text-sm text-emerald-900 flex items-center gap-2">
                        <span>✅</span>
                        <span>Bilgi Güncelleme Talebiniz Onaylandı!</span>
                      </div>
                      <p className="text-emerald-800">
                        Talebiniz temsilcimiz tarafından onaylandı ve siparişinizin teslimat bilgileri güncellendi.
                      </p>
                    </div>
                  )}

                  {order.updateRequest.status === "REJECTED" && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-950 space-y-1">
                      <div className="font-extrabold text-sm text-red-900 flex items-center gap-2">
                        <span>❌</span>
                        <span>Bilgi Güncelleme Talebiniz Kabul Edilemedi</span>
                      </div>
                      <p className="text-red-800 font-semibold">
                        Gerekçe: {order.updateRequest.adminNote || "Sipariş kuryede veya teslimat aşamasında olduğu için güncelleme yapılamadı."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Details & Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recipient & Delivery Details */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-extrabold text-sm text-slate-800 m-0">
                      📍 Teslimat Bilgileri
                    </h4>
                    {order.status !== "Teslim Edildi" && order.updateRequest?.status !== "PENDING" && (
                      <button
                        type="button"
                        onClick={() => setShowUpdateModal(true)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-extrabold text-[11px] transition shadow-2xs"
                      >
                        ✏️ Bilgileri Güncelle
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-slate-600">
                    <div>
                      <span className="font-bold text-slate-800">Alıcı: </span>
                      {order.recipientName}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Teslimat Adresi: </span>
                      {order.address}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">Teslimat Zamanı: </span>
                      {order.deliveryDate} ({order.deliveryTime})
                    </div>
                    {order.courierName && (
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-900 font-semibold border border-blue-100">
                        🚴 Kurye: {order.courierName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items & Card Note */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2">
                    🛍️ Ürünler & Kart Notu
                  </h4>
                  <div className="space-y-2">
                    {(order.items || []).map((it: any, iIdx: number) => (
                      <div key={iIdx} className="flex justify-between items-center text-slate-700">
                        <span className="font-semibold">{it.title || "Çiçek Buketi"} x {it.quantity || 1}</span>
                        <span className="font-bold text-slate-900">{it.price}</span>
                      </div>
                    ))}
                    {order.cardNote && (
                      <div className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-700 italic">
                        <span className="font-bold not-italic block text-amber-900 mb-1">💌 Kart Notu:</span>
                        "{order.cardNote}"
                      </div>
                    )}
                    <div className="pt-2 border-t flex justify-between font-black text-sm text-slate-900">
                      <span>Toplam Tutar:</span>
                      <span className="text-[#2b2623]">{order.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Update Request Modal */}
              <OrderUpdateRequestModal
                order={order}
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onSuccess={(updatedOrder) => setOrder(updatedOrder)}
              />
            </div>
          )}
        </main>
      </div>

      <StoreFooter />
    </div>
  );
}
