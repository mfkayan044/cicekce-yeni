import type { Metadata } from "next";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import PwaRegister from "@/components/pwa/PwaRegister";

export const metadata: Metadata = {
  title: "Çiçekçe | Çiçek Siparişi & Aynı Gün Teslimat (www.cicekce.com)",
  description: "Türkiye'nin lider taze çiçek sipariş portalı.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-cicekce.jpg",
    apple: "/logo-cicekce.jpg",
  },
  themeColor: "#2b2623",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Çiçekçe",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2b2623" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Çiçekçe" />
        <link rel="stylesheet" href="/demo-procicek.css" />
        <link rel="stylesheet" href="/sneat/assets/vendor/fonts/boxicons.css" />
      </head>
      <body className="bg-[#FAF6F0] text-slate-800 min-h-screen font-sans">
        <PwaRegister />
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
