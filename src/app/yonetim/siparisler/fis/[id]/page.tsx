"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";

export default function OrderThermalReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const list = await res.json();
          const found = list.find((o: any) => String(o.id) === String(orderId));
          if (found) {
            setOrder(found);
          }
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">Fiş yükleniyor...</div>;
  }

  const o = order || {
    id: orderId,
    customerName: "Müşteri Adı",
    customerPhone: "0555 000 00 00",
    recipientName: "Alıcı Adı",
    recipientPhone: "0544 000 00 00",
    address: "Antalya / Alanya / Mahmutlar Mah. Barbaros Cad. No: 12",
    deliveryDate: "Bugün",
    deliveryTime: "15:00 - 18:00",
    cardNote: "Varlığın hayatıma neşe katıyor, seni çok seviyorum!",
    totalAmount: "2.510 ₺",
    paymentMethod: "Kredi Kartı (3D Secure)",
    courierName: "Ahmet K. (Kurye)",
    items: [{ title: "7 Kırmızı Gül ve Papatyalar", quantity: 1, price: "2.510 ₺" }],
    addons: [{ name: "Kalp Çikolata", price: "250 ₺" }],
  };

  return (
    <div className="bg-slate-100 min-h-screen py-6 font-mono text-black">
      {/* Screen Toolbar (Hidden on Print) */}
      <div className="print:hidden max-w-sm mx-auto mb-4 px-4 flex items-center justify-between gap-2">
        <Link
          href="/yonetim/siparisler"
          className="text-xs font-bold text-slate-600 bg-white border px-3 py-1.5 rounded-xl shadow-xs"
        >
          ← Siparişlere Dön
        </Link>
        <button
          onClick={() => window.print()}
          style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
          className="text-xs font-black px-4 py-1.5 rounded-xl shadow-xs flex items-center gap-1"
        >
          <span>🖨️ Fişi Yazdır (80mm)</span>
        </button>
      </div>

      {/* 80mm Thermal Receipt Ticket Box */}
      <div className="bg-white max-w-[80mm] mx-auto p-4 border border-slate-300 shadow-md print:shadow-none print:border-none print:p-1 print:max-w-full text-xs space-y-3 leading-tight">
        {/* Store Brand Header */}
        <div className="text-center border-b border-dashed border-black pb-3 space-y-1">
          <div className="text-base font-black uppercase tracking-wider">🌸 ÇİÇEKÇE 🌸</div>
          <div className="text-[10px]">Taze Çiçek & Hızlı Teslimat</div>
          <div className="text-[10px] text-slate-600">www.cicekce.com</div>
        </div>

        {/* Order ID & Timing */}
        <div className="border-b border-dashed border-black pb-2 space-y-1">
          <div className="flex justify-between font-black text-sm">
            <span>SİPARİŞ NO:</span>
            <span>#{o.id}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Teslimat Tarihi:</span>
            <span className="font-bold">{o.deliveryDate || "Bugün"}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span>Teslimat Saati:</span>
            <span className="font-black text-sm">{o.deliveryTime || "09:00 - 18:00"}</span>
          </div>
          {o.courierName && (
            <div className="flex justify-between text-[11px] pt-1">
              <span>Atanan Kurye:</span>
              <span className="font-bold">🛵 {o.courierName}</span>
            </div>
          )}
        </div>

        {/* FLOWER CARD NOTE SECTION (LARGE FOR BOUQUET ATTACHMENT) */}
        <div className="border-2 border-black p-2.5 rounded space-y-1.5 bg-slate-50 print:bg-transparent">
          <div className="text-[10px] font-black uppercase text-center border-b border-black pb-1">
            💌 ÇİÇEK KART NOTU 💌
          </div>
          <div className="text-xs font-black italic text-center py-1 font-serif">
            "{o.cardNote || "Kart notu belirtilmedi."}"
          </div>
          <div className="border-t border-dashed border-black pt-1 text-[10px] flex justify-between">
            <span>Kimden: <b>{o.isAnonymous ? "Gizli Gönderici" : o.customerName}</b></span>
            <span>Kime: <b>{o.recipientName}</b></span>
          </div>
        </div>

        {/* RECIPIENT & DELIVERY ADDRESS */}
        <div className="border-b border-dashed border-black pb-2 space-y-1 text-[11px]">
          <div className="font-black uppercase text-[10px] bg-black text-white px-1 py-0.5 inline-block">
            ALICI BİLGİLERİ
          </div>
          <div>Alıcı: <strong className="text-xs">{o.recipientName}</strong></div>
          <div>Telefon: <strong className="text-xs">{o.recipientPhone}</strong></div>
          <div className="pt-1">
            <span>Adres:</span>
            <div className="font-bold leading-snug">{o.address}</div>
          </div>
        </div>

        {/* SENDER INFORMATION */}
        <div className="border-b border-dashed border-black pb-2 space-y-1 text-[11px]">
          <div className="font-black uppercase text-[10px] bg-black text-white px-1 py-0.5 inline-block">
            GÖNDEREN BİLGİLERİ
          </div>
          <div>Müşteri: <strong>{o.customerName}</strong></div>
          <div>Telefon: <strong>{o.customerPhone}</strong></div>
          <div>Ödeme: <strong>{o.paymentMethod || "Kredi Kartı"}</strong></div>
        </div>

        {/* ITEMS & EXTRAS BREAKDOWN */}
        <div className="border-b border-dashed border-black pb-2 space-y-1 text-[11px]">
          <div className="font-black uppercase text-[10px]">ÜRÜN LİSTESİ</div>
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-black text-left">
                <th>Ürün</th>
                <th className="text-center">Adet</th>
                <th className="text-right">Fiyat</th>
              </tr>
            </thead>
            <tbody>
              {o.items && o.items.length > 0 ? (
                o.items.map((it: any, idx: number) => (
                  <tr key={idx}>
                    <td>{it.title || it.name}</td>
                    <td className="text-center font-bold">{it.quantity || 1}</td>
                    <td className="text-right font-bold">{it.price}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>{o.product || "Çiçek Buketi"}</td>
                  <td className="text-center font-bold">1</td>
                  <td className="text-right font-bold">{o.totalAmount || o.totalPrice}</td>
                </tr>
              )}

              {/* Addons */}
              {o.addons && o.addons.map((add: any, idx: number) => (
                <tr key={`add-${idx}`}>
                  <td>+ {add.name}</td>
                  <td className="text-center font-bold">1</td>
                  <td className="text-right font-bold">{add.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GRAND TOTAL */}
        <div className="text-right space-y-1 pt-1">
          <div className="flex justify-between text-sm font-black border-t border-black pt-1">
            <span>GENEL TOPLAM:</span>
            <span>{o.totalAmount || o.totalPrice} ₺</span>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="text-center text-[9px] text-slate-500 pt-2 border-t border-dashed border-black">
          <div>Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz!</div>
          <div>🌸 Çiçekleriniz Sevdiklerinize Ulaştı 🌸</div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: 80mm auto;
            margin: 0mm;
          }
        }
      `}</style>
    </div>
  );
}
