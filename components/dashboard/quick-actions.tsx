"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus, ArrowUpDown, Target, CreditCard, Smartphone } from "lucide-react"

const quickActions = [
  {
    title: "Tambah Pemasukan",
    description: "Catat pemasukan baru",
    icon: Plus,
    color:
      "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-300 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:hover:text-emerald-200",
  },
  {
    title: "Tambah Pengeluaran",
    description: "Catat pengeluaran baru",
    icon: Minus,
    color:
      "text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 dark:text-rose-300 dark:bg-rose-950 dark:hover:bg-rose-900 dark:hover:text-rose-200",
  },
  {
    title: "Transfer",
    description: "Transfer antar akun",
    icon: ArrowUpDown,
    color:
      "text-sky-700 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-300 dark:bg-sky-950 dark:hover:bg-sky-900 dark:hover:text-sky-200",
  },
  {
    title: "Buat Anggaran",
    description: "Atur anggaran baru",
    icon: Target,
    color:
      "text-violet-700 bg-violet-50 hover:bg-violet-100 hover:text-violet-800 dark:text-violet-300 dark:bg-violet-950 dark:hover:bg-violet-900 dark:hover:text-violet-200",
  },
  {
    title: "Bayar Tagihan",
    description: "Bayar tagihan rutin",
    icon: CreditCard,
    color:
      "text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 dark:text-amber-300 dark:bg-amber-950 dark:hover:bg-amber-900 dark:hover:text-amber-200",
  },
  {
    title: "Top Up E-Wallet",
    description: "Isi saldo e-wallet",
    icon: Smartphone,
    color:
      "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 dark:text-indigo-300 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:hover:text-indigo-200",
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aksi Cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                variant="ghost"
                className={`h-auto p-4 flex flex-col items-center justify-center space-y-2 transition-colors ${action.color}`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="text-sm font-medium">{action.title}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
