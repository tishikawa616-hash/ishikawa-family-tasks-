import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
// import { PushNotificationManager } from "@/components/PushNotificationManager";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ClientVersion } from "@/components/pwa/ClientVersion";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "タスク管理",
  description: "家族で共有するタスク管理アプリ - 西原村から世界へ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "タスク管理",
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="antialiased">
        <ToastProvider>
          <ClientVersion />
          {children}
          <Suspense fallback={null}>
            <BottomNav />
          </Suspense>
{/* PushNotificationManager removed */}
        </ToastProvider>
      </body>
    </html>
  );
}
