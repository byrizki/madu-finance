"use client";

import { AppLogo } from "@/components/branding/app-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { useMember } from "@/components/context/member-context";
import { BookUser, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const { sharedAccount, isLoading } = useMember();
  const activeAccountName = sharedAccount?.name;
  return (
    <header className="w-full px-4 lg:px-8 pb-2">
      <div className="mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="relative flex cursor-pointer items-center space-x-3 overflow-hidden rounded-full px-2 py-1"
            onClick={() => router.push("/dashboard")}
          >
            <AppLogo width={28} height={28} alt="Logo" />
            <span className="relative z-10 text-sm font-semibold tracking-wide text-foreground">byMADU</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isLoading || activeAccountName) && (
            <Badge variant="outline" className="text-xs font-medium py-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Memuat Kas...
                </>
              ) : (
                <>
                  <BookUser className="h-4 w-4" />
                  {activeAccountName}
                </>
              )}
            </Badge>
          )}

          <ThemeToggle />
        </div>
      </div>
      <style jsx>{`
        @keyframes header-shimmer {
          0% {
            transform: translateX(-120%) translateY(-120%);
          }
          50% {
            transform: translateX(0%) translateY(0%);
          }
          100% {
            transform: translateX(120%) translateY(120%);
          }
        }
      `}</style>
    </header>
  );
}
