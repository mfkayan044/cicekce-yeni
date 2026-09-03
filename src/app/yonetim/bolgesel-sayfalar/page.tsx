"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BolgeselSayfalarPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/yonetim/sayfalar");
  }, [router]);

  return (
    <div className="p-10 text-center font-bold text-slate-500">
      Sayfa İçerikleri (CMS) yönetim paneline yönlendiriliyorsunuz...
    </div>
  );
}
