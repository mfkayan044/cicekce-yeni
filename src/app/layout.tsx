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

async function getGaIdServer(): Promise<string> {
  try {
    const { getSetting } = await import("@/lib/settings-helper");
    const settings = await getSetting("api_settings");
    const raw = settings?.googleAnalyticsId || settings?.googleTagId || "";
    if (raw) {
      const match = String(raw).match(/(G|GT|UA)-[A-Za-z0-9]+/i);
      return match ? match[0].toUpperCase() : String(raw).trim();
    }
  } catch (e) {}

  try {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase.from("site_settings").select("value").eq("id", "api_settings").maybeSingle();
    const raw = data?.value?.googleAnalyticsId || data?.value?.googleTagId || "";
    if (raw) {
      const match = String(raw).match(/(G|GT|UA)-[A-Za-z0-9]+/i);
      return match ? match[0].toUpperCase() : String(raw).trim();
    }
  } catch (e) {}

  return "";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = await getGaIdServer();

  return (
    <html lang="tr" className="antialiased" suppressHydrationWarning>
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
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="bg-[#FAF6F0] text-slate-800 min-h-screen font-sans pb-16 lg:pb-0" suppressHydrationWarning>
        <PwaRegister />
        <AnalyticsTracker />
        {children}
        <AiFloristWidget />
        <StoreMobileBottomNav />
      </body>
    </html>
  );
}
