"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Wallet,
  Smartphone,
  Building,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react"

const wallets = [
  {
    id: 1,
    name: "Rekening Utama",
    type: "Bank",
    provider: "BCA",
    balance: 12500000,
    accountNumber: "****1234",
    icon: Building,
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Tabungan",
    type: "Bank",
    provider: "Mandiri",
    balance: 5750000,
    accountNumber: "****5678",
    icon: Wallet,
    color: "bg-yellow-500",
  },
  {
    id: 3,
    name: "OVO",
    type: "E-Wallet",
    provider: "OVO",
    balance: 450000,
    accountNumber: "081234567890",
    icon: Smartphone,
    color: "bg-purple-500",
  },
  {
    id: 4,
    name: "GoPay",
    type: "E-Wallet",
    provider: "Gojek",
    balance: 275000,
    accountNumber: "081234567890",
    icon: Smartphone,
    color: "bg-green-500",
  },
  {
    id: 5,
    name: "Kartu Kredit",
    type: "Credit Card",
    provider: "BNI",
    balance: -1250000, // negative for credit card debt
    accountNumber: "****9876",
    icon: CreditCard,
    color: "bg-red-500",
  },
]

const installments = [
  {
    id: 1,
    name: "KTA BCA",
    type: "Bank Loan",
    provider: "BCA",
    monthlyAmount: 2500000,
    remainingAmount: 25000000,
    dueDate: "2024-01-15",
    status: "upcoming",
    icon: Building,
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Kartu Kredit BNI",
    type: "Credit Card",
    provider: "BNI",
    monthlyAmount: 1250000,
    remainingAmount: 1250000,
    dueDate: "2024-01-10",
    status: "overdue",
    icon: CreditCard,
    color: "bg-red-500",
  },
  {
    id: 3,
    name: "Pinjaman Online",
    type: "Online Loan",
    provider: "SpinJam",
    monthlyAmount: 850000,
    remainingAmount: 4250000,
    dueDate: "2024-01-20",
    status: "upcoming",
    icon: Smartphone,
    color: "bg-purple-500",
  },
  {
    id: 4,
    name: "Cicilan Motor",
    type: "Vehicle Loan",
    provider: "Adira Finance",
    monthlyAmount: 1800000,
    remainingAmount: 18000000,
    dueDate: "2024-01-25",
    status: "upcoming",
    icon: Building,
    color: "bg-green-500",
  },
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString))
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "overdue":
      return (
        <Badge variant="destructive" className="text-xs">
          Terlambat
        </Badge>
      )
    case "upcoming":
      return (
        <Badge variant="secondary" className="text-xs">
          Akan Datang
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-xs">
          Normal
        </Badge>
      )
  }
}

const getDaysUntilDue = (dueDate: string) => {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default function WalletPage() {
  const totalBalance = wallets
    .filter((wallet) => wallet.type !== "Credit Card")
    .reduce((sum, wallet) => sum + wallet.balance, 0)

  const totalDebt = wallets
    .filter((wallet) => wallet.type === "Credit Card" && wallet.balance < 0)
    .reduce((sum, wallet) => sum + Math.abs(wallet.balance), 0)

  const totalInstallments = installments.reduce((sum, installment) => sum + installment.monthlyAmount, 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dompet</h1>
          <p className="text-muted-foreground mt-1">Kelola semua akun dan dompet digital Anda</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Dompet
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Saldo</CardTitle>
            <Wallet className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs opacity-90 mt-1">
              Dari {wallets.filter((w) => w.type !== "Credit Card").length} akun
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total Hutang</CardTitle>
            <CreditCard className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
            <p className="text-xs opacity-90 mt-1">Kartu kredit dan pinjaman</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Cicilan Bulanan</CardTitle>
            <Calendar className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInstallments)}</div>
            <p className="text-xs opacity-90 mt-1">{installments.length} cicilan aktif</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs-based Layout */}
      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Akun & Dompet</TabsTrigger>
          <TabsTrigger value="installments">Cicilan & Tagihan</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6 mt-6">
          {/* Bank Accounts */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Rekening Bank</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets
                .filter((wallet) => wallet.type === "Bank")
                .map((wallet) => {
                  const Icon = wallet.icon
                  return (
                    <Card key={wallet.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${wallet.color} text-white`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{wallet.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {wallet.provider} • {wallet.accountNumber}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(wallet.balance)}</div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Transfer
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            Tarik
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>

          {/* E-Wallets */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Dompet Digital</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets
                .filter((wallet) => wallet.type === "E-Wallet")
                .map((wallet) => {
                  const Icon = wallet.icon
                  return (
                    <Card key={wallet.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${wallet.color} text-white`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{wallet.name}</div>
                              <div className="text-sm text-muted-foreground">{wallet.accountNumber}</div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-2xl font-bold text-foreground">{formatCurrency(wallet.balance)}</div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <Plus className="h-4 w-4 mr-1" />
                            Top Up
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Kirim
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>

          {/* Credit Cards */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Kartu Kredit</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets
                .filter((wallet) => wallet.type === "Credit Card")
                .map((wallet) => {
                  const Icon = wallet.icon
                  return (
                    <Card key={wallet.id} className="hover:shadow-md transition-shadow border-red-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${wallet.color} text-white`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{wallet.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {wallet.provider} • {wallet.accountNumber}
                              </div>
                            </div>
                          </div>
                          <Badge variant="destructive">Hutang</Badge>
                        </div>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(wallet.balance)}</div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700">
                            Bayar Tagihan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="installments" className="space-y-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Cicilan & Tagihan</h2>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Cicilan
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {installments.map((installment) => {
              const Icon = installment.icon
              const daysUntilDue = getDaysUntilDue(installment.dueDate)
              const isOverdue = daysUntilDue < 0
              const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0

              return (
                <Card
                  key={installment.id}
                  className={`hover:shadow-md transition-shadow ${isOverdue ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : isDueSoon ? "border-amber-200 bg-amber-50/50 dark:bg-amber-950/20" : ""}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${installment.color} text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{installment.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {installment.provider} • {installment.type}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(installment.status)}
                        {(isOverdue || isDueSoon) && (
                          <AlertCircle className={`h-4 w-4 ${isOverdue ? "text-red-500" : "text-amber-500"}`} />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Cicilan Bulanan</span>
                        <span className="text-sm font-medium">{formatCurrency(installment.monthlyAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sisa Hutang</span>
                        <span className="text-sm font-medium">{formatCurrency(installment.remainingAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Jatuh Tempo</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span
                            className={`text-sm font-medium ${isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : ""}`}
                          >
                            {formatDate(installment.dueDate)}
                          </span>
                        </div>
                      </div>
                      {daysUntilDue >= 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Sisa Hari</span>
                          <span className={`text-sm font-medium ${isDueSoon ? "text-amber-600" : ""}`}>
                            {daysUntilDue} hari
                          </span>
                        </div>
                      )}
                      {isOverdue && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Terlambat</span>
                          <span className="text-sm font-medium text-red-600">{Math.abs(daysUntilDue)} hari</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className={`flex-1 ${isOverdue ? "bg-red-600 hover:bg-red-700" : isDueSoon ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                      >
                        Bayar Sekarang
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                        Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
