"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useStore, CartItem, ExtraGift } from "@/lib/store";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, applyCoupon, discountAmount, clearCart } = useStore();
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const success = applyCoupon(couponInput);
    if (success) setCouponMsg("HOSGELDIN100 İndirim Kuponu Uygulandı (-100 ₺)!");
    else setCouponMsg("Geçersiz kupon kodu!");
  };

  const cartItems: CartItem[] = cart || [];

  const itemsPrice = cartItems.reduce((sum: number, item: CartItem) => {
    const pPrice = typeof item.product.price === "number" ? item.product.price : (parseFloat(String(item.product.price).replace(/[^\d.]/g, "")) || 2000);
    const extrasTotal = item.selectedExtras ? item.selectedExtras.reduce((es: number, e: ExtraGift) => es + e.price, 0) : 0;
    return sum + (pPrice + extrasTotal) * item.quantity;
  }, 0);

  const grandTotal = Math.max(0, itemsPrice - (discountAmount || 0));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
          <h1 className="text-3xl font-black text-slate-900">Alışveriş Sepetim</h1>

          {cartItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart List */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item: CartItem) => (
                  <div key={item.product.id} className="p-5 bg-white rounded-2xl border shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded-xl border"
                      />
                      <div>
                        <h5 className="font-bold text-slate-900 text-base m-0">{item.product.title}</h5>
                        <div className="text-xs text-[#2b2623] font-bold mt-1">{String(item.product.price)}</div>
                        {item.selectedExtras && item.selectedExtras.length > 0 && (
                          <div className="text-[11px] text-slate-400 mt-1">
                            + {item.selectedExtras.map((e: ExtraGift) => e.name).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-xl overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-3 py-1 font-bold hover:bg-slate-200 text-slate-600"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-3 py-1 font-bold hover:bg-slate-200 text-slate-600"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-red-500 p-2 text-xl"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => clearCart()}
                  className="text-xs font-semibold text-slate-400 hover:text-red-500 transition"
                >
                  Sepeti Temizle
                </button>
              </div>

              {/* Summary Card */}
              <div className="p-6 bg-white rounded-2xl border shadow-sm space-y-6 h-fit">
                <h4 className="font-bold text-slate-900 text-lg border-b pb-3">Sipariş Özeti</h4>

                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Kupon Kodu"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="form-control text-xs border rounded-xl px-3 py-2 flex-1"
                    />
                    <button type="submit" className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">
                      Uygula
                    </button>
                  </div>
                  {couponMsg && <div className="text-[11px] font-semibold text-emerald-600">{couponMsg}</div>}
                </form>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Ara Toplam</span>
                    <span className="font-semibold">{itemsPrice.toLocaleString("tr-TR")} ₺</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Kupon İndirimi</span>
                      <span>-{discountAmount} ₺</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Kargo / Teslimat</span>
                    <span className="font-semibold text-emerald-600">Ücretsiz</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-slate-900 font-extrabold text-lg">
                    <span>Toplam</span>
                    <span className="text-[#2b2623]">{grandTotal.toLocaleString("tr-TR")} ₺</span>
                  </div>
                </div>

                <Link
                  href="/odeme"
                  className="block w-full bg-[#2b2623] hover:bg-[#3d6415] text-white font-bold py-3.5 text-center rounded-xl shadow-md transition text-sm"
                >
                  Siparişi Tamamla →
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border shadow-sm space-y-4">
              <div className="text-6xl">🛒</div>
              <h3 className="text-2xl font-bold text-slate-900">Sepetiniz Boş</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Henüz sepetinize bir ürün eklemediniz. Çiçek koleksiyonumuzu inceleyip hemen sipariş verebilirsiniz.
              </p>
              <Link
                href="/"
                className="inline-block bg-[#2b2623] text-white font-bold px-6 py-3 rounded-xl shadow transition text-sm"
              >
                Alışverişe Başla
              </Link>
            </div>
          )}
        </div>
      </div>

      <StoreFooter />
    </div>
  );
}
