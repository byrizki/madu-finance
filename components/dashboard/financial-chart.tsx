"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FinancialChartDatum {
  month: string;
  income: number;
  expense: number;
}

interface FinancialChartProps {
  data?: FinancialChartDatum[];
  isLoading?: boolean;
}

const FALLBACK_DATA: FinancialChartDatum[] = [
  { month: "Jan", income: 7500000, expense: 5200000 },
  { month: "Feb", income: 8200000, expense: 5800000 },
  { month: "Mar", income: 7800000, expense: 6100000 },
  { month: "Apr", income: 8500000, expense: 5900000 },
  { month: "Mei", income: 9200000, expense: 6400000 },
  { month: "Jun", income: 8500000, expense: 6200000 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    notation: "compact",
  }).format(value);

export function FinancialChart({ data, isLoading }: FinancialChartProps) {
  const chartData = useMemo(() => {
    const source = data && data.length > 0 ? data : FALLBACK_DATA;
    return source.map((item) => ({
      month: item.month,
      income: item.income,
      expense: item.expense,
    }));
  }, [data]);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Tren Keuangan 6 Bulan Terakhir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="month"
                  className="text-muted-foreground"
                  fontSize={12}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                />
                <YAxis className="text-muted-foreground" fontSize={12} tickFormatter={formatCurrency} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "income" ? "Pemasukan" : "Pengeluaran",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorIncome)"
                  name="income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={3}
                  fill="url(#colorExpense)"
                  name="expense"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
