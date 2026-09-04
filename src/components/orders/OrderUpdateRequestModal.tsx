"use client";

import React, { useState } from "react";

interface OrderUpdateRequestModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: any) => void;
}

export default function OrderUpdateRequestModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: OrderUpdateRequestModalProps) {
  if (!isOpen || !order) return null;

  const [recipientName, setRecipientName] = useState(order.recipientName || "");
  const [recipientPhone, setRecipientPhone] = useState(order.recipientPhone || "");
  const [address, setAddress] = useState(order.address || "");
  const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate || "");
  const [deliveryTime, setDeliveryTime] = useState(order.deliveryTime || "13:00 - 17:00");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!recipientName.trim() || !address.trim()) {
      setErrorMsg("Lütfen Alıcı Adı ve Teslimat Adresi alanlarını doldurunuz.");
      return;
    }

    setSubmitting(true);

    const updateRequestObj = {
      id: `req_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "PENDING",
      requestedChanges: {
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        address: address.trim(),
        deliveryDate: deliveryDate.trim(),
        deliveryTime: deliveryTime.trim(),
        reason: reason.trim(),
      },
      adminNote: "",
      reviewedAt: "",
    };

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          updateRequest: updateRequestObj,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Bilgi güncelleme talebiniz yönetici onayına sunulmuştur.");
        onSuccess({ ...order, updateRequest: updateRequestObj });
        onClose();
      } else {
        setErrorMsg(data.error || "Talep iletilirken bir hata oluştu.");
      }
    } catch (e) {
      setErrorMsg("Bağlantı hatası oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-slate-100 my-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <div className="text-xs font-black uppercase text-amber-900 tracking-wider mb-1">
              🌸 ÇİÇEKÇE SİPARİŞ DEĞİŞİKLİK TALEBİ
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Sipariş Bilgilerini Güncelleme Talebi (#{order.id})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Teslimat adresi, alıcı bilgisi veya saati ile ilgili değişiklik talebiniz yönetici onayına iletilecektir.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-extrabold text-sm flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Recipient Name */}
          <div>
            <label className="font-extrabold text-slate-700 block mb-1">Yeni Alıcı Adı Soyadı *</label>
            <input
              type="text"
              className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#2b2623] bg-slate-50/50"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
          </div>

          {/* Recipient Phone */}
          <div>
            <label className="font-extrabold text-slate-700 block mb-1">Yeni Alıcı Telefon Numarası</label>
            <input
              type="text"
              placeholder="05XX XXX XX XX"
              className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#2b2623] bg-slate-50/50"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
            />
          </div>

          {/* Delivery Address */}
          <div>
            <label className="font-extrabold text-slate-700 block mb-1">Yeni Teslimat Adresi *</label>
            <textarea
              rows={3}
              className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#2b2623] bg-slate-50/50"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          {/* Date & Time Slot Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">Yeni Teslimat Tarihi</label>
              <input
                type="text"
                placeholder="Örn: 06.09.2026"
                className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#2b2623] bg-slate-50/50"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div>
              <label className="font-extrabold text-slate-700 block mb-1">Yeni Teslimat Saat Aralığı</label>
              <select
                className="w-full p-3 rounded-2xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-[#2b2623] bg-slate-50/50"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              >
                <option value="09:00 - 13:00">09:00 - 13:00 (Sabah)</option>
                <option value="13:00 - 17:00">13:00 - 17:00 (Öğleden Sonra)</option>
                <option value="17:00 - 21:00">17:00 - 21:00 (Akşam)</option>
                <option value="15:00 - 18:00">15:00 - 18:00</option>
                <option value="Gün İçi Teslimat (09:00 - 20:00)">Gün İçi Teslimat (09:00 - 20:00)</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="font-extrabold text-slate-700 block mb-1">Talep Nedeni / Notunuz (Opsiyonel)</label>
            <input
              type="text"
              placeholder="Örn: Alıcımızın iş adresi değişti, yeni adrese teslim edilmesini rica ederim."
              className="w-full p-3 rounded-2xl border border-slate-200 text-slate-900 outline-none focus:border-[#2b2623] bg-slate-50/50"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="w-1/2 py-3 rounded-2xl font-bold shadow-md hover:opacity-95 transition disabled:opacity-50"
            >
              {submitting ? "Gönderiliyor..." : "Talebi Gönder 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
