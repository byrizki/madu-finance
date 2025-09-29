"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Car,
  Home,
  Coffee,
  Smartphone,
  Heart,
  BookOpen,
} from "lucide-react"
import { TransactionModal } from "@/components/transactions/transaction-modal"

const allTransactions = [
  {
    id: 1,
    type: "expense",
    title: "Belanja Groceries",
    category: "Makanan & Minuman",
    amount: -450000,
    date: "2024-01-15",
    time: "14:30",
    icon: ShoppingCart,
    description: "Belanja bulanan di supermarket",
  },
  {
    id: 2,
    type: "income",
    title: "Gaji Bulanan",
    category: "Gaji",
    amount: 8500000,
    date: "2024-01-15",
    time: "09:00",
    icon: ArrowUpRight,
    description: "Gaji bulan Januari 2024",
  },
  {
    id: 3,
    type: "expense",
    title: "Bensin Motor",
    category: "Transportasi",
    amount: -75000,
    date: "2024-01-14",
    time: "16:45",
    icon: Car,
    description: "Isi bensin Pertamax",
  },
  {
    id: 4,
    type: "expense",
    title: "Listrik PLN",
    category: "Tagihan",
    amount: -320000,
    date: "2024-01-13",
    time: "10:15",
    icon: Home,
    description: "Tagihan listrik bulan Desember",
  },
  {
    id: 5,
    type: "expense",
    title: "Kopi & Snack",
    category: "Makanan & Minuman",
    amount: -85000,
    date: "2024-01-12",
    time: "15:20",
    icon: Coffee,
    description: "Kopi dan cemilan sore",
  },
  {
    id: 6,
    type: "expense",
    title: "Top Up OVO",
    category: "E-Wallet",
    amount: -200000,
    date: "2024-01-11",
    time: "11:30",
    icon: Smartphone,
    description: "Top up saldo OVO",
  },
  {
    id: 7,
    type: "expense",
    title: "Obat & Vitamin",
    category: "Kesehatan",
    amount: -150000,
    date: "2024-01-10",
    time: "13:45",
    icon: Heart,
    description: "Beli vitamin dan obat flu",
  },
  {
    id: 8,
    type: "expense",
    title: "Buku Programming",
    category: "Edukasi",
    amount: -275000,
    date: "2024-01-09",
    time: "19:00",
    icon: BookOpen,
    description: "Buku belajar React dan Next.js",
  },
]

const categories = [
  "Semua Kategori",
  "Makanan & Minuman",
  "Transportasi",
  "Tagihan",
  "E-Wallet",
  "Kesehatan",
  "Edukasi",
  "Hiburan",
  "Gaji",
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Math.abs(amount))
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori")
  const [activeTab, setActiveTab] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredTransactions = allTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Semua Kategori" || transaction.category === selectedCategory
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "income" && transaction.type === "income") ||
      (activeTab === "expense" && transaction.type === "expense")

    return matchesSearch && matchesCategory && matchesTab
  })

  const totalIncome = allTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = allTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau semua transaksi Anda</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Transaksi
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pemasukan</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatCurrency(totalIncome - totalExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="income">Pemasukan</TabsTrigger>
              <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada transaksi yang ditemukan</p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => {
                const Icon = transaction.icon
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3 rounded-full ${
                          transaction.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{transaction.title}</div>
                        <div className="text-sm text-muted-foreground">{transaction.description}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {transaction.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)} • {transaction.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        transaction.type === "income" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {transaction.type === "expense" ? "-" : "+"}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
