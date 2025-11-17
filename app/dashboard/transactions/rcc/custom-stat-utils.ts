import type { TransactionItem } from "@/hooks/use-transactions";
import type { CustomStatCard, CreateCustomStatCard, StatCardValue } from "./custom-stat-types";

export function calculateStatCardValue(
  card: CustomStatCard,
  transactions: TransactionItem[],
  monthRange?: number
): StatCardValue {
  let filteredTransactions = transactions.filter(transaction => {
    const matchesType = transaction.type === card.type;
    const matchesCategory = card.categories.length === 0 || 
      card.categories.includes(transaction.category);
    return matchesType && matchesCategory;
  });

  // Apply month range filter if specified
  if (monthRange && monthRange > 0) {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthRange);
    
    filteredTransactions = filteredTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.occurredAt || transaction.createdAt);
      return transactionDate >= cutoffDate;
    });
  }

  const totalValue = filteredTransactions.reduce((sum, transaction) => {
    return sum + Math.abs(transaction.amount);
  }, 0);

  return {
    id: card.id,
    name: card.name,
    value: totalValue,
    type: card.type,
    categories: card.categories,
    icon: card.icon,
    color: card.color,
  };
}

export function calculateAllStatCards(
  cards: CustomStatCard[],
  transactions: TransactionItem[],
  monthRange?: number
): StatCardValue[] {
  return cards.map(card => calculateStatCardValue(card, transactions, monthRange));
}

export function getAvailableCategories(transactions: TransactionItem[]): string[] {
  const categories = new Set<string>();
  transactions.forEach(transaction => {
    if (transaction.category && transaction.category.trim()) {
      categories.add(transaction.category);
    }
  });
  return Array.from(categories).sort();
}

// API call functions
export async function fetchCustomStatCards(accountSlug: string): Promise<CustomStatCard[]> {
  const response = await fetch(`/api/${accountSlug}/custom-stat-cards`);
  if (!response.ok) {
    throw new Error('Failed to fetch custom stat cards');
  }
  return response.json();
}

export async function createCustomStatCard(
  accountSlug: string, 
  card: CreateCustomStatCard
): Promise<CustomStatCard> {
  const response = await fetch(`/api/${accountSlug}/custom-stat-cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(card),
  });
  if (!response.ok) {
    throw new Error('Failed to create custom stat card');
  }
  return response.json();
}

export async function updateCustomStatCard(
  accountSlug: string,
  card: CustomStatCard
): Promise<CustomStatCard> {
  const response = await fetch(`/api/${accountSlug}/custom-stat-cards/${card.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: card.name,
      type: card.type,
      categories: card.categories,
      color: card.color,
      icon: card.icon,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to update custom stat card');
  }
  return response.json();
}

export async function deleteCustomStatCard(
  accountSlug: string,
  cardId: string
): Promise<void> {
  const response = await fetch(`/api/${accountSlug}/custom-stat-cards/${cardId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete custom stat card');
  }
}

// Default stat cards for fallback
export function getDefaultCreateCards(): CreateCustomStatCard[] {
  return [
    {
      name: "Total Pemasukan",
      type: "income",
      categories: [], // Empty = all categories
      color: "emerald",
    },
    {
      name: "Total Pengeluaran", 
      type: "expense",
      categories: [], // Empty = all categories
      color: "rose",
    },
  ];
}
