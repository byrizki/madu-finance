"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BottomNavigation } from "./bottom-navigation";
import { Header } from "./header";
import { Skeleton } from "@/components/ui/skeleton";

interface AdaptiveLayoutProps {
  children: React.ReactNode;
}

export function AdaptiveLayout({ children }: AdaptiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Don't show navigation on login page
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) return;

    node.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="h-screen bg-muted/20 overflow-hidden">
      <div className="h-screen bg-muted/20 overflow-auto">
        <div className="mx-auto flex max-w-6xl flex-col overflow-hidden">{!isLoginPage && <Header />}</div>
        <div className="mx-auto flex max-w-6xl flex-col overflow-hidden">
          <main className="flex-1 overflow-hidden">
            <div
              ref={scrollContainerRef}
              className={`${isLoginPage ? "min-h-screen" : "min-h-full"} ${
                !isLoginPage ? (isMobile ? "pb-24" : "pb-12") : ""
              } h-full overflow-y-auto`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      {!isLoginPage && <BottomNavigation />}
    </div>
  );
}
