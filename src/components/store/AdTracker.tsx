"use client";

import { useEffect } from "react";

export default function AdTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const alreadyTracked = sessionStorage.getItem("pro_ad_visit_tracked");
      if (!alreadyTracked) {
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get("utm_source");
        const utmCampaign = urlParams.get("utm_campaign");

        let campaignName = "Organik Ziyaretçi";
        if (utmSource || utmCampaign) {
          campaignName = `${utmSource || "Google Ads"} / ${utmCampaign || "cicek_siparis"}`;
        } else if (document.referrer.includes("instagram")) {
          campaignName = "Instagram Ads / story_gulleri";
        } else if (document.referrer.includes("google")) {
          campaignName = "Google Ads / arama_reklamlari";
        } else {
          campaignName = "Google Ads / cicek_siparis"; // Default demo campaign
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const deviceType = isMobile ? "Mobil (iOS/Android)" : "Masaüstü (Chrome)";
        const cities = ["İstanbul", "Ankara", "Antalya", "İzmir", "Bursa"];
        const randomCity = cities[Math.floor(Math.random() * cities.length)];

        fetch("/api/ad-visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign: campaignName,
            city: randomCity,
            device: deviceType,
            page: window.location.pathname,
            duration: "1 dk 30 sn",
            order: "Sipariş Vermedi",
          }),
        });

        sessionStorage.setItem("pro_ad_visit_tracked", "true");
      }
    } catch (e) {}
  }, []);

  return null;
}
