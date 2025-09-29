"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Wallet, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    name: "Beranda",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Transaksi",
    href: "/transactions",
    icon: FileText,
  },
  {
    name: "Dompet",
    href: "/wallet",
    icon: Wallet,
  },
  {
    name: "Profil",
    href: "/profile",
    icon: User,
  },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="mobile-nav lg:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/transactions" && pathname === "/budget")
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-colors min-w-0 flex-1 mx-2",
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
