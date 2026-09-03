"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useState, useEffect, use } from "react";
import Link from "next/link";

export default function OrderPhotoApprovalPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.orderId;
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [orderId]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const found = (data || []).find((o: any) => String(o.id) === String(orderId));
      if (found) {
        setOrder(found);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          customerApprovalStatus: "Onaylandı",
          rejectionReason: "",
        }),
      });
      if (res.ok) {
        setOrder((prev: any) => ({ ...prev, customerApprovalStatus: "Onaylandı", rejectionReason: "" }));
        alert("🎉 Çiçek görselini onayladınız! Buketiniz kuryemize teslim edilmek üzere hazırlandı.");
      }
    } catch (e) {
      alert("Onay işlemi sırasında bir hata oluştu.");
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const currentRejections = order?.rejectionCount || 0;
    const newRejectionCount = currentRejections + 1;

    try {
      if (newRejectionCount >= 3) {
        // 3rd rejection automatically approves system standard
        await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            customerApprovalStatus: "Otomatik Onaylandı",
            rejectionCount: 3,
            rejectionReason: rejectReason || "3. ret sonrası otomatik onay",
          }),
        });
        setOrder((prev: any) => ({
          ...prev,
          customerApprovalStatus: "Otomatik Onaylandı",
          rejectionCount: 3,
        }));
        setShowRejectModal(false);
        alert("Talebiniz çiçek atölyemize iletildi. Çiçeğiniz tasarım standartlarımıza uygun olarak hazırlanıp kuryeye teslim edilmektedir.");
      } else {
        await fetch("/api/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: orderId,
            customerApprovalStatus: "Reddedildi",
            rejectionCount: newRejectionCount,
            rejectionReason: rejectReason || "Müşteri yeniden düzenleme talep etti",
          }),
        });
        setOrder((prev: any) => ({
          ...prev,
          customerApprovalStatus: "Reddedildi",
          rejectionCount: newRejectionCount,
        }));
        setShowRejectModal(false);
        alert("Talebiniz çiçek ustamıza iletildi. Çiçeğiniz isteğiniz doğrultusunda yeniden düzenlenmektedir.");
      }
    } catch (e) {
      alert("İşlem sırasında hata oluştu.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between">
        <StoreHeader />
        <div className="text-center py-20 text-slate-500 font-bold">Fotoğraflı onay sayfası yükleniyor...</div>
        <StoreFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between">
        <StoreHeader />
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-slate-800">Sipariş Bulunamadı</h2>
          <p className="text-xs text-slate-500 mt-2">Belirtilen sipariş numarasına ait detay bulunamadı.</p>
        </div>
        <StoreFooter />
      </div>
    );
  }

  const isApproved =
    order.customerApprovalStatus === "Onaylandı" ||
    order.customerApprovalStatus === "Otomatik Onaylandı" ||
    order.customerApprovalStatus === "Sistem Tarafından Onaylandı";
  const isRejected = order.customerApprovalStatus === "Reddedildi";

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-md text-center space-y-4">
            <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="inline-block text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
              🌸 Çiçek Fotoğraflı Canlı Onay Servisi
            </span>

            <h1 className="text-2xl font-black text-slate-900 mb-1">
              Hazırlanan Çiçeğinizin Canlı Fotoğrafı
            </h1>
            <p className="text-xs text-slate-500">
              Sipariş No: <b className="text-slate-800 font-mono">#{order.id}</b> | Sayın <b>{order.customerName}</b>, ustanız çiçeğinizi özenle hazırladı.
            </p>

            {/* PREPARED FLOWER PHOTO DISPLAY */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 max-h-[460px] flex items-center justify-center">
              <img
                src={order.preparedPhoto || order.items?.[0]?.image || "https://demo.procicek.com.tr/urunler/35-kirmizi-gul-buketi-13981-v2.webp"}
                alt="Hazırlanan Çiçek Fotoğrafı"
                className="w-full h-auto max-h-[460px] object-cover mx-auto"
              />
            </div>

            {/* CARD NOTE PREVIEW */}
            {order.cardNote && order.cardNote !== "Kart notu belirtilmedi." && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left text-xs text-amber-950">
                <div className="font-bold text-amber-800 mb-1">💌 Eklenen Çiçek Kart Notunuz:</div>
                <div className="italic font-bold text-sm">"{order.cardNote}"</div>
              </div>
            )}

            {/* APPROVAL STATUS / ACTION BUTTONS */}
            {isApproved ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-extrabold text-sm space-y-1">
                <div>
                  ✅{" "}
                  {order.customerApprovalStatus === "Sistem Tarafından Onaylandı"
                    ? "Sistem Tarafından Onaylandı!"
                    : order.customerApprovalStatus === "Otomatik Onaylandı"
                    ? "Siparişiniz Onaylandı!"
                    : "Çiçek Fotoğrafını Onayladınız!"}
                </div>
                <div className="text-xs text-emerald-700 font-semibold">
                  Çiçeğiniz kuryemize teslim ediliyor ve alıcının adresine ulaştırılmak üzere yola çıkıyor.
                </div>
              </div>
            ) : isRejected ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-extrabold text-sm space-y-1">
                <div>🌸 Düzenleme Talebiniz Alındı</div>
                <div className="text-xs text-amber-800 font-semibold">
                  Çiçek ustamız buketi talebinize göre yeniden düzenliyor. Yeni görsel en kısa sürede hazırlanacaktır.
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={updating}
                    style={{ backgroundColor: "#166534", color: "#ffffff" }}
                    className="py-4 px-4 rounded-2xl font-black text-sm shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
                  >
                    <span>✅ Görseli Onaylıyorum</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={updating}
                    className="py-4 px-4 rounded-2xl font-bold text-xs bg-slate-100 border border-slate-300 text-slate-700 hover:bg-slate-200 transition flex items-center justify-center gap-2"
                  >
                    <span>💬 Değişiklik Talebi İlet</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h5 className="font-extrabold text-sm text-slate-900">
                🌸 Değişiklik & Düzenleme İsteği
              </h5>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Neyi değiştirmemizi istersiniz? *
                </label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-[#2b2623]"
                  placeholder="Örn: Buketteki ambalaj rengi beyaz olsun, sol tarafa 2 adet daha gül eklensin..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="btn btn-light px-4 py-2 text-xs font-bold"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:opacity-95 transition"
                >
                  {updating ? "İletiliyor..." : "Talebi Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StoreFooter />
    </div>
  );
}
