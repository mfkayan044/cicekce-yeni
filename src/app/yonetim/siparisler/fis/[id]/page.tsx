"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";

export default function OrderThermalReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paperMode, setPaperMode] = useState<"strip" | "full_a4">("strip"); // strip: tek şerit (210x99mm), full_a4: A4 3 kopya

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const list = await res.json();
          const cleanTarget = String(orderId).replace(/^SIP-/i, "").toLowerCase();
          const found = list.find((o: any) => {
            const cleanId = String(o.id).replace(/^SIP-/i, "").toLowerCase();
            return cleanId === cleanTarget || String(o.id).toLowerCase() === String(orderId).toLowerCase();
          });
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
    return <div className="p-8 text-center text-slate-500 font-bold">Fiş hazırlanıyor...</div>;
  }

  const o = order || {
    id: orderId,
    customerName: "BELGİN YÜCELBAK",
    customerPhone: "0532 000 00 00",
    recipientName: "Zeki Hanım",
    recipientPhone: "0544 000 00 00",
    address: "GÖKTÜRK MAH. KÖPRÜBAŞI CAD. OZAK SİTESİ A 1 BLOK DAİRE 19 GÖKTÜRK EYÜPSULTAN Göktürk Merkez Mahallesi Eyüpsultan İSTANBUL AVRUPA",
    deliveryDate: "15.09.2026",
    deliveryTime: "15:00 - 17:00 Arası Teslimat",
    cardNote: "Bu çiçekler sana şifa ve enerji getirsin. Kendine çok iyi bak çok geçmiş olsun öpüyorum seni.",
    totalAmount: "2.510 ₺",
    paymentMethod: "Kredi Kartı",
    items: [{ title: "Gazete Desenli Buket Süslemeli Saksıda Spatifilyum", code: "vbt1812-1", quantity: 1, price: "2.510 ₺" }],
  };

  const cleanItems = o.items && o.items.length > 0
    ? o.items
    : [{ title: o.product || "Taze Çiçek Buketi", code: o.productCode || `DM${o.id}`, quantity: 1, price: o.totalAmount || o.totalPrice }];

  const firstItem = cleanItems[0];
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(String(o.id).replace(/\D/g, "") || "460918939")}&scale=2&height=10&includetext`;

  // Render a single strip (Exact physical DL size: 210mm wide x 99mm high)
  const renderStrip = () => {
    const rawOrderNo = String(o.id).replace(/\D/g, "") || String(o.id);
    const barcodeCode = rawOrderNo.length >= 6 ? rawOrderNo : `${rawOrderNo}0143`;
    const barcodeImgUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeCode)}&scale=2&height=9&includetext=false`;
    const qrTargetUrl = o.mediaNoteUrl || `https://www.cicekce.com/siparis-takip?id=${o.id}`;

    return (
      <div className="otokopi-strip bg-white text-black relative flex overflow-hidden">
        {/* SOL KISIM: KART NOTU ALANI (Tam 70mm Genişlik x 99mm Yükseklik) */}
        <div className="card-note-part w-[70mm] h-[99mm] p-3 pt-4 flex flex-col justify-between relative box-border overflow-hidden">
          {/* Sol Üst: Tarih ve Saat */}
          <div className="text-[8px] text-slate-700 font-sans">
            {o.date || new Date().toLocaleDateString("tr-TR")} {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </div>

          {/* Kart Notu Metni - Ortalanmış, zarif italik */}
          <div className="my-auto px-1">
            <div className="text-[10px] leading-relaxed font-serif italic text-slate-900 break-words line-clamp-5">
              "{o.cardNote || "Kart notu belirtilmedi."}"
            </div>
            {/* Gönderen Adı - Notun sağ altında */}
            <div className="text-right pt-2">
              <span className="text-[10.5px] font-bold font-serif italic text-black">
                {o.isAnonymous ? "İsimsiz Gönderici" : (o.customerName || "Gönderen")}
              </span>
            </div>
          </div>

          {/* Sol Alt: QR Kod (Sesli/Videolu Not veya Sipariş Takip QR) */}
          <div className="pt-1 flex items-end justify-start">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrTargetUrl)}`}
              alt="QR Kod"
              className="w-12 h-12 object-contain"
            />
          </div>
        </div>

        {/* SAĞ KISIM: SİPARİŞ & TESLİMAT ALANI (Tam 140mm Genişlik x 99mm Yükseklik) */}
        <div className="order-detail-part w-[140mm] h-[99mm] p-3 pt-4 pl-4 flex flex-col justify-between relative box-border overflow-hidden">
          {/* Üst: Barkod + Sipariş Kodu + Ürün Küçük Görseli */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col items-center">
              {/* Barkod Görseli */}
              <img
                src={barcodeImgUrl}
                alt={`Barkod ${barcodeCode}`}
                className="h-8 max-w-[140px] object-contain"
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
              {/* Barkod Altı Sipariş Numarası */}
              <div className="text-[10.5px] font-bold font-mono tracking-wider mt-0.5 text-black">
                {barcodeCode}
              </div>
              {/* Tarih, Ürün Kodu ve Adet */}
              <div className="text-[8px] text-slate-600 font-sans mt-0.5">
                {o.deliveryDate || "15.09.2026"} / {firstItem.code || "at5115-1"} * {firstItem.quantity || 1} Adet
              </div>
            </div>

            {/* Ürün Görseli */}
            {o.productImage || firstItem.image ? (
              <img
                src={o.productImage || firstItem.image}
                alt="Ürün"
                className="w-9 h-9 object-cover rounded border border-slate-200"
              />
            ) : (
              <div className="w-9 h-9 border border-slate-200 rounded flex items-center justify-center text-xs">🌸</div>
            )}
          </div>

          {/* Orta: Sipariş Numarası, Ürün Başlığı, Teslimat Zamanı, Alıcı Bilgileri */}
          <div className="space-y-0.5 my-auto text-[8.5px] leading-tight text-slate-900">
            <div>
              <span className="font-extrabold text-black">
                {barcodeCode} - {firstItem.code || "at5115-1"} - {firstItem.title || "Çiçek Buketi"}
              </span>
            </div>
            <div className="text-[8px] text-slate-500">Standart Boy</div>

            <div className="pt-0.5">
              <span className="font-medium text-slate-700">Teslimat Zamanı: </span>
              <span className="font-bold text-black">{o.deliveryTime || o.deliverySlot || "18:00 - 22:00 Arası Teslimat"}</span>
            </div>

            <div>
              <span className="font-medium text-slate-700">Alıcı Adı Soyadı: </span>
              <span className="font-extrabold text-black text-[9.5px]">{o.recipientName}</span>
              {o.recipientPhone && <span className="text-slate-600 ml-1 font-semibold">({o.recipientPhone})</span>}
            </div>

            <div className="pt-0.5">
              <span className="font-medium text-slate-700">Alıcı Adresi: </span>
              <span className="font-bold text-black uppercase text-[8.5px] leading-tight">
                {o.address}
              </span>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div className="text-[7.5px] text-slate-400 text-right pt-0.5 border-t border-slate-100">
            {o.paymentMethod || "Kredi Kartı"} · Çiçekçe Formu
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-100 min-h-screen py-6 print:py-0 print:bg-white font-sans text-black">
      {/* Ekran Araç Çubuğu (Yazdırmada Gizlenir) */}
      <div className="print:hidden max-w-4xl mx-auto mb-6 px-4 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/yonetim/siparisler"
            className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border px-3 py-2 rounded-xl transition"
          >
            ← Siparişlere Dön
          </Link>
          <div className="text-xs font-bold text-slate-800">
            Sipariş: <span className="font-mono font-black text-[#2b2623]">#{o.id}</span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
          className="text-xs font-black px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 hover:opacity-95 transition cursor-pointer"
        >
          <span>🖨️ Formu Yazdır (A4)</span>
        </button>
      </div>

      {/* YAZDIRMA ALANI - Tam A4 Sayfası */}
      <div className="print-canvas mx-auto">
        <div className="a4-single-strip-sheet mx-auto bg-white shadow-md print:shadow-none">
          {renderStrip()}
        </div>
      </div>

      {/* Print Specific CSS to guarantee EXACT 1 Page output on A4 paper */}
      <style jsx global>{`
        .a4-single-strip-sheet {
          width: 210mm;
          height: 297mm;
          box-sizing: border-box;
          margin: 0 auto;
          overflow: hidden;
        }
        .a4-page-wrapper {
          width: 210mm;
          height: 297mm;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          margin: 0 auto;
          overflow: hidden;
        }
        .otokopi-strip {
          width: 210mm;
          height: 99mm;
          max-height: 99mm;
          box-sizing: border-box;
          overflow: hidden;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-canvas {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          .a4-single-strip-sheet,
          .a4-page-wrapper {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          .otokopi-strip {
            width: 210mm !important;
            height: 99mm !important;
            max-height: 99mm !important;
            page-break-inside: avoid !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
