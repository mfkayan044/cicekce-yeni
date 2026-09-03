import type { Metadata } from "next";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";

export const metadata: Metadata = {
  title: "Çiçekçe | Çiçek Siparişi & Aynı Gün Teslimat (www.cicekce.com)",
  description: "Türkiye'nin lider taze çiçek sipariş portalı.",
  icons: {
    icon: "/logo-icon.webp",
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
        <link rel="stylesheet" href="/demo-procicek.css" />
        <link rel="stylesheet" href="/sneat/assets/vendor/fonts/boxicons.css" />
      </head>
      <body className="bg-[#FAF6F0] text-slate-800 min-h-screen font-sans">
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
