"use client"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { AccountSwitcher } from "./account-switcher"
import { Wallet } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">FinanceApp</span>
          </div>
        </div>

        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
