"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectTracker() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function checkRedirects() {
      try {
        const res = await fetch("/api/redirects");
        if (res.ok) {
          const list = await res.json();
          const currentPath = window.location.pathname;
          const matched = list.find((r: any) => r.source === currentPath && r.active);
          if (matched && matched.target) {
            router.push(matched.target);
          }
        }
      } catch (e) {}
    }

    checkRedirects();
  }, []);

  return null;
}
