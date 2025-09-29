"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, PiggyBank, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { FinancialChart } from "@/components/dashboard/financial-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { QuickActions } from "@/components/dashboard/quick-actions"

// Dummy data
const financialData = {
  totalBalance: 15750000,
  monthlyIncome: 8500000,
  monthlyExpense: 6200000,
  savings: 2350000,
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function DashboardPage() {
  const savingsRate = ((financialData.savings / financialData.monthlyIncome) * 100).toFixed(1)
  const netIncome = financialData.monthlyIncome - financialData.monthlyExpense

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Selamat datang kembali!</h1>
          <p className="text-muted-foreground mt-1">Berikut ringkasan keuangan Anda hari ini</p>
        </div>
        <Button className="sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Transaksi
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Saldo</CardTitle>
            <Wallet className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData.totalBalance)}</div>
            <p className="text-xs opacity-90 mt-1">+2.5% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pemasukan Bulan Ini</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(financialData.monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">+12.3% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pengeluaran Bulan Ini</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(financialData.monthlyExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">-5.2% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tabungan</CardTitle>
            <PiggyBank className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(financialData.savings)}</div>
            <p className="text-xs text-muted-foreground mt-1">{savingsRate}% dari pemasukan</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FinancialChart />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  )
}
