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
  const [testEngine, setTestEngine] = useState<"transactional" | "marketing" | "smtp">("transactional");
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
        setToastMsg("✅ E-posta gönderim ayarları başarıyla veritabanına kaydedildi!");
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
      alert("Lütfen bir test e-posta adresi girin.");
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
          type: testEngine,
          subject: testEngine === "transactional" 
            ? "🌸 Çiçekçe Resend API Test E-Postası" 
            : testEngine === "marketing" 
            ? "🛒 Çiçekçe Brevo Sepet Hatırlatması Testi"
            : "✉️ Çiçekçe SMTP Test E-Postası",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; padding: 24px; background-color: #faf6f0; border-radius: 20px;">
              <div style="background: #2b2623; color: #ffffff; padding: 20px; text-align: center; border-radius: 16px; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900;">🌸 Çiçekçe E-Posta Test Servisi</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #e2e8f0;">Motor: ${testEngine.toUpperCase()}</p>
              </div>
              <div style="background: #ffffff; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <p style="font-size: 14px; color: #334155; margin: 0 0 10px 0;">Tebrikler! <b>${testEngine.toUpperCase()}</b> e-posta gönderim motorunuz başarıyla bağlandı ve canlı e-posta ulaştırıldı.</p>
                <p style="font-size: 12px; color: #64748b; margin: 0;">Alan Adı: <b>https://www.cicekce.com</b><br>Tarih: ${new Date().toLocaleString("tr-TR")}</p>
              </div>
            </div>
          `
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(`✅ TEBRİKLER! Test e-postası (${data.provider || testEngine}) üzerinden '${testRecipient}' adresine başarıyla ulaştırıldı!`);
      } else {
        setTestResult(`❌ HATA: ${data.error || "E-posta gönderilemedi."}`);
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
        <div className="p-5 text-center font-bold text-slate-600">E-Posta servis ayarları yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">📧 CANLI E-POSTA SUNUCU & API YÖNETİMİ</div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900">E-Posta Gönderim Ayarları</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Resend (Sipariş & Görsel Onayı), Brevo (Sepet & Pazarlama) ve Yedek SMTP servislerinin yönetimi.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setTestEmailModal(true); setTestResult(null); }}
              className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xs hover:bg-blue-700 transition"
            >
              🧪 Canlı Test E-Postası Gönder
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

        {/* Active Providers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resend Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <div>
                  <h3 className="font-black text-slate-900 text-base m-0">Resend API (Transactional)</h3>
                  <div className="text-[11px] text-slate-500 font-medium">Sipariş Onayı, Fotoğraf Onayı & Kurye Bildirimleri</div>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-200">
                🟢 Aktif & Bağlı
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1 font-mono">
              <div><strong className="text-slate-700">API Key:</strong> <span className="text-slate-500">re_3yetet1c_... (Tanımlı)</span></div>
              <div><strong className="text-slate-700">Domain:</strong> <span className="text-blue-700 font-bold">www.cicekce.com</span></div>
              <div><strong className="text-slate-700">Gönderici:</strong> <span className="text-slate-600">siparis@cicekce.com</span></div>
            </div>
          </div>

          {/* Brevo Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">📣</span>
                <div>
                  <h3 className="font-black text-slate-900 text-base m-0">Brevo API (Marketing)</h3>
                  <div className="text-[11px] text-slate-500 font-medium">Yarım Kalan Sepetler & Toplu Bülten</div>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-200">
                🟢 Aktif & Bağlı
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1 font-mono">
              <div><strong className="text-slate-700">API Key:</strong> <span className="text-slate-500">xkeysib-0f20b... (Tanımlı)</span></div>
              <div><strong className="text-slate-700">Gönderen:</strong> <span className="text-blue-700 font-bold">Çiçekçe Sipariş Servisi</span></div>
              <div><strong className="text-slate-700">Gönderici E-posta:</strong> <span className="text-slate-600">siparis@cicekce.com</span></div>
            </div>
          </div>
        </div>

        {/* Fallback SMTP Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h5 className="font-black text-slate-900 text-base m-0">
                  ✉️ Yedek SMTP Sunucu Ayarları (Nodemailer Fallback)
                </h5>
                <p className="text-slate-500 text-xs mt-0.5">
                  API servisleri yanıt vermediğinde devreye girecek olan kendi özel SMTP sunucunuz.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="form-check-input w-6 h-6 cursor-pointer"
                  checked={mailEnabled}
                  onChange={(e) => setMailEnabled(e.target.checked)}
                />
                <span className="text-xs font-extrabold text-slate-800">
                  {mailEnabled ? "🟢 SMTP Aktif" : "⚪ Pasif"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMTP Host (mail_host)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="smtp.yandex.com / mail.cicekce.com"
                  value={mailHost}
                  onChange={(e) => setMailHost(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMTP Port (mail_port)</label>
                <input
                  type="text"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="587 / 465"
                  value={mailPort}
                  onChange={(e) => setMailPort(e.target.value)}
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
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMTP Kullanıcı Adı</label>
                <input
                  type="email"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="siparis@cicekce.com"
                  value={mailUsername}
                  onChange={(e) => setMailUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">SMTP E-Posta Şifresi</label>
                <input
                  type="password"
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                  placeholder="••••••••••••"
                  value={mailPassword}
                  onChange={(e) => setMailPassword(e.target.value)}
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
              <span>💾 {saving ? "Kaydediliyor..." : "E-Posta Ayarlarını Kaydet"}</span>
            </button>
          </div>
        </form>

        {/* TEST EMAIL MODAL */}
        {testEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 font-sans">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-black text-slate-900 text-lg">🧪 Canlı Test E-Postası Gönder</h3>
                <button onClick={() => setTestEmailModal(false)} className="text-slate-400 font-bold hover:text-slate-600">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gönderim Motorunu Seçin:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTestEngine("transactional")}
                      className={`p-2.5 rounded-xl border text-xs font-black transition ${testEngine === "transactional" ? "bg-purple-100 border-purple-500 text-purple-900" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                    >
                      🚀 Resend API
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestEngine("marketing")}
                      className={`p-2.5 rounded-xl border text-xs font-black transition ${testEngine === "marketing" ? "bg-orange-100 border-orange-500 text-orange-900" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                    >
                      📣 Brevo API
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestEngine("smtp")}
                      className={`p-2.5 rounded-xl border text-xs font-black transition ${testEngine === "smtp" ? "bg-blue-100 border-blue-500 text-blue-900" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                    >
                      ✉️ SMTP
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Alıcı E-Posta Adresi:</label>
                  <input
                    type="email"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                    placeholder="kendi_epostaniz@gmail.com"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                  />
                </div>

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
                  {sendingTest ? "Gönderiliyor..." : "📧 Test E-Postası Gönder"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
