"use client";

import React from "react";

export interface QuickOrderProduct {
  id: string | number;
  title: string;
  price: string;
  oldPrice?: string;
  image: string;
  code?: string;
}

interface QuickOrderModalProps {
  product: QuickOrderProduct | null;
  onClose: () => void;
  onAddToCart?: (product: QuickOrderProduct) => void;
}

export default function QuickOrderModal({
  product,
  onClose,
  onAddToCart,
}: QuickOrderModalProps) {
  if (!product) return null;

  const handleSiparisiTamamla = () => {
    if (onAddToCart) {
      onAddToCart(product);
    }
    window.location.href = "/odeme";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 relative p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm z-10"
        >
          ✕
        </button>

        <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#2b2623] flex items-center justify-center mx-auto mb-3 font-bold text-xl">
          ✓
        </div>

        <h3 className="font-extrabold text-slate-900 text-base mb-1">
          {product.title}
        </h3>
        <div style={{ color: "#2b2623" }} className="font-black text-lg mb-4">
          {product.price}
        </div>

        <p className="text-xs text-slate-500 mb-6">
          Ürününüz hazırlanmak üzere sipariş aşamasına alındı.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full border border-slate-300 text-slate-700 font-bold py-3 rounded-2xl hover:bg-slate-100 transition text-xs"
          >
            Alışverişe Devam Et
          </button>

          <button
            type="button"
            onClick={handleSiparisiTamamla}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="w-full font-extrabold py-3 rounded-2xl shadow-md hover:opacity-95 transition text-xs"
          >
            Siparişi Tamamla
          </button>
        </div>
      </div>
    </div>
  );
}
