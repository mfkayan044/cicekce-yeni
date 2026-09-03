"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import { useState, useEffect } from "react";

export default function AyarlarPage() {
  const [logoMode, setLogoMode] = useState("text");
  const [logoUrl, setLogoUrl] = useState("/logo.jpg");
  const [mobileCols, setMobileCols] = useState("2");
  const [desktopCols, setDesktopCols] = useState("4");
  const [username, setUsername] = useState("demo");
  const [email, setEmail] = useState("demo@procicek.com.tr");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingAuth, setSavingAuth] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/general");
      if (res.ok) {
        const data = await res.json();
        if (data.logoMode) setLogoMode(data.logoMode);
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.mobileCols) setMobileCols(data.mobileCols);
        if (data.desktopCols) setDesktopCols(data.desktopCols);
        if (data.username) setUsername(data.username);
        if (data.email) setEmail(data.email);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const res = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoMode,
          logoUrl,
          mobileCols,
          desktopCols,
          username,
          email
        }),
      });

      if (res.ok) {
        setToastMsg("✅ Genel marka ve görünüm ayarları Supabase veritabanına kaydedildi!");
        setTimeout(() => setToastMsg(""), 4000);
      } else {
        alert("Kaydetme hatası.");
      }
    } catch (e) {
      alert("Hata oluştu.");
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== passwordConfirm) {
      alert("Parolalar birbiriyle eşleşmiyor!");
      return;
    }
    setSavingAuth(true);
    try {
      const res = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, ...(password ? { password } : {}) }),
      });

      if (res.ok) {
        setToastMsg("✅ Yönetici giriş ve güvenlik bilgileri başarıyla güncellendi!");
        setPassword("");
        setPasswordConfirm("");
        setTimeout(() => setToastMsg(""), 4000);
      }
    } catch (e) {
      alert("Güvenlik ayarları kaydedilirken hata oluştu.");
    } finally {
      setSavingAuth(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogoUrl(data.url);
        setLogoMode("image");
        
        // Auto save to general settings endpoint immediately
        await fetch("/api/settings/general", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logoMode: "image",
            logoUrl: data.url,
            mobileCols,
            desktopCols,
            username,
            email
          }),
        });

        setToastMsg("✅ Yeni logo yüklendi ve kaydetmeye gerek kalmadan canlı sitede aktifleştirildi!");
        setTimeout(() => setToastMsg(""), 4000);
      }
    } catch (err) {
      alert("Logo yükleme hatası.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-5 text-center font-bold text-slate-600">Genel ayarlar yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl font-sans">
        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">⚙️ MAĞAZA & GÜVENLİK AYARLARI</div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900">Genel Ayarlar & Marka Yönetimi</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Site logosu, mobil/masaüstü ürün listeleme düzeni ve yönetici giriş şifresi ayarları.
          </p>
        </div>

        {toastMsg && (
          <div className="p-4 bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl text-sm font-extrabold shadow-xs">
            {toastMsg}
          </div>
        )}

        {/* Form 1: Genel Marka Ayarları */}
        <form onSubmit={handleSaveGeneral} className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
          <h5 className="font-black text-slate-900 text-base border-b pb-3">
            🎨 Marka Görünümü & Ürün Listeleme Düzeni
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Logo Gösterim Modu (logo_mode)</label>
              <select
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                value={logoMode}
                onChange={(e) => setLogoMode(e.target.value)}
              >
                <option value="text">Yazı İle Logo (ÇİÇEKÇE)</option>
                <option value="image">Görsel Yüklenmiş Logo</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Logo Görseli Yükle / Değiştir</label>
              <input
                type="file"
                accept="image/*"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 text-slate-700 cursor-pointer"
                onChange={handleLogoUpload}
              />
            </div>

            {/* LIVE LOGO PREVIEW BOX */}
            <div className="col-span-1 md:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold text-slate-800">Aktif Canlı Logo Önizlemesi:</div>
                <div className="text-[11px] text-slate-500">Müşterilerinize görünecek olan logo biçimi</div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center min-w-[140px]">
                {logoMode === "image" && logoUrl ? (
                  <img src={logoUrl} alt="Logo Önizleme" className="h-10 w-auto object-contain rounded" />
                ) : (
                  <span style={{ fontFamily: "serif", fontWeight: "700", fontSize: "22px", color: "#1a1918" }}>
                    ÇİÇEKÇE
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Mobil Ürün Izgara Düzeni (grid_cols_mobile)</label>
              <select
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                value={mobileCols}
                onChange={(e) => setMobileCols(e.target.value)}
              >
                <option value="1">Tekli Görünüm (1 Sütun)</option>
                <option value="2">İkili Yan Yana (2 Sütun - Önerilen)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Masaüstü Ürün Izgara Düzeni (grid_cols_desktop)</label>
              <select
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none"
                value={desktopCols}
                onChange={(e) => setDesktopCols(e.target.value)}
              >
                <option value="3">3 Sütunlu Görünüm (Geniş Kartlar)</option>
                <option value="4">4 Sütunlu Görünüm (Standart)</option>
                <option value="5">5 Sütunlu Görünüm (Çoklu Vitrin)</option>
                <option value="6">6 Sütunlu Görünüm (Kompakt Sık Düzen)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingGeneral}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:opacity-95 transition flex items-center gap-2"
            >
              <span>💾 {savingGeneral ? "Kaydediliyor..." : "Marka & Görünüm Ayarlarını Kaydet"}</span>
            </button>
          </div>
        </form>

        {/* Form 2: Yönetici Güvenlik Bilgileri */}
        <form onSubmit={handleSaveAuth} className="card border-0 shadow-sm rounded-3xl bg-white p-6 space-y-4">
          <h5 className="font-black text-slate-900 text-base border-b pb-3">
            🔐 Yönetici Giriş & Güvenlik Bilgileri
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Kullanıcı Adı (username) *</label>
              <input
                type="text"
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Yönetici E-Posta Adresi (email) *</label>
              <input
                type="email"
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Yeni Yönetici Parolası (İsteğe Bağlı)</label>
              <input
                type="password"
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Yeni Parola Tekrarı</label>
              <input
                type="password"
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none"
                placeholder="••••••••••••"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingAuth}
              style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
              className="px-8 py-3.5 rounded-2xl font-black text-sm shadow-sm hover:opacity-95 transition flex items-center gap-2"
            >
              <span>🔐 {savingAuth ? "Güncelleniyor..." : "Giriş & Şifre Bilgilerini Güncelle"}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
