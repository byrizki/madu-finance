"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

const expenseCategories = [
  "Makanan & Minuman",
  "Transportasi",
  "Tagihan",
  "E-Wallet",
  "Kesehatan",
  "Edukasi",
  "Hiburan",
  "Belanja",
  "Lainnya",
]

const incomeCategories = ["Gaji", "Freelance", "Investasi", "Bonus", "Hadiah", "Lainnya"]

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const [activeTab, setActiveTab] = useState("expense")
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically save the transaction
    console.log("Transaction data:", { ...formData, type: activeTab })
    onClose()
    // Reset form
    setFormData({
      title: "",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    })
  }

  const categories = activeTab === "expense" ? expenseCategories : incomeCategories

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Baru</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Pengeluaran
            </TabsTrigger>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Pemasukan
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Transaksi</Label>
              <Input
                id="title"
                placeholder="Masukkan judul transaksi"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (IDR)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
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

            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea
                id="description"
                placeholder="Tambahkan catatan untuk transaksi ini"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Batal
              </Button>
              <Button
                type="submit"
                className={`flex-1 ${
                  activeTab === "expense" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                Simpan {activeTab === "expense" ? "Pengeluaran" : "Pemasukan"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
