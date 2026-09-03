"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState } from "react";

export default function WhatsAppSablonlarPage() {
  const [businessTpl, setBusinessTpl] = useState("Yeni Sipariş! Sipariş No: {SIPARIS_NO}, Toplam: {TOPLAM}, Müşteri: {MUSTERI_ADI} ({MUSTERI_TEL}), Ürün: {URUN_ADI}");
  const [customerTpl, setCustomerTpl] = useState("Sayın {MUSTERI_ADI}, {MARKA_ADI}'nden verdiğiniz {SIPARIS_NO} nolu siparişiniz alındı! Canlı Takip: {CANLI_TAKIP_LINK}");
  const [customerHavaleTpl, setCustomerHavaleTpl] = useState("Sayın {MUSTERI_ADI}, {SIPARIS_NO} nolu siparişinizin tamamlanması için Havale/EFT bilgileri: {HESAP_SAHIBI} - IBAN: {IBAN}");
  const [statusTpl, setStatusTpl] = useState("Sayın {MUSTERI_ADI}, {SIPARIS_NO} nolu siparişinizin durumu güncellendi: {DURUM}");
  const [recoveryTpl, setRecoveryTpl] = useState("Merhaba {ALICI_ADI}, sepetinizdeki {URUN_ADI} ürününü unutmayın! Özel %{INDIRIM_YUZDE} indirim kuponunuz: {KUPON_KODU}");
  const [activeTab, setActiveTab] = useState("business");
  const [toastMsg, setToastMsg] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg("WhatsApp mesaj şablonları başarıyla kaydedildi!");
    setTimeout(() => setToastMsg(""), 3000);
  };

  const insertTag = (tag: string) => {
    if (activeTab === "business") setBusinessTpl((prev) => prev + " " + tag);
    else if (activeTab === "customer") setCustomerTpl((prev) => prev + " " + tag);
    else if (activeTab === "havale") setCustomerHavaleTpl((prev) => prev + " " + tag);
    else if (activeTab === "status") setStatusTpl((prev) => prev + " " + tag);
    else if (activeTab === "recovery") setRecoveryTpl((prev) => prev + " " + tag);
  };

  const tags = [
    "{MARKA_ADI}", "{SIPARIS_NO}", "{URUN_ADI}", "{URUN_LINK}", "{EK_URUNLER}",
    "{DURUM}", "{ALICI_ADI}", "{ALICI_TEL}", "{GONDEREN_ADI}", "{GONDEREN_TEL}",
    "{MUSTERI_ADI}", "{MUSTERI_TEL}", "{TESLIMAT_TARIHI}", "{TESLIMAT_SAATI}",
    "{ADRES}", "{KART_NOTU}", "{TOPLAM}", "{ODEME_YONTEMI}", "{IBAN}", "{HESAP_SAHIBI}", "{CANLI_TAKIP_LINK}"
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h4 className="fw-bold py-1 mb-1 text-2xl font-bold text-slate-800">
              <span className="text-slate-400 fw-light">Sipariş Merkezi /</span> WhatsApp Şablonları (Mesaj Yönetimi)
            </h4>
            <p className="text-slate-500 text-sm">İşletmeye ve müşterilere otomatik atılan WhatsApp şablon metinleri.</p>
          </div>
          <Link href="/yonetim/whatsapp" className="btn btn-outline-secondary btn-sm rounded-lg flex items-center gap-1">
            <i className="bx bx-left-arrow-alt"></i> WhatsApp Ayarları
          </Link>
        </div>

        {toastMsg && (
          <div className="alert alert-success p-3 bg-[#F5EFE6] text-[#1a1918] border border-amber-900/15 text-sm flex items-center gap-2 rounded-lg">
            <i className="bx bx-check-circle text-lg"></i>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Dynamic Tag Inserter Bar */}
        <div className="card border-0 shadow-sm rounded-xl p-4 bg-white space-y-2">
          <div className="text-xs font-bold text-slate-700 uppercase">Dinamik Değişken Ekle (İmlecin Yanına Ekler):</div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => insertTag(t)}
                className="btn btn-sm btn-light border text-xs px-2 py-1 font-mono hover:bg-primary hover:text-white transition"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("business")}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition ${activeTab === "business" ? "bg-white border-t-2 border-primary text-primary shadow-sm" : "bg-slate-100 text-slate-600"}`}
          >
            İşletmeye — Yeni Sipariş Uyarısı (wa_tpl_business)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition ${activeTab === "customer" ? "bg-white border-t-2 border-primary text-primary shadow-sm" : "bg-slate-100 text-slate-600"}`}
          >
            Müşteriye — Sipariş Onayı (wa_tpl_customer)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("havale")}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition ${activeTab === "havale" ? "bg-white border-t-2 border-primary text-primary shadow-sm" : "bg-slate-100 text-slate-600"}`}
          >
            Müşteriye — Havale / EFT Onayı (wa_tpl_customer_havale)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recovery")}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition ${activeTab === "recovery" ? "bg-white border-t-2 border-primary text-primary shadow-sm" : "bg-slate-100 text-slate-600"}`}
          >
            Yarım Kalan Sepet AI (ai_recovery_tpl)
          </button>
        </div>

        <form onSubmit={handleSave} className="card border-0 shadow-sm rounded-xl p-6 bg-white space-y-4">
          {activeTab === "business" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">İşletme WhatsApp Bildirim Metni</label>
              <textarea className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={6} value={businessTpl} onChange={(e) => setBusinessTpl(e.target.value)} required />
            </div>
          )}

          {activeTab === "customer" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Müşteri Kredi Kartı Sipariş Onay Metni</label>
              <textarea className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={6} value={customerTpl} onChange={(e) => setCustomerTpl(e.target.value)} required />
            </div>
          )}

          {activeTab === "havale" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Müşteri Havale / EFT Bilgilendirme Metni</label>
              <textarea className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={6} value={customerHavaleTpl} onChange={(e) => setCustomerHavaleTpl(e.target.value)} required />
            </div>
          )}

          {activeTab === "recovery" && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Yarım Kalan Sepet AI Hatırlatma Metni</label>
              <textarea className="w-full px-3 py-2 border rounded-lg text-sm font-mono" rows={6} value={recoveryTpl} onChange={(e) => setRecoveryTpl(e.target.value)} required />
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button type="submit" className="btn btn-primary px-6 py-2.5 text-sm font-semibold rounded-lg shadow-md">
              Şablonları Kaydet
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
