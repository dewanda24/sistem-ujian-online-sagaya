import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563EB" },
    { media: "(prefers-color-scheme: dark)", color: "#1D4ED8" },
  ],
};

export const metadata: Metadata = {
  title: "CBT Sagaya - Sistem Ujian Online",
  description: "Sistem Ujian Online CBT Sagaya untuk Siswa dan Guru",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CBT Sagaya",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={poppins.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-touch-fullscreen" content="yes" />
        {/* Disable phone number detection on Android */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-sans antialiased select-none">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

