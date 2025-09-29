import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AdaptiveLayout } from "@/components/layout/adaptive-layout";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { MemberProvider } from "@/components/context/member-context";

import { Quicksand } from "next/font/google";

const fontQuicksand = Quicksand({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-quicksand",
});

export const metadata: Metadata = {
  title: "FinanceApp - Kelola Keuangan Anda",
  description:
    "Aplikasi keuangan personal untuk mengelola anggaran dan transaksi Anda",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${fontQuicksand.variable} antialiased`}>
      <body>
        <ThemeProvider>
          <MemberProvider>
            <AdaptiveLayout>{children}</AdaptiveLayout>
          </MemberProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
