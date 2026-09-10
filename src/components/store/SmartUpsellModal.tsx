"use client";

import { useState, useEffect } from "react";
import { X, Gift, Check, ShoppingBag, Sparkles } from "lucide-react";

interface SmartUpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onAddToCartWithExtras: (selectedExtras: any[]) => void;
}

export default function SmartUpsellModal({
  isOpen,
  onClose,
  product,
  onAddToCartWithExtras,
}: SmartUpsellModalProps) {
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [extraGiftsList, setExtraGiftsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/extras")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data
            .filter((item: any) => item.active !== false)
            .map((item: any) => {
              const rawPrice = item.price;
              const numericPrice =
                typeof rawPrice === "number"
                  ? rawPrice
                  : parseFloat(String(rawPrice).replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "")) || 0;
              return {
                id: String(item.id),
                name: item.name || item.names?.tr || "Ek Hediye",
                price: numericPrice,
                image: item.image || "🎁",
                desc: item.desc || item.description || "Özel hediye seçeneği",
              };
            });
          setExtraGiftsList(formatted);
        } else {
          setExtraGiftsList([]);
        }
      })
      .catch(() => {
        setExtraGiftsList([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const toggleExtra = (item: any) => {
    if (selectedExtras.some((e) => e.id === item.id)) {
      setSelectedExtras(selectedExtras.filter((e) => e.id !== item.id));
    } else {
      setSelectedExtras([...selectedExtras, item]);
    }
  };

  const handleConfirm = (includeExtras: boolean) => {
    if (includeExtras) {
      onAddToCartWithExtras(selectedExtras);
    } else {
      onAddToCartWithExtras([]);
    }
    setSelectedExtras([]);
    onClose();
  };

  const extrasTotal = selectedExtras.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-black shrink-0 border border-amber-200">
            <Gift className="w-6 h-6 text-amber-900" />
          </div>
          <div>
            <div className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>HEDİYENİZİ TAMAMLAYIN</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-snug">
              Harika Dokunuşlar Ekleyin! 🎁
            </h3>
          </div>
        </div>

        {/* Product Reference */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
          <img src={product.image} alt={product.title} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-extrabold text-slate-900 truncate">{product.title}</div>
            <div className="text-xs font-black text-emerald-700">{product.price}</div>
          </div>
        </div>

        {/* Extra Gifts Selection List */}
        <div className="space-y-2">
          <div className="text-xs font-extrabold text-slate-700">Seçebileceğiniz Ekstra Hediyeler:</div>
          
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400 font-bold">
              Ekstra hediyeler yükleniyor...
            </div>
          ) : extraGiftsList.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 font-medium">
              Şu an eklenmiş ekstra hediye seçeneği bulunmamaktadır.
            </div>
          ) : (
            extraGiftsList.map((item) => {
              const isSelected = selectedExtras.some((e) => e.id === item.id);
              const isImageUrl = item.image && (item.image.startsWith("http://") || item.image.startsWith("https://") || item.image.startsWith("/"));
              return (
                <div
                  key={item.id}
                  onClick={() => toggleExtra(item)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-amber-50/80 border-[#2b2623] shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isImageUrl ? (
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <span className="text-2xl shrink-0">{item.image}</span>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate">{item.name}</div>
                      {item.desc && <div className="text-[10px] text-slate-500 font-medium">{item.desc}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-slate-900">+{item.price} ₺</span>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                        isSelected ? "bg-[#2b2623] text-white" : "border-2 border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => handleConfirm(true)}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="w-full py-3.5 rounded-2xl text-xs font-black hover:opacity-95 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {selectedExtras.length > 0
                ? `Seçilen Hediyelerle Ekle (+${extrasTotal} ₺)`
                : "Sepete Ekle & Devam Et"}
            </span>
          </button>

          {selectedExtras.length > 0 && (
            <button
              type="button"
              onClick={() => handleConfirm(false)}
              className="w-full py-2.5 text-xs font-extrabold text-slate-600 hover:text-slate-900 text-center transition"
            >
              Yalnızca Çiçeği Sepete Ekle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
