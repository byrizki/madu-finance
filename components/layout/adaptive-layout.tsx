"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { BottomNavigation } from "./bottom-navigation";
import { SidebarNavigation } from "./sidebar-navigation";
import { Header } from "./header";

interface AdaptiveLayoutProps {
  children: React.ReactNode;
}

export function AdaptiveLayout({ children }: AdaptiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsLoading(false);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Don't show navigation on login page
  const isLoginPage = pathname === "/login";

  // Show skeleton during SSR/hydration
  if (isLoading) {
    return (
      <div className="h-screen flex bg-background animate-pulse">
        {/* Desktop sidebar skeleton */}
        {!isLoginPage && (
          <div className="hidden lg:flex w-64 bg-muted/30 border-r">
            <div className="flex flex-col w-full p-4 space-y-4">
              {/* Sidebar items skeleton */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted/50 rounded-md" />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header skeleton */}
          {!isLoginPage && (
            <div className="h-16 bg-muted/30 border-b flex items-center px-4 lg:px-6">
              <div className="h-8 w-32 bg-muted/50 rounded" />
            </div>
          )}

          <main className="flex-1 overflow-y-auto">
            <div
              className={`${
                isLoginPage ? "min-h-screen" : "min-h-full p-4 lg:p-6"
              }`}
            >
              {/* Content skeleton */}
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-muted/50 rounded" />
                <div className="h-4 w-full bg-muted/30 rounded" />
                <div className="h-4 w-2/3 bg-muted/30 rounded" />
                <div className="h-32 w-full bg-muted/20 rounded" />
              </div>
            </div>
          </main>

          {/* Mobile bottom navigation skeleton */}
          {!isLoginPage && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-muted/30 border-t flex items-center justify-around px-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 w-6 bg-muted/50 rounded" />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {!isLoginPage && !isMobile && <SidebarNavigation />}

      <div className="flex flex-col flex-1 overflow-hidden">
        {!isLoginPage && <Header />}

        <main className="flex-1 overflow-y-auto">
          <div
            className={`${
              isLoginPage ? "min-h-screen" : "min-h-full"
            } ${!isLoginPage && isMobile ? "pb-20" : ""}`}
          >
            {children}
          </div>
        </main>

        {!isLoginPage && isMobile && <BottomNavigation />}
      </div>
    </div>
  );
}
