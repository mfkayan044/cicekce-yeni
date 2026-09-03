"use client";

import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStoredMember } from "@/lib/member-auth";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          name: mode === "register" ? name : undefined,
          email,
          phone: mode === "register" ? phone : undefined,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Giriş yapılamadı.");
        setLoading(false);
        return;
      }

      if (data.member) {
        setStoredMember(data.member);
        router.push("/hesabim");
      }
    } catch (err: any) {
      setErrorMsg("Bir bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-between font-sans">
      <div>
        <StoreHeader />

        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
            <div className="text-center space-y-1">
              <span className="w-12 h-12 rounded-2xl bg-[#F5EFE6] text-[#2b2623] inline-flex items-center justify-center text-2xl mb-2">
                🌸
              </span>
              <h1 className="text-2xl font-black text-slate-900">
                {mode === "login" ? "Üye Girişi Yap" : "Yeni Hesap Oluştur"}
              </h1>
              <p className="text-xs text-slate-500">
                {mode === "login"
                  ? "Siparişlerinizi takip edin, adreslerinizi kaydedin ve indirimlerden faydalanın."
                  : "Hemen ücretsiz üye olun, aynı gün teslimatlı çiçek alışverişinin keyfini çıkarın."}
              </p>
            </div>

            {/* TAB TOGGLE: GİRİŞ YAP / KAYIT OL */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                }}
                className={`py-2.5 rounded-xl font-black text-xs transition ${
                  mode === "login" ? "bg-white text-[#2b2623] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg("");
                }}
                className={`py-2.5 rounded-xl font-black text-xs transition ${
                  mode === "register" ? "bg-white text-[#2b2623] shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {/* ERROR NOTIFICATION */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Adınız Soyadınız *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ahmet Yılmaz"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#2b2623]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">E-posta Adresiniz *</label>
                <input
                  type="email"
                  required
                  placeholder="ornek@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#2b2623]"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Telefon Numaranız</label>
                  <input
                    type="tel"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#2b2623]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Şifreniz *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#2b2623]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: "#2b2623", color: "#ffffff" }}
                className="w-full py-3.5 rounded-2xl font-black text-sm shadow-md hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <span>{loading ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : "Hesap Oluştur"}</span>
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500">
              <Link href="/siparis-takip" className="font-bold text-[#2b2623] hover:underline">
                🔍 Üye Olmadan Siparişimi Takip Et
              </Link>
            </div>
          </div>
        </main>
      </div>

      <StoreFooter />
    </div>
  );
}
