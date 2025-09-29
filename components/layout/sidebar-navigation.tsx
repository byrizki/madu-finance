"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Wallet, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    name: "Beranda",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Transaksi & Laporan",
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

export function SidebarNavigation() {
  const pathname = usePathname()

  return (
    <nav className="w-64 flex-col bg-card/95 backdrop-blur-sm border-r border-border flex">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">FinanceApp</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/transactions" && pathname === "/budget")
              const Icon = item.icon

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 rounded-lg transition-colors group",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Logout */}
        <div className="px-4 pb-6">
          <Link
            href="/login"
            className="flex items-center px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors group"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Keluar</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
