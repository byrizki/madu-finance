"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, ShoppingCart, Car, Home, Coffee, MoreHorizontal } from "lucide-react"

const recentTransactions = [
  {
    id: 1,
    type: "expense",
    title: "Belanja Groceries",
    category: "Makanan & Minuman",
    amount: -450000,
    date: "2 jam yang lalu",
    icon: ShoppingCart,
    color: "text-red-600",
  },
  {
    id: 2,
    type: "income",
    title: "Gaji Bulanan",
    category: "Gaji",
    amount: 8500000,
    date: "1 hari yang lalu",
    icon: ArrowUpRight,
    color: "text-emerald-600",
  },
  {
    id: 3,
    type: "expense",
    title: "Bensin Motor",
    category: "Transportasi",
    amount: -75000,
    date: "2 hari yang lalu",
    icon: Car,
    color: "text-red-600",
  },
  {
    id: 4,
    type: "expense",
    title: "Listrik PLN",
    category: "Tagihan",
    amount: -320000,
    date: "3 hari yang lalu",
    icon: Home,
    color: "text-red-600",
  },
  {
    id: 5,
    type: "expense",
    title: "Kopi & Snack",
    category: "Makanan & Minuman",
    amount: -85000,
    date: "4 hari yang lalu",
    icon: Coffee,
    color: "text-red-600",
  },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.abs(amount))
}

export function RecentTransactions() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaksi Terbaru</CardTitle>
        <Button variant="ghost" size="sm">
          Lihat Semua
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.map((transaction) => {
            const Icon = transaction.icon
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-muted ${transaction.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{transaction.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.category} • {transaction.date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`font-semibold ${transaction.color}`}>
                    {transaction.type === "expense" ? "-" : "+"}
                    {formatCurrency(transaction.amount)}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
