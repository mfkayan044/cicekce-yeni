"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { 
  getOrderReceivedHtml, 
  getPhotoApprovalHtml, 
  getDeliveredNoticeHtml, 
  getAbandonedCartHtml 
} from "@/lib/email-service";

const sampleOrder = {
  id: "SIP-56298",
  customerName: "Ahmet Yılmaz",
  recipientName: "Zeynep Yılmaz",
  recipientPhone: "0532 *** ** 12",
  totalAmount: "1.250 ₺",
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

export default function EpostaSablonDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [name, setName] = useState("Sipariş Onayı (Kredi Kartı / Havale)");
  const [subject, setSubject] = useState("Siparişiniz Alındı - #SIP-56298");
  const [category, setCategory] = useState("Sipariş");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetchTemplateDetails();
  }, [id]);

  const fetchTemplateDetails = async () => {
    try {
      const res = await fetch("/api/settings/email-templates");
      if (res.ok) {
        const templates = await res.json();
        const found = templates.find((t: any) => String(t.id) === String(id));
        if (found) {
          if (found.name) setName(found.name);
          if (found.subject) setSubject(found.subject);
          if (found.category) setCategory(found.category);
          if (typeof found.active === "boolean") setActive(found.active);
        }
      }
    } catch (e) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name, subject, category, active }),
      });

      if (res.ok) {
        setToastMsg("✅ E-posta şablonu başarıyla kaydedildi!");
        setTimeout(() => setToastMsg(""), 4000);
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const getPreviewHtml = () => {
    if (id === "2") return getPhotoApprovalHtml(sampleOrder);
    if (id === "3") return getDeliveredNoticeHtml(sampleOrder);
    if (id === "4") return getAbandonedCartHtml({ customerName: "Merve Kaya", product: "Vazoda Pembe Lisyantus & Gül Seti", total: "850 ₺" });
    return getOrderReceivedHtml(sampleOrder);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">✏️ HTML ŞABLON DÜZENLEYİCİ</div>
            <h1 className="text-2xl font-black text-slate-900">{name}</h1>
            <p className="text-slate-500 text-xs mt-1">Şablon konusu ve otomatik tetikleyici ayarlarını özelleştirin.</p>
          </div>
          <Link
            href="/yonetim/eposta/sablonlar"
            className="btn btn-outline-secondary font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xs"
          >
            ← Şablon Listesine Dön
          </Link>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl text-sm font-extrabold shadow-xs">
            {toastMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-6 space-y-4">
            <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h5 className="font-black text-slate-900 text-sm m-0">Şablon Genel Bilgileri</h5>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="form-check-input w-5 h-5 cursor-pointer"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  <span className={`text-xs font-extrabold ${active ? "text-emerald-700" : "text-slate-400"}`}>
                    {active ? "🟢 Aktif" : "⚪ Pasif"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Şablon Adı</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Kategori</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">E-Posta Konu Başlığı (Subject Line) *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
                <div className="text-[11px] text-slate-500 mt-1 font-medium">
                  Kullanılabilir Dinamik Değişkenler: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">#&#123;SIPARIS_NO&#125;</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">&#123;MUSTERI_ADI&#125;</code>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-6 py-3 rounded-2xl font-black text-xs shadow-sm hover:opacity-95 transition"
                >
                  💾 {saving ? "Kaydediliyor..." : "Şablonu Kaydet"}
                </button>
              </div>
            </div>
          </form>

          {/* HTML Preview Iframe */}
          <div className="lg:col-span-6 space-y-2">
            <div className="bg-slate-900 text-white p-3 rounded-t-3xl text-xs font-black flex justify-between items-center">
              <span>👁️ Canlı HTML Tasarım Önizlemesi</span>
              <span className="text-slate-400 text-[10px]">https://www.cicekce.com</span>
            </div>
            <div className="bg-slate-100 p-3 rounded-b-3xl border border-slate-200 shadow-sm">
              <iframe
                title="Şablon Önizleme"
                srcDoc={getPreviewHtml()}
                className="w-full min-h-[480px] border-0 rounded-2xl bg-white shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
