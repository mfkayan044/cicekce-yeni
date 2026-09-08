"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { getStoredMember } from "@/lib/member-auth";

export default function StoreMobileBottomNav() {
  const pathname = usePathname();
  const { cart } = useStore();
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    setMember(getStoredMember());
    const handler = () => setMember(getStoredMember());
    window.addEventListener("cicekce_auth_change", handler);
    return () => window.removeEventListener("cicekce_auth_change", handler);
  }, []);

  // Hide on admin routes or payment page if desired
  if (pathname?.startsWith("/yonetim")) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const triggerSearch = () => {
    const searchBtn = document.getElementById("searchOpen");
    if (searchBtn) {
      searchBtn.click();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-1.5 px-2">
      <div className="grid grid-cols-5 items-center text-center">
        {/* Anasayfa */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 transition ${
            isActive("/") ? "text-[#2b2623] font-black" : "text-slate-500 font-semibold"
          }`}
        >
          <span className="text-lg leading-none">🏠</span>
          <span className="text-[10px] mt-0.5">Anasayfa</span>
        </Link>

        {/* Kategoriler */}
        <Link
          href="/kategori/cicekler"
          className={`flex flex-col items-center justify-center py-1 transition ${
            isActive("/kategori") ? "text-[#2b2623] font-black" : "text-slate-500 font-semibold"
          }`}
        >
          <span className="text-lg leading-none">🌸</span>
          <span className="text-[10px] mt-0.5">Kategoriler</span>
        </Link>

        {/* Arama */}
        <button
          type="button"
          onClick={triggerSearch}
          className="flex flex-col items-center justify-center py-1 text-slate-500 font-semibold transition hover:text-[#2b2623]"
        >
          <span className="text-lg leading-none">🔍</span>
          <span className="text-[10px] mt-0.5">Arama</span>
        </button>

        {/* Sepet */}
        <Link
          href="/sepet"
          className={`flex flex-col items-center justify-center py-1 transition relative ${
            isActive("/sepet") ? "text-[#2b2623] font-black" : "text-slate-500 font-semibold"
          }`}
        >
          <div className="relative">
            <span className="text-lg leading-none">🛒</span>
            {cart && cart.length > 0 && (
              <span suppressHydrationWarning className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Sepetim</span>
        </Link>

        {/* Hesabım / Giriş */}
        <Link
          href={member ? "/hesabim" : "/giris-yap"}
          className={`flex flex-col items-center justify-center py-1 transition ${
            isActive("/hesabim") || isActive("/giris-yap") ? "text-[#2b2623] font-black" : "text-slate-500 font-semibold"
          }`}
        >
          <span className="text-lg leading-none">👤</span>
          <span className="text-[10px] mt-0.5 truncate max-w-[55px]">
            {member ? member.name.split(" ")[0] : "Giriş"}
          </span>
        </Link>
      </div>
    </div>
  );
}
