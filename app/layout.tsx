import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ShowValuesProvider } from "@/components/providers/show-values-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import type React from "react";
import "./globals.css";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="antialiased">
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
