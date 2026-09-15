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

  // Render a single strip (210mm x 99mm)
  const renderStrip = (copyLabel?: string) => (
    <div className="otokopi-strip bg-white text-black relative flex overflow-hidden border border-dashed border-slate-300 print:border-none">
      {/* SOL KISIM: KART NOTU (70mm x 99mm) */}
      <div className="card-note-part w-[70mm] h-[99mm] p-3 flex flex-col justify-between border-r border-dashed border-slate-400 print:border-slate-300 relative">
        {/* Card Note Body */}
        <div className="space-y-1.5 overflow-hidden">
          {copyLabel && (
            <div className="text-[8px] font-bold uppercase text-slate-400 print:hidden">{copyLabel}</div>
          )}
          <div className="text-[10.5px] leading-snug font-serif italic text-slate-900 break-words line-clamp-5">
            "{o.cardNote || "Kart notu belirtilmedi."}"
          </div>
        </div>

        {/* Media Note QR Code (Voice / Video Message) if available */}
        {o.mediaNoteUrl ? (
          <div className="flex items-center gap-2 pt-1 border-t border-dashed border-slate-300">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(o.mediaNoteUrl)}`}
              alt="Sesli/Videolu Mesaj QR Kodu"
              className="w-10 h-10 object-contain rounded shrink-0 border border-slate-200"
            />
            <div className="text-[8px] font-sans leading-tight text-slate-700">
              <span className="font-bold text-black flex items-center gap-0.5">
                <span>🎙️</span> Ses/Video Mesajı
              </span>
              <span className="text-[7.5px] text-slate-500 block">Kameranızla okutunuz</span>
            </div>
          </div>
        ) : null}

        {/* Sender Name */}
        <div className="pt-1 text-right border-t border-slate-100">
          <div className="text-[11px] font-black uppercase font-serif tracking-wide text-black truncate">
            {o.isAnonymous ? "İsimsiz Gönderici" : (o.customerName || "Gönderen")}
          </div>
        </div>
      </div>

      {/* SAĞ KISIM: SİPARİŞ DETAY VE TESLİMAT BİLGİSİ (140mm x 99mm) */}
      <div className="order-detail-part w-[140mm] h-[99mm] p-3 pl-4 flex flex-col justify-between relative">
        {/* Top: Barcode + Order Number + Product Thumb */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="h-9">
              {/* Barcode representation */}
              <img
                src={barcodeUrl}
                alt={`Barkod ${o.id}`}
                className="h-8 max-w-[130px] object-contain"
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="text-[9px] font-mono font-bold tracking-widest leading-none mt-0.5">
                #{String(o.id).replace(/\D/g, "") || o.id}
              </div>
            </div>
            <div className="text-[9px] text-slate-500 font-semibold">
              {o.deliveryDate || "15.09.2026"} / {firstItem.code || "vbt1812-1"} * {firstItem.quantity || 1} Adet
            </div>
          </div>

          {/* Small Product Thumbnail */}
          {o.productImage || firstItem.image ? (
            <img
              src={o.productImage || firstItem.image}
              alt="Ürün"
              className="w-10 h-10 object-cover rounded border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 border border-slate-200 rounded flex items-center justify-center text-xs">🌸</div>
          )}
        </div>

        {/* Center: Product Name & Recipient Address */}
        <div className="space-y-1 my-auto text-[10px] leading-tight">
          <div className="font-extrabold text-slate-900">
            {firstItem.code || "vbt1812-1"} - {firstItem.title || "Çiçek Buketi"}
          </div>
          <div className="text-[9px] text-slate-600">Standart Boy</div>

          <div className="text-[10px] font-bold text-slate-800 pt-0.5">
            Teslimat Zamanı: <span className="font-black text-black">{o.deliveryTime || o.deliverySlot || "13:00 - 18:00 Arası Teslimat"}</span>
          </div>

          <div className="pt-0.5">
            <span className="font-semibold text-slate-700">Alıcı Ad Soyadı: </span>
            <span className="font-black text-black text-[11px]">{o.recipientName}</span>
            {o.recipientPhone && <span className="text-[10px] text-slate-600 font-bold ml-1">({o.recipientPhone})</span>}
          </div>

          <div className="pt-0.5">
            <span className="font-semibold text-slate-700">Alıcı Adresi: </span>
            <span className="font-bold text-slate-900 text-[9.5px] uppercase leading-tight">
              {o.address}
            </span>
          </div>
        </div>

        {/* Bottom: Note / Print timestamp */}
        <div className="flex items-center justify-between text-[8px] text-slate-400 pt-1 border-t border-slate-100">
          <span>{o.paymentMethod || "Kredi Kartı"} - {o.totalAmount || o.totalPrice} ₺</span>
          <span className="italic">Çiçekçe Sipariş Formu · {new Date().toLocaleDateString("tr-TR")}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-100 min-h-screen py-6 font-sans text-black">
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
              className={`px-3 py-1.5 rounded-lg transition ${
                paperMode === "strip" ? "bg-white text-black shadow-xs font-black" : "text-slate-500"
              }`}
            >
              Tek Şerit (210x99mm DL)
            </button>
            <button
              type="button"
              onClick={() => setPaperMode("full_a4")}
              className={`px-3 py-1.5 rounded-lg transition ${
                paperMode === "full_a4" ? "bg-white text-black shadow-xs font-black" : "text-slate-500"
              }`}
            >
              Tam A4 (3 Kırımlı Kopya)
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
          <div className="single-strip-wrapper mx-auto shadow-md print:shadow-none bg-white">
            {renderStrip()}
          </div>
        ) : (
          <div className="a4-page-wrapper mx-auto shadow-lg print:shadow-none bg-white">
            {renderStrip("1. Nüsha - Müşteri & Çiçek Notu")}
            <div className="perforation-divider my-0 border-b border-dashed border-slate-300 print:border-slate-400"></div>
            {renderStrip("2. Nüsha - Atölye / Hazırlık")}
            <div className="perforation-divider my-0 border-b border-dashed border-slate-300 print:border-slate-400"></div>
            {renderStrip("3. Nüsha - Kurye Teslimat")}
          </div>
        )}
      </div>

      {/* Print Specific Precise CSS for 210mm x 297mm (A4) and 210mm x 99mm (DL) */}
      <style jsx global>{`
        .single-strip-wrapper {
          width: 210mm;
          height: 99mm;
        }
        .a4-page-wrapper {
          width: 210mm;
          min-height: 297mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .otokopi-strip {
          width: 210mm;
          height: 99mm;
          box-sizing: border-box;
        }

        @media print {
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: ${paperMode === "strip" ? "210mm 99mm" : "A4 portrait"};
            margin: 0mm;
          }
          .print-canvas {
            margin: 0 !important;
            padding: 0 !important;
          }
          .otokopi-strip {
            page-break-inside: avoid;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
