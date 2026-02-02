import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "@/features/accounting/components/ServiceWorkerRegister";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"], // Regular and Bold
});

export const metadata: Metadata = {
  title: "縺企≡縺ｮ險倬鹸",
  description: "縺頑ｯ阪＆繧薙・縺溘ａ縺ｮ莨夊ｨ医い繝励Μ",
  manifest: "/manifest.json",
  themeColor: "#4D7C0F",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "螳ｶ險育ｰｿ",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

import BottomNav from "@/features/accounting/components/BottomNav";

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="accounting-layout">
        {children}
        {/* Accounting specific BottomNav would go here if we hide the global one, or we merge them */}
    </div>
  );
}
