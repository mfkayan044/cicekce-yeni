"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function EpostaPage() {
  const [mailEnabled, setMailEnabled] = useState(true);
  const [mailHost, setMailHost] = useState("");
  const [mailPort, setMailPort] = useState("587");
  const [mailEncryption, setMailEncryption] = useState("tls");
  const [mailUsername, setMailUsername] = useState("");
  const [mailPassword, setMailPassword] = useState("");
  const [mailFromAddress, setMailFromAddress] = useState("");
  const [mailFromName, setMailFromName] = useState("Çiçekçe Sipariş Servisi");
  const [mailAdminTo, setMailAdminTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Test Email state
  const [testEmailModal, setTestEmailModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/email");
      if (res.ok) {
        const data = await res.json();
        if (typeof data.mailEnabled === "boolean") setMailEnabled(data.mailEnabled);
        if (data.mailHost) setMailHost(data.mailHost);
        if (data.mailPort) setMailPort(data.mailPort);
        if (data.mailEncryption) setMailEncryption(data.mailEncryption);
        if (data.mailUsername) setMailUsername(data.mailUsername);
        if (data.mailPassword) setMailPassword(data.mailPassword);
        if (data.mailFromAddress) setMailFromAddress(data.mailFromAddress);
        if (data.mailFromName) setMailFromName(data.mailFromName);
        if (data.mailAdminTo) setMailAdminTo(data.mailAdminTo);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailEnabled,
          mailHost,
          mailPort,
          mailEncryption,
          mailUsername,
          mailPassword,
          mailFromAddress,
          mailFromName,
          mailAdminTo
        }),
      });

      if (res.ok) {
        setToastMsg("✅ SMTP E-posta ayarları Supabase veritabanına başarıyla kaydedildi!");
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

  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      alert("Lütfen e-posta adresi girin.");
      return;
    }
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testRecipient,
          subject: "🌸 Çiçekçe SMTP Test E-Postası",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #FAF6F0; border-radius: 16px;">
              <h2 style="color: #2b2623;">🌸 Çiçekçe SMTP E-Posta Gönderim Testi</h2>
              <p style="color: #444; font-size: 14px;">Tebrikler! SMTP sunucu ayarlarınız <b>(${mailHost})</b> başarıyla bağlandı ve gerçek e-posta gönderimi aktif edildi.</p>
              <p style="font-size: 12px; color: #888;">Tarih: ${new Date().toLocaleString("tr-TR")}</p>
            </div>
          `,
          isTest: true
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(`✅ TEBRİKLER! Test e-postası '${testRecipient}' adresine başarıyla ulaştırıldı!`);
      } else {
        setTestResult(`❌ HATA: ${data.error || "SMTP e-posta gönderilemedi."}`);
      }
    } catch (e: any) {
      setTestResult(`❌ HATA: ${e?.message || "Bağlantı hatası"}`);
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-5 text-center font-bold text-slate-600">SMTP ayarları yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">📧 CANLI E-POSTA SUNUCUSU</div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">E-Posta Gönderim Ayarları (SMTP)</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Müşterilerinize otomatik sipariş onayı, fatura ve kurye bilgilendirmesi atacak SMTP e-posta sunucunuzu bağlayın.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setTestEmailModal(true); setTestResult(null); }}
              className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xs hover:bg-blue-700 transition"
            >
              🧪 Test E-Postası Gönder
            </button>
            <Link
              href="/yonetim/eposta/sablonlar"
              className="btn btn-outline-primary font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xs"
            >
              <span>📄 Şablonlar &rarr;</span>
            </Link>
          </div>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl text-sm font-extrabold shadow-xs">
            {toastMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: SMTP Server Settings */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h5 className="font-black text-slate-900 text-base m-0">
                E-Posta Gönderim Servisi (mail_enabled)
              </h5>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="form-check-input w-6 h-6 cursor-pointer"
                  checked={mailEnabled}
                  onChange={(e) => setMailEnabled(e.target.checked)}
                />
                <span className="text-xs font-extrabold text-slate-800">
                  {mailEnabled ? "🟢 E-Posta Gönderimi Aktif" : "⚪ Pasif"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMTP Host (mail_host) *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="smtp.yandex.com / mail.cicekce.com"
                  value={mailHost}
                  onChange={(e) => setMailHost(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMTP Port (mail_port) *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="587 / 465"
                  value={mailPort}
                  onChange={(e) => setMailPort(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Şifreleme Türü</label>
                <select
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  value={mailEncryption}
                  onChange={(e) => setMailEncryption(e.target.value)}
                >
                  <option value="tls">TLS (Önerilen - Port 587)</option>
                  <option value="ssl">SSL (Port 465)</option>
                  <option value="none">Şifrelemesiz (Port 25)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMTP Kullanıcı Adı (mail_username) *</label>
                <input
                  type="email"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="siparis@cicekce.com"
                  value={mailUsername}
                  onChange={(e) => setMailUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMTP E-Posta Şifresi (mail_password) *</label>
                <input
                  type="password"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="••••••••••••"
                  value={mailPassword}
                  onChange={(e) => setMailPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: Sender Info */}
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <h5 className="font-black text-slate-900 text-base border-b pb-3">
              ✉️ Gönderen & Alıcı Yönetici Bilgileri
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Gönderen E-Posta (mail_from_address)</label>
                <input
                  type="email"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="siparis@cicekce.com"
                  value={mailFromAddress}
                  onChange={(e) => setMailFromAddress(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Gönderen Adı (mail_from_name)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="Çiçekçe Sipariş Servisi"
                  value={mailFromName}
                  onChange={(e) => setMailFromName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Sipariş Uyarısı Alacak Yönetici E-Postası</label>
                <input
                  type="email"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="yonetim@cicekce.com"
                  value={mailAdminTo}
                  onChange={(e) => setMailAdminTo(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:opacity-95 transition flex items-center gap-2"
            >
              <span>💾 {saving ? "Kaydediliyor..." : "SMTP E-Posta Ayarlarını Kaydet ve Aktif Et"}</span>
            </button>
          </div>
        </form>

        {/* TEST EMAIL MODAL */}
        {testEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-slate-900 text-lg">🧪 Canlı SMTP Test E-Postası Gönder</h3>
                <button onClick={() => setTestEmailModal(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-bold">
                  SMTP sunucunuzun <b>({mailHost || "Henüz Girilmedi"})</b> gerçek e-posta gönderip göndermediğini test etmek için kendi e-posta adresinizi yazın:
                </p>

                <input
                  type="email"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="kendi_epostaniz@gmail.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                />

                {testResult && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${testResult.includes("TEBRİKLER") ? "bg-emerald-50 text-emerald-950 border border-emerald-300" : "bg-red-50 text-red-900 border border-red-300"}`}>
                    {testResult}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button onClick={() => setTestEmailModal(false)} className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200">
                  Kapat
                </button>
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  className="px-5 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-xl hover:bg-blue-700 transition"
                >
                  {sendingTest ? "Gönderiliyor..." : "📧 Test E-Postası At"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
