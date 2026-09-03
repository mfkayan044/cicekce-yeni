"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function EpostaSablonlarPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/settings/email-templates");
      const data = await res.json();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">HTML E-Posta Şablon Paneli</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Müşterilerinize otomatik gönderilen sipariş onayı, kurye teslimat bildirimi ve şifre yenileme mailleri.
            </p>
          </div>
          <Link
            href="/yonetim/eposta"
            className="btn btn-outline-secondary font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xs"
          >
            <span>← SMTP Gönderim Ayarları</span>
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
                <div className="flex items-center gap-2">
                  <span style={{ backgroundColor: "#2b2623", color: "#ffffff" }} className="text-[10px] font-black px-2.5 py-0.5 rounded-md shadow-xs">
                    {t.category || "Şablon"}
                  </span>
                  <h2 className="font-extrabold text-slate-900 text-base m-0">{t.name}</h2>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  E-Posta Konu Başlığı: <strong className="text-blue-700 font-bold">{t.subject}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="badge bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                  🟢 Otomatik Aktif
                </span>
                <button
                  type="button"
                  onClick={() => alert(`"${t.name}" HTML şablon önizlemesi hazırlanıyor.`)}
                  className="btn btn-sm btn-outline-secondary font-bold text-xs px-3 py-1.5 rounded-xl"
                >
                  👁️ Önizleme
                </button>
                <button
                  type="button"
                  onClick={() => alert(`"${t.name}" şablon düzenleyicisi açılıyor.`)}
                  style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                  className="px-4 py-1.5 rounded-xl font-extrabold text-xs shadow-xs hover:opacity-90 transition"
                >
                  ✏️ Düzenle
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
