"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Link2, Plus, Copy, Send, Trash2, CheckCircle2, Clock, XCircle, X } from "lucide-react";

export default function ManuelOdemelerPage() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manuel-odemeler");
      if (res.ok) {
        const data = await res.json();
        setLinks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/manuel-odemeler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desc, amount, payer, phone }),
      });

      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
        setDesc("");
        setAmount("");
        setPayer("");
        setPhone("");
        setShowModal(false);
        setToastMsg("✅ Yeni manuel ödeme linki başarıyla oluşturuldu!");
        setTimeout(() => setToastMsg(""), 3500);
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Bekliyor" ? "Ödendi" : currentStatus === "Ödendi" ? "İptal" : "Bekliyor";
    try {
      const res = await fetch("/api/manuel-odemeler", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (e) {
      alert("Durum güncellenirken hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ödeme linkini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/manuel-odemeler?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (e) {
      alert("Silme hatası.");
    }
  };

  const copyToClipboard = (linkPath: string) => {
    const fullUrl = `${window.location.origin}${linkPath}`;
    navigator.clipboard.writeText(fullUrl);
    setToastMsg(`📋 Ödeme linki kopyalandı: ${fullUrl}`);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const sendWhatsApp = (l: any) => {
    const fullUrl = `${window.location.origin}${l.linkUrl || "/odeme"}`;
    const cleanPhone = (l.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("90") ? cleanPhone : `90${cleanPhone}`;
    const msg = encodeURIComponent(`Merhaba ${l.payer || "Müşterimiz"},\n\n"${l.desc}" siparişiniz için ${l.amount} tutarındaki ödeme linkiniz aşağıdadır:\n👉 ${fullUrl}\n\nKeyifli alışverişler dileriz! 🌸`);
    
    if (cleanPhone) {
      window.open(`https://wa.me/${formattedPhone}?text=${msg}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">💳 TESLİMAT & KASA</div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Manuel Ödemeler & Ödeme Linkleri</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Özel tutarlı müşteri siparişleri için SMS & WhatsApp uyumlu ödeme linki oluşturun.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
            className="px-5 py-2.5 rounded-2xl text-xs font-black hover:opacity-90 transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Ödeme Linki Oluştur</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-black flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Table Card */}
        <div className="card border-0 shadow-sm rounded-3xl bg-white overflow-hidden p-0">
          {loading ? (
            <div className="p-12 text-center text-xs font-extrabold text-slate-400">Yükleniyor...</div>
          ) : links.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold text-slate-500">
              Henüz oluşturulmuş bir manuel ödeme linki bulunmuyor.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 w-full text-xs font-medium text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Tarih</th>
                    <th className="px-5 py-3.5">Açıklama / Ürün</th>
                    <th className="px-5 py-3.5">Müşteri</th>
                    <th className="px-5 py-3.5">Tutar</th>
                    <th className="px-5 py-3.5 text-center">Durum</th>
                    <th className="px-5 py-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {links.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">{l.date}</td>
                      <td className="px-5 py-3.5 font-extrabold text-slate-900">{l.desc}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">
                        {l.payer || "Müşteri"}
                        {l.phone && <div className="text-[10px] text-slate-400 font-mono">{l.phone}</div>}
                      </td>
                      <td className="px-5 py-3.5 font-black text-emerald-700 whitespace-nowrap">{l.amount}</td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(l.id, l.status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black transition flex items-center justify-center gap-1 mx-auto ${
                            l.status === "Ödendi"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : l.status === "İptal"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-900 border border-amber-200"
                          }`}
                        >
                          {l.status === "Ödendi" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {l.status === "Bekliyor" && <Clock className="w-3 h-3 text-amber-600" />}
                          {l.status === "İptal" && <XCircle className="w-3 h-3 text-red-600" />}
                          <span>{l.status}</span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(l.linkUrl || "/odeme")}
                            title="Linkini Kopyala"
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => sendWhatsApp(l)}
                            title="WhatsApp ile Gönder"
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(l.id)}
                            title="Sil"
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-slate-900 text-base">Yeni Ödeme Linki Oluştur</h3>
                <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Ürün / Sipariş Açıklaması *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    placeholder="Örn: 33 Kırmızı Gül Özel Buket Siparişi"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Müşteri Ad Soyad</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      placeholder="Halil SERTKAYA"
                      value={payer}
                      onChange={(e) => setPayer(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Telefon (WhatsApp)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                      placeholder="0532 111 22 33"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Ödeme Tutarı (TL) *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-emerald-700"
                    placeholder="2.500 ₺"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                    className="px-5 py-2.5 text-xs font-black rounded-xl hover:opacity-90 transition"
                  >
                    {saving ? "Oluşturuluyor..." : "Bağlantıyı Oluştur 🚀"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
