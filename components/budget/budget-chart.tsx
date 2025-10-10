"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BudgetChartDatum {
  category: string;
  amount: number;
  spent: number;
  status: "on-track" | "warning" | "over-budget" | string;
}

interface BudgetChartProps {
  data?: BudgetChartDatum[];
  isLoading?: boolean;
}

const FALLBACK_DATA: BudgetChartDatum[] = [
  { category: "Makanan", amount: 1500000, spent: 1250000, status: "on-track" },
  { category: "Transport", amount: 800000, spent: 650000, status: "on-track" },
  { category: "Hiburan", amount: 500000, spent: 520000, status: "over-budget" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    notation: "compact",
  }).format(value);

const getBarColor = (status: string) => {
  switch (status) {
    case "on-track":
      return "#10b981";
    case "warning":
      return "#f59e0b";
    case "over-budget":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

export function BudgetChart({ data, isLoading }: BudgetChartProps) {
  const chartData = useMemo(() => {
    const source = data && data.length > 0 ? data : FALLBACK_DATA;
    return source.map((budget) => ({
      category: budget.category.length > 12 ? `${budget.category.slice(0, 12)}…` : budget.category,
      fullCategory: budget.category,
      anggaran: budget.amount,
      terpakai: budget.spent,
      status: budget.status,
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perbandingan Anggaran vs Pengeluaran</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="category"
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
                    name === "anggaran" ? "Anggaran" : "Terpakai",
                  ]}
                  labelFormatter={(label: string) => {
                    const item = chartData.find((d) => d.category === label);
                    return item?.fullCategory || label;
                  }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="anggaran" fill="#e5e7eb" name="Anggaran" radius={[4, 4, 0, 0]} />
                <Bar dataKey="terpakai" name="Terpakai" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span>Sesuai Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded" />
            <span>Perhatian</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Melebihi Budget</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
