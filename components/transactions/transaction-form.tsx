"use client";

import type { UseFormReturn } from "react-hook-form";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CategoryAutocompleteInput } from "@/components/category/category-autocomplete-input";
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";
import { WalletAutocompleteInput } from "@/components/wallet/wallet-autocomplete-input";
import type { WalletType } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export interface TransactionFormValues {
  title: string;
  amount: string;
  category: string;
  description: string;
  date: string;
  walletId: string;
}

export interface TransactionFormWalletOption {
  id: string;
  name: string;
  type: WalletType;
  color: string | null;
  provider: string | null | undefined;
}

export const NO_WALLET_OPTION_VALUE = "no-wallet";

interface TransactionFormFieldsProps {
  form: UseFormReturn<TransactionFormValues>;
  accountSlug?: string;
  walletOptions: TransactionFormWalletOption[];
  walletsLoading: boolean;
  isSubmitting: boolean;
  noWalletValue?: string;
  showDateField: boolean;
  showDescriptionField: boolean;
  fallbackCategories?: ReadonlyArray<string>;
  walletPlaceholder?: string;
  categoryPlaceholder?: string;
}

export function TransactionFormFields({
  form,
  accountSlug,
  walletOptions,
  walletsLoading,
  isSubmitting,
  noWalletValue = NO_WALLET_OPTION_VALUE,
  showDateField,
  showDescriptionField,
  fallbackCategories = [],
  walletPlaceholder = "Cari atau pilih dompet",
  categoryPlaceholder = "Ketik atau pilih kategori",
}: TransactionFormFieldsProps) {
  const disabled = walletsLoading || isSubmitting;

  return (
    <>
      <FormField
        control={form.control}
        name="title"
        rules={{ required: "Nama transaksi wajib diisi" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nama transaksi</FormLabel>
            <FormControl>
              <Input placeholder="Contoh: Gaji bulanan" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className={cn("flex flex-col gap-4", showDateField ? "sm:flex-row sm:gap-3" : undefined)}>
        <FormField
          control={form.control}
          name="amount"
          rules={{
            required: "Nominal wajib diisi",
            validate: (value) => (Number(value) > 0 ? true : "Masukkan nominal yang valid"),
          }}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Nominal</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="0"
                  allowClear
                  clearLabel="Reset nominal"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showDateField ? (
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Tanggal</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    allowClear
                    clearLabel="Reset tanggal"
                    disabled={isSubmitting}
                    isRequired
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
        <FormField
          control={form.control}
          name="walletId"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Dompet</FormLabel>
              <FormControl>
                <WalletAutocompleteInput
                  wallets={walletOptions}
                  value={field.value === noWalletValue ? null : field.value}
                  onChange={(walletId) => field.onChange(walletId ?? noWalletValue)}
                  disabled={disabled}
                  placeholder={walletPlaceholder}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          rules={{
            required: "Kategori wajib dipilih",
            validate: (value) => (value.trim().length ? true : "Kategori tidak boleh kosong"),
          }}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Kategori</FormLabel>
              <FormControl>
                <CategoryAutocompleteInput
                  value={field.value}
                  onChange={field.onChange}
                  accountSlug={accountSlug}
                  fallback={fallbackCategories}
                  placeholder={categoryPlaceholder}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {showDescriptionField ? (
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Tambahkan catatan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
    </>
  );
}
