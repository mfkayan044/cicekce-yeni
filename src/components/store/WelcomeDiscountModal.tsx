"use client";

import React, { useState, useEffect } from "react";

export default function WelcomeDiscountModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const [popup, setPopup] = useState<any>({
    enabled: true,
    title: "İlk Siparişinize Özel 150 ₺ İndirim! 🎉",
    description: "İlk siparişinize özel 150 ₺ indirim kodu sizleri bekliyor. Hediye10 koduyla siparişinizi hemen oluşturabilirsiniz.",
    couponCode: "Hediye10",
    badgeText: "BİLGİLENDİRME",
    buttonText: "Kodu Kopyala & Alışverişe Başla 🛍️",
    icon: "🎁"
  });

  useEffect(() => {
    // Fetch live popup settings from API
    fetch("/api/settings/popup")
      .then((res) => res.json())
      .then((data) => {
        if (data) setPopup((prev: any) => ({ ...prev, ...data }));
      })
      .catch(() => {});

    // Check if modal was already dismissed in this session
    try {
      const seen = sessionStorage.getItem("pro_flower_discount_modal_seen");
      if (!seen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem("pro_flower_discount_modal_seen", "true");
    } catch (e) {}
  };

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(popup.couponCode || "Hediye10");
    }
    setCopied(true);
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  if (!isOpen || popup.enabled === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 relative p-6 sm:p-8 text-center animate-in zoom-in-95 duration-300 font-sans">
        {/* Close Icon Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm z-10"
          title="Kapat"
        >
          ✕
        </button>

        {/* Gift Icon Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#2b2623] flex items-center justify-center mx-auto mb-4 text-3xl shadow-xs">
          {popup.icon || "🎁"}
        </div>

        {/* Header Label */}
        <div className="text-xs font-black uppercase tracking-wider text-[#2b2623] mb-1">
          {popup.badgeText || "BİLGİLENDİRME"}
        </div>

        <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mb-3 leading-snug">
          {popup.title}
        </h3>

        {/* Message Content */}
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          {popup.description}
        </p>

        {/* Coupon Code Pill */}
        {popup.couponCode && (
          <div className="bg-[#F5EFE6]/80 border-2 border-dashed border-[#2b2623] rounded-2xl p-3.5 mb-6 flex items-center justify-between gap-3">
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase text-[#1a1918]">İndirim Kupon Kodunuz</div>
              <div className="text-lg font-black tracking-widest text-[#2b2623]">{popup.couponCode}</div>
            </div>

            <button
              onClick={handleCopyCode}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-4 py-2 rounded-xl text-xs font-extrabold shadow-xs hover:opacity-95 transition"
            >
              {copied ? "✓ Kopyalandı!" : "📋 Kopyala"}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCopyCode}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="w-full font-extrabold py-3.5 rounded-2xl shadow-md hover:opacity-95 transition text-xs sm:text-sm"
          >
            {copied ? "✓ Kod Kopyalandı, Keyifli Alışverişler!" : (popup.buttonText || "Kodu Kopyala & Alışverişe Başla 🛍️")}
          </button>

          <button
            onClick={handleClose}
            className="text-xs text-slate-400 font-bold hover:text-slate-600 transition pt-1"
          >
            Teşekkürler, Alışverişe Devam Et
          </button>
        </div>
      </div>
    </div>
  );
}
