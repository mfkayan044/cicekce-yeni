"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  getOrderReceivedHtml, 
  getPhotoApprovalHtml, 
  getCourierNoticeHtml,
  getDeliveredNoticeHtml, 
  getAbandonedCartHtml,
  getWelcomeNoticeHtml
} from "@/lib/email-service";

const sampleOrder = {
  id: "SIP-56298",
  customerName: "Ahmet Yılmaz",
  recipientName: "Zeynep Yılmaz",
  recipientPhone: "0532 *** ** 12",
  totalAmount: "1.250 ₺",
  totalPrice: "1.250 ₺",
  deliveryDate: "11 Eylül 2026",
  deliveryTime: "15:00 - 18:00",
  address: "Bağdat Caddesi No:142 Kadıköy / İstanbul",
  items: [
    { title: "Kırmızı Gül Buketi (101 Dal)", quantity: 1, price: "1.100 ₺" },
    { title: "Kalp Çikolata Kutusu", quantity: 1, price: "150 ₺" }
  ],
  preparedPhoto: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600",
  deliveredPhoto: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=600"
};

const sampleCart = {
  customerName: "Merve Kaya",
  product: "Vazoda Pembe Lisyantus & Gül Seti",
  total: "850 ₺"
};

export default function EpostaSablonlarPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewModalHtml, setPreviewModalHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/settings/email-templates");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTemplates(data);
      } else {
        setTemplates(getInitialTemplates());
      }
    } catch (e) {
      setTemplates(getInitialTemplates());
    } finally {
      setLoading(false);
    }
  };

  const getInitialTemplates = () => [
    { id: "1", name: "Sipariş Onayı (Kredi Kartı / Havale)", subject: "🌸 Siparişiniz Alındı - #SIP-56298", active: true, category: "Sipariş", engine: "Resend (Transactional)", type: "order_received" },
    { id: "2", name: "Canlı Görsel Onayı İsteği", subject: "📸 Çiçeğiniz Hazırlandı! Görsel Onayı Bekliyor - #SIP-56298", active: true, category: "Fotoğraf Onayı", engine: "Resend (Transactional)", type: "photo_approval" },
    { id: "3", name: "Kurye Yola Çıktı / Hazırlanıyor", subject: "🛵 Çiçeğiniz Kuryede! Sipariş #SIP-56298 Yolda", active: true, category: "Kurye", engine: "Resend (Transactional)", type: "courier" },
    { id: "4", name: "Sipariş Teslim Edildi & ÇiçekPuan İsteği", subject: "✅ Çiçeğiniz Teslim Edildi! 50 ÇiçekPuan Kazanın - #SIP-56298", active: true, category: "Teslimat", engine: "Resend (Transactional)", type: "delivered" },
    { id: "5", name: "Yarım Kalan Sepet Hatırlatması", subject: "🛒 Sepetinizde Harika Çiçekler Bekliyor! %10 İndirim Fırsatı", active: true, category: "Pazarlama", engine: "Brevo (Marketing)", type: "abandoned_cart" },
    { id: "6", name: "Yeni Üyelik Hoş Geldin Mesajı", subject: "🌸 Çiçekçe Ailesine Hoş Geldiniz! 100 ₺ İndiriminiz Tanımlandı", active: true, category: "Üyelik", engine: "Resend (Transactional)", type: "welcome" }
  ];

  const handleOpenPreview = (t: any) => {
    let html = "";
    if (t.type === "photo_approval") {
      html = getPhotoApprovalHtml(sampleOrder);
    } else if (t.type === "courier") {
      html = getCourierNoticeHtml(sampleOrder);
    } else if (t.type === "delivered") {
      html = getDeliveredNoticeHtml(sampleOrder);
    } else if (t.type === "abandoned_cart") {
      html = getAbandonedCartHtml(sampleCart);
    } else if (t.type === "welcome") {
      html = getWelcomeNoticeHtml({ name: "Ahmet Yılmaz" });
    } else {
      html = getOrderReceivedHtml(sampleOrder);
    }
    setPreviewTitle(t.name);
    setPreviewModalHtml(html);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-5 text-center font-bold text-slate-600">E-posta şablonları yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">📧 OTOMATİK E-POSTA TASARIMLARI</div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">HTML E-Posta Şablon Yönetimi</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Müşterilerinize otomatik gönderilen sipariş onayı, canlı görsel onayı, kurye ve sepet hatırlatma mailleri.
            </p>
          </div>
          <Link
            href="/yonetim/eposta"
            className="btn btn-outline-secondary font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xs"
          >
            <span>← Sunucu & API Ayarları</span>
          </Link>
        </div>

        {/* Templates List Cards */}
        <div className="space-y-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition duration-200"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="text-[10px] font-black px-2.5 py-0.5 rounded-md shadow-xs">
                    {t.category || "Şablon"}
                  </span>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border">
                    {t.engine || "Resend API"}
                  </span>
                  <h2 className="font-extrabold text-slate-900 text-base m-0">{t.name}</h2>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  E-Posta Konusu: <strong className="text-blue-700 font-bold">{t.subject}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="badge bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                  🟢 Otomatik Aktif
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenPreview(t)}
                  className="btn btn-sm btn-outline-secondary font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1"
                >
                  <span>👁️ Canlı Önizleme</span>
                </button>
                <Link
                  href={`/yonetim/eposta/sablonlar/${t.id}/duzenle`}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-4 py-1.5 rounded-xl font-extrabold text-xs shadow-xs hover:opacity-90 transition inline-block"
                >
                  ✏️ Düzenle
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* LIVE HTML PREVIEW MODAL */}
        {previewModalHtml && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📧</span>
                  <div>
                    <h3 className="font-bold text-sm m-0 text-white">{previewTitle}</h3>
                    <div className="text-[11px] text-slate-400">Canlı HTML Şablon Önizlemesi (https://www.cicekce.com)</div>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewModalHtml(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white font-bold text-sm flex items-center justify-center transition"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
                <iframe
                  title="E-posta Şablon Önizleme"
                  srcDoc={previewModalHtml}
                  className="w-full min-h-[550px] border-0 rounded-2xl bg-white shadow-sm"
                />
              </div>

              <div className="p-4 bg-white border-t flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">💡 Tasarım tüm e-posta istemcileriyle (Gmail, Apple Mail, Hotmail) %100 uyumludur.</span>
                <button
                  onClick={() => setPreviewModalHtml(null)}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-5 py-2 rounded-xl font-extrabold"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
