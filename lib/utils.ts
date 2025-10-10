import { clsx, type ClassValue } from "clsx";
import { formatDistanceToNow } from "date-fns";
import { twMerge } from "tailwind-merge";
import { id as localeId } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const stripTrailingZero = (value: string) => value.replace(/\.0$/, "");

export const formatCompactCurrency = (amount: number) => {
  const sign = amount < 0 ? "-" : "";
  const value = Math.abs(amount);

  if (value >= 1_000_000_000) {
    const base = value / 1_000_000_000;
    const formatted = base >= 10 ? Math.round(base).toString() : stripTrailingZero(base.toFixed(1));
    return `${sign}${formatted}m`;
  }

  if (value >= 1_000_000) {
    const base = value / 1_000_000;
    const formatted = base >= 10 ? Math.round(base).toString() : stripTrailingZero(base.toFixed(1));
    return `${sign}${formatted}jt`;
  }

  if (value >= 1_000) {
    const base = value / 1_000;
    const formatted = base >= 10 ? Math.round(base).toString() : stripTrailingZero(base.toFixed(1));
    return `${sign}${formatted}rb`;
  }

  return `${sign}${value.toFixed(0)}`;
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export const getRelativeTime = (date: string) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: localeId });

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const randomSlugSuffix = (length = 4) =>
  Array.from({ length })
    .map(() => Math.random().toString(36).charAt(2))
    .join("");

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
};

export const getDaysUntilDue = (dueDate: string | null) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const noOpLock = async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
  return await fn();
};
