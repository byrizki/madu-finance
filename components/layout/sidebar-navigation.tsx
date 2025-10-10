"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Wallet, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, LayoutGroup } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  {
    name: "Beranda",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Transaksi & Laporan",
    href: "/dashboard/transactions",
    icon: FileText,
  },
  {
    name: "Dompet",
    href: "/dashboard/wallet",
    icon: Wallet,
  },
  {
    name: "Profil",
    href: "/dashboard/profile",
    icon: User,
  },
];

export function SidebarNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex w-20 flex-col items-center border border-border/40 bg-background/90 py-6 backdrop-blur-sm shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
      <LayoutGroup>
        <ul className="flex flex-1 flex-col items-center gap-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/transactions" && pathname === "/budget");
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-2xl bg-primary shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
                          transition={{
                            type: "spring",
                            stiffness: 360,
                            damping: 28,
                          }}
                        />
                      ) : null}
                      <Icon className="relative z-10 h-5 w-5" />
                      <span className="sr-only">{item.name}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
}
