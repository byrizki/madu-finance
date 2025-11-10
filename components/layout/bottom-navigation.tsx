"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, LayoutGroup } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMounted } from "@/hooks/use-is-mounted";

const navItems = [
  {
    name: "Dashboard",
    segment: null as string | null,
    icon: Home,
  },
  {
    name: "Anggaran & Transaksi",
    segment: "transactions",
    icon: FileText,
  },
  {
    name: "Dompet & Tagihan",
    segment: "wallet",
    icon: Wallet,
  },
  {
    name: "Profil",
    segment: "profile",
    icon: User,
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const staticTargets = new Set(["transactions", "wallet", "profile"]);
  const isMounted = useIsMounted();
  const [animationRun, setAnimationRun] = useState(false);

  useEffect(() => {
    if (isMounted) {
      setAnimationRun(true);
    }
  }, [isMounted]);

  const secondary = segments[1];
  const hasAccountSlug = Boolean(secondary && !staticTargets.has(secondary));
  const accountBase = hasAccountSlug ? `/dashboard/${secondary}` : "/dashboard";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 flex justify-center lg:bottom-5">
      <div className="pointer-events-auto w-auto px-4 min-w-[96vw] sm:min-w-[24rem] lg:px-0">
        <LayoutGroup id="bottom-navigation">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-around gap-2.5 rounded-3xl border border-border/50 bg-background/90 px-3.5 py-2.5 shadow-[0_12px_24px_rgba(15,23,42,0.16)] backdrop-blur transition-colors dark:border-white/15 dark:bg-[linear-gradient(140deg,rgba(99,102,241,0.16)_0%,rgba(15,23,42,0.82)_48%,rgba(15,23,42,0.94)_100%)] dark:shadow-[0_26px_58px_rgba(2,6,23,0.6)] dark:ring-1 dark:ring-primary/25 dark:backdrop-blur-xl">
            {navItems.map((item) => {
              const href = item.segment ? `${accountBase}/${item.segment}` : accountBase;
              const isRoot = item.segment === null;
              const isActive =
                animationRun && (isRoot ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
              const Icon = item.icon;
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      className={cn(
                        "relative flex h-11 w-11 items-center justify-center rounded-full transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="bottom-nav-active"
                          className="absolute inset-0 rounded-full bg-primary shadow-[0_3px_8px_rgba(0,0,0,0.08)] dark:bg-primary/85 dark:shadow-[0_10px_24px_rgba(17,24,39,0.45)]"
                          initial={{ opacity: 0, scale: 0.88 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            layout: { type: "spring", stiffness: 380, damping: 28 },
                            opacity: { duration: 0.18, ease: "easeOut" },
                            scale: { duration: 0.22, ease: "easeOut" },
                          }}
                        >
                        </motion.span>
                      ) : null}
                      <span className="relative z-10 flex h-full w-full items-center justify-center rounded-full">
                        <Icon className="h-4.5 w-4.5" />
                        <span className="sr-only">{item.name}</span>
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
