import BudgetsClient from "../../budgets/rcc/budgets-client";
import { Suspense } from "react";

interface BudgetsPageProps {
  params: Promise<{ account: string }>;
}

export default async function BudgetsPage({ params }: BudgetsPageProps) {
  const { account } = await params;
  return (
    <Suspense fallback={null}>
      <BudgetsClient accountSlugOverride={account} />
    </Suspense>
  );
}
