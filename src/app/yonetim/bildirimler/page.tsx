"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BildirimlerRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/yonetim/bildirim-ayarlari");
  }, [router]);

  return (
    <div className="p-8 text-center font-bold text-slate-600">
      Bildirim ayarları sayfasına yönlendiriliyorsunuz...
    </div>
  );
}
