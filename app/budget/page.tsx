"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, AlertTriangle, CheckCircle, TrendingUp, Calendar } from "lucide-react"
import { BudgetModal } from "@/components/budget/budget-modal"
import { BudgetChart } from "@/components/budget/budget-chart"

const budgets = [
  {
    id: 1,
    category: "Makanan & Minuman",
    budgetAmount: 1500000,
    spentAmount: 1250000,
    period: "Bulanan",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    status: "on-track",
  },
  {
    id: 2,
    category: "Transportasi",
    budgetAmount: 800000,
    spentAmount: 650000,
    period: "Bulanan",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    status: "on-track",
  },
  {
    id: 3,
    category: "Hiburan",
    budgetAmount: 500000,
    spentAmount: 520000,
    period: "Bulanan",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    status: "over-budget",
  },
  {
    id: 4,
    category: "Belanja",
    budgetAmount: 1000000,
    spentAmount: 750000,
    period: "Bulanan",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    status: "on-track",
  },
  {
    id: 5,
    category: "Tagihan",
    budgetAmount: 1200000,
    spentAmount: 980000,
    period: "Bulanan",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    status: "warning",
  },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "on-track":
      return "text-emerald-600 bg-emerald-50"
    case "warning":
      return "text-amber-600 bg-amber-50"
    case "over-budget":
      return "text-red-600 bg-red-50"
    default:
      return "text-gray-600 bg-gray-50"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "on-track":
      return CheckCircle
    case "warning":
      return AlertTriangle
    case "over-budget":
      return AlertTriangle
    default:
      return Target
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "on-track":
      return "Sesuai Target"
    case "warning":
      return "Perhatian"
    case "over-budget":
      return "Melebihi Budget"
    default:
      return "Normal"
  }
}

export default function BudgetPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.budgetAmount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spentAmount, 0)
  const totalRemaining = totalBudget - totalSpent

  const overBudgetCount = budgets.filter((b) => b.status === "over-budget").length
  const warningCount = budgets.filter((b) => b.status === "warning").length

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Anggaran</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau anggaran bulanan Anda</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Buat Anggaran
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Anggaran</CardTitle>
            <Target className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs opacity-90 mt-1">Bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sudah Terpakai</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalSpent / totalBudget) * 100).toFixed(1)}% dari total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sisa Anggaran</CardTitle>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRemaining)}</div>
            <p className="text-xs text-muted-foreground mt-1">Tersisa untuk bulan ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status Anggaran</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{overBudgetCount + warningCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Perlu perhatian</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Chart */}
      <BudgetChart budgets={budgets} />

      {/* Budget List */}
      <Card>
        <CardHeader>
          <CardTitle>Anggaran Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {budgets.map((budget) => {
              const percentage = (budget.spentAmount / budget.budgetAmount) * 100
              const StatusIcon = getStatusIcon(budget.status)

              return (
                <div key={budget.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{budget.category}</h3>
                        <Badge className={getStatusColor(budget.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusText(budget.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sisa: {formatCurrency(budget.budgetAmount - budget.spentAmount)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-2"
                      style={
                        {
                          "--progress-background":
                            percentage > 100 ? "#ef4444" : percentage > 80 ? "#f59e0b" : "#10b981",
                        } as React.CSSProperties
                      }
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(1)}% terpakai</span>
                      <span>{budget.period}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <BudgetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
