"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    fbq?: any;
    gtag?: any;
    dataLayer?: any[];
  }
}

export function trackPurchase(data: { orderId: string; value: number; currency?: string; items?: any[] }) {
  if (typeof window === "undefined") return;

  // 1. Meta Pixel Purchase Track
  if (typeof window.fbq === "function") {
    window.fbq("track", "Purchase", {
      value: data.value,
      currency: data.currency || "TRY",
      content_ids: data.items?.map((i: any) => i.id || i.title) || [data.orderId],
      content_type: "product",
    });
  }

  // 2. Google Analytics 4 / Google Ads Purchase Track
  if (typeof window.gtag === "function") {
    window.gtag("event", "purchase", {
      transaction_id: data.orderId,
      value: data.value,
      currency: data.currency || "TRY",
      items: data.items?.map((i: any) => ({
        item_id: i.id || i.title,
        item_name: i.title || i.name,
        price: i.price,
        quantity: i.quantity || 1,
      })),
    });
  }
}

export default function AnalyticsTracker() {
  const [pixelId, setPixelId] = useState<string>("");
  const [gaId, setGaId] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings/apis")
      .then((res) => res.json())
      .then((data) => {
        if (data?.metaPixelId) setPixelId(data.metaPixelId);
        if (data?.googleAnalyticsId || data?.googleTagId) setGaId(data.googleAnalyticsId || data.googleTagId);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Meta (Facebook) Pixel */}
      {pixelId && (
        <>
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {/* Google Analytics 4 / Google Tag */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
