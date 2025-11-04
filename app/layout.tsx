import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ShowValuesProvider } from "@/components/providers/show-values-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { Quicksand } from "next/font/google";
import type { Metadata } from "next";
import type React from "react";
import "./globals.css";

const fontQuicksand = Quicksand({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "byMADU - Kelola Keuangan Anda",
  description: "Aplikasi keuangan personal untuk mengelola anggaran dan transaksi Anda",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fontQuicksand.variable} antialiased`}>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ShowValuesProvider>{children}</ShowValuesProvider>
              <Toaster position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
