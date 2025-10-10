import type { ReactNode } from "react";

import { MemberProvider } from "@/components/context/member-context";
import { AdaptiveLayout } from "@/components/layout/adaptive-layout";

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
