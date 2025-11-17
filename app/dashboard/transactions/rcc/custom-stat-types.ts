import type { CustomStatCardRow } from "@/lib/db/types";

export interface CustomStatCard {
  id: string;
  accountId: string;
  name: string;
  type: "income" | "expense";
  categories: string[];
  icon?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Database type alias for convenience
export type CustomStatCardDB = CustomStatCardRow;

// For creating new stat cards (without database-specific fields)
export interface CreateCustomStatCard {
  name: string;
  type: "income" | "expense";
  categories: string[];
  icon?: string;
  color?: string;
}

export interface StatCardValue {
  id: string;
  name: string;
  value: number;
  type: "income" | "expense";
  categories: string[];
  icon?: string | null;
  color?: string | null;
}
