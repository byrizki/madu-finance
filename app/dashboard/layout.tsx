import type { ReactNode } from "react";

import { MemberProvider } from "@/components/context/member-context";
import { AdaptiveLayout } from "@/components/layout/adaptive-layout";
import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Dashboard - byMADU 🐝",
  description: "Aplikasi keuangan personal untuk mengelola anggaran dan transaksi Anda",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <MemberProvider>
      <AdaptiveLayout>{children}</AdaptiveLayout>
    </MemberProvider>
  );
}
