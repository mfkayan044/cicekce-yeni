"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function IcerikPage() {
  const [h1Title, setH1Title] = useState("Çiçekçe ile Aynı Gün Taze Çiçek Siparişi");
  const [h1Subtitle, setH1Subtitle] = useState("Sizler için özenle seçtiğimiz taze çiçekler, buketler ve aranjmanlar; hepsi aynı gün adrese teslimata hazır.");
  const [metaTitle, setMetaTitle] = useState("Çiçekçe | Aynı Gün Taze Çiçek Siparişi & Çiçek Gönder");
  const [metaDescription, setMetaDescription] = useState("Türkiye'nin ve Antalya'nın en taze çiçek sipariş platformu Çiçekçe ile sevdiklerinize aynı gün teslimatlı kırmızı güller, lilyumlar ve aranjmanlar gönderin.");
  const [keywords, setKeywords] = useState("çiçek siparişi, taze çiçek gönder, antalya çiçekçi, gül buketi, aynı gün çiçek teslimatı");
  const [seoArticle, setSeoArticle] = useState("Çiçekçe, en özel anlarınızı taze ve canlı çiçeklerle taçlandırmak için 7/24 hizmet veren online çiçek sipariş platformudur. Kırmızı gül buketlerinden beyaz papatya aranjmanlarına, şık saksı çiçeklerinden açılış çelenklerine kadar geniş ürün yelpazemizle aynı gün adrese hızlı kurye teslimatı sağlıyoruz.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchSeoSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seo");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setH1Title(data.h1Title || "Çiçekçe ile Aynı Gün Taze Çiçek Siparişi");
          setH1Subtitle(data.h1Subtitle || "Sizler için özenle seçtiğimiz taze çiçekler, buketler ve aranjmanlar; hepsi aynı gün adrese teslimata hazır.");
          setMetaTitle(data.metaTitle || "Çiçekçe | Aynı Gün Taze Çiçek Siparişi & Çiçek Gönder");
          setMetaDescription(data.metaDescription || "Türkiye'nin ve Antalya'nın en taze çiçek sipariş platformu Çiçekçe ile sevdiklerinize aynı gün teslimatlı kırmızı güller, lilyumlar ve aranjmanlar gönderin.");
          setKeywords(data.keywords || "çiçek siparişi, taze çiçek gönder, antalya çiçekçi, gül buketi");
          setSeoArticle(data.seoArticle || "");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        h1Title,
        h1Subtitle,
        metaTitle,
        metaDescription,
        keywords,
        seoArticle
      };

      const res = await fetch("/api/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToastMsg("Anasayfa SEO ve İçerik ayarları Supabase veritabanına başarıyla kaydedildi!");
        setTimeout(() => setToastMsg(""), 3500);
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
            <span className="text-slate-400 fw-light">Site Tasarımı /</span> SEO & İçerik Blokları (Supabase Canlı)
          </h4>
          <p className="text-slate-500 text-sm">
            Google arama sonuçlarında üst sıralara çıkmak için Anasayfa Meta Başlıklarını, H1 Etiketini ve SEO makale yazılarını buradan güncelleyin.
          </p>
        </div>

        {toastMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm rounded-xl font-bold flex items-center gap-2 shadow-xs">
            <span>✓</span> <span>{toastMsg}</span>
          </div>
        )}

        {/* Google Snippet Live Preview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">🔍 Google Arama Önizlemesi (Google Search Snippet Preview)</label>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans space-y-1">
            <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <span>www.cicekce.com</span>
              <span className="text-[10px]">› anasayfa</span>
            </div>
            <div className="text-base font-semibold text-blue-700 hover:underline cursor-pointer line-clamp-1">
              {metaTitle || "Çiçekçe | Aynı Gün Taze Çiçek Siparişi"}
            </div>
            <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {metaDescription || "Türkiye'nin en taze çiçek sipariş platformu Çiçekçe ile sevdiklerinize aynı gün adrese teslim taze güller gönderin."}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border">SEO ayarları yükleniyor...</div>
        ) : (
          <form onSubmit={handleSubmit} className="card border-0 shadow-sm rounded-2xl p-6 bg-white space-y-6">
            <div className="space-y-4 border-b pb-6">
              <h5 className="font-extrabold text-slate-800 text-base m-0">1. Anasayfa Görünür Başlıklar (H1 Heading & Subtitle)</h5>
              
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Anasayfa Ana H1 Başlığı *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                  value={h1Title}
                  onChange={(e) => setH1Title(e.target.value)}
                  placeholder="Çiçekçe ile Aynı Gün Taze Çiçek Siparişi"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Anasayfa Spot Alt Başlığı</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#2b2623]"
                  value={h1Subtitle}
                  onChange={(e) => setH1Subtitle(e.target.value)}
                  placeholder="Sizler için özenle seçtiğimiz taze çiçekler, buketler ve aranjmanlar; hepsi aynı gün adrese teslimata hazır."
                />
              </div>
            </div>

            <div className="space-y-4 border-b pb-6">
              <h5 className="font-extrabold text-slate-800 text-base m-0">2. Google Meta Arama Etiketleri (Meta Title & Description)</h5>
              
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Meta Title (Arama Başlığı - Maks 60 Karakter) *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#2b2623]"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  required
                />
                <div className="text-[11px] text-slate-400 mt-1">Karakter sayısı: <b>{metaTitle.length}</b> / 60</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Meta Description (Arama Özeti - Maks 160 Karakter) *</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#2b2623]"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  required
                />
                <div className="text-[11px] text-slate-400 mt-1">Karakter sayısı: <b>{metaDescription.length}</b> / 160</div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">SEO Anahtar Kelimeler (Keywords)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#2b2623]"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="virgülle ayırın: çiçek siparişi, taze çiçek gönder"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-extrabold text-slate-800 text-base m-0">3. Anasayfa Alt SEO Makale / Tanıtım Metni (SEO Content Block)</h5>
              <p className="text-xs text-slate-500 m-0">Anasayfanın en altında ürünlerin altında çıkan ve Google sıralamasını yükselten açıklama yazısı.</p>
              
              <textarea
                rows={5}
                className="w-full p-3.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#2b2623] leading-relaxed"
                value={seoArticle}
                onChange={(e) => setSeoArticle(e.target.value)}
                placeholder="Çiçekçe online çiçek sipariş platformu hakkında detaylı tanıtım yazısı..."
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="px-8 py-3 rounded-xl text-xs font-extrabold shadow-md hover:opacity-95 transition"
              >
                {saving ? "Kaydediliyor..." : "SEO Ayarlarını Supabase'e Kaydet"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
