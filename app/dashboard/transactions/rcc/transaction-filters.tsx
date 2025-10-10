"use client";

import { useState } from "react";

import { Search, SlidersHorizontal } from "lucide-react";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { CategoryAutocompleteInput } from "@/components/category/category-autocomplete-input";

import type { FilterSummary } from "./budgets-types";

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onReset: () => void;
  summary: FilterSummary;
  accountSlug?: string;
}

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  typeFilter,
  onTypeFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset,
  summary,
  accountSlug,
}: TransactionFiltersProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const buttonClasses = isMobile
    ? "h-9 w-full rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90"
    : "h-9 rounded-full border border-border/60 bg-background/80 text-sm font-medium";

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
      <Button className={buttonClasses} variant="outline" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="mr-2 h-4 w-4" /> Filter
      </Button>
      <ModalShell
        open={open}
        onOpenChange={setOpen}
        title="Filter transaksi"
        description="Sesuaikan pencarian transaksi sesuai kebutuhan Anda."
      >
        <FilterFields
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          category={category}
          onCategoryChange={onCategoryChange}
          categories={categories}
          typeFilter={typeFilter}
          onTypeFilterChange={onTypeFilterChange}
          startDate={startDate}
          onStartDateChange={onStartDateChange}
          endDate={endDate}
          onEndDateChange={onEndDateChange}
          onReset={onReset}
          onClose={() => setOpen(false)}
          summary={summary}
          accountSlug={accountSlug}
        />
      </ModalShell>
    </div>
  );
}

interface FilterFieldsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onReset: () => void;
  onClose: () => void;
  summary: FilterSummary;
  accountSlug?: string;
}

function FilterFields({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  typeFilter,
  onTypeFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset,
  onClose,
  summary,
  accountSlug,
}: FilterFieldsProps) {
  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari berdasarkan judul, kategori, atau deskripsi"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="rounded-2xl border border-border/60 pl-9 text-sm"
        />
      </div>
      <CategoryAutocompleteInput
        accountSlug={accountSlug}
        value={category}
        onChange={(value) => onCategoryChange(value || "Semua Kategori")}
        fallback={categories}
        placeholder="Ketik atau pilih kategori"
      />
      <Select value={typeFilter} onValueChange={onTypeFilterChange}>
        <SelectTrigger className="rounded-2xl border border-border/60 text-sm">
          <SelectValue placeholder="Pilih tipe transaksi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Semua Tipe">Semua Tipe</SelectItem>
          <SelectItem value="Pemasukan">Pemasukan</SelectItem>
          <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
        </SelectContent>
      </Select>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="start-date">Tanggal mulai</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            max={endDate || undefined}
            className="rounded-2xl border border-border/60 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="end-date">Tanggal akhir</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            min={startDate || undefined}
            className="rounded-2xl border border-border/60 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="ghost" size="sm" className="rounded-full px-3 text-sm" onClick={onReset}>
          Reset
        </Button>
        <Button size="sm" className="rounded-full px-3 text-sm" onClick={onClose}>
          Tutup
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Menampilkan {summary.filtered} dari {summary.total} transaksi
      </p>
    </div>
  );
}
