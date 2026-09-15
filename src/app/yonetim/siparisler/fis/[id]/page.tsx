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
  const renderStrip = (copyLabel?: string) => (
    <div className="otokopi-strip bg-white text-black relative flex overflow-hidden">
      {/* SOL KISIM: KART NOTU (Tam 70mm Genişlik x 99mm Yükseklik) */}
      <div className="card-note-part w-[70mm] h-[99mm] p-3 flex flex-col justify-between relative box-border overflow-hidden">
        {/* Card Note Body */}
        <div className="space-y-1 overflow-hidden">
          {copyLabel && (
            <div className="text-[7.5px] font-bold uppercase text-slate-400 print:hidden">{copyLabel}</div>
          )}
          <div className="text-[9.5px] leading-tight font-serif italic text-slate-900 break-words line-clamp-6 pt-0.5">
            "{o.cardNote || "Kart notu belirtilmedi."}"
          </div>
        </div>

        {/* Media Note QR Code if available */}
        {o.mediaNoteUrl ? (
          <div className="flex items-center gap-1.5 py-1">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(o.mediaNoteUrl)}`}
              alt="Sesli/Videolu Mesaj QR Kodu"
              className="w-7 h-7 object-contain rounded shrink-0 border border-slate-200"
            />
            <div className="text-[7px] font-sans leading-tight text-slate-700">
              <span className="font-bold text-black block">🎙️ Ses/Video</span>
              <span className="text-[6.5px] text-slate-500">Okutunuz</span>
            </div>
          </div>
        ) : null}

        {/* Sender Name - Sol kutunun en altında kalır, yatay çizgiyi asla aşmaz */}
        <div className="pt-0.5 text-right">
          <div className="text-[10px] font-black uppercase font-serif tracking-wide text-black truncate">
            {o.isAnonymous ? "İsimsiz Gönderici" : (o.customerName || "Gönderen")}
          </div>
        </div>
      </div>

      {/* SAĞ KISIM: SİPARİŞ DETAY VE TESLİMAT BİLGİSİ (Tam 140mm Genişlik x 99mm Yükseklik) */}
      <div className="order-detail-part w-[140mm] h-[99mm] p-3 pl-4 flex flex-col justify-between relative box-border overflow-hidden">
        {/* Top: Barcode + Order Number + Product Thumb */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="h-7">
              {/* Barcode representation */}
              <img
                src={barcodeUrl}
                alt={`Barkod ${o.id}`}
                className="h-6 max-w-[125px] object-contain"
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="text-[8px] font-mono font-bold tracking-widest leading-none mt-0.5">
                #{String(o.id).replace(/\D/g, "") || o.id}
              </div>
            </div>
            <div className="text-[8px] text-slate-500 font-semibold pt-0.5">
              {o.deliveryDate || "15.09.2026"} / {firstItem.code || "vbt1812-1"} * {firstItem.quantity || 1} Adet
            </div>
          </div>

          {/* Small Product Thumbnail */}
          {o.productImage || firstItem.image ? (
            <img
              src={o.productImage || firstItem.image}
              alt="Ürün"
              className="w-8 h-8 object-cover rounded border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 border border-slate-200 rounded flex items-center justify-center text-xs">🌸</div>
          )}
        </div>

        {/* Center: Product Name & Recipient Address */}
        <div className="space-y-0.5 my-auto text-[9px] leading-tight">
          <div className="font-extrabold text-slate-900">
            {firstItem.code || "vbt1812-1"} - {firstItem.title || "Çiçek Buketi"}
          </div>
          <div className="text-[8px] text-slate-500">Standart Boy</div>

          <div className="text-[9px] font-bold text-slate-800 pt-0.5">
            Teslimat Zamanı: <span className="font-black text-black">{o.deliveryTime || o.deliverySlot || "13:00 - 18:00 Arası Teslimat"}</span>
          </div>

          <div className="pt-0.5">
            <span className="font-semibold text-slate-700">Alıcı Ad Soyadı: </span>
            <span className="font-black text-black text-[10px]">{o.recipientName}</span>
            {o.recipientPhone && <span className="text-[9px] text-slate-600 font-bold ml-1">({o.recipientPhone})</span>}
          </div>

          <div className="pt-0.5">
            <span className="font-semibold text-slate-700">Alıcı Adresi: </span>
            <span className="font-bold text-slate-900 text-[8.5px] uppercase leading-tight line-clamp-2">
              {o.address}
            </span>
          </div>
        </div>

        {/* Bottom: Note / Print timestamp - 99mm yatay çizgisinin tam üstünde sonlanır */}
        <div className="flex items-center justify-between text-[7px] text-slate-400 pt-0.5 border-t border-slate-100">
          <span>{o.paymentMethod || "Kredi Kartı"} - {o.totalAmount || o.totalPrice} ₺</span>
          <span className="italic">Çiçekçe Sipariş Formu · {new Date().toLocaleDateString("tr-TR")}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-100 min-h-screen py-6 print:py-0 print:bg-white font-sans text-black">
      {/* Screen Toolbar (Hidden on Print) */}
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

        <div className="flex items-center gap-2">
          {/* Paper Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaperMode("strip")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                paperMode === "strip" ? "bg-white text-black shadow-xs font-black" : "text-slate-500"
              }`}
            >
              Standart A4 Fiş (1. Bölüme Hizalı)
            </button>
            <button
              type="button"
              onClick={() => setPaperMode("full_a4")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                paperMode === "full_a4" ? "bg-white text-black shadow-xs font-black" : "text-slate-500"
              }`}
            >
              Tam A4 (3 Bölüm / 3 Nüsha)
            </button>
          </div>

          <button
            onClick={() => window.print()}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="text-xs font-black px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 hover:opacity-95 transition cursor-pointer"
          >
            <span>🖨️ Formu Yazdır</span>
          </button>
        </div>
      </div>

      {/* PRINT CONTAINER */}
      <div className="print-canvas mx-auto">
        {paperMode === "strip" ? (
          <div className="a4-single-strip-sheet mx-auto bg-white shadow-md print:shadow-none">
            {renderStrip()}
          </div>
        ) : (
          <div className="a4-page-wrapper mx-auto bg-white shadow-lg print:shadow-none">
            {renderStrip("1. Nüsha - Müşteri & Çiçek Notu")}
            {renderStrip("2. Nüsha - Atölye / Hazırlık")}
            {renderStrip("3. Nüsha - Kurye Teslimat")}
          </div>
        )}
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
