"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const chartData = [
  { month: "Jan", pemasukan: 7500000, pengeluaran: 5200000 },
  { month: "Feb", pemasukan: 8200000, pengeluaran: 5800000 },
  { month: "Mar", pemasukan: 7800000, pengeluaran: 6100000 },
  { month: "Apr", pemasukan: 8500000, pengeluaran: 5900000 },
  { month: "Mei", pemasukan: 9200000, pengeluaran: 6400000 },
  { month: "Jun", pemasukan: 8500000, pengeluaran: 6200000 },
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    notation: "compact",
  }).format(value)
}

export function FinancialChart() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Tren Keuangan 6 Bulan Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis
                dataKey="month"
                className="text-muted-foreground"
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                className="text-muted-foreground"
                fontSize={12}
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "pemasukan" ? "Pemasukan" : "Pengeluaran",
                ]}
                labelClassName="text-foreground"
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Area
                type="monotone"
                dataKey="pemasukan"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#colorPemasukan)"
                name="pemasukan"
              />
              <Area
                type="monotone"
                dataKey="pengeluaran"
                stroke="#ef4444"
                strokeWidth={3}
                fill="url(#colorPengeluaran)"
                name="pengeluaran"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
