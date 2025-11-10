"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactionOverview } from "@/hooks/use-transactions";
import { MaskedValue } from "@/components/dashboard/masked-value";

interface TransactionOverviewProps {
  accountSlug?: string;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  net: number;
}

const COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(340, 75%, 55%)",
  "hsl(280, 65%, 60%)",
  "hsl(160, 60%, 45%)",
  "hsl(40, 90%, 60%)",
  "hsl(200, 70%, 50%)",
  "hsl(20, 80%, 55%)",
  "hsl(300, 65%, 55%)",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    notation: "compact",
  }).format(value);

const formatCurrencyFull = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  isMobile?: boolean;
}

const CustomPieTooltip = ({ active, payload, isMobile }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Card className="border-border/50 shadow-lg py-3">
        <CardContent className="px-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium">{payload[0].name}</p>
            <p className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {formatCurrencyFull(payload[0].value)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label, isMobile }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Card className="border-border/50 shadow-lg py-3">
        <CardContent className="px-3">
          <p className="text-xs font-medium mb-2">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.name === "income" ? "Pemasukan" : entry.name === "expense" ? "Pengeluaran" : "Net"}
                  </span>
                </div>
                <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {formatCurrencyFull(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  return null;
};

export function TransactionOverview({ accountSlug }: TransactionOverviewProps) {
  const [monthRange, setMonthRange] = useState<number>(6);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const { data: overview, isLoading } = useTransactionOverview(accountSlug, monthRange);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const categoryData = overview?.categoryData.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  })) ?? [];
  
  const monthlyData = overview?.monthlyData ?? [];
  const stats = overview?.stats ?? {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    transactionCount: 0,
    avgTransaction: 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="grid gap-3 grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/50 py-3 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/50 animate-in fade-in slide-in-from-bottom-3" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card className="border-border/50 animate-in fade-in slide-in-from-bottom-3" style={{ animationDelay: '250ms' }}>
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasData = stats.transactionCount > 0;

  return (
    <div className="space-y-4">
      {/* Month Range Filter */}
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium">Periode</span>
          </div>
          <Select value={monthRange.toString()} onValueChange={(value) => setMonthRange(Number(value))}>
            <SelectTrigger className="w-[140px] h-7 text-xs border-0 bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 bulan</SelectItem>
              <SelectItem value="3">3 bulan</SelectItem>
              <SelectItem value="6">6 bulan</SelectItem>
              <SelectItem value="12">12 bulan</SelectItem>
              <SelectItem value="0">Semua</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Cards - Mobile First 2 Column Grid */}
      <div className="grid gap-3 grid-cols-2">
        <Card className="border-border/50 py-3">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Pemasukan</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <MaskedValue
              value={stats.totalIncome}
              className="text-lg font-bold text-emerald-600 dark:text-emerald-400"
              compact
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 py-3">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Pengeluaran</span>
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <MaskedValue
              value={stats.totalExpense}
              className="text-lg font-bold text-rose-600 dark:text-rose-400"
              compact
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 py-3">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Net</span>
              {stats.netAmount >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              )}
            </div>
            <MaskedValue
              value={stats.netAmount}
              className={`text-lg font-bold ${
                stats.netAmount >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
              compact
            />
          </CardContent>
        </Card>

        <Card className="border-border/50 py-3">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Rata-rata</span>
            </div>
            <MaskedValue
              value={stats.avgTransaction}
              className="text-lg font-bold"
              compact
            />
            <p className="text-xs text-muted-foreground mt-1">{stats.transactionCount} transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - 2 Column on Large Screen */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card className="border-border/50 gap-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              {hasData && categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart
                    onClick={() => setActiveIndex(null)}
                    style={{ touchAction: 'pan-y' }}
                  >
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => {
                        const index = categoryData.findIndex((d) => d.name === entry.name);
                        if (activeIndex === index) {
                          return `${entry.name} ${(entry.percent * 100).toFixed(0)}%`;
                        }
                        return null;
                      }}
                      outerRadius={isMobile ? 60 : 80}
                      innerRadius={isMobile ? 0 : 0}
                      fill="#8884d8"
                      dataKey="value"
                      style={{ cursor: 'pointer' }}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                          opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip isMobile={isMobile} />} />
                    <Legend
                      layout={isMobile ? "horizontal" : "vertical"}
                      verticalAlign={isMobile ? "bottom" : "middle"}
                      align={isMobile ? "center" : "right"}
                      wrapperStyle={{ 
                        fontSize: isMobile ? "11px" : "12px",
                        paddingLeft: isMobile ? 0 : "20px"
                      }}
                      iconSize={isMobile ? 8 : 10}
                      onClick={(e) => {
                        const clickedIndex = categoryData.findIndex((d) => d.name === e.value);
                        setActiveIndex(activeIndex === clickedIndex ? null : clickedIndex);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Belum ada data pengeluaran
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card className="border-border/50 gap-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Perbandingan Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              {hasData && monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{
                      top: 5,
                      right: isMobile ? 5 : 10,
                      left: isMobile ? -10 : 0,
                      bottom: 5
                    }}
                    style={{ touchAction: 'pan-y' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                    <XAxis
                      dataKey="month"
                      className="text-muted-foreground"
                      fontSize={isMobile ? 10 : 11}
                      tick={{ fontSize: isMobile ? 10 : 11 }}
                    />
                    <YAxis
                      className="text-muted-foreground"
                      fontSize={isMobile ? 10 : 11}
                      tickFormatter={formatCurrency}
                      width={isMobile ? 40 : 45}
                      tick={{ fontSize: isMobile ? 10 : 11 }}
                    />
                    <Tooltip
                      content={<CustomBarTooltip isMobile={isMobile} />}
                      cursor={{ fill: 'hsl(var(--muted) / 0.1)' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: isMobile ? "11px" : "12px" }}
                      iconSize={isMobile ? 8 : 10}
                      formatter={(value: string) => {
                        if (value === "income") return "Pemasukan";
                        if (value === "expense") return "Pengeluaran";
                        return "Net";
                      }}
                    />
                    <Bar
                      dataKey="income"
                      fill="#10b981"
                      radius={isMobile ? [3, 3, 0, 0] : [4, 4, 0, 0]}
                      maxBarSize={isMobile ? 30 : 40}
                    />
                    <Bar
                      dataKey="expense"
                      fill="#ef4444"
                      radius={isMobile ? [3, 3, 0, 0] : [4, 4, 0, 0]}
                      maxBarSize={isMobile ? 30 : 40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Belum ada data transaksi
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
