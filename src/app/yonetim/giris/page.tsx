"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!login || !password) {
      setError("Kullanıcı adı veya e-posta alanı zorunludur.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.");
        setLoading(false);
        return;
      }

      router.push("/yonetim");
      router.refresh();
    } catch (err) {
      setError("Bağlantı hatası oluştu. Lütfen tekrar deneyiniz.");
      setLoading(false);
    }
  };

  return (
    <div className="container-xxl min-h-screen flex items-center justify-center py-5 bg-[#f5f5f9]">
      <div className="authentication-wrapper authentication-basic container-p-y w-full max-w-md">
        <div className="authentication-inner">
          <div className="card px-sm-6 px-0 border-0 shadow-lg rounded-xl bg-white">
            <div className="card-body p-8">
              {/* Logo */}
              <div className="app-brand justify-content-center mb-6 flex flex-col items-center">
                <a href="/yonetim/giris" className="app-brand-link gap-2 flex items-center">
                  <span className="app-brand-logo demo">
                    <i className="bx bxs-flower bx-lg text-primary text-4xl"></i>
                  </span>
                  <span className="app-brand-text demo text-body fw-bold text-2xl font-bold text-slate-800 ms-1">
                    Çiçekçe Yönetim
                  </span>
                </a>
              </div>

              <h4 className="mb-1 text-xl font-bold text-slate-800 text-center">Yönetim Paneli 👋</h4>
              <p className="mb-6 text-sm text-slate-500 text-center">Devam etmek için güvenli giriş yapın</p>

              {error && (
                <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form className="mb-5 space-y-4" onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="login" className="form-label text-sm font-semibold text-slate-700 mb-1 block">
                    Kullanıcı adı veya E-posta
                  </label>
                  <input
                    type="text"
                    className="form-control w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none text-sm transition"
                    id="login"
                    name="login"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="kullanıcı adı ya da e-posta"
                    required
                  />
                </div>

                <div className="mb-4 form-password-toggle">
                  <label className="form-label text-sm font-semibold text-slate-700 mb-1 block" htmlFor="password">
                    Parola
                  </label>
                  <div className="input-group input-group-merge flex relative items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className="form-control w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none pr-10 text-sm transition"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="········"
                      required
                    />
                    <button
                      type="button"
                      className="input-group-text cursor-pointer absolute right-3 text-slate-400 hover:text-slate-600 bg-transparent border-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bx ${showPassword ? "bx-show" : "bx-hide"} text-xl`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <div className="form-check flex items-center gap-2">
                    <input
                      className="form-check-input rounded border-slate-300 cursor-pointer"
                      type="checkbox"
                      id="remember"
                      name="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <label className="form-check-label text-xs text-slate-600 cursor-pointer select-none" htmlFor="remember">
                      Beni hatırla
                    </label>
                  </div>
                </div>

                <button
                  className="w-full py-3 bg-[#2b2623] text-white font-bold rounded-xl hover:bg-[#1a1715] transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Giriş Yapılıyor...</span>
                    </>
                  ) : (
                    <span>Güvenli Giriş Yap</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
