"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";

export default function OrderThermalReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paperMode, setPaperMode] = useState<"full_a4" | "strip1" | "strip2" | "strip3">("full_a4");

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
  const itemsSummary = cleanItems.map((it: any) => `${it.code || "ürün"} * ${it.quantity || 1} Adet`).join(" / ");

  // Render a single strip (Exact physical size: 210mm wide x 90mm high | Left 90mm + Right 120mm)
  const renderStrip = (keyIndex: number = 1) => {
    const rawOrderNo = String(o.id).replace(/\D/g, "") || String(o.id);
    const barcodeCode = rawOrderNo.length >= 6 ? rawOrderNo : `${rawOrderNo}0143`;
    const barcodeImgUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeCode)}&scale=2&height=8&includetext=false`;
    const qrTargetUrl = o.mediaNoteUrl || `https://www.cicekce.com/siparis-takip?id=${o.id}`;

    return (
      <div key={keyIndex} className="otokopi-strip bg-white text-black relative flex overflow-hidden border-b border-dashed border-slate-300 print:border-none">
        {/* SOL KISIM: KART NOTU ALANI (Tam 90mm Genişlik x 90mm Yükseklik) */}
        <div className="card-note-part w-[90mm] min-w-[90mm] max-w-[90mm] h-[90mm] min-h-[90mm] max-h-[90mm] p-3 pt-2.5 pb-2 flex flex-col justify-between relative box-border overflow-hidden">
          {/* Sol Üst: Tarih ve Saat */}
          <div className="text-[8.5px] text-slate-700 font-sans">
            {o.date || new Date().toLocaleDateString("tr-TR")} {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </div>

          {/* Kart Notu Metni - Ortalanmış, zarif italik */}
          <div className="my-auto px-1">
            <div className="text-[10px] leading-relaxed font-serif italic text-slate-900 break-words line-clamp-4">
              "{o.cardNote || "Kart notu belirtilmedi."}"
            </div>
            {/* Gönderen Adı - Notun sağ altında */}
            <div className="text-right pt-1.5">
              <span className="text-[10.5px] font-bold font-serif italic text-black">
                {o.isAnonymous ? "İsimsiz Gönderici" : (o.customerName || "Gönderen")}
              </span>
            </div>
          </div>

          {/* Sol Alt: QR Kod (Sesli/Videolu Not veya Sipariş Takip QR) */}
          <div className="pt-0.5 flex items-end justify-start">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(qrTargetUrl)}`}
              alt="QR Kod"
              className="w-11 h-11 object-contain"
            />
          </div>
        </div>

        {/* SAĞ KISIM: SİPARİŞ & TESLİMAT ALANI (Tam 120mm Genişlik x 90mm Yükseklik) */}
        <div className="order-detail-part w-[120mm] min-w-[120mm] max-w-[120mm] h-[90mm] min-h-[90mm] max-h-[90mm] p-2.5 pt-2.5 pb-1.5 pl-3 flex flex-col justify-between relative box-border overflow-hidden">
          {/* Üst: Barkod + Sipariş Kodu + Ürün Küçük Görselleri */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col items-center">
              {/* Barkod Görseli */}
              <img
                src={barcodeImgUrl}
                alt={`Barkod ${barcodeCode}`}
                className="h-7 max-w-[130px] object-contain"
                onError={(e: any) => {
                  e.target.style.display = "none";
                }}
              />
              {/* Barkod Altı Sipariş Numarası */}
              <div className="text-[10.5px] font-bold font-mono tracking-wider mt-0.5 text-black">
                {barcodeCode}
              </div>
              {/* Tarih, Ürün Kodu ve Adet */}
              <div className="text-[8px] text-slate-600 font-sans mt-0.5 text-center truncate max-w-[120px]">
                {o.deliveryDate || "15.09.2026"} / {itemsSummary}
              </div>
            </div>

            {/* Ürün Görselleri (Varsa birden fazla ürün) */}
            <div className="flex items-center gap-1 shrink-0">
              {cleanItems.slice(0, 2).map((item: any, idx: number) => (
                item.image || o.productImage ? (
                  <img
                    key={idx}
                    src={item.image || o.productImage}
                    alt={item.title || "Ürün"}
                    className="w-9 h-9 object-cover rounded border border-slate-200 shrink-0"
                  />
                ) : (
                  <div key={idx} className="w-9 h-9 border border-slate-200 rounded flex items-center justify-center text-xs shrink-0">🌸</div>
                )
              ))}
            </div>
          </div>

          {/* Orta: Sipariş Numarası, Ürün Başlığı, Teslimat Zamanı, Alıcı Bilgileri */}
          <div className="space-y-0.5 my-auto text-[8.5px] leading-tight text-slate-900">
            <div className="truncate">
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
              <span className="font-bold text-black uppercase text-[8px] leading-tight line-clamp-2">
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

        <div className="flex items-center gap-2">
          {/* Parça Seçimi */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaperMode("full_a4")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                paperMode === "full_a4" ? "bg-white text-black shadow-xs font-black" : "text-slate-500"
              }`}
            >
              Tam A4 (3 Parça)
            </button>
            <button
              type="button"
              onClick={() => setPaperMode("strip1")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                paperMode === "strip1" ? "bg-white text-black shadow-xs font-black" : "text-slate-500"
              }`}
            >
              1. Parça (Üst)
            </button>
            <button
              type="button"
              onClick={() => setPaperMode("strip2")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                paperMode === "strip2" ? "bg-white text-black shadow-xs font-black" : "text-slate-500"
              }`}
            >
              2. Parça (Orta)
            </button>
            <button
              type="button"
              onClick={() => setPaperMode("strip3")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                paperMode === "strip3" ? "bg-white text-black shadow-xs font-black" : "text-slate-500"
              }`}
            >
              3. Parça (Alt)
            </button>
          </div>

          <button
            onClick={() => window.print()}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="text-xs font-black px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 hover:opacity-95 transition cursor-pointer"
          >
            <span>🖨️ Formu Yazdır</span>
          </button>
        </div>
      </div>

      {/* YAZDIRMA ALANI - Tam A4 Sayfası (210mm x 297mm) */}
      <div className="print-canvas mx-auto">
        <div className="a4-page-wrapper mx-auto bg-white shadow-lg print:shadow-none">
          {paperMode === "full_a4" && (
            <>
              {renderStrip(1)}
              {renderStrip(2)}
              {renderStrip(3)}
            </>
          )}

          {paperMode === "strip1" && (
            <>
              {renderStrip(1)}
            </>
          )}

          {paperMode === "strip2" && (
            <>
              <div className="w-[210mm] h-[90mm] min-h-[90mm] max-h-[90mm] invisible" />
              {renderStrip(2)}
            </>
          )}

          {paperMode === "strip3" && (
            <>
              <div className="w-[210mm] h-[180mm] min-h-[180mm] max-h-[180mm] invisible" />
              {renderStrip(3)}
            </>
          )}
        </div>
      </div>

      {/* Print Specific CSS to guarantee EXACT 1 Page output on A4 paper */}
      <style jsx global>{`
        .a4-page-wrapper {
          width: 210mm;
          height: 297mm;
          max-height: 297mm;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          box-sizing: border-box;
          margin: 0 auto;
          overflow: hidden;
          background: #ffffff;
        }
        .otokopi-strip {
          width: 210mm;
          height: 90mm;
          min-height: 90mm;
          max-height: 90mm;
          box-sizing: border-box;
          overflow: hidden;
        }
        .card-note-part {
          width: 90mm;
          min-width: 90mm;
          max-width: 90mm;
          height: 90mm;
          min-height: 90mm;
          max-height: 90mm;
          box-sizing: border-box;
          overflow: hidden;
        }
        .order-detail-part {
          width: 120mm;
          min-width: 120mm;
          max-width: 120mm;
          height: 90mm;
          min-height: 90mm;
          max-height: 90mm;
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
          .a4-page-wrapper {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
            background: white !important;
          }
          .otokopi-strip {
            width: 210mm !important;
            height: 90mm !important;
            min-height: 90mm !important;
            max-height: 90mm !important;
            page-break-inside: avoid !important;
            border: none !important;
            overflow: hidden !important;
          }
          .card-note-part {
            width: 90mm !important;
            min-width: 90mm !important;
            max-width: 90mm !important;
            height: 90mm !important;
            min-height: 90mm !important;
            max-height: 90mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .order-detail-part {
            width: 120mm !important;
            min-width: 120mm !important;
            max-width: 120mm !important;
            height: 90mm !important;
            min-height: 90mm !important;
            max-height: 90mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
