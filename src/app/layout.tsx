import type { Metadata, Viewport } from "next";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import PwaRegister from "@/components/pwa/PwaRegister";
import StoreMobileBottomNav from "@/components/store/StoreMobileBottomNav";
import AiFloristWidget from "@/components/AiFloristWidget";

export const viewport: Viewport = {
  themeColor: "#2b2623",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Çiçekçe | Çiçek Siparişi & Aynı Gün Teslimat (www.cicekce.com)",
  description: "Türkiye'nin lider taze çiçek sipariş portalı.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    apple: "/apple-icon.png",
  },
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Çiçekçe" />
        <link rel="stylesheet" href="/demo-procicek.css" />
        <link rel="stylesheet" href="/sneat/assets/vendor/fonts/boxicons.css" />
      </head>
      <body className="bg-[#FAF6F0] text-slate-800 min-h-screen font-sans pb-16 lg:pb-0">
        <PwaRegister />
        <AnalyticsTracker />
        {children}
        <AiFloristWidget />
        <StoreMobileBottomNav />
      </body>
    </html>
  );
}
