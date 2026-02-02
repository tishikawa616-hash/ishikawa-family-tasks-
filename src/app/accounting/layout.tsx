import type { Metadata } from "next";
import "./globals.css";

// notoSansJP removed as it is applied in root layout
// ServiceWorkerRegister removed as unused

export const metadata: Metadata = {
  title: "お金の記録",
  description: "お母さんのための会計アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "家計簿",
  },
};

export const viewport = {
  themeColor: "#4D7C0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="accounting-layout accounting-theme">
        {children}
    </div>
  );
}
